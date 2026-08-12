import { storageKind } from "../../lib/server/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const storage = storageKind();
  return Response.json({ ok: storage !== "none", storage });
}
