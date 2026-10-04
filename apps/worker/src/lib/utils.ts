import { createRedisClient } from "@repo/redis";

const pubClient = createRedisClient();

type EventType = "build" | "deployment"

export async function publishEvent(id: string, status: string, message: string, type: EventType) {
    const payload = JSON.stringify({ status, message, timestamp: new Date().toISOString() });
    const key = `deployment-logs:${id}`;

    await Promise.all([
        pubClient.publish(`deployment-events:${id}`, payload).catch(console.error),
        pubClient.rpush(key, payload).catch(console.error),
        pubClient.expire(key, 60 * 60 * 24 * 7).catch(console.error)
    ]);
}