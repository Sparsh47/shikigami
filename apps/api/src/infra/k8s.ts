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

const NAMESPACE = "default";

const KANIKO_JOB_YAML_PATH = path.join(__dirname, "manifests", "kaniko-job.yaml");

interface KanikoJobOverrides {
    jobName?: string;
    gitContext?: string;
    destination?: string;
}

export async function createKanikoJob(overrides: KanikoJobOverrides = {}) {
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

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMainModule) {
    createKanikoJob({
        jobName: `kaniko-build-test-${Date.now()}`,
    })
        .then((job) => {
            console.log("Job created:", job.metadata?.name);
        })
        .catch((err) => {
            console.error("Failed to create Job:", err);
        });
}