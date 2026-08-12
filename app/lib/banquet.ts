// Core types, furniture catalog, and geometry helpers for the banquet layout designer.
// All dimensions are in feet; the canvas renders at PPF pixels per foot.

export const PPF = 10; // base pixels per foot at zoom = 1
export const CANVAS_MARGIN = 20; // feet of workspace around the room (hallways, storage, staging areas)

export type SeatArrangement = "around" | "both" | "one" | "none";
export type Shape = "round" | "rect";

export interface CatalogEntry {
  type: string;
  name: string;
  category: "Tables" | "Seating" | "Staging" | "Fixtures" | "Structure";
  shape: Shape;
  w: number; // feet (diameter for round)
  h: number;
  seats: number;
  seatArrangement: SeatArrangement;
  resizable?: boolean;
  fill: string;
  stroke: string;
  hideLabel?: boolean;
}

export interface PlacedItem {
  id: string;
  type: string;
  x: number; // center, feet
  y: number;
  w: number;
  h: number;
  rotation: number; // degrees
  seats: number;
  label: string;
}

export interface Room {
  name: string;
  w: number; // feet
  h: number;
}

export interface LayoutComment {
  id: string;
  x: number; // feet, same coordinate space as items
  y: number;
  author: string;
  text: string;
  createdAt: number;
}

export interface LayoutDoc {
  room: Room;
  items: PlacedItem[];
  comments?: LayoutComment[];
}

const wood = { fill: "#e8cfa3", stroke: "#a07d45" };
const linen = { fill: "#f1e4cb", stroke: "#a07d45" };

