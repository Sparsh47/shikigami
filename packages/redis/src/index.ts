import { Redis, type RedisOptions } from "ioredis";

export const redisOptions: RedisOptions = process.env.REDIS_URL
    ? {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
      }
    : {
          host: process.env.REDIS_HOST || "localhost",
          port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          username: process.env.REDIS_USERNAME || undefined,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
      };

export function createRedisClient(customOptions?: RedisOptions): Redis {
    if (process.env.REDIS_URL) {
        return new Redis(process.env.REDIS_URL, {
            ...redisOptions,
            ...customOptions,
        });
    }
    return new Redis({
        ...redisOptions,
        ...customOptions,
    });
}

const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? createRedisClient();
export const redisConnection = redis;

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
}

export { Redis, type RedisOptions };
