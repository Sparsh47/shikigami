import { FlowProducer } from "bullmq";
import { redisConnection } from "@repo/redis";

export const flowProducer = new FlowProducer({
    connection: redisConnection
});
