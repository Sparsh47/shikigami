import { Worker, DelayedError } from "bullmq";
import { redisConnection, createRedisClient } from "@repo/redis";
import { createKanikoJob, readJob, deleteJob } from "@repo/k8s";
import { prisma } from "@repo/db";

const pubClient = createRedisClient();

function publishEvent(deploymentId: string, status: string, message: string) {
    pubClient.publish(`deployment-events:${deploymentId}`, JSON.stringify({
        status,
        message,
        timestamp: new Date().toISOString()
    })).catch(console.error);
}

export const buildWorker = new Worker("build", async (job) => {
    const { deploymentId, gitContext, image, kanikoJobName } = job.data;

    await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: "BUILDING", updatedAt: new Date() }
    });

    try {
        await createKanikoJob({
            jobName: kanikoJobName,
            gitContext,
            destination: image
        });
        publishEvent(deploymentId, "BUILD_STARTED", "Triggered Kaniko build container in Kubernetes");
    } catch (err: any) {
        // 409 means the Kaniko job was already created in a previous attempt.
        if (err.code !== 409 && err.statusCode !== 409) {
            throw err;
        }
    }

    const k8sJob = await readJob(kanikoJobName);
    const conditions = k8sJob.status?.conditions ?? [];

    const succeeded = conditions.some((c) => c.type === "Complete" && c.status === "True");
    const failed = conditions.some((c) => c.type === "Failed" && c.status === "True");

    if (succeeded) {
        await deleteJob(kanikoJobName);
        publishEvent(deploymentId, "BUILD_SUCCESS", "Kaniko build completed successfully");
        return { success: true, image, deploymentId, jobName: kanikoJobName };
    } else if (failed) {
        await deleteJob(kanikoJobName);
        publishEvent(deploymentId, "BUILD_FAILED", "Kaniko build failed");
        throw new Error("Kaniko build job failed");
    } else {
        // Job still running, delay this bullmq job by 5 seconds
        publishEvent(deploymentId, "BUILD_POLLING", "Waiting for Kaniko build to complete...");
        job.moveToDelayed(Date.now() + 5000);
        throw new DelayedError();
    }
}, {
    connection: redisConnection,
    concurrency: 3
});

buildWorker.on("completed", async (job, result) => {
    console.log(`[BUILD] Job ${job.id} completed. Flow will proceed.`, result);
});

buildWorker.on("failed", async (job, error) => {
    console.log(`[BUILD] Job ${job?.id} failed`, error);
    if (job?.data?.deploymentId) {
        await prisma.deployment.update({
            where: { id: job.data.deploymentId },
            data: { status: "FAILED", updatedAt: new Date() }
        });
    }
});

buildWorker.on("error", (error) => {
    console.error(`[BUILD] Worker Error: `, error);
});