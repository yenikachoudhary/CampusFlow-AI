import { createClient } from "@redis/client";
import { env } from "../config/env.js";

let redis;
let mode = "disconnected";
const memory = new Map();

export function redisMode() {
  return mode;
}

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
    console.log("Redis connected");
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

export function redisClient() {
  if (mode === "redis" && redis?.isReady) return redis;
  if (mode === "memory") return null;
  throw new Error("Redis is not connected");
}

export async function cacheGetJson(key) {
  if (mode === "redis") {
    const value = await redisClient().get(key);
    return value ? JSON.parse(value) : null;
  }
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

export async function cacheSetJson(key, value, ttl = env.cacheTtlSeconds) {
  if (mode === "redis") {
    await redisClient().set(key, JSON.stringify(value), { EX: ttl });
    return;
  }
  memory.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

export async function cacheDelete(key) {
  if (mode === "redis") {
    await redisClient().del(key);
    return;
  }
  memory.delete(key);
}

export async function closeRedis() {
  if (redis?.isOpen) await redis.quit();
  redis = undefined;
  memory.clear();
  mode = "disconnected";
}
