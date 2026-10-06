import { FastifyInstance } from "fastify";
import * as stream from "stream";
import { EnvVar, prisma } from "@repo/db";
import { createDeploymentSchema } from "../types/deployments.types.js";
import { flowProducer } from "@repo/queue";
import { createRedisClient } from "@repo/redis";
import { streamJobLogs } from "@repo/k8s";
import path from "path";

export async function userRoutes(fastify: FastifyInstance) {
    fastify.get("/", async (request, reply) => {
        const userId = request.userId;
        const { repo, agentName } = (request.query as { repo?: string; agentName?: string }) ?? {};

        try {
            const whereClause: any = { agent: { userId } };
            if (repo) {
                whereClause.agent.repoFullName = repo;
            }
            if (agentName) {
                whereClause.agent.agentName = agentName;
            }

            const deployments = await prisma.deployment.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                include: {
                    agent: {
                        select: {
                            agentName: true,
                            repoFullName: true,
                            branch: true,
                            framework: true,
                        },
                    },
                },
            });

            const shaped = deployments.map((d) => ({
                id: d.id,
                name: d.agent.agentName,
                repo: d.agent.repoFullName,
                branch: d.agent.branch,
                framework: d.agent.framework,
                status: d.status.toLowerCase() as "ready" | "building" | "failed" | "queued",
                commitSha: d.commitSha ?? "latest",
                commitMessage: d.commitMessage ?? "",
                url: d.url ?? `https://${d.agent.agentName}.shikigami.app`,
                createdAt: d.createdAt.toISOString(),
                updatedAt: d.updatedAt.toISOString(),
            }));

            return reply.send({ deployments: shaped });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch deployments", message: error instanceof Error ? error.message : String(error) });
        }
    });

    fastify.get("/:id", async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            const deployment = await prisma.deployment.findUnique({
                where: { id },
                include: {
                    agent: {
                        select: {
                            agentName: true,
                            repoFullName: true,
                            branch: true,
                            framework: true,
                        },
                    },
                },
            });
            if (!deployment) {
                return reply.status(404).send({ error: `Deployment with id: ${id} not found` });
            }
            const shaped = {
                id: deployment.id,
                name: deployment.agent.agentName,
                repo: deployment.agent.repoFullName,
                branch: deployment.agent.branch,
                framework: deployment.agent.framework,
                status: deployment.status.toLowerCase() as "ready" | "building" | "failed" | "queued",
                commitSha: deployment.commitSha ?? "latest",
                commitMessage: deployment.commitMessage ?? "",
                url: deployment.url ?? `https://${deployment.agent.agentName}.shikigami.app`,
                createdAt: deployment.createdAt.toISOString(),
                updatedAt: deployment.updatedAt.toISOString(),
            };
            return reply.send({ deployment: shaped });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: `Failed to fetch deployment with id: ${id}` });
        }
    });

    fastify.post("/create", async (request, reply) => {
        try {
            const parsed = createDeploymentSchema.safeParse(request.body);

            if (!parsed.success) {
                return reply.status(400).send({
                    error: "Validation failed",
                    details: parsed.error.flatten(),
                });
            }

            const userId = request.userId;

            const {
                agentName,
                framework,
                repoFullName,
                cloneUrl,
                branch,
                isPrivate,
                rootDir,
                dockerfilePath,
                buildCommand,
                runCommand,
                port,
                memory,
                cpu,
                scalingMode,
                dockerUsername,
                envVars,
                commitSha,
                commitMessage,
            } = parsed.data;

            if (!dockerfilePath.trim()) {
                return reply.status(400).send({ error: "Docker file path is required" });
            }

            if (path.posix.isAbsolute(dockerfilePath) || path.win32.isAbsolute(dockerfilePath)) {
                return reply.status(400).send({ error: "Docker file path cannot be absolute" });
            }

            const normalizedDockerPath = path.posix.normalize(dockerfilePath);

            const PLATFORM_REGISTRY = "jestico";
            const registry = dockerUsername ?? PLATFORM_REGISTRY;

            let agent = await prisma.agent.findFirst({
                where: {
                    userId,
                    agentName,
                },
            });

            if (!agent) {
                agent = await prisma.agent.create({
                    data: {
                        userId,
                        agentName,
                        framework,
                        repoFullName,
                        cloneUrl,
                        branch,
                        isPrivate,
                        rootDir,
                        dockerfilePath: normalizedDockerPath,
                        buildCommand,
                        runCommand,
                        port,
                        memory,
                        cpu,
                        scalingMode,
                        dockerUsername: dockerUsername ?? null,
                        envVars: {
                            create: envVars.map((v) => ({
                                key: v.key,
                                value: v.value,
                                isSecret: v.isSecret,
                            })),
                        },
                    },
                });
            } else {
                agent = await prisma.agent.update({
                    where: { id: agent.id },
                    data: {
                        framework,
                        repoFullName,
                        cloneUrl,
                        branch,
                        isPrivate,
                        rootDir,
                        dockerfilePath: normalizedDockerPath,
                        buildCommand,
                        runCommand,
                        port,
                        memory,
                        cpu,
                        scalingMode,
                        dockerUsername: dockerUsername ?? null,
                    },
                });

                if (envVars.length > 0) {
                    const currentAgentId = agent.id;
                    await prisma.envVar.deleteMany({
                        where: { agentId: currentAgentId },
                    });
                    await prisma.envVar.createMany({
                        data: envVars.map((v) => ({
                            agentId: currentAgentId,
                            key: v.key,
                            value: v.value,
                            isSecret: v.isSecret,
                        })),
                    });
                }
            }

            const cleanName = agentName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
            const jobName = `kaniko-${cleanName}-${Date.now()}`;

            const deployment = await prisma.deployment.create({
                data: {
                    agentId: agent.id,
                    status: "QUEUED",
                    jobName,
                    commitSha: commitSha || null,
                    commitMessage: commitMessage || null,
                    url: `https://${cleanName}.shikigami.app`,
                },
            });

            const gitRef = commitSha || `refs/heads/${branch}`;
            const gitContext = `git://github.com/${repoFullName}.git#${gitRef}`;

            await flowProducer.add({
                name: "deploy",
                queueName: "deploy",
                data: {
                    deploymentId: deployment.id,
                    image: `${registry}/${deployment.jobName}`
                },
                children: [
                    {
                        name: "build",
                        queueName: "build",
                        data: {
                            deploymentId: deployment.id,
                            appName: agentName,
                            gitContext,
                            image: `${registry}/${deployment.jobName}`,
                            port,
                            cpu,
                            memory,
                            runCommand,
                            kanikoJobName: `kaniko-${deployment.id}`,
                            rootDir,
                            dockerfilePath: normalizedDockerPath
                        }
                    }
                ]
            });

            return reply.status(201).send({
                success: true,
                agentId: agent.id,
                deploymentId: deployment.id,
                destination: `${registry}/${cleanName}:${deployment.id}`,
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: "Failed to create deployment",
                message: error instanceof Error ? error.message : "Internal Server Error",
            });
        }
    });

    fastify.post("/:id/redeploy", async (request, reply) => {
        const { id } = request.params as { id: string };
        try {
            const oldDeployment = await prisma.deployment.findUnique({
                where: { id },
                include: { agent: true }
            });

            if (!oldDeployment) {
                return reply.status(404).send({ error: "Deployment not found" });
            }

            const agent = oldDeployment.agent;
            const cleanName = agent.agentName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
            const jobName = `kaniko-${cleanName}-${Date.now()}`;

            const PLATFORM_REGISTRY = "jestico";
            const registry = agent.dockerUsername ?? PLATFORM_REGISTRY;

            const newDeployment = await prisma.deployment.create({
                data: {
                    agentId: agent.id,
                    status: "QUEUED",
                    jobName,
                    commitSha: oldDeployment.commitSha,
                    commitMessage: oldDeployment.commitMessage,
                    url: oldDeployment.url,
                },
            });

            const gitRef = oldDeployment.commitSha || `refs/heads/${agent.branch}`;
            const gitContext = `git://github.com/${agent.repoFullName}.git#${gitRef}`;

            await flowProducer.add({
                name: "deploy",
                queueName: "deploy",
                data: {
                    deploymentId: newDeployment.id,
                    image: `${registry}/${newDeployment.jobName}`
                },
                children: [
                    {
                        name: "build",
                        queueName: "build",
                        data: {
                            deploymentId: newDeployment.id,
                            appName: agent.agentName,
                            gitContext,
                            image: `${registry}/${newDeployment.jobName}`,
                            port: agent.port,
                            cpu: agent.cpu,
                            memory: agent.memory,
                            runCommand: agent.runCommand,
                            kanikoJobName: `kaniko-${newDeployment.id}`,
                            rootDir: agent.rootDir,
                            dockerfilePath: agent.dockerfilePath
                        }
                    }
                ]
            });

            return reply.status(201).send({
                success: true,
                deploymentId: newDeployment.id,
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: "Failed to redeploy",
                message: error instanceof Error ? error.message : "Internal Server Error",
            });
        }
    });

    // Must be registered BEFORE /:id/logs so Fastify doesn't shadow it
    fastify.get("/:id/logs/history", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const redis = createRedisClient();
            const raw = await redis.lrange(`deployment-logs:${id}`, 0, -1);
            await redis.quit();
            const events = raw.map((r) => JSON.parse(r));
            return reply.send({ events });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({
                error: "Failed to fetch logs history",
                message: err instanceof Error ? err.message : "Internal Server Error"
            });
        }
    });

    fastify.get("/:id/logs", async (request, reply) => {
        const { id } = request.params as { id: string };

        reply.raw.setHeader("Content-Type", "text/event-stream");
        reply.raw.setHeader("Cache-Control", "no-cache");
        reply.raw.setHeader("Connection", "keep-alive");
        reply.raw.setHeader("Access-Control-Allow-Origin", "*");

        // 1. Subscribe to Redis high-level events
        const subClient = createRedisClient();
        await subClient.subscribe(`deployment-events:${id}`);

        subClient.on("message", (channel, message) => {
            if (channel === `deployment-events:${id}`) {
                const data = JSON.parse(message);
                reply.raw.write(`data: ${JSON.stringify({ type: "event", ...data })}\n\n`);
            }
        });

        // 2. Stream Kaniko Pod logs if applicable
        // Find the deployment to get the kaniko job name
        const deployment = await prisma.deployment.findUnique({
            where: { id }
        });

        if (deployment && deployment.status !== "READY" && deployment.status !== "FAILED") {
            const sseStream = new stream.Writable({
                write(chunk, encoding, callback) {
                    const logLine = chunk.toString();
                    reply.raw.write(`data: ${JSON.stringify({ type: "log", message: logLine })}\n\n`);
                    callback();
                }
            });

            let logStreamConnected = false;

            const tryConnectLogs = async () => {
                try {
                    await streamJobLogs(`kaniko-${id}`, sseStream);
                    logStreamConnected = true;
                } catch (err) {
                    reply.raw.write(`data: ${JSON.stringify({ type: "syslog", message: "Waiting for pod to initialize..." })}\n\n`);
                }
            };

            // Initial attempt
            tryConnectLogs(); // don't await, let it run in background

            // Poll every 3 seconds if not connected
            const logCheckInterval = setInterval(() => {
                if (!logStreamConnected) {
                    tryConnectLogs();
                } else {
                    clearInterval(logCheckInterval);
                }
            }, 3000);

            await new Promise<void>((resolve) => {
                request.raw.on("close", () => {
                    subClient.unsubscribe();
                    subClient.quit();
                    clearInterval(logCheckInterval);
                    resolve();
                });
            });
        } else {
            await new Promise<void>((resolve) => {
                request.raw.on("close", () => {
                    subClient.unsubscribe();
                    subClient.quit();
                    resolve();
                });
            });
        }
    });

    fastify.get("/:id/envs", async (request, reply) => {
        const { id } = request.params as { id: string };
        try {
            const deployment = await prisma.deployment.findFirst({
                where: { id },
                include: {
                    agent: {
                        include: {
                            envVars: true
                        }
                    }
                }
            });

            if (!deployment) {
                return reply.status(404).send({ error: "Deployment not found" });
            }

            const envs = deployment.agent.envVars.map((env) => {
                const { key, isSecret, value, agentId, id } = env;
                const newEnv = {
                    id,
                    agentId,
                    isSecret,
                    key,
                    value: isSecret ? "********************" : value
                }

                return newEnv
            })

            return reply.status(200).send({ envs: envs, agent: deployment.agent.agentName });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({
                error: "Failed to fetch envs",
                message: err instanceof Error ? err.message : "Internal Server Error",
            });
        }
    })

    fastify.patch("/:id/envs/update", async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { envVars, agentName } = request.body as {
                envVars?: Array<{ key: string; value: string; isSecret: boolean; id?: number }>;
                agentName?: string;
            };

            const deployment = await prisma.deployment.findUnique({
                where: { id: id },
                include: {
                    agent: {
                        include: {
                            envVars: true,
                        },
                    },
                },
            });

            if (!deployment) {
                return reply.status(404).send({ error: "Agent not found" });
            }

            await prisma.$transaction(async (tx) => {
                if (agentName && agentName.trim() !== deployment.agent.agentName) {
                    await tx.agent.update({
                        where: { id: deployment.agent.id },
                        data: { agentName: agentName.trim() },
                    });
                }

                if (envVars && envVars.length > 0) {
                    for (const env of envVars) {
                        const existing = (env.id ? deployment.agent.envVars.find((e) => e.id === Number(env.id)) : null) ??
                            deployment.agent.envVars.find((e) => e.key === env.key);

                        if (existing) {
                            await tx.envVar.update({
                                where: { id: existing.id },
                                data: {
                                    value: env.value,
                                    isSecret: env.isSecret,
                                },
                            });
                        } else {
                            await tx.envVar.create({
                                data: {
                                    agentId: deployment.agent.id,
                                    key: env.key,
                                    value: env.value,
                                    isSecret: env.isSecret,
                                },
                            });
                        }
                    }
                }
            });

            return reply.status(200).send({ success: true, agentId: id });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({
                error: "Failed to update envs",
                message: err instanceof Error ? err.message : "Internal Server Error",
            });
        }
    })

    fastify.delete("/:id/delete", async (request, reply) => {
        try {
            const { id } = request.body as { id: string };

            const deployment = await prisma.deployment.findUnique({
                where: { id }
            });

            if (!deployment) {
                return reply.status(404).send({ error: "Deployment not found" });
            }

            await prisma.agent.delete({
                where: {
                    id: deployment.agentId
                }
            });

            return reply.status(200).send({ success: true, message: "Deployment deleted successfully" });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({
                error: "Failed to delete deployment",
                message: err instanceof Error ? err.message : "Internal Server Error",
            });
        }
    })
}

export const deploymentRoutes = userRoutes;