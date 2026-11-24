import type { SeoMeta } from "@/contracts/content";
import type { ContentSection, RichContent } from "@/contracts/richcontent";
import { resolveFileUrl } from "@/lib/files/resolve-file-url";
import {
  extractFaqsFromContents,
  richContentToPlainText,
  type ExtractedFaq,
} from "@/lib/richcontent";

const META_DESC_MAX = 160;

function truncatePlain(text: string, max = META_DESC_MAX): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Meta description: admin SEO override, else first non-empty fallback
 * (summary / excerpt / plain text from RichContent).
 */
export function resolveMetaDescription(options: {
  seo?: SeoMeta | null;
  fallbacks?: ReadonlyArray<string | RichContent | undefined | null>;
}): string {
  const fromSeo = options.seo?.metaDescription?.trim();
  if (fromSeo) return truncatePlain(fromSeo);

  for (const fallback of options.fallbacks ?? []) {
    if (!fallback) continue;
    if (typeof fallback === "string") {
      const text = fallback.trim();
      if (text) return truncatePlain(text);
      continue;
    }
    const text = richContentToPlainText(fallback).trim();
    if (text) return truncatePlain(text);
  }

  return "";
}

/** Prefer `seo.ogImageId` (resolved file URL), else a path/URL fallback. */
export function resolveOgImage(
  seo?: SeoMeta | null,
  fallback?: string | null,
): string | undefined {
  const fromId = seo?.ogImageId ? resolveFileUrl(seo.ogImageId) : null;
  if (fromId) return fromId;
  const fb = fallback?.trim();
  return fb || undefined;
}

export function extractFaqsFromSections(
  sections: readonly ContentSection[] | undefined | null,
): ExtractedFaq[] {
  if (!sections?.length) return [];
  return extractFaqsFromContents(
    sections.filter((s) => s.visible).map((s) => s.content),
  );
}
