import Redis from "ioredis";
import { env } from "~/env";

let redisClient: Redis | null = null;

export const getRedis = (): Redis | null => {
    if (!env.REDIS_URL) return null;

    if (!redisClient) {
        redisClient = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: 2,
            lazyConnect: false,
        });
    }
    return redisClient;
};

export const canUseRedis = (): boolean => Boolean(env.REDIS_URL);

