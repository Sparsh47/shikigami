import { Writable } from "stream";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as yaml from "js-yaml";
import * as k8s from "@kubernetes/client-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const batchV1Api = kc.makeApiClient(k8s.BatchV1Api);
const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
const networkingV1Api = kc.makeApiClient(k8s.NetworkingV1Api);

// NodePort that nginx-ingress exposes on localhost (http).
// kubectl get svc ingress-nginx-controller -n ingress-nginx
const INGRESS_NODE_PORT = 30581;

const NAMESPACE = "default";

const KANIKO_JOB_YAML_PATH = path.join(__dirname, "manifests", "kaniko-job.yaml");

export interface KanikoJobOverrides {
    jobName?: string;
    gitContext?: string;
    destination?: string;
    cache?: boolean;
    pathOfDockerfile?: string;
}

export async function createKanikoJob(overrides: KanikoJobOverrides = { cache: false }) {
    const fileContents = fs.readFileSync(KANIKO_JOB_YAML_PATH, "utf8");
    const jobManifest = yaml.load(fileContents) as k8s.V1Job;

    if (overrides.jobName) {
        jobManifest.metadata!.name = overrides.jobName;
    }

    if (overrides.gitContext || overrides.destination) {
        const kanikoContainer = jobManifest.spec?.template.spec?.containers?.[0];
        if (!kanikoContainer) {
            throw new Error("Kaniko container not found in Job manifest");
        }
        if (kanikoContainer.args) {
            kanikoContainer.args = kanikoContainer.args.map((arg) => {
                if (overrides.gitContext && arg.startsWith("--context=")) {
                    return `--context=${overrides.gitContext}`;
                }
                if (overrides.destination && arg.startsWith("--destination=")) {
                    return `--destination=${overrides.destination}`;
                }
                if (overrides.cache === false && arg.startsWith("--cache=")) {
                    return `--cache=${overrides.cache}`;
                }
                if (overrides.pathOfDockerfile && arg.startsWith("--dockerfile=")) {
                    return `--dockerfile=${overrides.pathOfDockerfile}`;
                }
                return arg;
            });
        }
    }

    const createdJob = await batchV1Api.createNamespacedJob({
        namespace: NAMESPACE,
        body: jobManifest,
    });

    return createdJob;
}

export async function readJob(jobName: string): Promise<k8s.V1Job> {
    return batchV1Api.readNamespacedJob({ name: jobName, namespace: NAMESPACE });
}

export async function deleteJob(jobName: string): Promise<void> {
    try {
        await batchV1Api.deleteNamespacedJob({
            name: jobName,
            namespace: NAMESPACE,
            body: new k8s.V1DeleteOptions(),
        });
    } catch (err: any) {
        if (err.statusCode === 404) {
            return;
        }
        throw err;
    }
}

export interface DeployAppOptions {
    appName: string;
    image: string;
    port: number;
    cpu: string;
    memory: string;
    runCommand?: string;
    imagePullSecret?: string;
    env?: Array<{ name: string; value: string }>;
}

