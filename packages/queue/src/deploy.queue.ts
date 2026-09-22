import { Queue } from "bullmq";
import { redisConnection } from "@repo/redis";

export const deployQueue = new Queue("deploy", {
    connection: redisConnection,

    defaultJobOptions: {
        attempts: 3,

        backoff: {
            type: "exponential",
            delay: 1000
        },

        removeOnComplete: {
            age: 60 * 60,
            count: 1000
        },

        removeOnFail: {
            age: 24 * 60 * 60
        }
    }
});