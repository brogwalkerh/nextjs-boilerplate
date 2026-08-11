"use client";

import {
  CANVAS_MARGIN,
  CATALOG,
  CATALOG_BY_TYPE,
  CATEGORIES,
  chairPositions,
  displayName,
  LayoutDoc,
  makeItem,
  PlacedItem,
  PPF,
  Room,
  sampleLayout,
  snapTo,
  totalSeats,
} from "../lib/banquet";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "banquet-layout-v1";
const M = CANVAS_MARGIN;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function rot(dx: number, dy: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: dx * c - dy * s, y: dx * s + dy * c };
}

/* ---------- SVG glyphs (all coordinates in feet, origin at item center) ---------- */

function ChairGlyph({ scale = 1 }: { scale?: number }) {
  // Seat with a back bar on the local -y side; the chair "faces" +y.
  return (
    <g transform={`scale(${scale})`}>
      <rect x={-0.62} y={-0.55} width={1.24} height={1.15} rx={0.3} fill="#cbd5e1" stroke="#64748b" strokeWidth={0.06} />
      <rect x={-0.62} y={-0.72} width={1.24} height={0.34} rx={0.17} fill="#94a3b8" stroke="#64748b" strokeWidth={0.06} />
    </g>
  );
}

function ItemGlyph({ item, showText = true }: { item: PlacedItem; showText?: boolean }) {
  const cat = CATALOG_BY_TYPE[item.type];
  if (!cat) return null;
  const chairs = chairPositions(item);
  const name = displayName(item);
  const showLabel = showText && (!cat.hideLabel || item.label.trim() !== "");
  const labelSize = clamp(Math.min(item.w, item.h) * 0.28, 0.7, 1.15);
  const isRound = cat.shape === "round";

  const decorations: React.ReactNode[] = [];
  if (item.type === "dance-floor") {
    // Parquet grid, 3 ft squares
    for (let gx = 3; gx < item.w; gx += 3) {
      decorations.push(
        <line key={`v${gx}`} x1={-item.w / 2 + gx} y1={-item.h / 2} x2={-item.w / 2 + gx} y2={item.h / 2} stroke={cat.stroke} strokeWidth={0.04} opacity={0.5} />
      );
    }
    for (let gy = 3; gy < item.h; gy += 3) {
      decorations.push(
        <line key={`h${gy}`} x1={-item.w / 2} y1={-item.h / 2 + gy} x2={item.w / 2} y2={-item.h / 2 + gy} stroke={cat.stroke} strokeWidth={0.04} opacity={0.5} />
      );
    }
  }
  if (item.type === "chair-row" && item.seats > 0) {
    for (let i = 0; i < item.seats; i++) {
      const cx = -item.w / 2 + (item.w * (i + 0.5)) / item.seats;
      decorations.push(
        <g key={`c${i}`} transform={`translate(${cx},0) rotate(180)`}>
          <ChairGlyph />
        </g>
      );
    }
  }
  if (item.type === "lounge-sofa") {
    decorations.push(
      <rect key="back" x={-item.w / 2 + 0.15} y={-item.h / 2 + 0.15} width={item.w - 0.3} height={0.7} rx={0.3} fill={cat.stroke} opacity={0.35} />
    );
  }
  if (item.type === "plant") {
    decorations.push(
      <circle key="inner" r={item.w * 0.28} fill={cat.stroke} opacity={0.4} />
    );
  }

  return (
    <g>
      {chairs.map((c, i) => (
        <g key={i} transform={`translate(${c.x},${c.y}) rotate(${c.angle})`}>
          <ChairGlyph />
        </g>
      ))}
      {item.type === "chair" ? (
        <ChairGlyph scale={1.15} />
      ) : isRound ? (
        <circle r={item.w / 2} fill={cat.fill} stroke={cat.stroke} strokeWidth={0.12} />
      ) : (
        <rect
          x={-item.w / 2}
          y={-item.h / 2}
          width={item.w}
          height={item.h}
          rx={item.type === "chair-row" ? 0.3 : 0.15}
          fill={item.type === "chair-row" ? "none" : cat.fill}
          stroke={cat.stroke}
          strokeWidth={0.12}
          strokeDasharray={item.type === "chair-row" || item.type === "entrance" ? "0.4 0.3" : undefined}
        />
      )}
      {decorations}
      {showLabel && (
        <g transform={`rotate(${-item.rotation})`}>
          <text
            textAnchor="middle"
            y={item.seats > 0 && item.type !== "chair" && item.type !== "chair-row" ? -0.1 : labelSize * 0.35}
            fontSize={labelSize}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fill="#3f3222"
            fontWeight={600}
          >
            {name}
          </text>
          {item.seats > 0 && item.type !== "chair" && item.type !== "chair-row" && (
            <text
              textAnchor="middle"
              y={labelSize}
              fontSize={labelSize * 0.8}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fill="#6b5b3e"
            >
              {item.seats} seats
            </text>
          )}
        </g>
      )}
    </g>
  );
}

