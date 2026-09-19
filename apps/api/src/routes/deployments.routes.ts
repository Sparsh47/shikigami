import { FastifyInstance } from "fastify";
import { prisma } from "@repo/db";
import { createDeploymentSchema } from "../types/deployments.types.js";
import { createKanikoJob } from "../infra/k8s.js";

export async function userRoutes(fastify: FastifyInstance) {
    // ── GET /api/deployments?userId=<id> ─────────────────────────────────────
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

    fastify.post("/", async (request, reply) => {
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

            // Check if agent already exists for this user, or create a new one
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
                // Update agent configurations if already existing
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

                // Update or recreate envVars if provided
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

            // Create a new Deployment record linked to this agent
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


            await createKanikoJob({ jobName: deployment.jobName!, gitContext, destination: `jestico/${deployment.jobName}` });

            return reply.status(201).send({
                success: true,
                agentId: agent.id,
                deploymentId: deployment.id,
                destination: `jestico/${cleanName}:${deployment.id}`
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                error: "Failed to create deployment",
                message: error instanceof Error ? error.message : "Internal Server Error",
            });
        }
    });
}

// Semantic alias
export const deploymentRoutes = userRoutes;