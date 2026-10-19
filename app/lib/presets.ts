// Ready-made starting points for the "Set layout" menu: the venue's own floor
// plans plus the sample wedding. Each preset builds a fresh LayoutDoc so the
// planner can edit it freely without touching the template.

import { LayoutDoc, PlacedItem, Room, makeItem, sampleLayout } from "./banquet";

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  build: () => LayoutDoc;
}

/* ------------------------------------------------------------------------ */
/* Courtyard by Marriott — Liberty Hall (Salons A, B and C)                   */
/*                                                                           */
/* Traced from the venue's setup sheet. The hall is modelled as a 90 × 40 ft  */
/* room split into three 30 ft salons by airwalls. The event space ends at    */
/* the restroom block on the left: a pre-function foyer runs along the top,   */
/* two restrooms with a shared vestibule sit against the hall's left wall,    */
/* guests arrive from the hotel at the foyer's left end, and the Banquets     */
/* Service Area is behind the back wall. Coordinates below are "hall" feet    */
/* with the hall's top-left corner at (0, 0); single-salon presets shift      */
/* everything so the chosen salon sits at the origin.                        */
/* ------------------------------------------------------------------------ */

type Section = "all" | "a" | "b" | "c";

const SALON_W = 30; // feet, each salon
const HALL_W = SALON_W * 3;
const HALL_H = 40;
const WC_W = 11.5; // restroom block depth, left of the hall
const FOYER_D = 13; // foyer depth, above the hall
const FOYER_R = 83; // where the foyer's end wall sits (short of the hall's right wall)

const SALON_INFO: Record<Exclude<Section, "all">, { index: number; label: string }> = {
  a: { index: 0, label: "Salon A" },
  b: { index: 1, label: "Salon B" },
  c: { index: 2, label: "Salon C" },
};

function courtyardLayout(section: Section): LayoutDoc {
  const items: PlacedItem[] = [];
  const add = (type: string, x: number, y: number, extra?: Partial<PlacedItem>) => {
    const it = { ...makeItem(type, x, y), ...extra };
    items.push(it);
    return it;
  };

  /* ---- pre-function foyer along the top, flush with the restroom block ---- */
  const foyerW = FOYER_R + WC_W;
  const foyerCx = (FOYER_R - WC_W) / 2;
  add("floor", foyerCx, -FOYER_D / 2, { w: foyerW, h: FOYER_D, label: "Pre-Function Foyer" });
  add("wall", foyerCx, -FOYER_D, { w: foyerW + 0.6, h: 0.6 }); // exterior wall along the top
  add("wall", FOYER_R, -FOYER_D / 2, { w: 0.6, h: FOYER_D + 0.6 }); // foyer end wall
  add("door", FOYER_R, -8.5, { w: 4, rotation: 90 }); // exterior door at the foyer's end
  add("entrance", -WC_W, -FOYER_D / 2, { w: 12, rotation: 90, label: "Entry from Hotel" });
  add("console", 5, -1.3);
  add("console", 62.5, -1.3);
  add("console", 31, -12.2);
  add("plant", 26, -11.3);
  add("plant", 37, -11.3);
  add("plant", -8.5, -3);
  add("plant", -8.5, -10);

  /* ---- restrooms with a shared vestibule, against the hall's left wall ---- */
  add("restroom", -WC_W / 2, 7.75, { w: WC_W, h: 15.5 });
  add("restroom", -WC_W / 2, 31.75, { w: WC_W, h: 16.5 });
  add("floor", -WC_W / 2, 19.5, { w: WC_W, h: 8 });
  add("wall", -3.5, 19.5, { w: 7, h: 0.4 }); // partition between the two restroom doors
  add("door", -9.5, 15.5, { w: 3 }); // swings up into the upper restroom
  add("door", -9.5, 23.5, { w: 3, rotation: 180 }); // swings down into the lower restroom

  /* ---- doors into the hall: one per salon from the foyer, service doors behind ---- */
  add("door", 15, 0);
  add("door", 45.5, 0);
  add("door", 75, 0);
  add("door", 19, HALL_H, { rotation: 180 });
  add("door", 53, HALL_H, { rotation: 180 });
  add("door", 69, HALL_H, { rotation: 180 });
  add("label", 45, HALL_H + 6.5, { w: 30, h: 2.4, label: "Banquets Service Area" });

  /* ---- signature block from the setup sheet, above the foyer ---- */
  add("label", 6, -20, { w: 34, h: 2.2, label: "SIGNATURE: ______________________________" });
  add("label", 8, -17.4, { w: 36, h: 1.2, label: "By signing this agreement, you are confirming the setup for your event." });
  add("label", 8, -16, { w: 36, h: 1.2, label: "Any changes day of will result in additional fees." });

  let room: Room;
  let shift = 0;

  if (section === "all") {
    room = { name: "Liberty Hall — Salons A, B & C", w: HALL_W, h: HALL_H };
  } else {
    const me = SALON_INFO[section];
    shift = me.index * SALON_W;
    room = { name: `Courtyard — ${me.label}`, w: SALON_W, h: HALL_H };
    // The airwalls are closed: show the neighbouring salons as greyed zones.
    for (const other of Object.values(SALON_INFO)) {
      if (other.index === me.index) continue;
      add("area", other.index * SALON_W + SALON_W / 2, HALL_H / 2, {
        w: SALON_W,
        h: HALL_H,
        label: `${other.label} (airwall closed)`,
      });
    }
    // Airwall tracks on whichever side(s) of this salon touch another salon.
    if (me.index > 0) add("airwall", me.index * SALON_W, HALL_H / 2, { w: HALL_H, h: 0.6, rotation: 90 });
    if (me.index < 2) add("airwall", (me.index + 1) * SALON_W, HALL_H / 2, { w: HALL_H, h: 0.6, rotation: 90 });
  }

  if (shift !== 0) for (const it of items) it.x -= shift;
  return { room, items };
}

export const PRESETS: LayoutPreset[] = [
  {
    id: "liberty-hall",
    name: "Liberty Hall (Salons A + B + C)",
    description: "All three salons opened up — 90 × 40 ft with the foyer, restrooms and service area.",
    build: () => courtyardLayout("all"),
  },
  {
    id: "salon-a",
    name: "Salon A (left)",
    description: "The left salon on its own, 30 × 40 ft, airwall closed.",
    build: () => courtyardLayout("a"),
  },
  {
    id: "salon-b",
    name: "Salon B (middle)",
    description: "The middle salon on its own, 30 × 40 ft, airwalls closed on both sides.",
    build: () => courtyardLayout("b"),
  },
  {
    id: "salon-c",
    name: "Salon C (right)",
    description: "The right salon on its own, 30 × 40 ft, airwall closed.",
    build: () => courtyardLayout("c"),
  },
  {
    id: "sample-wedding",
    name: "Sample wedding reception",
    description: "A furnished 60 × 40 ft ballroom to explore the tools with.",
    build: sampleLayout,
  },
];

export const PRESETS_BY_ID: Record<string, LayoutPreset> = Object.fromEntries(PRESETS.map((p) => [p.id, p]));
