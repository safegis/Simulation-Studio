/**
 * Atlas conversation history API lives on the Simulation Studio Python backend
 * (`NEXT_PUBLIC_BACKEND_ENDPOINT`), not on Next.js.
 */
export function getAtlasConversationsApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_ENDPOINT?.trim() ?? "";
  const base = raw.replace(/\/$/, "");
  return base ? `${base}/api/atlas-chat` : "";
}

/** e.g. `/conversations` or `/conversations/{id}` */
export function atlasConversationsUrl(path: string): string {
  const root = getAtlasConversationsApiBase();
  if (!root) return "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${root}${p}`;
}
