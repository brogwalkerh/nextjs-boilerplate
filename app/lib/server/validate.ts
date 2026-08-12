// Bounds-checking for data arriving from the network.

import { CATALOG_BY_TYPE, LayoutComment, PlacedItem, Room } from "../banquet";

export const MAX_DOC_BYTES = 300_000;
export const MAX_COMMENTS = 300;
export const MAX_TEXT = 500;
export const MAX_NAME = 120;

function num(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

export function cleanRoom(v: unknown): Room {
  const r = (v ?? {}) as Partial<Room>;
  return {
    name: String(r.name ?? "").slice(0, MAX_NAME),
    w: num(r.w, 10, 300, 60),
    h: num(r.h, 10, 300, 40),
  };
}

export function cleanItems(v: unknown): PlacedItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((it) => it && typeof it === "object" && CATALOG_BY_TYPE[(it as PlacedItem).type])
    .slice(0, 2000)
    .map((raw) => {
      const it = raw as PlacedItem;
      return {
        id: String(it.id).slice(0, 40),
        type: it.type,
        x: num(it.x, -100, 400, 0),
        y: num(it.y, -100, 400, 0),
        w: num(it.w, 0.5, 200, 1),
        h: num(it.h, 0.5, 200, 1),
        rotation: num(it.rotation, 0, 360, 0),
        seats: num(it.seats, 0, 30, 0),
        label: String(it.label ?? "").slice(0, MAX_NAME),
      };
    });
}

export function cleanComment(v: unknown): Omit<LayoutComment, "id" | "createdAt"> | null {
  const c = (v ?? {}) as Partial<LayoutComment>;
  const author = String(c.author ?? "").trim().slice(0, 60);
  const text = String(c.text ?? "").trim().slice(0, MAX_TEXT);
  if (!author || !text) return null;
  return { author, text, x: num(c.x, -100, 400, 0), y: num(c.y, -100, 400, 0) };
}

export function cleanComments(v: unknown): LayoutComment[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, MAX_COMMENTS)
    .map((raw) => {
      const base = cleanComment(raw);
      if (!base) return null;
      const c = raw as Partial<LayoutComment>;
      return {
        ...base,
        id: String(c.id ?? "").slice(0, 40) || "c",
        createdAt: num(c.createdAt, 0, 8.64e15, Date.now()),
      };
    })
    .filter((c): c is LayoutComment => c !== null);
}