export async function deployApp(opts: DeployAppOptions): Promise<string> {
    const { appName, image, port, cpu, env = [], runCommand, imagePullSecret = "dockerhub-secret" } = opts;

    const memory = opts.memory.replace(/GB$/i, "Gi").replace(/MB$/i, "Mi");

    const command = runCommand?.trim() ? runCommand.trim().split(/\s+/) : undefined;

    const labels = { app: appName };
    const resources: k8s.V1ResourceRequirements = {
        requests: { cpu, memory },
        limits: { cpu, memory },
    };

    // Force inject the expected PORT into the environment so the app binds to the correct port
    const finalEnv = env.filter(e => e.name !== "PORT");
    finalEnv.push({ name: "PORT", value: port.toString() });

    const deploymentManifest: k8s.V1Deployment = {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: { name: appName, namespace: NAMESPACE, labels },
        spec: {
            replicas: 1,
            selector: { matchLabels: labels },
            template: {
                metadata: { labels },
                spec: {
                    imagePullSecrets: [{ name: imagePullSecret }],
                    containers: [
                        {
                            name: appName,
                            image,
                            ...(command && { command }),
                            ports: [{ containerPort: port }],
                            resources,
                            env: finalEnv,
                        },
                    ],
                },
            },
        },
    };

    try {
        const existing = await appsV1Api.readNamespacedDeployment({
            name: appName,
            namespace: NAMESPACE,
        });
        if (existing.metadata?.resourceVersion) {
            deploymentManifest.metadata!.resourceVersion = existing.metadata.resourceVersion;
        }
        await appsV1Api.replaceNamespacedDeployment({
            name: appName,
            namespace: NAMESPACE,
            body: deploymentManifest,
        });
    } catch (err: any) {
        if (err.code === 404 || err.statusCode === 404) {
            // First deploy — create it fresh
            await appsV1Api.createNamespacedDeployment({
                namespace: NAMESPACE,
                body: deploymentManifest,
            });
        } else {
            throw err;
        }
    }

    const serviceName = `${appName}-svc`;
    const serviceManifest: k8s.V1Service = {
        apiVersion: "v1",
        kind: "Service",
        metadata: { name: serviceName, namespace: NAMESPACE },
        spec: {
            selector: labels,
            ports: [{ port: 80, targetPort: port as any }],
            type: "NodePort",
        },
    };

    try {
        const existing = await coreV1Api.readNamespacedService({
            name: serviceName,
            namespace: NAMESPACE,
        });
        if (existing.metadata?.resourceVersion) {
            serviceManifest.metadata!.resourceVersion = existing.metadata.resourceVersion;
        }
        // retain clusterIP if needed, though replace usually works if omitted? Wait!
        // Services often complain if clusterIP is missing during replace. 
        // Let's copy it over just in case it's a ClusterIP service.
        if (existing.spec && existing.spec.clusterIP) {
            serviceManifest.spec!.clusterIP = existing.spec.clusterIP;
        }
        // Preserve nodePort if it was already assigned by K8s
        if (existing.spec && existing.spec.ports?.[0]?.nodePort) {
            serviceManifest.spec!.ports![0].nodePort = existing.spec.ports[0].nodePort;
        }
        await coreV1Api.replaceNamespacedService({
            name: serviceName,
            namespace: NAMESPACE,
            body: serviceManifest,
        });
    } catch (err: any) {
        if (err.code === 404 || err.statusCode === 404) {
            await coreV1Api.createNamespacedService({
                namespace: NAMESPACE,
                body: serviceManifest,
            });
        } else {
            throw err;
        }
    }

    const ingressName = `${appName}-ingress`;
    const host = `${appName}.localtest.me`;
    const ingressManifest: k8s.V1Ingress = {
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: {
            name: ingressName,
            namespace: NAMESPACE,
            annotations: {
                "nginx.ingress.kubernetes.io/rewrite-target": "/",
            },
        },
        spec: {
            ingressClassName: "nginx",
            rules: [
                {
                    host,
                    http: {
                        paths: [
                            {
                                path: "/",
                                pathType: "Prefix",
                                backend: {
                                    service: {
                                        name: serviceName,
                                        port: { number: 80 },
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };

    try {
        const existing = await networkingV1Api.readNamespacedIngress({
            name: ingressName,
            namespace: NAMESPACE,
        });
        if (existing.metadata?.resourceVersion) {
            ingressManifest.metadata!.resourceVersion = existing.metadata.resourceVersion;
        }
        await networkingV1Api.replaceNamespacedIngress({
            name: ingressName,
            namespace: NAMESPACE,
            body: ingressManifest,
        });
    } catch (err: any) {
        if (err.code === 404 || err.statusCode === 404) {
            await networkingV1Api.createNamespacedIngress({
                namespace: NAMESPACE,
                body: ingressManifest,
            });
        } else {
            throw err;
        }
    }

    return `http://${host}:${INGRESS_NODE_PORT}`;
}

export async function streamJobLogs(jobName: string, outStream: Writable) {
    const log = new k8s.Log(kc);
    
    // Find the pod for the job
    const podsRes = await coreV1Api.listNamespacedPod({
        namespace: NAMESPACE,
        labelSelector: `job-name=${jobName}`
    });
    
    if (!podsRes.items || podsRes.items.length === 0) {
        throw new Error(`No pods found for job ${jobName}`);
    }
    
    const pod = podsRes.items[0];
    if (!pod || !pod.metadata?.name) {
        throw new Error(`Pod has no name for job ${jobName}`);
    }

    const podName = pod.metadata.name;
    await log.log(NAMESPACE, podName, "", outStream, { follow: true });
}
