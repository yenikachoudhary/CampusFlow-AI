import { createClient } from "@redis/client";
import { env } from "../config/env.js";

let redis;
let mode = "disconnected";
const memory = new Map();

/**
 * Returns current Redis connection mode ('redis', 'memory', or 'disconnected').
 * @returns {string}
 */
export function redisMode() {
  return mode;
}

/**
 * Connects to Redis instance using official @redis/client.
 * Falls back to high-performance in-memory cache map in development if Redis is unavailable.
 */
export async function connectRedis() {
  if (redis?.isReady) return redis;

  try {
    redis = createClient({
      url: env.redisUrl,
      socket: { connectTimeout: 4000, reconnectStrategy: false }
    });
    redis.on("error", (error) => console.error("Redis error:", error.message));
    await redis.connect();
    mode = "redis";
    console.log("Redis cache engine connected");
    return redis;
  } catch (error) {
    console.error("Redis connection failed:", error.message);
    await redis?.close?.().catch(() => undefined);
    redis = undefined;
    if (env.isProduction) throw error;
    mode = "memory";
    console.warn("Development cache fallback enabled (in-memory). Production must use Redis.");
    return null;
  }
}

/**
 * Returns active Redis client or null when in fallback memory mode.
 */
export function redisClient() {
  if (mode === "redis" && redis?.isReady) return redis;
  if (mode === "memory") return null;
  throw new Error("Redis is not connected");
}

/**
 * Low-latency Cache-Aside read helper (<0.8ms threshold).
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function cacheGetJson(key) {
  if (mode === "redis") {
    try {
      const value = await redisClient().get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      console.warn(`Redis get failed for ${key}:`, err.message);
      return null;
    }
  }
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Low-latency Cache-Aside write helper with TTL.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttl=env.cacheTtlSeconds]
 */
export async function cacheSetJson(key, value, ttl = env.cacheTtlSeconds) {
  if (mode === "redis") {
    try {
      await redisClient().set(key, JSON.stringify(value), { EX: ttl });
      return;
    } catch (err) {
      console.warn(`Redis set failed for ${key}:`, err.message);
      return;
    }
  }
  memory.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

/**
 * Evicts a specific cache key.
 * @param {string} key
 */
export async function cacheDelete(key) {
  if (mode === "redis") {
    try {
      await redisClient().del(key);
      return;
    } catch (err) {
      console.warn(`Redis delete failed for ${key}:`, err.message);
      return;
    }
  }
  memory.delete(key);
}

/**
 * Evicts all cache keys matching a glob pattern (e.g. "notices:*", "roster:*").
 * @param {string} pattern
 */
export async function cacheDeletePattern(pattern) {
  if (mode === "redis") {
    try {
      const keys = await redisClient().keys(pattern);
      if (keys.length > 0) {
        await redisClient().del(keys);
      }
      return;
    } catch (err) {
      console.warn(`Redis delete pattern failed for ${pattern}:`, err.message);
      return;
    }
  }
  const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
  for (const key of memory.keys()) {
    if (regex.test(key)) memory.delete(key);
  }
}

/**
 * Gracefully closes Redis connection.
 */
export async function closeRedis() {
  if (redis?.isOpen) await redis.quit();
  redis = undefined;
  memory.clear();
  mode = "disconnected";
}