export const CATALOG: CatalogEntry[] = [
  // ---- Tables ----
  { type: "round-72", name: '72" Round', category: "Tables", shape: "round", w: 6, h: 6, seats: 10, seatArrangement: "around", ...wood },
  { type: "round-60", name: '60" Round', category: "Tables", shape: "round", w: 5, h: 5, seats: 8, seatArrangement: "around", ...wood },
  { type: "round-48", name: '48" Round', category: "Tables", shape: "round", w: 4, h: 4, seats: 6, seatArrangement: "around", ...wood },
  { type: "cocktail-30", name: '30" Cocktail', category: "Tables", shape: "round", w: 2.5, h: 2.5, seats: 0, seatArrangement: "none", ...linen },
  { type: "banquet-8", name: "8' Banquet", category: "Tables", shape: "rect", w: 8, h: 2.5, seats: 8, seatArrangement: "both", ...wood },
  { type: "banquet-6", name: "6' Banquet", category: "Tables", shape: "rect", w: 6, h: 2.5, seats: 6, seatArrangement: "both", ...wood },
  { type: "classroom-6", name: "6' Classroom", category: "Tables", shape: "rect", w: 6, h: 1.5, seats: 3, seatArrangement: "one", ...wood },
  { type: "sweetheart", name: "Sweetheart", category: "Tables", shape: "rect", w: 4, h: 2.5, seats: 2, seatArrangement: "one", fill: "#f3d6de", stroke: "#b06a80" },

  // ---- Seating ----
  { type: "chair", name: "Chair", category: "Seating", shape: "rect", w: 1.5, h: 1.5, seats: 1, seatArrangement: "none", fill: "#cbd5e1", stroke: "#64748b", hideLabel: true },
  { type: "chair-row", name: "Chair Row (10)", category: "Seating", shape: "rect", w: 17, h: 1.6, seats: 10, seatArrangement: "none", resizable: true, fill: "#cbd5e1", stroke: "#64748b" },
  { type: "lounge-sofa", name: "Lounge Sofa", category: "Seating", shape: "rect", w: 7, h: 3, seats: 3, seatArrangement: "none", fill: "#b8c9e8", stroke: "#5b7db8" },

  // ---- Staging ----
  { type: "stage", name: "Stage 8×6", category: "Staging", shape: "rect", w: 8, h: 6, seats: 0, seatArrangement: "none", resizable: true, fill: "#c5b6de", stroke: "#7a5fa8" },
  { type: "riser", name: "Riser 8×4", category: "Staging", shape: "rect", w: 8, h: 4, seats: 0, seatArrangement: "none", resizable: true, fill: "#d4c8e8", stroke: "#7a5fa8" },
  { type: "dance-floor", name: "Dance Floor", category: "Staging", shape: "rect", w: 15, h: 15, seats: 0, seatArrangement: "none", resizable: true, fill: "#f0e3b8", stroke: "#b3922e" },
  { type: "podium", name: "Podium", category: "Staging", shape: "rect", w: 2, h: 1.5, seats: 0, seatArrangement: "none", fill: "#d9b98c", stroke: "#8a6d3b" },
  { type: "screen", name: "AV Screen", category: "Staging", shape: "rect", w: 8, h: 1, seats: 0, seatArrangement: "none", resizable: true, fill: "#9aa4b2", stroke: "#4b5563" },
  { type: "dj-booth", name: "DJ Booth", category: "Staging", shape: "rect", w: 6, h: 3, seats: 0, seatArrangement: "none", fill: "#a8d5c8", stroke: "#3f8f78" },

  // ---- Fixtures ----
  { type: "bar", name: "Bar", category: "Fixtures", shape: "rect", w: 8, h: 3, seats: 0, seatArrangement: "none", resizable: true, fill: "#aecfe0", stroke: "#4a7fa0" },
  { type: "buffet", name: "Buffet Line", category: "Fixtures", shape: "rect", w: 12, h: 2.5, seats: 0, seatArrangement: "none", resizable: true, fill: "#c9dcb3", stroke: "#6f8f4a" },
  { type: "plant", name: "Plant", category: "Fixtures", shape: "round", w: 2, h: 2, seats: 0, seatArrangement: "none", fill: "#b5d4a7", stroke: "#4f7d3a", hideLabel: true },
  { type: "gift-table", name: "Gift Table", category: "Fixtures", shape: "rect", w: 6, h: 2.5, seats: 0, seatArrangement: "none", ...linen },

  // ---- Structure & annotation ----
  { type: "hallway", name: "Hallway", category: "Structure", shape: "rect", w: 20, h: 6, seats: 0, seatArrangement: "none", resizable: true, fill: "#eceae2", stroke: "#78716c" },
  { type: "area", name: "Area / Zone", category: "Structure", shape: "rect", w: 12, h: 10, seats: 0, seatArrangement: "none", resizable: true, fill: "#dbe7f5", stroke: "#6b8cae" },
  { type: "label", name: "Text Label", category: "Structure", shape: "rect", w: 8, h: 2, seats: 0, seatArrangement: "none", resizable: true, fill: "none", stroke: "none" },
  { type: "airwall", name: "Airwall", category: "Structure", shape: "rect", w: 12, h: 0.6, seats: 0, seatArrangement: "none", resizable: true, fill: "#9ca3af", stroke: "#4b5563" },
  { type: "entrance", name: "Entrance", category: "Structure", shape: "rect", w: 6, h: 1, seats: 0, seatArrangement: "none", fill: "#fcd9a8", stroke: "#c08a2e" },
  { type: "pillar", name: "Pillar", category: "Structure", shape: "round", w: 2.5, h: 2.5, seats: 0, seatArrangement: "none", fill: "#d6d3d1", stroke: "#57534e", hideLabel: true },
];

export const CATALOG_BY_TYPE: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG.map((c) => [c.type, c])
);

export const CATEGORIES = ["Tables", "Seating", "Staging", "Fixtures", "Structure"] as const;

let idCounter = 0;
export function nextId(): string {
  idCounter += 1;
  return `item-${Date.now().toString(36)}-${idCounter}`;
}

