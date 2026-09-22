import { Worker } from "bullmq";
import { redisConnection, createRedisClient } from "@repo/redis";
import { deployApp } from "@repo/k8s";
import { prisma } from "@repo/db";

const pubClient = createRedisClient();

function publishEvent(deploymentId: string, status: string, message: string) {
    pubClient.publish(`deployment-events:${deploymentId}`, JSON.stringify({
        status,
        message,
        timestamp: new Date().toISOString()
    })).catch(console.error);
}

export const deployWorker = new Worker("deploy", async (job) => {
    const { deploymentId, image } = job.data;

    publishEvent(deploymentId, "DEPLOY_STARTED", "Fetching configuration for deployment...");

    // Fetch the deployment and associated agent config
    const deploymentRecord = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: {
            agent: {
                include: { envVars: true },
            },
        },
    });

    if (!deploymentRecord || !deploymentRecord.agent) {
        publishEvent(deploymentId, "DEPLOY_FAILED", "Agent configuration not found");
        throw new Error(`Agent configuration not found for deploymentId: ${deploymentId}`);
    }

    const { agent } = deploymentRecord;
    const appName = agent.agentName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    publishEvent(deploymentId, "DEPLOY_PROGRESS", "Applying Kubernetes manifests...");

    // Deploy to Kubernetes
    const appUrl = await deployApp({
        appName,
        image,
        port: agent.port,
        cpu: String(agent.cpu),
        memory: agent.memory,
        ...(agent.runCommand && { runCommand: agent.runCommand }),
        env: agent.envVars.map((v) => ({ name: v.key, value: v.value })),
    });

    // Update database status to READY
    await prisma.deployment.update({
        where: { id: deploymentId },
        data: { 
            status: "READY", 
            url: appUrl, 
            updatedAt: new Date() 
        },
    });

    publishEvent(deploymentId, "DEPLOY_SUCCESS", `Application successfully deployed and available at ${appUrl}`);

    return { success: true, url: appUrl, deploymentId };
}, {
    connection: redisConnection,
    concurrency: 5
});

deployWorker.on("completed", (job, result) => {
    console.log(`[DEPLOY] Job ${job.id} completed. App is available at ${result.url}`);
});

deployWorker.on("failed", async (job, error) => {
    console.error(`[DEPLOY] Job ${job?.id} failed:`, error);
    if (job?.data?.deploymentId) {
        await prisma.deployment.update({
            where: { id: job.data.deploymentId },
            data: { status: "FAILED", updatedAt: new Date() }
        });
    }
});
