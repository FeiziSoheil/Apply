"use client";

import { useQuery } from "@tanstack/react-query";
import type { RichContent } from "@/contracts/richcontent";
import type { EntityReferenceType } from "@/contracts/richcontent";
import {
  blogPostsApi,
  countriesApi,
  programsApi,
  servicesApi,
  universitiesApi,
} from "@/features/content/api";
import { resolveFileUrl as defaultResolveFileUrl } from "@/lib/files/resolve-file-url";
import type { ResolveFileUrl } from "@/lib/files/resolve-file-url";
import { createHeadingIdAllocator } from "@/lib/richcontent";
import { cn } from "@/lib/utils";
import type { EntityReferenceCardModel } from "@/services/entity-reference";
import { EntityReferenceCardView } from "./entity-reference-card-view";
import type { RichRenderContext } from "./render-context";
import { proseClassName, SharedRichNodes } from "./shared-nodes";

type RichContentPreviewProps = {
  doc: RichContent | null | undefined;
  className?: string;
  resolveFileUrl?: ResolveFileUrl;
};

async function fetchEntityModel(
  entityType: EntityReferenceType,
  entityId: string,
  signal: AbortSignal,
): Promise<EntityReferenceCardModel | null> {
  if (!entityId.trim()) return null;
  try {
    switch (entityType) {
      case "country": {
        const item = await countriesApi.get(entityId, { signal });
        return {
          entityType,
          id: item.id,
          href: `/countries/${item.slug}`,
          title: item.nameFa,
          description: item.summary,
          meta: item.nameEn,
          imageSrc: item.heroImage,
        };
      }
      case "university": {
        const item = await universitiesApi.get(entityId, { signal });
        return {
          entityType,
          id: item.id,
          href: `/universities/${item.slug}`,
          title: item.nameFa,
          description: item.summary,
          meta: item.nameEn,
          imageSrc: item.heroImage,
        };
      }
      case "program": {
        const item = await programsApi.get(entityId, { signal });
        return {
          entityType,
          id: item.id,
          href: `/programs/${item.slug}`,
          title: item.nameFa,
          description: item.field,
          meta: item.universitySlug,
        };
      }
      case "service": {
        const item = await servicesApi.get(entityId, { signal });
        return {
          entityType,
          id: item.id,
          href: `/services/${item.slug}`,
          title: item.title,
          description: item.shortDescription,
        };
      }
      case "blog-post": {
        const item = await blogPostsApi.get(entityId, { signal });
        return {
          entityType,
          id: item.id,
          href: `/blog/${item.slug}`,
          title: item.title,
          description: item.excerpt,
          meta: item.category,
          imageSrc: item.coverImage,
        };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function EntityReferencePreview({
  entityType,
  entityId,
}: {
  entityType: EntityReferenceType;
  entityId: string;
}) {
  const query = useQuery({
    queryKey: ["richcontent-preview-entity", entityType, entityId],
    queryFn: ({ signal }) => fetchEntityModel(entityType, entityId, signal),
    staleTime: 60_000,
    retry: false,
  });

  if (!query.data) return null;
  return <EntityReferenceCardView model={query.data} />;
}

/**
 * Client-side RichContent preview for admin (draft sections).
 * Same visual whitelist as the public Server renderer.
 */
export function RichContentPreview({
  doc,
  className,
  resolveFileUrl = defaultResolveFileUrl,
}: RichContentPreviewProps) {
  if (!doc?.content?.length) {
    return (
      <p className="text-sm italic text-muted-foreground">(بدون محتوا)</p>
    );
  }

  const ctx: RichRenderContext = {
    headingId: createHeadingIdAllocator(),
    resolveFileUrl,
    warnUnknown: true,
  };

  function renderDoc(inner: RichContent) {
    return (
      <SharedRichNodes
        nodes={inner.content}
        ctx={ctx}
        renderEntity={(attrs) => (
          <EntityReferencePreview
            entityType={attrs.entityType}
            entityId={attrs.entityId}
          />
        )}
        renderDoc={renderDoc}
      />
    );
  }

  return (
    <div className={cn(proseClassName, className)}>
      {renderDoc(doc)}
    </div>
  );
}
