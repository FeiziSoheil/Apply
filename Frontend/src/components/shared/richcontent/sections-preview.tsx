"use client";

import type { ContentSection } from "@/contracts/richcontent";
import { cn } from "@/lib/utils";
import { RichContentPreview } from "./rich-content-preview";

export type SectionsPreviewProps = {
  sections: ReadonlyArray<{
    title: string;
    anchor: string;
    visible: boolean;
    content: ContentSection["content"] | { type: "doc"; content?: unknown[] };
    icon?: ContentSection["icon"];
    id?: string;
  }>;
  className?: string;
  /** Include hidden sections (draft preview). Default true for admin. */
  includeHidden?: boolean;
};

/**
 * Admin draft preview — same visual tree as public `SectionsView`,
 * using the client RichContent renderer (entity refs via content API).
 */
export function SectionsPreview({
  sections,
  className,
  includeHidden = true,
}: SectionsPreviewProps) {
  const list = includeHidden
    ? sections
    : sections.filter((section) => section.visible);

  if (list.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        هیچ بخش قابل‌نمایشی وجود ندارد.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-10", className)}>
      {list.map((section) => (
        <section
          key={section.id ?? section.anchor}
          id={section.anchor}
          className="scroll-mt-4"
        >
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {section.title}
          </h2>
          <p className="mb-2 text-xs text-muted-foreground" dir="ltr">
            #{section.anchor}
            {!section.visible ? " · مخفی" : null}
          </p>
          <RichContentPreview
            doc={section.content as ContentSection["content"]}
          />
        </section>
      ))}
    </div>
  );
}
