import { redis } from "../config/redis.js";

// 7 days in seconds
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const getRedisKey = (userId: string) => `refresh_token:${userId}`;

export const storeRefreshToken = async (
  userId: string,
  token: string
): Promise<void> => {
  await redis.set(getRedisKey(userId), token, "EX", REFRESH_TOKEN_TTL_SECONDS);
};

export const getStoredRefreshToken = async (
  userId: string
): Promise<string | null> => {
  return await redis.get(getRedisKey(userId));
};

export const removeRefreshToken = async (userId: string): Promise<void> => {
  await redis.del(getRedisKey(userId));
};
