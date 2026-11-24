import type {
  BlogCategory,
  BlogPost,
  Consultant,
  ContentSection,
  Country,
  Faq,
  NewsItem,
  Program,
  Service,
  SuccessStory,
  University,
} from "@/contracts/content";
import {
  paragraphDoc,
  type RichContent,
  type RichNode,
} from "@/contracts/richcontent";
import { idSchema } from "@/contracts/common";
import {
  blogPosts,
  consultants,
  countries,
  faqs,
  newsItems,
  programs,
  services,
  successStories,
  universities,
} from "@/data";
import { DAY_MS, uuidFromKey } from "../utils";
import { iso, type SeedClock } from "./helpers";

/**
 * Content seed: the existing `src/data/*` mock data mapped onto the contract
 * entities (UUID ids, audit timestamps, publication status, rial prices).
 */

export type ContentSeed = {
  countries: Country[];
  universities: University[];
  programs: Program[];
  services: Service[];
  consultants: Consultant[];
  successStories: SuccessStory[];
  blogCategories: BlogCategory[];
  blogPosts: BlogPost[];
  newsItems: NewsItem[];
  faqs: Faq[];
};

/** `2025-09-01` → `2025-09-01T08:30:00.000Z`; full timestamps pass through */
function toDateTime(value: string): string {
  return value.length === 10 ? `${value}T08:30:00.000Z` : new Date(value).toISOString();
}

function audit(clock: SeedClock, index: number, total: number) {
  const createdAt = clock.now - (total - index + 30) * DAY_MS;
  return { createdAt: iso(createdAt), updatedAt: iso(createdAt + 3 * DAY_MS) };
}

function isUuid(value: string): boolean {
  return idSchema.safeParse(value).success;
}

/** Map static mock keys (e.g. `svc-1`) to seed UUIDs; leave real UUIDs alone. */
function remapEntityId(id: string): string {
  return isUuid(id) ? id : uuidFromKey(id);
}

function remapRichNode(node: RichNode): RichNode {
  switch (node.type) {
    case "entityReference":
      return {
        ...node,
        attrs: {
          ...node.attrs,
          entityId: remapEntityId(node.attrs.entityId),
        },
      };
    case "image":
      return {
        ...node,
        attrs: {
          ...node.attrs,
          fileId: remapEntityId(node.attrs.fileId),
        },
      };
    case "accordion":
      return {
        ...node,
        attrs: {
          items: node.attrs.items.map((item) => ({
            ...item,
            answer: remapRichContent(item.answer),
          })),
        },
      };
    case "bulletList":
    case "orderedList":
      return {
        ...node,
        content: node.content.map(
          (child) => remapRichNode(child) as Extract<RichNode, { type: "listItem" }>,
        ),
      };
    case "listItem":
    case "blockquote":
    case "callout":
    case "tableHeader":
    case "tableCell":
      return {
        ...node,
        content: node.content?.map((child) => remapRichNode(child)),
      };
    case "table":
      return {
        ...node,
        content: node.content.map(
          (child) => remapRichNode(child) as Extract<RichNode, { type: "tableRow" }>,
        ),
      };
    case "tableRow":
      return {
        ...node,
        content: node.content.map(
          (child) =>
            remapRichNode(child) as Extract<
              RichNode,
              { type: "tableHeader" | "tableCell" }
            >,
        ),
      };
    default:
      return node;
  }
}

function remapRichContent(doc: RichContent): RichContent {
  return {
    type: "doc",
    content: doc.content?.map((node) => remapRichNode(node)),
  };
}

function remapSections(
  entityKey: string,
  sections: ContentSection[],
): ContentSection[] {
  return sections.map((section, index) => ({
    ...section,
    id: uuidFromKey(`${entityKey}:section:${section.anchor}:${index}`),
    content: remapRichContent(section.content),
  }));
}

function mapSeo(seo: {
  metaTitle?: string;
  metaDescription?: string;
  ogImageId?: string;
  noindex?: boolean;
}) {
  return {
    metaTitle: seo.metaTitle,
    metaDescription: seo.metaDescription,
    ogImageId: seo.ogImageId,
    noindex: seo.noindex,
  };
}

const BLOG_CATEGORIES: Array<{ key: string; slug: string; title: string }> = [
  { key: "cat-guide", slug: "rahnamaye-entekhab", title: "راهنمای انتخاب" },
  { key: "cat-scholarship", slug: "borsiye", title: "بورسیه" },
  { key: "cat-germany", slug: "alman", title: "آلمان" },
  { key: "cat-canada", slug: "kanada", title: "کانادا" },
  { key: "cat-visa", slug: "viza", title: "ویزا" },
  { key: "cat-news", slug: "akhbar-tahsili", title: "اخبار تحصیلی" },
];

