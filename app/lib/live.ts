// Client for the live-sharing API. On static hosts (GitHub Pages) /api/*
// doesn't exist, so liveAvailable() resolves false and the UI falls back to
// snapshot links.

import { LayoutComment, PlacedItem, Room } from "./banquet";

export interface LiveInfo {
  id: string;
  key: string;
}

export interface LiveEvent {
  name: string;
  room: Room;
  items: PlacedItem[];
  comments: LayoutComment[];
  createdAt: number;
  updatedAt: number;
}

let healthPromise: Promise<boolean> | null = null;

export function liveAvailable(): Promise<boolean> {
  if (!healthPromise) {
    healthPromise = fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => !!(j as { ok?: boolean } | null)?.ok)
      .catch(() => false);
  }
  return healthPromise;
}

export async function createLive(doc: { room: Room; items: PlacedItem[]; comments?: LayoutComment[] }): Promise<LiveInfo> {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doc }),
  });
  if (!res.ok) throw new Error(`create failed: ${res.status}`);
  return (await res.json()) as LiveInfo;
}

export async function getLive(id: string): Promise<LiveEvent | null> {
  const res = await fetch(`/api/events/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as LiveEvent;
}

export async function pushLive(
  id: string,
  key: string,
  doc: { room: Room; items: PlacedItem[] },
  comments?: LayoutComment[]
): Promise<boolean> {
  const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comments === undefined ? { key, doc } : { key, doc, comments }),
  });
  return res.ok;
}

export async function addLiveComment(
  id: string,
  comment: { author: string; text: string; x: number; y: number }
): Promise<LayoutComment | null> {
  const res = await fetch(`/api/events/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comment),
  });
  if (!res.ok) return null;
  return ((await res.json()) as { comment: LayoutComment }).comment;
}

export async function deleteLiveComment(id: string, cid: string): Promise<boolean> {
  const res = await fetch(`/api/events/${encodeURIComponent(id)}/comments?cid=${encodeURIComponent(cid)}`, {
    method: "DELETE",
  });
  return res.ok;
}
