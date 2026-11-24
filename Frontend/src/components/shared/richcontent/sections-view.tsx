import type { ContentSection } from "@/contracts/richcontent";
import { cn } from "@/lib/utils";
import { RichContentRenderer } from "./rich-content-renderer";
import { sectionsNav } from "./sections-nav";

export type SectionsViewProps = {
  sections: readonly ContentSection[] | undefined | null;
  className?: string;
  /**
   * When true, also render sections with `visible: false`
   * (only for authenticated preview routes — never default public pages).
   */
  includeHidden?: boolean;
};

function pickSections(
  sections: readonly ContentSection[] | undefined | null,
  includeHidden: boolean,
): ContentSection[] {
  if (!sections?.length) return [];
  return includeHidden
    ? [...sections]
    : sections.filter((section) => section.visible);
}

export { sectionsNav };

/**
 * Public CMS sections (anchor + title + RichContent).
 * Empty / all-hidden lists render nothing so structured page UI stays intact.
 */
export function SectionsView({
  sections,
  className,
  includeHidden = false,
}: SectionsViewProps) {
  const list = pickSections(sections, includeHidden);
  if (list.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-12", className)}>
      {list.map((section) => (
        <section
          key={section.id || section.anchor}
          id={section.anchor}
          className="scroll-mt-28"
        >
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {section.title}
          </h2>
          <RichContentRenderer doc={section.content} />
        </section>
      ))}
    </div>
  );
}
