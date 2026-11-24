import type { RichContent } from "@/contracts/richcontent";
import { resolveFileUrl as defaultResolveFileUrl } from "@/lib/files/resolve-file-url";
import type { ResolveFileUrl } from "@/lib/files/resolve-file-url";
import { createHeadingIdAllocator } from "@/lib/richcontent";
import { cn } from "@/lib/utils";
import { EntityReferenceCard } from "./entity-reference-card";
import type { RichRenderContext } from "./render-context";
import { proseClassName, SharedRichNodes } from "./shared-nodes";

export type RichContentRendererProps = {
  doc: RichContent | null | undefined;
  className?: string;
  resolveFileUrl?: ResolveFileUrl;
  /** Skip empty docs without layout noise */
  hideIfEmpty?: boolean;
};

/**
 * Public RichContent renderer (Server Component).
 * Whitelist nodes only — never uses dangerouslySetInnerHTML for content.
 */
export function RichContentRenderer({
  doc,
  className,
  resolveFileUrl = defaultResolveFileUrl,
  hideIfEmpty = true,
}: RichContentRendererProps) {
  if (!doc?.content?.length) {
    return hideIfEmpty ? null : (
      <div className={cn(proseClassName, className)} />
    );
  }

  const ctx: RichRenderContext = {
    headingId: createHeadingIdAllocator(),
    resolveFileUrl,
    warnUnknown: true,
  };

  const renderDoc = (inner: RichContent) => (
    <SharedRichNodes
      nodes={inner.content}
      ctx={ctx}
      renderEntity={(attrs) => (
        <EntityReferenceCard
          entityType={attrs.entityType}
          entityId={attrs.entityId}
        />
      )}
      renderDoc={renderDoc}
    />
  );

  return (
    <div className={cn(proseClassName, className)}>
      <SharedRichNodes
        nodes={doc.content}
        ctx={ctx}
        renderEntity={(attrs) => (
          <EntityReferenceCard
            entityType={attrs.entityType}
            entityId={attrs.entityId}
          />
        )}
        renderDoc={renderDoc}
      />
    </div>
  );
}
