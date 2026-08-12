import { putEvent, randomId, storageKind } from "../../lib/server/store";
import { cleanComments, cleanItems, cleanRoom, MAX_DOC_BYTES } from "../../lib/server/validate";

export const dynamic = "force-dynamic";

// Create a live shared event. Returns the public id and the planner's secret
// key (required for future layout updates).
export async function POST(req: Request) {
  if (storageKind() === "none") {
    return Response.json(
      { error: "Live sharing is not configured on this server (no storage attached)." },
      { status: 503 }
    );
  }
  const raw = await req.text();
  if (raw.length > MAX_DOC_BYTES) return Response.json({ error: "Layout too large." }, { status: 413 });
  let body: { doc?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const doc = (body.doc ?? {}) as { room?: unknown; items?: unknown; comments?: unknown };
  const room = cleanRoom(doc.room);
  const id = randomId(10);
  const key = randomId(24);
  const now = Date.now();
  await putEvent(id, {
    key,
    name: room.name,
    room,
    items: cleanItems(doc.items),
    comments: cleanComments(doc.comments),
    createdAt: now,
    updatedAt: now,
  });
  return Response.json({ id, key });
}
