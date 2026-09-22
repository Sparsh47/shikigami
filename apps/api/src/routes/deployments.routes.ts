import { FastifyInstance } from "fastify";
import * as stream from "stream";
import { prisma } from "@repo/db";
import { createDeploymentSchema } from "../types/deployments.types.js";
import { flowProducer } from "@repo/queue";
import { createRedisClient } from "@repo/redis";
import { streamJobLogs } from "@repo/k8s";

export async function userRoutes(fastify: FastifyInstance) {
    fastify.get("/", async (request, reply) => {
        const { userId } = request.query as { userId?: string };

        if (!userId) {
            return reply.status(400).send({ error: "userId query param is required" });
        }

        try {
            const deployments = await prisma.deployment.findMany({
                where: { agent: { userId } },
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
            return reply.status(500).send({ error: "Failed to fetch deployments" });
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

            const {
                userId,
                agentName,
                framework,
                repoFullName,
                cloneUrl,
                branch,
                isPrivate,
                rootDir,
                buildCommand,
                runCommand,
                port,
                memory,
                cpu,
                scalingMode,
                envVars,
                commitSha,
                commitMessage,
            } = parsed.data;

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
                        buildCommand,
                        runCommand,
                        port,
                        memory,
                        cpu,
                        scalingMode,
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
                        buildCommand,
                        runCommand,
                        port,
                        memory,
                        cpu,
                        scalingMode,
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
                    image: `jestico/${deployment.jobName}`
                },
                children: [
                    {
                        name: "build",
                        queueName: "build",
                        data: {
                            deploymentId: deployment.id,
                            appName: agentName,
                            gitContext,
                            image: `jestico/${deployment.jobName}`,
                            port,
                            cpu,
                            memory,
                            runCommand,
                            kanikoJobName: `kaniko-${deployment.id}`
                        }
                    }
                ]
            });

            return reply.status(201).send({
                success: true,
                agentId: agent.id,
                deploymentId: deployment.id,
                destination: `jestico/${cleanName}:${deployment.id}`,
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: "Failed to create deployment",
                message: error instanceof Error ? error.message : "Internal Server Error",
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
            // For READY or FAILED deployments, just wait until client closes
            await new Promise<void>((resolve) => {
                request.raw.on("close", () => {
                    subClient.unsubscribe();
                    subClient.quit();
                    resolve();
                });
            });
        }
    });
}

// Semantic alias
export const deploymentRoutes = userRoutes;