export function makeItem(type: string, x: number, y: number): PlacedItem {
  const cat = CATALOG_BY_TYPE[type];
  return {
    id: nextId(),
    type,
    x,
    y,
    w: cat.w,
    h: cat.h,
    rotation: 0,
    seats: cat.seats,
    label: "",
  };
}

export function snapTo(v: number, step: number): number {
  return Math.round(v / step) * step;
}

export interface ChairPos {
  x: number;
  y: number;
  angle: number; // degrees; chair back faces away from the table
}

// Chair positions in the item's local coordinate space (origin at item center).
export function chairPositions(item: PlacedItem): ChairPos[] {
  const cat = CATALOG_BY_TYPE[item.type];
  if (!cat || item.seats <= 0) return [];
  const out: ChairPos[] = [];
  if (cat.seatArrangement === "around") {
    const r = item.w / 2 + 0.95;
    for (let i = 0; i < item.seats; i++) {
      const a = (i / item.seats) * Math.PI * 2 - Math.PI / 2;
      out.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        angle: (a * 180) / Math.PI + 90,
      });
    }
  } else if (cat.seatArrangement === "both" || cat.seatArrangement === "one") {
    const both = cat.seatArrangement === "both";
    const nTop = both ? Math.ceil(item.seats / 2) : item.seats;
    const nBottom = both ? Math.floor(item.seats / 2) : 0;
    const dy = item.h / 2 + 0.95;
    for (let i = 0; i < nTop; i++) {
      out.push({ x: -item.w / 2 + (item.w * (i + 0.5)) / nTop, y: -dy, angle: 0 });
    }
    for (let i = 0; i < nBottom; i++) {
      out.push({ x: -item.w / 2 + (item.w * (i + 0.5)) / nBottom, y: dy, angle: 180 });
    }
  }
  return out;
}

export function displayName(item: PlacedItem): string {
  if (item.label) return item.label;
  const cat = CATALOG_BY_TYPE[item.type];
  return cat ? cat.name : item.type;
}

export function totalSeats(items: PlacedItem[]): number {
  return items.reduce((sum, it) => sum + (it.seats || 0), 0);
}

// A ready-made wedding reception layout used by the "Load sample" action.
export function sampleLayout(): LayoutDoc {
  const room: Room = { name: "Grand Ballroom — Sample Wedding", w: 60, h: 40 };
  const items: PlacedItem[] = [];
  const add = (type: string, x: number, y: number, extra?: Partial<PlacedItem>) => {
    const it = { ...makeItem(type, x, y), ...extra };
    items.push(it);
    return it;
  };
  add("stage", 30, 4.5, { w: 16, h: 7, label: "Stage / Head Table" });
  add("sweetheart", 30, 10.5, { label: "Sweetheart" });
  add("dance-floor", 30, 21, { w: 18, h: 14 });
  for (let i = 0; i < 4; i++) {
    add("round-60", 8, 8 + i * 8.5);
    add("round-60", 52, 8 + i * 8.5);
  }
  add("round-60", 15, 34);
  add("round-60", 24, 35);
  add("round-60", 36, 35);
  add("round-60", 45, 34);
  add("bar", 6, 37, { rotation: 0, label: "Bar" });
  add("buffet", 45, 38.5, { label: "Dessert" });
  add("dj-booth", 52.5, 21, { rotation: 90 });
  add("gift-table", 12, 38.5);
  add("entrance", 30, 39.5);
  add("plant", 2, 2);
  add("plant", 58, 2);
  // Back-of-house and circulation outside the room itself
  add("hallway", 30, -5, { w: 60, h: 6, label: "Pre-Function Hallway" });
  add("hallway", 66, 20, { w: 40, h: 6, rotation: 90, label: "Service Corridor" });
  add("area", -9, 10, { w: 14, h: 16, label: "Storage" });
  add("label", -9, 22, { label: "Back of house" });
  add("label", 30, -10.5, { w: 12, h: 2.5, label: "← To Lobby" });
  return { room, items };
}
