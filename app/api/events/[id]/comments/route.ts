import { getEvent, putEvent, randomId } from "../../../../lib/server/store";
import { cleanComment, MAX_COMMENTS } from "../../../../lib/server/validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Anyone with the link can add a comment — that's the point of the team link.
// The client link simply never shows commenting UI.
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const rec = await getEvent(id);
  if (!rec) return Response.json({ error: "Not found." }, { status: 404 });
  if (rec.comments.length >= MAX_COMMENTS) {
    return Response.json({ error: "Comment limit reached." }, { status: 409 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const base = cleanComment(body);
  if (!base) return Response.json({ error: "Name and comment text are required." }, { status: 400 });
  const comment = { ...base, id: randomId(10), createdAt: Date.now() };
  rec.comments.push(comment);
  rec.updatedAt = Date.now();
  await putEvent(id, rec);
  return Response.json({ comment });
}

// Remove a comment. The team link is a trusted space, so knowing the link and
// the comment id is enough (the planner's key also works).
export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const rec = await getEvent(id);
  if (!rec) return Response.json({ error: "Not found." }, { status: 404 });
  const cid = new URL(req.url).searchParams.get("cid");
  if (!cid) return Response.json({ error: "Missing cid." }, { status: 400 });
  const before = rec.comments.length;
  rec.comments = rec.comments.filter((c) => c.id !== cid);
  if (rec.comments.length !== before) {
    rec.updatedAt = Date.now();
    await putEvent(id, rec);
  }
  return Response.json({ ok: true });
}
