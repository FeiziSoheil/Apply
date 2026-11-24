import type { ContentSection } from "@/contracts/richcontent";

/** Nav items for SectionNav / sticky TOC — visible sections only. */
export function sectionsNav(
  sections: readonly ContentSection[] | undefined | null,
): Array<{ id: string; label: string }> {
  if (!sections?.length) return [];
  return sections
    .filter((section) => section.visible)
    .map((section) => ({
      id: section.anchor,
      label: section.title,
    }));
}
