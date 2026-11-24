import type { EntityReferenceType } from "@/contracts/richcontent";
import { blogPosts } from "@/data/blog";
import { countries } from "@/data/countries";
import { programs } from "@/data/programs";
import { services } from "@/data/services";
import { universities } from "@/data/universities";
import { mockDelay } from "@/lib/mock-delay";

export type EntityReferenceCardModel = {
  entityType: EntityReferenceType;
  id: string;
  href: string;
  title: string;
  description?: string;
  meta?: string;
  imageSrc?: string;
};

/**
 * Resolve an `entityReference` node for public rendering.
 * Missing / unpublished entities return `null` (caller renders nothing).
 */
export async function resolveEntityReference(
  entityType: EntityReferenceType,
  entityId: string,
): Promise<EntityReferenceCardModel | null> {
  await mockDelay();

  const id = entityId.trim();
  if (!id) return null;

  switch (entityType) {
    case "country": {
      const item = countries.find((c) => c.id === id);
      if (!item) return null;
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
      const item = universities.find((u) => u.id === id);
      if (!item) return null;
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
      const item = programs.find((p) => p.id === id);
      if (!item) return null;
      const uni = universities.find((u) => u.slug === item.universitySlug);
      return {
        entityType,
        id: item.id,
        href: `/programs/${item.slug}`,
        title: item.nameFa,
        description: item.field,
        meta: uni?.nameFa ?? item.universitySlug,
      };
    }
    case "service": {
      const item = services.find((s) => s.id === id);
      if (!item) return null;
      return {
        entityType,
        id: item.id,
        href: `/services/${item.slug}`,
        title: item.title,
        description: item.shortDescription,
      };
    }
    case "blog-post": {
      const item = blogPosts.find((p) => p.id === id);
      if (!item) return null;
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
}
