import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // Retry with backoff up to 2 seconds
    return Math.min(times * 200, 2000);
  },
});

redis.on("connect", () => {
  console.log("[Redis] Connected successfully");
});

redis.on("error", (err: any) => {
  console.error(`[Redis] Connection error: ${err.message || err}`);
});