function PalettePreview({ type }: { type: string }) {
  const cat = CATALOG_BY_TYPE[type];
  const fake = { ...makeItem(type, 0, 0), id: "preview" };
  const hasChairs = cat.seats > 0 && cat.seatArrangement !== "none";
  const extent = Math.max(fake.w, fake.h) + (hasChairs ? 3.4 : 1);
  return (
    <svg viewBox={`${-extent / 2} ${-extent / 2} ${extent} ${extent}`} width={44} height={44} aria-hidden>
      <ItemGlyph item={fake} showText={false} />
    </svg>
  );
}

/* ---------- main component ---------- */

type Marquee = { x0: number; y0: number; x1: number; y1: number; additive: boolean };
type Ghost = { type: string; x: number; y: number };

export default function BanquetDesigner() {
  const [room, setRoom] = useState<Room>({ name: "Grand Ballroom", w: 60, h: 40 });
  const [items, setItemsRaw] = useState<PlacedItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [past, setPast] = useState<PlacedItem[][]>([]);
  const [future, setFuture] = useState<PlacedItem[][]>([]);
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [loaded, setLoaded] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  const zoomRef = useRef(zoom);
  const roomRef = useRef(room);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const snapStep = useCallback(() => (snap ? 0.5 : 0.05), [snap]);

  /* ----- history ----- */

  const commit = useCallback((next: PlacedItem[], base?: PlacedItem[]) => {
    setPast((p) => [...p.slice(-99), base ?? itemsRef.current]);
    setFuture([]);
    setItemsRaw(next);
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [itemsRef.current, ...f.slice(0, 99)]);
      setItemsRaw(prev);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p.slice(-99), itemsRef.current]);
      setItemsRaw(next);
      return f.slice(1);
    });
  }, []);

  /* ----- persistence ----- */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const doc = JSON.parse(raw) as LayoutDoc;
        if (doc && Array.isArray(doc.items) && doc.room) {
          setRoom(doc.room);
          setItemsRaw(doc.items.filter((it) => CATALOG_BY_TYPE[it.type]));
          setLoaded(true);
          return;
        }
      }
    } catch {
      // fall through to sample
    }
    const sample = sampleLayout();
    setRoom(sample.room);
    setItemsRaw(sample.items);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ room, items }));
      } catch {
        // storage full / unavailable — ignore
      }
    }, 300);
    return () => clearTimeout(t);
  }, [room, items, loaded]);

  /* ----- coordinate helpers ----- */

  const clientToFeet = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const scale = PPF * zoomRef.current;
    return { x: (clientX - rect.left) / scale - M, y: (clientY - rect.top) / scale - M };
  }, []);

  const overCanvas = useCallback((clientX: number, clientY: number) => {
    const el = scrollRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }, []);

  const beginDrag = useCallback(
    (onMove: (e: PointerEvent) => void, onUp: (e: PointerEvent) => void) => {
      const move = (e: PointerEvent) => onMove(e);
      const up = (e: PointerEvent) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        onUp(e);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    []
  );

  /* ----- item interactions ----- */

  const onItemPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      let sel: string[];
      if (e.shiftKey) {
        sel = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
        setSelected(sel);
        return; // shift-click toggles membership; no drag
      }
      sel = selected.includes(id) ? selected : [id];
      setSelected(sel);

      const base = itemsRef.current;
      const start = clientToFeet(e.clientX, e.clientY);
      const orig = new Map(base.filter((it) => sel.includes(it.id)).map((it) => [it.id, { x: it.x, y: it.y }]));
      let moved = false;
      const step = snapStep();
      const rm = roomRef.current;

      beginDrag(
        (ev) => {
          const p = clientToFeet(ev.clientX, ev.clientY);
          const dx = p.x - start.x;
          const dy = p.y - start.y;
          if (Math.abs(dx) + Math.abs(dy) > 0.1) moved = true;
          if (!moved) return;
          setItemsRaw(
            base.map((it) => {
              const o = orig.get(it.id);
              if (!o) return it;
              return {
                ...it,
                x: clamp(snapTo(o.x + dx, step), -M + 1, rm.w + M - 1),
                y: clamp(snapTo(o.y + dy, step), -M + 1, rm.h + M - 1),
              };
            })
          );
        },
        () => {
          if (moved) commit(itemsRef.current, base);
        }
      );
    },
    [selected, clientToFeet, snapStep, beginDrag, commit]
  );

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      const base = itemsRef.current;
      const item = base.find((it) => it.id === id);
      if (!item) return;
      // The corner opposite the drag handle stays fixed.
      const fixedLocal = rot(-item.w / 2, -item.h / 2, item.rotation);
      const fixed = { x: item.x + fixedLocal.x, y: item.y + fixedLocal.y };
      const step = snapStep();
      let moved = false;

      beginDrag(
        (ev) => {
          const p = clientToFeet(ev.clientX, ev.clientY);
          const local = rot(p.x - fixed.x, p.y - fixed.y, -item.rotation);
          const w = clamp(snapTo(local.x, step), 1, 200);
          const h = clamp(snapTo(local.y, step), 0.5, 200);
          moved = true;
          const centerOff = rot(w / 2, h / 2, item.rotation);
          setItemsRaw(
            base.map((it) =>
              it.id === id ? { ...it, w, h, x: fixed.x + centerOff.x, y: fixed.y + centerOff.y } : it
            )
          );
        },
        () => {
          if (moved) commit(itemsRef.current, base);
        }
      );
    },
    [clientToFeet, snapStep, beginDrag, commit]
  );

  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const start = clientToFeet(e.clientX, e.clientY);
      const additive = e.shiftKey;
      let dragged = false;

      beginDrag(
        (ev) => {
          const p = clientToFeet(ev.clientX, ev.clientY);
          if (Math.abs(p.x - start.x) + Math.abs(p.y - start.y) > 0.3) dragged = true;
          if (dragged) setMarquee({ x0: start.x, y0: start.y, x1: p.x, y1: p.y, additive });
        },
        (ev) => {
          setMarquee(null);
          if (!dragged) {
            if (!additive) setSelected([]);
            return;
          }
          const p = clientToFeet(ev.clientX, ev.clientY);
          const minX = Math.min(start.x, p.x);
          const maxX = Math.max(start.x, p.x);
          const minY = Math.min(start.y, p.y);
          const maxY = Math.max(start.y, p.y);
          const hit = itemsRef.current
            .filter((it) => it.x >= minX && it.x <= maxX && it.y >= minY && it.y <= maxY)
            .map((it) => it.id);
          setSelected((prev) => (additive ? [...new Set([...prev, ...hit])] : hit));
        }
      );
    },
    [clientToFeet, beginDrag]
  );

  /* ----- palette: click to add, or drag onto the canvas ----- */

  const addItem = useCallback(
    (type: string, x: number, y: number) => {
      const step = snapStep();
      const rm = roomRef.current;
      const it = makeItem(type, clamp(snapTo(x, step), 0, rm.w), clamp(snapTo(y, step), 0, rm.h));
      commit([...itemsRef.current, it]);
      setSelected([it.id]);
    },
    [snapStep, commit]
  );

  const onPalettePointerDown = useCallback(
    (e: React.PointerEvent, type: string) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      let dragged = false;

      beginDrag(
        (ev) => {
          if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 5) dragged = true;
          if (dragged && overCanvas(ev.clientX, ev.clientY)) {
            const p = clientToFeet(ev.clientX, ev.clientY);
            setGhost({ type, x: snapTo(p.x, snapStep()), y: snapTo(p.y, snapStep()) });
          } else if (dragged) {
            setGhost(null);
          }
        },
        (ev) => {
          setGhost(null);
          if (!dragged) {
            const rm = roomRef.current;
            addItem(type, rm.w / 2, rm.h / 2);
          } else if (overCanvas(ev.clientX, ev.clientY)) {
            const p = clientToFeet(ev.clientX, ev.clientY);
            addItem(type, p.x, p.y);
          }
        }
      );
    },
    [beginDrag, overCanvas, clientToFeet, snapStep, addItem]
  );

  /* ----- selection operations ----- */

  const updateSelected = useCallback(
    (fn: (it: PlacedItem) => PlacedItem) => {
      commit(itemsRef.current.map((it) => (selected.includes(it.id) ? fn(it) : it)));
    },
    [selected, commit]
  );

  const deleteSelected = useCallback(() => {
    if (selected.length === 0) return;
    commit(itemsRef.current.filter((it) => !selected.includes(it.id)));
    setSelected([]);
  }, [selected, commit]);

  const duplicateSelected = useCallback(() => {
    if (selected.length === 0) return;
    const copies = itemsRef.current
      .filter((it) => selected.includes(it.id))
      .map((it) => ({ ...makeItem(it.type, it.x + 2, it.y + 2), w: it.w, h: it.h, rotation: it.rotation, seats: it.seats, label: it.label }));
    commit([...itemsRef.current, ...copies]);
    setSelected(copies.map((c) => c.id));
  }, [selected, commit]);

  const reorderSelected = useCallback(
    (toFront: boolean) => {
      const sel = itemsRef.current.filter((it) => selected.includes(it.id));
      const rest = itemsRef.current.filter((it) => !selected.includes(it.id));
      commit(toFront ? [...rest, ...sel] : [...sel, ...rest]);
    },
    [selected, commit]
  );

  /* ----- keyboard shortcuts ----- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === "Escape") {
        setSelected([]);
      } else if (e.key.toLowerCase() === "r" && selected.length > 0) {
        e.preventDefault();
        updateSelected((it) => ({ ...it, rotation: (it.rotation + 45) % 360 }));
      } else if (e.key.startsWith("Arrow") && selected.length > 0) {
        e.preventDefault();
        const d = e.shiftKey ? 0.1 : 0.5;
        const dx = e.key === "ArrowLeft" ? -d : e.key === "ArrowRight" ? d : 0;
        const dy = e.key === "ArrowUp" ? -d : e.key === "ArrowDown" ? d : 0;
        updateSelected((it) => ({ ...it, x: it.x + dx, y: it.y + dy }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, duplicateSelected, deleteSelected, updateSelected, selected]);

  /* ----- zoom ----- */

  const fitZoom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const z = Math.min(
      (el.clientWidth - 24) / ((roomRef.current.w + 2 * M) * PPF),
      (el.clientHeight - 24) / ((roomRef.current.h + 2 * M) * PPF)
    );
    setZoom(clamp(z, 0.2, 3));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const pt = clientToFeet(e.clientX, e.clientY);
      const elRect = el.getBoundingClientRect();
      setZoom((z) => {
        const nz = clamp(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 0.2, 3);
        requestAnimationFrame(() => {
          el.scrollLeft = (pt.x + M) * PPF * nz - (e.clientX - elRect.left);
          el.scrollTop = (pt.y + M) * PPF * nz - (e.clientY - elRect.top);
        });
        return nz;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clientToFeet]);

  // Fit the room on first load
  useEffect(() => {
    if (loaded) fitZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  /* ----- import / export ----- */

  const exportJSON = useCallback(() => {
    const doc: LayoutDoc = { room: roomRef.current, items: itemsRef.current };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${roomRef.current.name || "layout"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const importJSON = useCallback(
    (file: File) => {
      file.text().then((text) => {
        try {
          const doc = JSON.parse(text) as LayoutDoc;
          if (!doc || !Array.isArray(doc.items) || !doc.room) throw new Error("bad file");
          setRoom({ name: String(doc.room.name ?? ""), w: clamp(Number(doc.room.w) || 60, 10, 300), h: clamp(Number(doc.room.h) || 40, 10, 300) });
          commit(doc.items.filter((it) => CATALOG_BY_TYPE[it.type]));
          setSelected([]);
        } catch {
          alert("Could not read that file — it doesn't look like a saved layout.");
        }
      });
    },
    [commit]
  );

  const exportPNG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll("[data-noexport]").forEach((n) => n.remove());
    const scale = 2;
    const w = (roomRef.current.w + 2 * M) * PPF * scale;
    const h = (roomRef.current.h + 2 * M) * PPF * scale;
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((png) => {
        if (!png) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(png);
        a.download = `${roomRef.current.name || "layout"}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
    };
    img.src = url;
  }, []);

  const clearAll = useCallback(() => {
    if (itemsRef.current.length > 0 && !confirm("Clear the entire layout?")) return;
    commit([]);
    setSelected([]);
  }, [commit]);

  const loadSample = useCallback(() => {
    if (itemsRef.current.length > 0 && !confirm("Replace the current layout with the sample?")) return;
    const s = sampleLayout();
    setRoom(s.room);
    commit(s.items);
    setSelected([]);
  }, [commit]);

  /* ----- derived ----- */

  const selectedItems = items.filter((it) => selected.includes(it.id));
  const single = selectedItems.length === 1 ? selectedItems[0] : null;
  const singleCat = single ? CATALOG_BY_TYPE[single.type] : null;
  const seats = totalSeats(items);
  const sqft = room.w * room.h;

  /* ----- grid lines ----- */

  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    for (let x = 0; x <= room.w; x++) {
      const major = x % 5 === 0;
      gridLines.push(
        <line key={`gx${x}`} x1={x} y1={0} x2={x} y2={room.h} stroke={major ? "#c9c2b4" : "#e3ddd0"} strokeWidth={major ? 0.06 : 0.03} />
      );
    }
    for (let y = 0; y <= room.h; y++) {
      const major = y % 5 === 0;
      gridLines.push(
        <line key={`gy${y}`} x1={0} y1={y} x2={room.w} y2={y} stroke={major ? "#c9c2b4" : "#e3ddd0"} strokeWidth={major ? 0.06 : 0.03} />
      );
    }
  }

  const btn =
    "rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 active:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none";
  const input =
    "rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-800 dark:text-zinc-100";

  return (
    <div className="flex h-dvh flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      {/* ---------- top toolbar ---------- */}
      <header className="flex flex-wrap items-center gap-2 border-b border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mr-2 flex items-center gap-2">
          <span className="text-base font-bold tracking-tight">Salon Planner</span>
          <span className="hidden text-[11px] text-zinc-500 sm:inline dark:text-zinc-400">banquet &amp; event layouts</span>
        </div>

        <input
          className={`${input} w-48`}
          value={room.name}
          onChange={(e) => setRoom((r) => ({ ...r, name: e.target.value }))}
          placeholder="Room / event name"
          aria-label="Room name"
        />
        <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
          W
          <input
            className={`${input} w-16`}
            type="number"
            min={10}
            max={300}
            value={room.w}
            onChange={(e) => setRoom((r) => ({ ...r, w: clamp(Number(e.target.value) || 10, 10, 300) }))}
            aria-label="Room width in feet"
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
          H
          <input
            className={`${input} w-16`}
            type="number"
            min={10}
            max={300}
            value={room.h}
            onChange={(e) => setRoom((r) => ({ ...r, h: clamp(Number(e.target.value) || 10, 10, 300) }))}
            aria-label="Room height in feet"
          />
        </label>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">ft</span>

        <div className="mx-1 h-6 w-px bg-zinc-300 dark:bg-zinc-600" />

        <button className={btn} onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)">
          ↩ Undo
        </button>
        <button className={btn} onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Shift+Z)">
          ↪ Redo
        </button>

        <div className="mx-1 h-6 w-px bg-zinc-300 dark:bg-zinc-600" />

        <button className={btn} onClick={() => setZoom((z) => clamp(z / 1.2, 0.2, 3))} title="Zoom out">
          −
        </button>
        <span className="w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
        <button className={btn} onClick={() => setZoom((z) => clamp(z * 1.2, 0.2, 3))} title="Zoom in">
          +
        </button>
        <button className={btn} onClick={fitZoom} title="Fit room to window">
          Fit
        </button>

        <div className="mx-1 h-6 w-px bg-zinc-300 dark:bg-zinc-600" />

        <button className={`${btn} ${snap ? "!bg-amber-100 dark:!bg-amber-900/50" : ""}`} onClick={() => setSnap((s) => !s)} title="Snap to 6-inch grid">
          Snap {snap ? "on" : "off"}
        </button>
        <button className={`${btn} ${showGrid ? "!bg-amber-100 dark:!bg-amber-900/50" : ""}`} onClick={() => setShowGrid((g) => !g)}>
          Grid {showGrid ? "on" : "off"}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button className={btn} onClick={loadSample}>
            Sample
          </button>
          <button className={btn} onClick={clearAll}>
            Clear
          </button>
          <button className={btn} onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <button className={btn} onClick={exportJSON}>
            Export JSON
          </button>
          <button className={btn} onClick={exportPNG}>
            Export PNG
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJSON(f);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {/* ---------- stats strip ---------- */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
        <span>
          <b className="text-zinc-800 dark:text-zinc-100">{room.w}′ × {room.h}′</b> ({sqft.toLocaleString()} sq ft)
        </span>
        <span>
          <b className="text-zinc-800 dark:text-zinc-100">{items.length}</b> items
        </span>
        <span>
          <b className="text-zinc-800 dark:text-zinc-100">{seats}</b> seats
        </span>
        {seats > 0 && <span>{(sqft / seats).toFixed(1)} sq ft / guest</span>}
        <span className="ml-auto hidden text-[11px] text-zinc-400 md:inline">
          Drag from palette · R rotate · Del delete · Ctrl+D duplicate · Ctrl+scroll zoom · Shift+click multi-select
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ---------- palette ---------- */}
        <aside className="w-44 shrink-0 overflow-y-auto border-r border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800">
          {CATEGORIES.map((catName) => (
            <div key={catName} className="mb-3">
              <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{catName}</div>
              <div className="grid grid-cols-2 gap-1">
                {CATALOG.filter((c) => c.category === catName).map((c) => (
                  <button
                    key={c.type}
                    className="flex cursor-grab flex-col items-center gap-0.5 rounded-md border border-transparent p-1 hover:border-zinc-300 hover:bg-zinc-50 active:cursor-grabbing dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                    onPointerDown={(e) => onPalettePointerDown(e, c.type)}
                    title={`${c.name} — click to add at room center, or drag onto the floor plan`}
                  >
                    <PalettePreview type={c.type} />
                    <span className="text-center text-[10px] leading-tight text-zinc-600 dark:text-zinc-300">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* ---------- canvas ---------- */}
        <div ref={scrollRef} className="relative min-w-0 flex-1 overflow-auto bg-zinc-200 dark:bg-zinc-900">
          <svg
            ref={svgRef}
            width={(room.w + 2 * M) * PPF * zoom}
            height={(room.h + 2 * M) * PPF * zoom}
            viewBox={`${-M} ${-M} ${room.w + 2 * M} ${room.h + 2 * M}`}
            onPointerDown={onCanvasPointerDown}
            className="block touch-none select-none"
            style={{ cursor: "default" }}
          >
            {/* floor */}
            <rect x={-M} y={-M} width={room.w + 2 * M} height={room.h + 2 * M} fill="#efeadf" />
            <rect x={0} y={0} width={room.w} height={room.h} fill="#f7f3e8" stroke="none" />
            {gridLines}
            <rect x={0} y={0} width={room.w} height={room.h} fill="none" stroke="#57534e" strokeWidth={0.25} />

            {/* dimension labels */}
            <text x={room.w / 2} y={-1.2} textAnchor="middle" fontSize={1.4} fill="#78716c" fontFamily="ui-sans-serif, system-ui, sans-serif">
              {room.w}′
            </text>
            <text x={-1.2} y={room.h / 2} textAnchor="middle" fontSize={1.4} fill="#78716c" fontFamily="ui-sans-serif, system-ui, sans-serif" transform={`rotate(-90 ${-1.2} ${room.h / 2})`}>
              {room.h}′
            </text>
            {room.name && (
              <text x={room.w / 2} y={room.h + 2.4} textAnchor="middle" fontSize={1.6} fontWeight={600} fill="#57534e" fontFamily="ui-sans-serif, system-ui, sans-serif">
                {room.name}
              </text>
            )}

            {/* items */}
            {items.map((it) => {
              const isSel = selected.includes(it.id);
              const cat = CATALOG_BY_TYPE[it.type];
              const chairPad = cat && cat.seatArrangement !== "none" && it.seats > 0 ? 1.7 : 0.4;
              return (
                <g
                  key={it.id}
                  transform={`translate(${it.x},${it.y}) rotate(${it.rotation})`}
                  onPointerDown={(e) => onItemPointerDown(e, it.id)}
                  style={{ cursor: "move" }}
                >
                  <ItemGlyph item={it} />
                  {isSel && (
                    <g data-noexport>
                      <rect
                        x={-it.w / 2 - chairPad}
                        y={-it.h / 2 - chairPad}
                        width={it.w + chairPad * 2}
                        height={it.h + chairPad * 2}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth={0.12}
                        strokeDasharray="0.5 0.35"
                      />
                      {single?.id === it.id && singleCat?.resizable && (
                        <rect
                          x={it.w / 2 - 0.5}
                          y={it.h / 2 - 0.5}
                          width={1.4}
                          height={1.4}
                          rx={0.2}
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth={0.15}
                          style={{ cursor: "nwse-resize" }}
                          onPointerDown={(e) => onResizePointerDown(e, it.id)}
                        />
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* ghost while dragging from palette */}
            {ghost && (
              <g data-noexport transform={`translate(${ghost.x},${ghost.y})`} opacity={0.55} pointerEvents="none">
                <ItemGlyph item={{ ...makeItem(ghost.type, 0, 0), id: "ghost" }} />
              </g>
            )}

            {/* marquee */}
            {marquee && (
              <rect
                data-noexport
                x={Math.min(marquee.x0, marquee.x1)}
                y={Math.min(marquee.y0, marquee.y1)}
                width={Math.abs(marquee.x1 - marquee.x0)}
                height={Math.abs(marquee.y1 - marquee.y0)}
                fill="#2563eb"
                fillOpacity={0.08}
                stroke="#2563eb"
                strokeWidth={0.08}
                strokeDasharray="0.4 0.3"
                pointerEvents="none"
              />
            )}
          </svg>
        </div>

        {/* ---------- inspector ---------- */}
        <aside className="w-56 shrink-0 overflow-y-auto border-l border-zinc-300 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
          {selectedItems.length === 0 && (
            <div className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              <p className="mb-2 font-semibold text-zinc-700 dark:text-zinc-200">Nothing selected</p>
              <p className="mb-2">Click an item on the floor plan to edit it, or drag a shape in from the palette.</p>
              <p className="mb-1 font-semibold text-zinc-600 dark:text-zinc-300">Shortcuts</p>
              <ul className="space-y-0.5">
                <li>R — rotate 45°</li>
                <li>Arrows — nudge (Shift = fine)</li>
                <li>Delete — remove</li>
                <li>Ctrl+D — duplicate</li>
                <li>Ctrl+Z / Ctrl+Shift+Z — undo / redo</li>
                <li>Ctrl+scroll — zoom</li>
                <li>Drag on floor — marquee select</li>
              </ul>
            </div>
          )}

          {selectedItems.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">{selectedItems.length} items selected</p>
              <p className="text-xs text-zinc-500">
                {totalSeats(selectedItems)} seats in selection
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button className={btn} onClick={() => updateSelected((it) => ({ ...it, rotation: (it.rotation + 45) % 360 }))}>
                  Rotate 45°
                </button>
                <button className={btn} onClick={duplicateSelected}>
                  Duplicate
                </button>
                <button className={btn} onClick={() => reorderSelected(true)}>
                  To front
                </button>
                <button className={btn} onClick={() => reorderSelected(false)}>
                  To back
                </button>
                <button className={`${btn} !text-red-600 dark:!text-red-400`} onClick={deleteSelected}>
                  Delete
                </button>
              </div>
            </div>
          )}

          {single && singleCat && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">{singleCat.name}</p>

              <label className="block text-xs text-zinc-600 dark:text-zinc-300">
                Label
                <input
                  className={`${input} mt-1 w-full`}
                  value={single.label}
                  placeholder={singleCat.name}
                  onChange={(e) => updateSelected((it) => ({ ...it, label: e.target.value }))}
                />
              </label>

              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                Rotation
                <div className="mt-1 flex items-center gap-1.5">
                  <button className={btn} onClick={() => updateSelected((it) => ({ ...it, rotation: (it.rotation - 45 + 360) % 360 }))}>
                    −45°
                  </button>
                  <input
                    className={`${input} w-16 text-center`}
                    type="number"
                    value={single.rotation}
                    onChange={(e) => updateSelected((it) => ({ ...it, rotation: ((Number(e.target.value) || 0) % 360 + 360) % 360 }))}
                  />
                  <button className={btn} onClick={() => updateSelected((it) => ({ ...it, rotation: (it.rotation + 45) % 360 }))}>
                    +45°
                  </button>
                </div>
              </div>

              {(singleCat.seats > 0 || single.seats > 0) && (
                <label className="block text-xs text-zinc-600 dark:text-zinc-300">
                  Seats
                  <input
                    className={`${input} mt-1 w-20`}
                    type="number"
                    min={0}
                    max={30}
                    value={single.seats}
                    onChange={(e) => updateSelected((it) => ({ ...it, seats: clamp(Math.round(Number(e.target.value) || 0), 0, 30) }))}
                  />
                </label>
              )}

              {singleCat.resizable && (
                <div className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <label>
                    Width (ft)
                    <input
                      className={`${input} mt-1 w-full`}
                      type="number"
                      min={1}
                      max={200}
                      step={0.5}
                      value={single.w}
                      onChange={(e) => updateSelected((it) => ({ ...it, w: clamp(Number(e.target.value) || 1, 1, 200) }))}
                    />
                  </label>
                  <label>
                    Depth (ft)
                    <input
                      className={`${input} mt-1 w-full`}
                      type="number"
                      min={0.5}
                      max={200}
                      step={0.5}
                      value={single.h}
                      onChange={(e) => updateSelected((it) => ({ ...it, h: clamp(Number(e.target.value) || 0.5, 0.5, 200) }))}
                    />
                  </label>
                </div>
              )}

              <div className="text-[11px] text-zinc-400">
                {single.w}′ × {single.h}′ at ({single.x.toFixed(1)}, {single.y.toFixed(1)})
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <button className={btn} onClick={duplicateSelected}>
                  Duplicate
                </button>
                <button className={btn} onClick={() => reorderSelected(true)}>
                  To front
                </button>
                <button className={btn} onClick={() => reorderSelected(false)}>
                  To back
                </button>
                <button className={`${btn} !text-red-600 dark:!text-red-400`} onClick={deleteSelected}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
