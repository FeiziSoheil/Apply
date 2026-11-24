/**
 * Seed / demo file ids that map to static assets under `/public`
 * (so public pages work with `NEXT_PUBLIC_API_MOCKING=disabled`).
 */
const STATIC_FILE_URLS: Record<string, string> = {
  "seed-richcontent-image": "/images/covers/blog-01.svg",
  // Deterministic seed id from `uuidFromKey("file:license-badge")`
  "6e371510-dc13-4f21-ba83-8bd3c6d02211": "/images/covers/blog-01.svg",
};

/**
 * Resolve a CMS `fileId` to a public URL for `<Image>` / OG tags.
 *
 * Known seed ids map to local `/images/*`. Uploaded mock assets are served at
 * `/mock-files/:id/:name` (MSW). Returns `null` for empty ids.
 */
export function resolveFileUrl(fileId: string): string | null {
  const id = fileId.trim();
  if (!id) return null;
  if (STATIC_FILE_URLS[id]) return STATIC_FILE_URLS[id];
  return `/mock-files/${encodeURIComponent(id)}/image`;
}

export type ResolveFileUrl = (fileId: string) => string | null | undefined;
