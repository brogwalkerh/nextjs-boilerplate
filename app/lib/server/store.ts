// Storage for live shared events. Uses Upstash Redis when configured (the
// Vercel Marketplace integration injects UPSTASH_* or KV_* env vars); falls
// back to an in-process Map for local development. On Vercel without Redis,
// writes are refused instead of silently landing in per-lambda memory.

import { Redis } from "@upstash/redis";
import { LayoutComment, PlacedItem, Room } from "../banquet";

export interface LiveRecord {
  key: string; // planner's secret; required to update the layout
  name: string;
  room: Room;
  items: PlacedItem[];
  comments: LayoutComment[];
  createdAt: number;
  updatedAt: number;
}

const TTL_SECONDS = 60 * 60 * 24 * 90; // live links stay active 90 days after the last change

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

const memory = new Map<string, LiveRecord>();

export function storageKind(): "redis" | "memory" | "none" {
  if (getRedis()) return "redis";
  return process.env.VERCEL ? "none" : "memory";
}

export async function getEvent(id: string): Promise<LiveRecord | null> {
  const r = getRedis();
  if (r) return ((await r.get(`evt:${id}`)) as LiveRecord | null) ?? null;
  return memory.get(id) ?? null;
}

export async function putEvent(id: string, rec: LiveRecord): Promise<void> {
  const r = getRedis();
  if (r) {
    await r.set(`evt:${id}`, rec, { ex: TTL_SECONDS });
  } else {
    memory.set(id, rec);
  }
}

export function randomId(len: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
