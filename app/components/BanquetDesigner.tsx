"use client";

import {
  CANVAS_MARGIN,
  CATALOG,
  CATALOG_BY_TYPE,
  CATEGORIES,
  chairPositions,
  displayName,
  LayoutComment,
  LayoutDoc,
  makeItem,
  nextId,
  PlacedItem,
  PPF,
  Room,
  sampleLayout,
  snapTo,
  totalSeats,
} from "../lib/banquet";
import { addLiveComment, createLive, deleteLiveComment, getLive, liveAvailable, LiveInfo, pushLive } from "../lib/live";
import { decodeShare, encodeShare } from "../lib/share";
import { useCallback, useEffect, useRef, useState } from "react";

const PORTFOLIO_KEY = "banquet-portfolio-v1";
const LEGACY_KEY = "banquet-layout-v1"; // pre-portfolio single-layout storage
const AUTHOR_KEY = "banquet-author-name";
const M = CANVAS_MARGIN;

interface SavedLayout {
  id: string;
  name: string;
  room: Room;
  items: PlacedItem[];
  comments?: LayoutComment[];
  live?: LiveInfo; // set once the event has live share links
  updatedAt: number;
}

interface Portfolio {
  layouts: SavedLayout[];
  activeId: string;
}

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
  if (item.type === "lounge-sofa" || item.type === "patio-sofa") {
    decorations.push(
      <rect key="back" x={-item.w / 2 + 0.15} y={-item.h / 2 + 0.15} width={item.w - 0.3} height={0.7} rx={0.3} fill={cat.stroke} opacity={0.35} />
    );
  }
  if (item.type === "chaise") {
    // backrest slats at the head end
    decorations.push(
      <line key="s1" x1={-item.w / 2 + 0.5} y1={-item.h / 2 + 0.2} x2={-item.w / 2 + 0.5} y2={item.h / 2 - 0.2} stroke={cat.stroke} strokeWidth={0.1} />,
      <line key="s2" x1={-item.w / 2 + 1} y1={-item.h / 2 + 0.2} x2={-item.w / 2 + 1} y2={item.h / 2 - 0.2} stroke={cat.stroke} strokeWidth={0.1} />
    );
  }
  if (item.type === "fire-pit") {
    decorations.push(
      <circle key="ring" r={item.w * 0.3} fill="none" stroke={cat.stroke} strokeWidth={0.1} />,
      <circle key="f1" cx={-item.w * 0.08} cy={0.05} r={item.w * 0.09} fill="#e8853d" />,
      <circle key="f2" cx={item.w * 0.09} cy={-0.06} r={item.w * 0.07} fill="#d4552a" />,
      <circle key="f3" cx={0} cy={item.w * 0.09} r={item.w * 0.06} fill="#f2b04a" />
    );
  }
  if (item.type === "patio-heater") {
    decorations.push(
      <circle key="in" r={item.w * 0.28} fill="none" stroke={cat.stroke} strokeWidth={0.08} />,
      <circle key="dot" r={item.w * 0.08} fill={cat.stroke} />
    );
  }
  if (item.type === "planter") {
    for (let i = 0; i < 3; i++) {
      decorations.push(
        <circle key={`p${i}`} cx={-item.w / 2 + (item.w * (i + 0.5)) / 3} cy={0} r={Math.min(item.h, item.w / 3) * 0.32} fill={cat.stroke} opacity={0.45} />
      );
    }
  }
  if (item.type === "umbrella" || item.type === "patio-table") {
    // umbrella canopy seen from above: translucent circle with spokes
    const r = item.type === "umbrella" ? item.w / 2 : item.w / 2 + 1.7;
    const spokes: React.ReactNode[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      spokes.push(
        <line key={`sp${i}`} x1={0} y1={0} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke="#3f7f6f" strokeWidth={0.07} opacity={0.5} />
      );
    }
    decorations.push(
      <g key="canopy" pointerEvents="none">
        <circle r={r} fill="#8fc1b5" fillOpacity={item.type === "umbrella" ? 0 : 0.25} stroke="#3f7f6f" strokeWidth={0.1} opacity={0.9} />
        {spokes}
        <circle r={0.22} fill="#3f7f6f" />
      </g>
    );
  }
  if (item.type === "steps") {
    const n = Math.max(2, Math.round(item.h / 1));
    for (let i = 1; i < n; i++) {
      decorations.push(
        <line key={`t${i}`} x1={-item.w / 2} y1={-item.h / 2 + (item.h * i) / n} x2={item.w / 2} y2={-item.h / 2 + (item.h * i) / n} stroke={cat.stroke} strokeWidth={0.08} />
      );
    }
  }
  if (item.type === "plant") {
    decorations.push(
      <circle key="inner" r={item.w * 0.28} fill={cat.stroke} opacity={0.4} />
    );
  }
  if (item.type === "pillar") {
    decorations.push(
      <line key="x1" x1={-item.w * 0.25} y1={-item.w * 0.25} x2={item.w * 0.25} y2={item.w * 0.25} stroke={cat.stroke} strokeWidth={0.08} />,
      <line key="x2" x1={-item.w * 0.25} y1={item.w * 0.25} x2={item.w * 0.25} y2={-item.w * 0.25} stroke={cat.stroke} strokeWidth={0.08} />
    );
  }
  if (item.type === "hallway") {
    // Solid walls on the long sides only — the short ends stay open like a real corridor
    decorations.push(
      <line key="w1" x1={-item.w / 2} y1={-item.h / 2} x2={item.w / 2} y2={-item.h / 2} stroke="#57534e" strokeWidth={0.28} />,
      <line key="w2" x1={-item.w / 2} y1={item.h / 2} x2={item.w / 2} y2={item.h / 2} stroke="#57534e" strokeWidth={0.28} />
    );
  }

  // Free text labels rotate with the item (so text can run along a hallway);
  // furniture labels stay upright regardless of the item's rotation.
  const keepTextRotation = item.type === "label" || item.type === "hallway" || item.type === "area";

  return (
    <g>
      {chairs.map((c, i) => (
        <g key={i} transform={`translate(${c.x},${c.y}) rotate(${c.angle})`}>
          <ChairGlyph />
        </g>
      ))}
      {item.type === "chair" ? (
        <ChairGlyph scale={1.15} />
      ) : item.type === "label" ? (
        // invisible hit target so the text can be clicked and dragged
        <rect x={-item.w / 2} y={-item.h / 2} width={item.w} height={item.h} fill="transparent" stroke="none" />
      ) : item.type === "arch" ? (
        // archway: two posts joined by an arc over a dashed opening
        <>
          <rect x={-item.w / 2} y={-item.h / 2} width={item.w} height={item.h} fill="transparent" stroke="none" />
          <line x1={-item.w / 2} y1={item.h / 2 - 0.1} x2={item.w / 2} y2={item.h / 2 - 0.1} stroke={cat.stroke} strokeWidth={0.1} strokeDasharray="0.5 0.4" />
          <path d={`M ${-item.w / 2} ${item.h / 2} A ${item.w / 2} ${item.h} 0 0 1 ${item.w / 2} ${item.h / 2}`} fill="none" stroke={cat.stroke} strokeWidth={0.28} />
          <rect x={-item.w / 2 - 0.45} y={item.h / 2 - 0.9} width={0.9} height={0.9} fill={cat.fill} stroke={cat.stroke} strokeWidth={0.1} />
          <rect x={item.w / 2 - 0.45} y={item.h / 2 - 0.9} width={0.9} height={0.9} fill={cat.fill} stroke={cat.stroke} strokeWidth={0.1} />
        </>
      ) : item.type === "fireplace" ? (
        // fireplace: flat back with a rounded hearth front and a firebox
        <>
          <path
            d={`M ${-item.w / 2} ${-item.h / 2} H ${item.w / 2} V 0 A ${item.w / 2} ${item.h / 2} 0 0 1 ${-item.w / 2} 0 Z`}
            fill={cat.fill}
            stroke={cat.stroke}
            strokeWidth={0.12}
          />
          <path d={`M ${-item.w * 0.28} ${-item.h * 0.15} H ${item.w * 0.28} V 0 A ${item.w * 0.28} ${item.h * 0.3} 0 0 1 ${-item.w * 0.28} 0 Z`} fill="#6b3226" />
          <circle cx={-item.w * 0.07} cy={item.h * 0.02} r={item.w * 0.06} fill="#e8853d" />
          <circle cx={item.w * 0.07} cy={-item.h * 0.02} r={item.w * 0.05} fill="#f2b04a" />
        </>
      ) : isRound ? (
        <circle r={item.w / 2} fill={cat.fill} fillOpacity={item.type === "umbrella" ? 0.35 : undefined} stroke={cat.stroke} strokeWidth={0.12} />
      ) : (
        <rect
          x={-item.w / 2}
          y={-item.h / 2}
          width={item.w}
          height={item.h}
          rx={item.type === "chair-row" ? 0.3 : 0.15}
          fill={item.type === "chair-row" ? "none" : cat.fill}
          fillOpacity={item.type === "area" ? 0.45 : undefined}
          stroke={item.type === "hallway" ? "none" : cat.stroke}
          strokeWidth={0.12}
          strokeDasharray={item.type === "chair-row" || item.type === "entrance" || item.type === "area" ? "0.4 0.3" : undefined}
        />
      )}
      {decorations}
      {item.type === "label" && (
        <text
          textAnchor="middle"
          y={item.h * 0.22}
          fontSize={clamp(item.h * 0.62, 0.8, 12)}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fill="#44403c"
          fontWeight={700}
        >
          {item.label || "Label"}
        </text>
      )}
      {showLabel && item.type !== "label" && (
        <g transform={`rotate(${keepTextRotation ? 0 : -item.rotation})`}>
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
  if (type === "label") {
    return (
      <svg viewBox="-3 -3 6 6" width={44} height={44} aria-hidden>
        <text textAnchor="middle" y={1.1} fontSize={3.4} fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight={700} fill="#78716c">
          Aa
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox={`${-extent / 2} ${-extent / 2} ${extent} ${extent}`} width={44} height={44} aria-hidden>
      <ItemGlyph item={fake} showText={false} />
    </svg>
  );
}

/* ---------- main component ---------- */

type Marquee = { x0: number; y0: number; x1: number; y1: number; additive: boolean };
type Ghost = { type: string; x: number; y: number };
type ViewerMode = { mode: "client" | "team"; liveId?: string };

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
  const [layoutList, setLayoutList] = useState<{ id: string; name: string }[]>([]);
  const [activeId, setActiveId] = useState("");
  const [comments, setComments] = useState<LayoutComment[]>([]);
  const [viewer, setViewer] = useState<ViewerMode | null>(null);
  const [addingComment, setAddingComment] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLinks, setShareLinks] = useState<{ client: string; team: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [liveAvail, setLiveAvail] = useState(false);
  const [activeLive, setActiveLive] = useState<LiveInfo | null>(null);
  const activeLiveRef = useRef(activeLive);
  const liveUpdatedRef = useRef(0);
  useEffect(() => {
    activeLiveRef.current = activeLive;
  }, [activeLive]);
  useEffect(() => {
    liveAvailable().then(setLiveAvail);
  }, []);
  const portfolioRef = useRef<Portfolio | null>(null);
  const viewerRef = useRef<ViewerMode | null>(null);
  const commentsRef = useRef(comments);
  const addingCommentRef = useRef(addingComment);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);
  useEffect(() => {
    addingCommentRef.current = addingComment;
  }, [addingComment]);

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

  /* ----- persistence: a portfolio of saved layouts, one per event ----- */

  const persistPortfolio = useCallback(() => {
    const pf = portfolioRef.current;
    if (!pf) return;
    try {
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(pf));
    } catch {
      // storage full / unavailable — ignore
    }
  }, []);

  // Write the editor's current room + items into the active portfolio entry.
  // No-op while showing a shared link, so a shared snapshot never overwrites
  // the viewer's own saved events.
  const flushSave = useCallback(() => {
    if (viewerRef.current) return;
    const pf = portfolioRef.current;
    const entry = pf?.layouts.find((l) => l.id === activeIdRef.current);
    if (!pf || !entry) return;
    entry.room = roomRef.current;
    entry.items = itemsRef.current;
    entry.comments = commentsRef.current;
    entry.name = roomRef.current.name.trim() || "Untitled event";
    entry.updatedAt = Date.now();
    persistPortfolio();
  }, [persistPortfolio]);

  useEffect(() => {
    let pf: Portfolio | null = null;
    try {
      const raw = localStorage.getItem(PORTFOLIO_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Portfolio;
        if (parsed && Array.isArray(parsed.layouts) && parsed.layouts.length > 0) pf = parsed;
      }
    } catch {
      // corrupted — rebuild below
    }
    if (!pf) {
      // Migrate the pre-portfolio single layout if one exists, else start with the sample.
      let first: SavedLayout | null = null;
      try {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const doc = JSON.parse(legacy) as LayoutDoc;
          if (doc && doc.room && Array.isArray(doc.items)) {
            first = {
              id: nextId(),
              name: doc.room.name?.trim() || "My event",
              room: doc.room,
              items: doc.items,
              updatedAt: Date.now(),
            };
          }
        }
      } catch {
        // ignore broken legacy data
      }
      if (!first) {
        const s = sampleLayout();
        first = { id: nextId(), name: s.room.name, room: s.room, items: s.items, updatedAt: Date.now() };
      }
      pf = { layouts: [first], activeId: first.id };
    }
    const active = pf.layouts.find((l) => l.id === pf.activeId) ?? pf.layouts[0];
    pf.activeId = active.id;
    portfolioRef.current = pf;
    setLayoutList(pf.layouts.map((l) => ({ id: l.id, name: l.name })));
    setActiveId(active.id);

    const openActive = () => {
      setRoom(active.room);
      setItemsRaw(active.items.filter((it) => CATALOG_BY_TYPE[it.type]));
      setComments(active.comments ?? []);
      setActiveLive(active.live ?? null);
      setLoaded(true);
    };

    // Opening a share link while the app is already loaded only changes the
    // hash (no reload), so force one to enter viewer mode.
    const onHash = () => {
      if (window.location.hash.startsWith("#share=") || window.location.hash.startsWith("#live=")) window.location.reload();
    };
    window.addEventListener("hashchange", onHash);

    const hash = window.location.hash;
    // A #live= hash points at a live shared event on the server: fetch the
    // current version and keep polling for updates.
    if (hash.startsWith("#live=")) {
      const [liveId, liveMode] = hash.slice(6).split(".");
      getLive(liveId).then((rec) => {
        if (!rec) {
          alert("This live link isn't available (the event may have expired) — opening your own layouts instead.");
          openActive();
          return;
        }
        const mode: ViewerMode = { mode: liveMode === "client" ? "client" : "team", liveId };
        viewerRef.current = mode;
        setViewer(mode);
        liveUpdatedRef.current = rec.updatedAt;
        setRoom(rec.room);
        setItemsRaw(rec.items.filter((it) => CATALOG_BY_TYPE[it.type]));
        setComments(rec.comments ?? []);
        setLoaded(true);
      });
      return () => window.removeEventListener("hashchange", onHash);
    }
    // A #share= hash means this page was opened from a snapshot share link:
    // show the shared snapshot in viewer mode instead of the user's own portfolio.
    if (hash.startsWith("#share=")) {
      decodeShare(hash.slice(7)).then((payload) => {
        if (!payload) {
          alert("This share link is invalid or incomplete — opening your own layouts instead.");
          openActive();
          return;
        }
        const mode: ViewerMode = { mode: payload.mode };
        viewerRef.current = mode;
        setViewer(mode);
        const doc = payload.doc;
        setRoom({
          name: String(doc.room.name ?? ""),
          w: clamp(Number(doc.room.w) || 60, 10, 300),
          h: clamp(Number(doc.room.h) || 40, 10, 300),
        });
        setItemsRaw(doc.items.filter((it) => CATALOG_BY_TYPE[it.type]));
        setComments(Array.isArray(doc.comments) ? doc.comments : []);
        setLoaded(true);
      });
    } else {
      openActive();
    }
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!loaded || viewer) return;
    const t = setTimeout(() => {
      const pf = portfolioRef.current;
      const entry = pf?.layouts.find((l) => l.id === activeIdRef.current);
      if (!pf || !entry) return;
      entry.room = room;
      entry.items = items;
      entry.comments = comments;
      entry.name = room.name.trim() || "Untitled event";
      entry.updatedAt = Date.now();
      setLayoutList(pf.layouts.map((l) => ({ id: l.id, name: l.name })));
      persistPortfolio();
    }, 300);
    return () => clearTimeout(t);
  }, [room, items, comments, loaded, viewer, persistPortfolio]);

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
      if (viewerRef.current) return; // read-only; let the event reach the canvas for comment pins
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
      if (viewerRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      const base = itemsRef.current;
      const item = base.find((it) => it.id === id);
      if (!item) return;
      const isRound = CATALOG_BY_TYPE[item.type]?.shape === "round";
      // The corner opposite the drag handle stays fixed.
      const fixedLocal = rot(-item.w / 2, -item.h / 2, item.rotation);
      const fixed = { x: item.x + fixedLocal.x, y: item.y + fixedLocal.y };
      const step = snapStep();
      let moved = false;

      beginDrag(
        (ev) => {
          const p = clientToFeet(ev.clientX, ev.clientY);
          const local = rot(p.x - fixed.x, p.y - fixed.y, -item.rotation);
          let w = clamp(snapTo(local.x, step), 1, 200);
          let h = clamp(snapTo(local.y, step), 0.5, 200);
          if (isRound) {
            // round pieces scale their diameter uniformly
            w = h = clamp(snapTo(Math.max(local.x, local.y), step), 1, 200);
          }
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

  // In team-review mode a click on the plan drops a numbered comment pin.
  const addPin = useCallback((x: number, y: number) => {
    let author = "";
    try {
      author = localStorage.getItem(AUTHOR_KEY) || "";
    } catch {
      // ignore
    }
    if (!author) {
      author = (window.prompt("Your name (shown next to your comments):") || "").trim();
      if (!author) return;
      try {
        localStorage.setItem(AUTHOR_KEY, author);
      } catch {
        // ignore
      }
    }
    const text = (window.prompt("Your comment for this spot:") || "").trim();
    if (!text) return;
    const liveId = viewerRef.current?.liveId;
    if (liveId) {
      addLiveComment(liveId, { author, text, x, y }).then((c) => {
        if (c) {
          setComments((cs) => [...cs, c]);
          setNotice("Comment sent to the planner");
          if (noticeTimer.current) clearTimeout(noticeTimer.current);
          noticeTimer.current = setTimeout(() => setNotice(null), 2500);
        } else {
          alert("Could not send the comment — please try again.");
        }
      });
      return;
    }
    setComments((c) => [...c, { id: nextId(), x, y, author, text, createdAt: Date.now() }]);
  }, []);

  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (viewerRef.current) {
        if (viewerRef.current.mode === "team" && addingCommentRef.current) {
          const p = clientToFeet(e.clientX, e.clientY);
          addPin(p.x, p.y);
        }
        return;
      }
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
      const it = makeItem(
        type,
        clamp(snapTo(x, step), -M + 1, rm.w + M - 1),
        clamp(snapTo(y, step), -M + 1, rm.h + M - 1)
      );
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
      if (viewerRef.current) return; // shared links are read-only
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

  // Bounding box (in feet) around the room plus everything placed, including
  // items sitting outside the room — used by Fit and PNG export.
  const contentBBox = useCallback(() => {
    const rm = roomRef.current;
    let minX = 0;
    let minY = 0;
    let maxX = rm.w;
    let maxY = rm.h + (rm.name ? 3.2 : 0); // leave space for the room name caption
    for (const it of itemsRef.current) {
      const r = Math.max(it.w, it.h) / 2 + 2.2;
      minX = Math.min(minX, it.x - r);
      minY = Math.min(minY, it.y - r);
      maxX = Math.max(maxX, it.x + r);
      maxY = Math.max(maxY, it.y + r);
    }
    minX = Math.max(minX - 1.5, -M);
    minY = Math.max(minY - 1.5, -M);
    maxX = Math.min(maxX + 1.5, rm.w + M);
    maxY = Math.min(maxY + 1.5, rm.h + M);
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }, []);

  const fitZoom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const bb = contentBBox();
    const z = clamp(
      Math.min((el.clientWidth - 24) / (bb.w * PPF), (el.clientHeight - 24) / (bb.h * PPF)),
      0.2,
      3
    );
    setZoom(z);
    requestAnimationFrame(() => {
      el.scrollLeft = (bb.x + M) * PPF * z - (el.clientWidth - bb.w * PPF * z) / 2;
      el.scrollTop = (bb.y + M) * PPF * z - (el.clientHeight - bb.h * PPF * z) / 2;
    });
  }, [contentBBox]);

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

  /* ----- portfolio operations ----- */

  const switchLayout = useCallback(
    (id: string) => {
      const pf = portfolioRef.current;
      if (!pf || id === activeIdRef.current) return;
      flushSave();
      const entry = pf.layouts.find((l) => l.id === id);
      if (!entry) return;
      pf.activeId = id;
      setActiveId(id);
      setRoom(entry.room);
      setItemsRaw(entry.items.filter((it) => CATALOG_BY_TYPE[it.type]));
      setComments(entry.comments ?? []);
      setActiveLive(entry.live ?? null);
      setSelected([]);
      setPast([]);
      setFuture([]);
      setLayoutList(pf.layouts.map((l) => ({ id: l.id, name: l.name })));
      persistPortfolio();
      setTimeout(fitZoom, 30);
    },
    [flushSave, persistPortfolio, fitZoom]
  );

  const addLayoutEntry = useCallback(
    (entry: SavedLayout) => {
      const pf = portfolioRef.current;
      if (!pf) return;
      flushSave();
      pf.layouts.push(entry);
      setLayoutList(pf.layouts.map((l) => ({ id: l.id, name: l.name })));
      switchLayout(entry.id);
    },
    [flushSave, switchLayout]
  );

  const newLayout = useCallback(() => {
    addLayoutEntry({
      id: nextId(),
      name: "New Event",
      room: { name: "New Event", w: 60, h: 40 },
      items: [],
      updatedAt: Date.now(),
    });
  }, [addLayoutEntry]);

  const duplicateLayout = useCallback(() => {
    flushSave();
    const pf = portfolioRef.current;
    const entry = pf?.layouts.find((l) => l.id === activeIdRef.current);
    if (!entry) return;
    const name = `${entry.name} (copy)`;
    addLayoutEntry({
      id: nextId(),
      name,
      room: { ...entry.room, name },
      items: entry.items.map((it) => ({ ...it })),
      comments: (entry.comments ?? []).map((c) => ({ ...c })),
      updatedAt: Date.now(),
    });
  }, [flushSave, addLayoutEntry]);

  const deleteLayout = useCallback(() => {
    const pf = portfolioRef.current;
    const entry = pf?.layouts.find((l) => l.id === activeIdRef.current);
    if (!pf || !entry) return;
    if (!confirm(`Delete the event "${entry.name}" and its layout? This cannot be undone.`)) return;
    pf.layouts = pf.layouts.filter((l) => l.id !== entry.id);
    if (pf.layouts.length === 0) {
      pf.layouts.push({
        id: nextId(),
        name: "New Event",
        room: { name: "New Event", w: 60, h: 40 },
        items: [],
        updatedAt: Date.now(),
      });
    }
    const next = pf.layouts[0];
    pf.activeId = next.id;
    setActiveId(next.id);
    setRoom(next.room);
    setItemsRaw(next.items.filter((it) => CATALOG_BY_TYPE[it.type]));
    setComments(next.comments ?? []);
    setActiveLive(next.live ?? null);
    setSelected([]);
    setPast([]);
    setFuture([]);
    setLayoutList(pf.layouts.map((l) => ({ id: l.id, name: l.name })));
    persistPortfolio();
    setTimeout(fitZoom, 30);
  }, [persistPortfolio, fitZoom]);

  /* ----- import / export ----- */

  // Save the active event as a portable .evlay file (JSON inside, so the
  // format stays open and future-proof). Colleagues load it via Open.
  const saveFile = useCallback(() => {
    const doc: LayoutDoc = { room: roomRef.current, items: itemsRef.current, comments: commentsRef.current };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${roomRef.current.name.trim() || "event-layout"}.evlay`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }, []);

  // Importing a file adds it to the portfolio as a new event instead of
  // overwriting whatever is open.
  const importJSON = useCallback(
    (file: File) => {
      file.text().then((text) => {
        try {
          const doc = JSON.parse(text) as LayoutDoc;
          if (!doc || !Array.isArray(doc.items) || !doc.room) throw new Error("bad file");
          const name = String(doc.room.name ?? "").trim() || file.name.replace(/\.(json|evlay)$/i, "") || "Imported event";
          addLayoutEntry({
            id: nextId(),
            name,
            room: { name, w: clamp(Number(doc.room.w) || 60, 10, 300), h: clamp(Number(doc.room.h) || 40, 10, 300) },
            items: doc.items.filter((it) => CATALOG_BY_TYPE[it.type]),
            comments: Array.isArray(doc.comments) ? doc.comments : [],
            updatedAt: Date.now(),
          });
        } catch {
          alert("Could not read that file — it doesn't look like a saved layout.");
        }
      });
    },
    [addLayoutEntry]
  );

  // Render the floor plan (cropped to content) onto an offscreen canvas.
  const renderToCanvas = useCallback(
    (scale = 2) =>
      new Promise<HTMLCanvasElement>((resolve, reject) => {
        const svg = svgRef.current;
        if (!svg) return reject(new Error("canvas not ready"));
        const clone = svg.cloneNode(true) as SVGSVGElement;
        clone.querySelectorAll("[data-noexport]").forEach((n) => n.remove());
        const bb = contentBBox();
        const w = Math.round(bb.w * PPF * scale);
        const h = Math.round(bb.h * PPF * scale);
        clone.setAttribute("viewBox", `${bb.x} ${bb.y} ${bb.w} ${bb.h}`);
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
          resolve(canvas);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("could not render floor plan"));
        };
        img.src = url;
      }),
    [contentBBox]
  );

  const exportPNG = useCallback(async () => {
    const canvas = await renderToCanvas(2);
    canvas.toBlob((png) => {
      if (!png) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(png);
      a.download = `${roomRef.current.name.trim() || "layout"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    });
  }, [renderToCanvas]);

  // A printable setup sheet: title, stats line, and the floor plan fitted to
  // a US Letter page (landscape or portrait, whichever suits the plan).
  const exportPDF = useCallback(async () => {
    const canvas = await renderToCanvas(2);
    const { jsPDF } = await import("jspdf");
    const rm = roomRef.current;
    const name = rm.name.trim() || "Event layout";
    const seatCount = totalSeats(itemsRef.current);
    const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
    const pdf = new jsPDF({ orientation, unit: "pt", format: "letter" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const headerH = 46;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(40);
    pdf.text(name, margin, margin + 4);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(120);
    // Standard PDF fonts use WinAnsi encoding, so keep this line ASCII-only.
    pdf.text(
      `${rm.w} ft x ${rm.h} ft  |  ${(rm.w * rm.h).toLocaleString("en-US")} sq ft  |  ${seatCount} seats  |  ${new Date().toLocaleDateString("en-US")}`,
      margin,
      margin + 22
    );

    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2 - headerH;
    const s = Math.min(availW / canvas.width, availH / canvas.height);
    const iw = canvas.width * s;
    const ih = canvas.height * s;
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      margin + (availW - iw) / 2,
      margin + headerH + (availH - ih) / 2,
      iw,
      ih
    );
    pdf.save(`${name}.pdf`);
  }, [renderToCanvas]);

  /* ----- sharing ----- */

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3000);
  }, []);

  const copyText = useCallback(
    async (text: string, msg: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showNotice(msg);
      } catch {
        window.prompt("Copy this link:", text);
      }
    },
    [showNotice]
  );

  // Generate both share links whenever the dialog opens. The client link is a
  // clean snapshot without comments; the team link carries comments too.
  useEffect(() => {
    if (!shareOpen) return;
    let cancelled = false;
    (async () => {
      const base = `${window.location.origin}${window.location.pathname}#share=`;
      const clientDoc: LayoutDoc = { room: roomRef.current, items: itemsRef.current };
      const teamDoc: LayoutDoc = { room: roomRef.current, items: itemsRef.current, comments: commentsRef.current };
      const [client, team] = await Promise.all([
        encodeShare({ v: 1, mode: "client", doc: clientDoc }),
        encodeShare({ v: 1, mode: "team", doc: teamDoc }),
      ]);
      if (!cancelled) setShareLinks({ client: base + client, team: base + team });
    })();
    return () => {
      cancelled = true;
    };
  }, [shareOpen]);

  const emailLink = useCallback((mode: "client" | "team", link: string, live: boolean) => {
    const name = roomRef.current.name.trim() || "Event layout";
    const subject = mode === "client" ? `Floor plan: ${name}` : `Please review: ${name}`;
    const body =
      mode === "client"
        ? `Hi,\n\nHere is the floor plan for ${name}:\n\n${link}\n`
        : live
          ? `Hi team,\n\nPlease review the layout for ${name}:\n\n${link}\n\nUse "Add comment" to drop pins on the plan — your comments reach me automatically.\n`
          : `Hi team,\n\nPlease review the layout for ${name}:\n\n${link}\n\nUse "Add comment" to drop pins on the plan, then "Email feedback" or "Copy feedback link" to send your notes back to me.\n`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, []);

  // Feedback link = the same team link, but regenerated so it includes the
  // reviewer's freshly added comment pins.
  const makeFeedbackLink = useCallback(async () => {
    const doc: LayoutDoc = { room: roomRef.current, items: itemsRef.current, comments: commentsRef.current };
    return `${window.location.origin}${window.location.pathname}#share=` + (await encodeShare({ v: 1, mode: "team", doc }));
  }, []);

  const copyFeedbackLink = useCallback(async () => {
    copyText(await makeFeedbackLink(), "Feedback link copied — send it back to the planner");
  }, [makeFeedbackLink, copyText]);

  const emailFeedback = useCallback(async () => {
    const link = await makeFeedbackLink();
    const name = roomRef.current.name.trim() || "the event layout";
    window.location.href = `mailto:?subject=${encodeURIComponent(`Feedback on ${name}`)}&body=${encodeURIComponent(
      `Hi,\n\nMy comments on ${name} are pinned in this link:\n\n${link}\n`
    )}`;
  }, [makeFeedbackLink]);

  /* ----- live sharing ----- */

  const createLiveLink = useCallback(async () => {
    const pf = portfolioRef.current;
    const entry = pf?.layouts.find((l) => l.id === activeIdRef.current);
    if (!pf || !entry) return;
    try {
      const info = await createLive({ room: roomRef.current, items: itemsRef.current, comments: commentsRef.current });
      entry.live = info;
      persistPortfolio();
      setActiveLive(info);
      showNotice("Live links created — your edits now sync automatically");
    } catch {
      showNotice("Could not create live links — the server may not be set up yet");
    }
  }, [persistPortfolio, showNotice]);

  // Planner side: push layout edits to the live event, debounced.
  useEffect(() => {
    if (!loaded || viewer || !activeLive) return;
    const t = setTimeout(() => {
      pushLive(activeLive.id, activeLive.key, { room: roomRef.current, items: itemsRef.current }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [room, items, loaded, viewer, activeLive]);

  // Planner side: pull the team's comments into the editor sidebar.
  useEffect(() => {
    if (!loaded || viewer || !activeLive) return;
    const iv = setInterval(async () => {
      try {
        const rec = await getLive(activeLive.id);
        if (rec) setComments(rec.comments ?? []);
      } catch {
        // transient network problem — next tick retries
      }
    }, 12000);
    return () => clearInterval(iv);
  }, [loaded, viewer, activeLive]);

  // Viewer side: poll the live event so the plan and comments stay current.
  useEffect(() => {
    if (!viewer?.liveId) return;
    const id = viewer.liveId;
    const iv = setInterval(async () => {
      try {
        const rec = await getLive(id);
        if (!rec) return;
        setComments(rec.comments ?? []);
        if (rec.updatedAt !== liveUpdatedRef.current) {
          liveUpdatedRef.current = rec.updatedAt;
          setRoom(rec.room);
          setItemsRaw(rec.items.filter((it) => CATALOG_BY_TYPE[it.type]));
        }
      } catch {
        // transient network problem — next tick retries
      }
    }, 8000);
    return () => clearInterval(iv);
  }, [viewer]);

  // Comment removal works on local state and, for live events, on the server.
  const removeComment = useCallback((cid: string) => {
    setComments((cs) => cs.filter((x) => x.id !== cid));
    const liveId = viewerRef.current?.liveId ?? activeLiveRef.current?.id;
    if (liveId) deleteLiveComment(liveId, cid).catch(() => {});
  }, []);

  const clearComments = useCallback(() => {
    setComments([]);
    const lv = activeLiveRef.current;
    if (lv) pushLive(lv.id, lv.key, { room: roomRef.current, items: itemsRef.current }, []).catch(() => {});
  }, []);

  // From a shared link: keep a copy (including comment pins) in your own
  // portfolio and switch back to the normal editor.
  const saveSharedCopy = useCallback(() => {
    const pf = portfolioRef.current;
    if (!pf || !viewerRef.current) return;
    const entry: SavedLayout = {
      id: nextId(),
      name: roomRef.current.name.trim() || "Shared event",
      room: { ...roomRef.current },
      items: itemsRef.current.map((it) => ({ ...it })),
      comments: commentsRef.current.map((c) => ({ ...c })),
      updatedAt: Date.now(),
    };
    pf.layouts.push(entry);
    pf.activeId = entry.id;
    viewerRef.current = null;
    setViewer(null);
    setAddingComment(false);
    setActiveLive(null);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setActiveId(entry.id);
    setLayoutList(pf.layouts.map((l) => ({ id: l.id, name: l.name })));
    persistPortfolio();
    showNotice(`Saved “${entry.name}” to your events`);
    setTimeout(fitZoom, 30);
  }, [persistPortfolio, fitZoom, showNotice]);

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

  const liveLinks =
    activeLive && typeof window !== "undefined"
      ? {
          client: `${window.location.origin}${window.location.pathname}#live=${activeLive.id}.client`,
          team: `${window.location.origin}${window.location.pathname}#live=${activeLive.id}.team`,
        }
      : null;

  const selectedItems = items.filter((it) => selected.includes(it.id));
  const single = selectedItems.length === 1 ? selectedItems[0] : null;
  const singleCat = single ? CATALOG_BY_TYPE[single.type] : null;
  const seats = totalSeats(items);
  const sqft = room.w * room.h;

  /* ----- grid lines ----- */

  const gridLines: React.ReactNode[] = [];
  const outsideGrid: React.ReactNode[] = [];
  if (showGrid) {
    // faint 5 ft grid across the workspace outside the room
    for (let x = Math.ceil(-M / 5) * 5; x <= room.w + M; x += 5) {
      outsideGrid.push(
        <line key={`ox${x}`} x1={x} y1={-M} x2={x} y2={room.h + M} stroke="#e2dccd" strokeWidth={0.05} />
      );
    }
    for (let y = Math.ceil(-M / 5) * 5; y <= room.h + M; y += 5) {
      outsideGrid.push(
        <line key={`oy${y}`} x1={-M} y1={y} x2={room.w + M} y2={y} stroke="#e2dccd" strokeWidth={0.05} />
      );
    }
  }
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
        {viewer ? (
          <>
            <span className="text-base font-bold tracking-tight">Salon Planner</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {viewer.liveId
                ? viewer.mode === "team"
                  ? "live team review — comments reach the planner automatically"
                  : "live floor plan — always the latest version"
                : viewer.mode === "team"
                  ? "shared for team review"
                  : "shared floor plan"}
            </span>
            <span className="mx-1 truncate text-sm font-semibold">{room.name}</span>
            <div className="mx-1 h-6 w-px bg-zinc-300 dark:bg-zinc-600" />
            <button className={btn} onClick={() => setZoom((z) => clamp(z / 1.2, 0.2, 3))} title="Zoom out">
              −
            </button>
            <span className="w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
            <button className={btn} onClick={() => setZoom((z) => clamp(z * 1.2, 0.2, 3))} title="Zoom in">
              +
            </button>
            <button className={btn} onClick={fitZoom}>
              Fit
            </button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {viewer.mode === "team" && (
                <>
                  <button
                    className={`${btn} ${addingComment ? "!bg-amber-100 dark:!bg-amber-900/50" : ""}`}
                    onClick={() => setAddingComment((a) => !a)}
                    title="Toggle comment mode, then click a spot on the plan"
                  >
                    {addingComment ? "Click the plan to comment…" : "💬 Add comment"}
                  </button>
                  {!viewer.liveId && (
                    <>
                      <button className={btn} onClick={copyFeedbackLink} title="Copy a link containing your comment pins">
                        Copy feedback link
                      </button>
                      <button className={btn} onClick={emailFeedback} title="Email your comment pins back to the planner">
                        Email feedback
                      </button>
                    </>
                  )}
                </>
              )}
              <button className={btn} onClick={exportPDF}>
                PDF
              </button>
              <button className={btn} onClick={saveSharedCopy} title="Keep this layout in your own Salon Planner">
                Save a copy
              </button>
            </div>
          </>
        ) : (
          <>
        <div className="mr-2 flex items-center gap-2">
          <span className="text-base font-bold tracking-tight">Salon Planner</span>
          <span className="hidden text-[11px] text-zinc-500 sm:inline dark:text-zinc-400">banquet &amp; event layouts</span>
        </div>

        <select
          className={`${input} max-w-44`}
          value={activeId}
          onChange={(e) => switchLayout(e.target.value)}
          aria-label="Switch event layout"
          title="Your saved event layouts"
        >
          {layoutList.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button className={btn} onClick={newLayout} title="Start a new empty event layout">
          + New
        </button>
        <button className={btn} onClick={duplicateLayout} title="Duplicate this event layout">
          Copy
        </button>
        <button className={`${btn} !text-red-600 dark:!text-red-400`} onClick={deleteLayout} title="Delete this event layout">
          Delete
        </button>

        <div className="mx-1 h-6 w-px bg-zinc-300 dark:bg-zinc-600" />

        <input
          className={`${input} w-44`}
          value={room.name}
          onChange={(e) => setRoom((r) => ({ ...r, name: e.target.value }))}
          placeholder="Event / room name"
          aria-label="Event name"
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
          <button
            className={`${btn} !border-blue-700 !bg-blue-600 !text-white hover:!bg-blue-500`}
            onClick={() => {
              setShareLinks(null);
              setShareOpen(true);
            }}
            title="Share this event with a client or the banquets team"
          >
            Share
          </button>
          <button className={btn} onClick={loadSample}>
            Sample
          </button>
          <button className={btn} onClick={clearAll}>
            Clear
          </button>
          <button className={btn} onClick={() => fileRef.current?.click()} title="Open an .evlay file as a new event">
            Open
          </button>
          <button className={btn} onClick={saveFile} title="Save this event as an .evlay file on your computer">
            Save
          </button>
          <button className={btn} onClick={exportPNG} title="Export the floor plan as a PNG image">
            PNG
          </button>
          <button className={btn} onClick={exportPDF} title="Export a printable PDF setup sheet">
            PDF
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".evlay,.json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJSON(f);
              e.target.value = "";
            }}
          />
        </div>
          </>
        )}
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
        {comments.length > 0 && (
          <span>
            <b className="text-zinc-800 dark:text-zinc-100">{comments.length}</b> comments
          </span>
        )}
        <span className="ml-auto hidden text-[11px] text-zinc-400 md:inline">
          {viewer
            ? viewer.mode === "team"
              ? "Click “Add comment”, then click a spot on the plan — send pins back with “Copy feedback link”"
              : "View-only floor plan — zoom with Ctrl+scroll, download with PDF"
            : "Drag from palette · R rotate · Del delete · Ctrl+D duplicate · Ctrl+scroll zoom · Shift+click multi-select"}
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ---------- palette (hidden when viewing a shared link) ---------- */}
        {!viewer && (
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
        )}

        {/* ---------- canvas ---------- */}
        <div ref={scrollRef} className="relative min-w-0 flex-1 overflow-auto bg-zinc-200 dark:bg-zinc-900">
          <svg
            ref={svgRef}
            width={(room.w + 2 * M) * PPF * zoom}
            height={(room.h + 2 * M) * PPF * zoom}
            viewBox={`${-M} ${-M} ${room.w + 2 * M} ${room.h + 2 * M}`}
            onPointerDown={onCanvasPointerDown}
            className="block touch-none select-none"
            style={{ cursor: viewer?.mode === "team" && addingComment ? "crosshair" : "default" }}
          >
            {/* floor */}
            <rect x={-M} y={-M} width={room.w + 2 * M} height={room.h + 2 * M} fill="#efeadf" />
            {outsideGrid}
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
                  {it.type === "label" && !isSel && (
                    <rect
                      data-noexport
                      x={-it.w / 2}
                      y={-it.h / 2}
                      width={it.w}
                      height={it.h}
                      fill="none"
                      stroke="#c4bdad"
                      strokeWidth={0.05}
                      strokeDasharray="0.3 0.3"
                    />
                  )}
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
                      {single?.id === it.id && (
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

            {/* feedback comment pins (kept out of PNG/PDF exports) */}
            {comments.map((c, i) => (
              <g key={c.id} data-noexport transform={`translate(${c.x},${c.y})`}>
                <circle r={1.3} fill="#dc2626" stroke="#ffffff" strokeWidth={0.18} />
                <text
                  y={0.45}
                  textAnchor="middle"
                  fontSize={1.4}
                  fontWeight={700}
                  fill="#ffffff"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {i + 1}
                </text>
                <title>{`${c.author}: ${c.text}`}</title>
              </g>
            ))}

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

        {/* ---------- inspector / comments panel ---------- */}
        {viewer ? (
          viewer.mode === "team" ? (
            <aside className="w-56 shrink-0 overflow-y-auto border-l border-zinc-300 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-1 text-sm font-semibold">Comments ({comments.length})</p>
              <p className="mb-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {viewer.liveId
                  ? "Click “Add comment”, then click a spot on the plan. Your pins reach the planner automatically."
                  : "Click “Add comment”, then click a spot on the plan. When you're done, use “Copy feedback link” or “Email feedback” to send your pins back to the planner."}
              </p>
              <ol className="space-y-2">
                {comments.map((c, i) => (
                  <li key={c.id} className="rounded-md border border-zinc-200 p-2 text-xs dark:border-zinc-600">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        #{i + 1} · {c.author}
                      </span>
                      <button
                        className="text-red-600 hover:underline dark:text-red-400"
                        onClick={() => removeComment(c.id)}
                        title="Remove this comment"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-300">{c.text}</p>
                  </li>
                ))}
              </ol>
            </aside>
          ) : null
        ) : (
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
              {comments.length > 0 && (
                <div className="mt-3 border-t border-zinc-200 pt-2 dark:border-zinc-600">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-semibold text-zinc-700 dark:text-zinc-200">Team feedback ({comments.length})</p>
                    <button className="text-red-600 hover:underline dark:text-red-400" onClick={clearComments}>
                      Clear all
                    </button>
                  </div>
                  <ol className="space-y-2">
                    {comments.map((c, i) => (
                      <li key={c.id} className="rounded-md border border-zinc-200 p-2 dark:border-zinc-600">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">
                            #{i + 1} · {c.author}
                          </span>
                          <button
                            className="text-red-600 hover:underline dark:text-red-400"
                            onClick={() => removeComment(c.id)}
                            title="Resolve / remove"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-300">{c.text}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
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

              {singleCat.shape === "round" ? (
                <label className="block text-xs text-zinc-600 dark:text-zinc-300">
                  Diameter (ft)
                  <input
                    className={`${input} mt-1 w-24`}
                    type="number"
                    min={1}
                    max={200}
                    step={0.5}
                    value={single.w}
                    onChange={(e) => {
                      const d = clamp(Number(e.target.value) || 1, 1, 200);
                      updateSelected((it) => ({ ...it, w: d, h: d }));
                    }}
                  />
                </label>
              ) : (
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
        )}
      </div>

      {/* ---------- share dialog ---------- */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShareOpen(false)}>
          <div
            className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-zinc-800"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Share this event"
          >
            <h2 className="mb-1 text-base font-bold">Share “{room.name.trim() || "Untitled event"}”</h2>

            {liveAvail && (
              <div className="mb-4 rounded-md border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="mb-1 text-sm font-semibold">Live links — always show the latest version</p>
                {activeLive && liveLinks ? (
                  <>
                    <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Your edits sync automatically, and team comments appear in your sidebar within seconds — no links
                      to send back. Live links stay active for 90 days after the last change.
                    </p>
                    <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">Client (view only)</p>
                    <div className="mb-2 flex gap-2">
                      <input readOnly className={`${input} min-w-0 flex-1`} value={liveLinks.client} onFocus={(e) => e.target.select()} aria-label="Live client link" />
                      <button className={btn} onClick={() => copyText(liveLinks.client, "Live client link copied")}>
                        Copy
                      </button>
                      <button className={btn} onClick={() => emailLink("client", liveLinks.client, true)}>
                        Email…
                      </button>
                    </div>
                    <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">Team (view &amp; comment)</p>
                    <div className="flex gap-2">
                      <input readOnly className={`${input} min-w-0 flex-1`} value={liveLinks.team} onFocus={(e) => e.target.select()} aria-label="Live team link" />
                      <button className={btn} onClick={() => copyText(liveLinks.team, "Live team link copied")}>
                        Copy
                      </button>
                      <button className={btn} onClick={() => emailLink("team", liveLinks.team, true)}>
                        Email…
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                      One link per audience that always shows the current layout. Your edits sync automatically, and the
                      team&apos;s comment pins come straight back to your sidebar.
                    </p>
                    <button className={btn} onClick={createLiveLink}>
                      Create live links
                    </button>
                  </>
                )}
              </div>
            )}

            <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
              {liveAvail ? "Snapshot links below work everywhere, but freeze the layout as it is right now:" : "Links carry a snapshot of this layout — changes you make later aren't reflected in links you already sent."}{" "}
              Nothing is uploaded for snapshot links: the whole floor plan travels inside the link itself.
            </p>

            <div className="mb-4">
              <p className="mb-1 text-sm font-semibold">Share with client — view only</p>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                A clean, read-only floor plan. Your client can zoom around and download the PDF — no editing tools, no
                comments.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  className={`${input} min-w-0 flex-1`}
                  value={shareLinks?.client ?? "Generating link…"}
                  onFocus={(e) => e.target.select()}
                  aria-label="Client share link"
                />
                <button className={btn} disabled={!shareLinks} onClick={() => copyText(shareLinks!.client, "Client link copied")}>
                  Copy
                </button>
                <button className={btn} disabled={!shareLinks} onClick={() => emailLink("client", shareLinks!.client, false)}>
                  Email…
                </button>
              </div>
            </div>

            <div className="mb-2">
              <p className="mb-1 text-sm font-semibold">Share with team — review &amp; comment</p>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                The banquets team can drop numbered comment pins right on the plan, then send everything back to you with
                “Copy feedback link” or “Email feedback”. Open their link and the pins appear on your screen.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  className={`${input} min-w-0 flex-1`}
                  value={shareLinks?.team ?? "Generating link…"}
                  onFocus={(e) => e.target.select()}
                  aria-label="Team share link"
                />
                <button className={btn} disabled={!shareLinks} onClick={() => copyText(shareLinks!.team, "Team link copied")}>
                  Copy
                </button>
                <button className={btn} disabled={!shareLinks} onClick={() => emailLink("team", shareLinks!.team, false)}>
                  Email…
                </button>
              </div>
            </div>

            <div className="mt-4 text-right">
              <button className={btn} onClick={() => setShareOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* transient notice toast */}
      {notice && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-zinc-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          {notice}
        </div>
      )}
    </div>
  );
}
