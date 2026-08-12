import { getEvent, putEvent } from "../../../lib/server/store";
import { cleanComments, cleanItems, cleanRoom, MAX_DOC_BYTES } from "../../../lib/server/validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const rec = await getEvent(id);
  if (!rec) return Response.json({ error: "Not found." }, { status: 404 });
  const { key: _key, ...pub } = rec;
  void _key;
  return Response.json(pub);
}

// Update the layout (planner only — requires the secret key returned at
// creation). Comments are replaced only when explicitly provided.
export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const rec = await getEvent(id);
  if (!rec) return Response.json({ error: "Not found." }, { status: 404 });
  const raw = await req.text();
  if (raw.length > MAX_DOC_BYTES) return Response.json({ error: "Layout too large." }, { status: 413 });
  let body: { key?: string; doc?: { room?: unknown; items?: unknown }; comments?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.key || body.key !== rec.key) return Response.json({ error: "Wrong key." }, { status: 403 });
  if (body.doc) {
    rec.room = cleanRoom(body.doc.room);
    rec.items = cleanItems(body.doc.items);
    rec.name = rec.room.name;
  }
  if (body.comments !== undefined) rec.comments = cleanComments(body.comments);
  rec.updatedAt = Date.now();
  await putEvent(id, rec);
  return Response.json({ ok: true, updatedAt: rec.updatedAt });
}
