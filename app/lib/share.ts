// Share links encode the entire layout into the URL hash, so sharing needs no
// server: anyone with the link reconstructs the floor plan locally in their
// browser. Payloads are deflate-compressed ("z:" prefix) when the browser
// supports CompressionStream, with an uncompressed fallback ("u:").

import { LayoutDoc } from "./banquet";

export interface SharePayload {
  v: 1;
  mode: "client" | "team";
  doc: LayoutDoc;
}

function toB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

export async function encodeShare(payload: SharePayload): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    const packed = new Uint8Array(await new Response(stream).arrayBuffer());
    return "z:" + toB64Url(packed);
  } catch {
    return "u:" + toB64Url(bytes);
  }
}

export async function decodeShare(encoded: string): Promise<SharePayload | null> {
  try {
    const kind = encoded.slice(0, 2);
    const bytes = fromB64Url(encoded.slice(2));
    let json: string;
    if (kind === "z:") {
      const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      json = await new Response(stream).text();
    } else if (kind === "u:") {
      json = new TextDecoder().decode(bytes);
    } else {
      return null;
    }
    const payload = JSON.parse(json) as SharePayload;
    if (!payload || payload.v !== 1 || (payload.mode !== "client" && payload.mode !== "team")) return null;
    if (!payload.doc || !payload.doc.room || !Array.isArray(payload.doc.items)) return null;
    return payload;
  } catch {
    return null;
  }
}