function categoryIdForTitle(title: string): string | undefined {
  const found = BLOG_CATEGORIES.find((c) => c.title === title);
  return found ? uuidFromKey(found.key) : undefined;
}

export function buildContentSeed(clock: SeedClock): ContentSeed {
  const countrySeed: Country[] = countries.map((country, index) => ({
    ...country,
    id: uuidFromKey(country.id),
    status: "published" as const,
    publishedAt: iso(clock.now - 60 * DAY_MS),
    updatedBy: "سارا احمدی",
    seo: mapSeo(country.seo),
    sections: remapSections(country.id, country.sections),
    costBreakdown: country.costBreakdown.map((row) => ({
      ...row,
      id: uuidFromKey(`${country.id}:cost:${row.id}`),
    })),
    faqs: country.faqs.map((faq) => ({
      ...faq,
      id: uuidFromKey(`${country.id}:faq:${faq.id}`),
    })),
    ...audit(clock, index, countries.length),
  }));
  countrySeed.push({
    ...countrySeed[0]!,
    id: uuidFromKey("country-draft-1"),
    slug: "draft-sample-country",
    nameFa: "کشور نمونه (پیش‌نویس)",
    nameEn: "Draft Sample Country",
    status: "draft",
    publishedAt: undefined,
    updatedBy: "علی رضایی",
    summary: "این کشور هنوز منتشر نشده و فقط برای کارمندان قابل مشاهده است.",
    seo: {
      metaTitle: "کشور نمونه پیش‌نویس",
      metaDescription: "صفحهٔ پیش‌نویس کشور برای آزمایش پنل مدیریت.",
    },
    sections: remapSections("country-draft-1", countrySeed[0]!.sections),
    ...audit(clock, countrySeed.length, countrySeed.length + 1),
  });

  const programCount = new Map<string, number>();
  for (const program of programs) {
    programCount.set(
      program.universitySlug,
      (programCount.get(program.universitySlug) ?? 0) + 1,
    );
  }

  const universitySeed: University[] = universities.map((university, index) => ({
    ...university,
    id: uuidFromKey(university.id),
    programsCount: programCount.get(university.slug) ?? 0,
    status: "published" as const,
    publishedAt: iso(clock.now - 45 * DAY_MS),
    updatedBy: "سارا احمدی",
    sections: remapSections(university.id, university.sections),
    seo: university.seo ? mapSeo(university.seo) : {
      metaTitle: university.nameFa.slice(0, 70),
      metaDescription: university.summary.slice(0, 160),
    },
    ...audit(clock, index, universities.length),
  }));

  const programSeed: Program[] = programs.map((program, index) => ({
    ...program,
    id: uuidFromKey(program.id),
    status: "published" as const,
    ...audit(clock, index, programs.length),
  }));

  const serviceSeed: Service[] = services.map((service, index) => ({
    ...service,
    id: uuidFromKey(service.id),
    order: service.order ?? index,
    status: "published" as const,
    publishedAt: iso(clock.now - 30 * DAY_MS),
    updatedBy: "سارا احمدی",
    sections: remapSections(service.id, service.sections),
    seo: mapSeo(service.seo),
    faqs: service.faqs.map((faq) => ({
      ...faq,
      id: uuidFromKey(`${service.id}:faq:${faq.id}`),
    })),
    ...audit(clock, index, services.length),
  }));

  const consultantSeed: Consultant[] = consultants.map((consultant, index) => ({
    ...consultant,
    id: uuidFromKey(consultant.id),
    order: index,
    showOnTeamPage: true,
    active: true,
    ...audit(clock, index, consultants.length),
  }));

  const storySeed: SuccessStory[] = successStories.map((story, index) => ({
    ...story,
    id: uuidFromKey(story.id),
    isAnonymous: story.studentName.includes("."),
    publicationConsent: true,
    status: "published" as const,
    publishedAt: iso(clock.now - 20 * DAY_MS),
    order: index,
    ...audit(clock, index, successStories.length),
  }));
  storySeed.push({
    id: uuidFromKey("story-draft-1"),
    slug: "draft-story-netherlands",
    studentName: "نمونه پیش‌نویس",
    isAnonymous: false,
    publicationConsent: false,
    country: "هلند",
    university: "دانشگاه دلفت",
    field: "مهندسی عمران",
    year: 2026,
    quote: "این داستان هنوز منتشر نشده و فقط برای کارمندان قابل مشاهده است.",
    status: "draft",
    order: storySeed.length,
    ...audit(clock, storySeed.length, storySeed.length + 1),
  });

  const blogCategorySeed: BlogCategory[] = BLOG_CATEGORIES.map((cat, index) => ({
    id: uuidFromKey(cat.key),
    slug: cat.slug,
    title: cat.title,
    ...audit(clock, index, BLOG_CATEGORIES.length),
  }));

  const blogSeed: BlogPost[] = blogPosts.map((post, index) => ({
    ...post,
    id: uuidFromKey(post.id),
    content: remapRichContent(post.content),
    publishedAt: toDateTime(post.publishedAt ?? iso(clock.now)),
    status: "published" as const,
    updatedBy: post.author,
    categoryId: categoryIdForTitle(post.category),
    seo: {
      metaTitle: post.title.slice(0, 70),
      metaDescription: post.excerpt.slice(0, 160),
    },
    ...audit(clock, index, blogPosts.length),
  }));
  blogSeed.push({
    id: uuidFromKey("blog-draft-1"),
    slug: "draft-visa-interview-guide",
    title: "راهنمای مصاحبه ویزا (پیش‌نویس)",
    excerpt: "نکات کلیدی برای آماده‌سازی مصاحبه سفارت؛ در حال نگارش.",
    content: paragraphDoc("این مقاله هنوز در حال تکمیل است."),
    category: "ویزا",
    categoryId: categoryIdForTitle("ویزا"),
    tags: ["ویزا", "مصاحبه"],
    author: "سارا احمدی",
    publishedAt: iso(clock.now),
    readingTime: 4,
    coverImage: blogPosts[0]!.coverImage,
    status: "draft",
    updatedBy: "سارا احمدی",
    seo: {
      metaTitle: "راهنمای مصاحبه ویزا",
      metaDescription: "نکات کلیدی برای آماده‌سازی مصاحبه سفارت.",
    },
    ...audit(clock, blogSeed.length, blogSeed.length + 1),
  });
  blogSeed.push({
    id: uuidFromKey("blog-scheduled-1"),
    slug: "scheduled-tuition-update",
    title: "به‌روزرسانی شهریه (زمان‌بندی‌شده)",
    excerpt: "مطلب زمان‌بندی‌شده که پس از رسیدن زمان، منتشر می‌شود.",
    content: paragraphDoc("این مطلب برای انتشار در آینده زمان‌بندی شده است."),
    category: "اخبار تحصیلی",
    categoryId: categoryIdForTitle("اخبار تحصیلی"),
    tags: ["شهریه"],
    author: "علی رضایی",
    publishedAt: undefined,
    /** Future schedule — must stay hidden on the public site until due */
    scheduledAt: iso(clock.now + 14 * DAY_MS),
    readingTime: 3,
    coverImage: blogPosts[0]!.coverImage,
    status: "scheduled",
    updatedBy: "علی رضایی",
    seo: {
      metaTitle: "به‌روزرسانی شهریه",
      metaDescription: "مطلب زمان‌بندی‌شده درباره تغییر شهریه.",
    },
    ...audit(clock, 0, blogSeed.length + 1),
  });

  const newsSeed: NewsItem[] = newsItems.map((item, index) => ({
    ...item,
    id: uuidFromKey(item.id),
    content: item.content,
    publishedAt: toDateTime(item.publishedAt ?? iso(clock.now)),
    status: "published" as const,
    updatedBy: "سارا احمدی",
    ...audit(clock, index, newsItems.length),
  }));
  newsSeed.push({
    id: uuidFromKey("news-draft-1"),
    slug: "draft-webinar-announcement",
    title: "اطلاعیه وبینار آینده (پیش‌نویس)",
    excerpt: "زمان و موضوع وبینار هنوز نهایی نشده است.",
    content: paragraphDoc("جزئیات وبینار به‌زودی اعلام می‌شود."),
    publishedAt: iso(clock.now + 7 * DAY_MS),
    eventType: "webinar",
    status: "draft",
    ...audit(clock, newsSeed.length, newsSeed.length + 1),
  });

  const faqSeed: Faq[] = faqs.map((faq, index) => ({
    ...faq,
    id: uuidFromKey(faq.id),
    order: index,
    ...audit(clock, index, faqs.length),
  }));

  return {
    countries: countrySeed,
    universities: universitySeed,
    programs: programSeed,
    services: serviceSeed,
    consultants: consultantSeed,
    successStories: storySeed,
    blogCategories: blogCategorySeed,
    blogPosts: blogSeed,
    newsItems: newsSeed,
    faqs: faqSeed,
  };
}
