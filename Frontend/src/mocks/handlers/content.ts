import type {
  BlogCategory,
  BlogCategoryCreate,
  BlogCategoryListQuery,
  BlogCategoryUpdate,
  BlogPost,
  BlogPostCreate,
  BlogPostListQuery,
  BlogPostUpdate,
  Consultant,
  ConsultantCreate,
  ConsultantListQuery,
  ConsultantUpdate,
  ContentSection,
  ContentSectionInput,
  Country,
  CountryCreate,
  CountryListQuery,
  CountryUpdate,
  Faq,
  FaqCreate,
  FaqListQuery,
  FaqUpdate,
  NewsItem,
  NewsItemCreate,
  NewsItemUpdate,
  NewsListQuery,
  Program,
  ProgramCreate,
  ProgramListQuery,
  ProgramUpdate,
  Service,
  ServiceCreate,
  ServiceListQuery,
  ServiceUpdate,
  SuccessStory,
  SuccessStoryCreate,
  SuccessStoryListQuery,
  SuccessStoryUpdate,
  University,
  UniversityCreate,
  UniversityListQuery,
  UniversityUpdate,
} from "@/contracts/content";
import { toEurEquivalent } from "@/lib/currency";
import { matchesLanguageRequirementType } from "@/lib/language-requirements";
import type { RouteImplementations } from "../contract";
import { apiError } from "../errors";
import { compact, newId, normalizeText, sortItems } from "../utils";
import { contentResource, withIds } from "./crud";

const includesText = (haystack: readonly string[], needle: string) =>
  haystack.some((entry) => normalizeText(entry).includes(normalizeText(needle)));

function withSectionIds(
  sections: readonly ContentSectionInput[],
): ContentSection[] {
  return sections.map((section) => ({ ...section, id: newId() }));
}

/* ----- Countries ----- */

const countries = contentResource<Country, CountryCreate, CountryUpdate, CountryListQuery>({
  singular: "Country",
  plural: "Countries",
  label: "کشور",
  repo: (db) => db.countries,
  bySlug: true,
  slugOf: (item) => item.slug,
  statusOf: (item) => item.status,
  publishable: true,
  filter: (item, q, staff) =>
    (!q.continent || item.continent === q.continent) &&
    (!q.costBand || item.costBand === q.costBand) &&
    (!staff || !q.status || item.status === q.status),
  searchText: (item) => [item.nameFa, item.nameEn, item.slug, item.summary, item.language],
  sorters: {
    nameFa: (item) => item.nameFa,
    costOfLiving: (item) => toEurEquivalent(item.costOfLiving, item.currency),
    createdAt: (item) => item.createdAt,
  },
  create: (input, { id, now }, ctx) => ({
    ...input,
    id,
    status: input.status ?? "draft",
    costBreakdown: withIds(input.costBreakdown),
    faqs: withIds(input.faqs),
    sections: withSectionIds(input.sections),
    updatedBy: ctx?.user?.name,
    createdAt: now,
    updatedAt: now,
  }),
  merge: (current, patch, now, ctx) => {
    const { costBreakdown, faqs, sections, ...rest } = compact(patch);
    return {
      ...current,
      ...rest,
      ...(costBreakdown ? { costBreakdown: withIds(costBreakdown) } : {}),
      ...(faqs ? { faqs: withIds(faqs) } : {}),
      ...(sections ? { sections: withSectionIds(sections) } : {}),
      updatedBy: ctx?.user?.name ?? current.updatedBy,
      updatedAt: now,
    };
  },
  beforeDelete: (item, db) => {
    const inUse =
      db.universities.find((uni) => uni.countrySlug === item.slug) ??
      db.programs.find((program) => program.countrySlug === item.slug);
    if (inUse) {
      throw apiError.conflict("این کشور به دانشگاه یا برنامه تحصیلی وابسته است و قابل حذف نیست");
    }
  },
});

/* ----- Universities ----- */

const universities = contentResource<
  University,
  UniversityCreate,
  UniversityUpdate,
  UniversityListQuery
>({
  singular: "University",
  plural: "Universities",
  label: "دانشگاه",
  repo: (db) => db.universities,
  bySlug: true,
  slugOf: (item) => item.slug,
  statusOf: (item) => item.status,
  publishable: true,
  filter: (item, q, staff) =>
    (!q.country || item.countrySlug === q.country) &&
    (q.minTuition === undefined ||
      toEurEquivalent(item.tuitionPerYear, item.currency) >= q.minTuition) &&
    (q.maxTuition === undefined ||
      toEurEquivalent(item.tuitionPerYear, item.currency) <= q.maxTuition) &&
    (!staff || !q.status || item.status === q.status),
  searchText: (item) => [item.nameFa, item.nameEn, item.slug, item.city, item.summary],
  sorters: {
    ranking: (item) => item.ranking,
    tuitionPerYear: (item) => toEurEquivalent(item.tuitionPerYear, item.currency),
    nameFa: (item) => item.nameFa,
    createdAt: (item) => item.createdAt,
  },
  create: (input, { id, now }, ctx) => ({
    ...input,
    id,
    status: input.status ?? "draft",
    programsCount: 0,
    sections: withSectionIds(input.sections),
    updatedBy: ctx?.user?.name,
    createdAt: now,
    updatedAt: now,
  }),
  merge: (current, patch, now, ctx) => {
    const { sections, ...rest } = compact(patch);
    return {
      ...current,
      ...rest,
      ...(sections ? { sections: withSectionIds(sections) } : {}),
      updatedBy: ctx?.user?.name ?? current.updatedBy,
      updatedAt: now,
    };
  },
  present: (item, db) => ({
    ...item,
    programsCount: db.programs.filter((program) => program.universitySlug === item.slug).length,
  }),
  beforeDelete: (item, db) => {
    if (db.programs.find((program) => program.universitySlug === item.slug)) {
      throw apiError.conflict("این دانشگاه برنامه تحصیلی دارد و قابل حذف نیست");
    }
  },
  afterUpdate: ({ previous, next, db, now }) => {
    if (previous.slug === next.slug && previous.countrySlug === next.countrySlug) {
      return;
    }
    for (const program of db.programs.all()) {
      if (program.universitySlug !== previous.slug) continue;
      db.programs.update(program.id, {
        ...program,
        universitySlug: next.slug,
        countrySlug: next.countrySlug,
        updatedAt: now,
      });
    }
  },
});

/* ----- Programs ----- */

function programTuitionEur(item: Program): number {
  return toEurEquivalent(item.tuition, item.currency);
}

function orderPrograms(items: Program[], q: ProgramListQuery): Program[] {
  if (q.sort) {
    return sortItems(items, q.sort, q.order, {
      tuition: programTuitionEur,
      deadline: (item) => item.deadline,
      nameFa: (item) => item.nameFa,
      createdAt: (item) => item.createdAt,
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  switch (q.preset) {
    case "cheapest":
      return sortItems(items, "tuition", "asc", { tuition: programTuitionEur });
    case "nearest_deadline":
      return [...items].sort((a, b) => {
        const aPast = a.deadline < today;
        const bPast = b.deadline < today;
        if (aPast !== bPast) return aPast ? 1 : -1;
        return a.deadline.localeCompare(b.deadline);
      });
    default:
      return items;
  }
}

const programs = contentResource<Program, ProgramCreate, ProgramUpdate, ProgramListQuery>({
  singular: "Program",
  plural: "Programs",
  label: "برنامه تحصیلی",
  repo: (db) => db.programs,
  bySlug: true,
  slugOf: (item) => item.slug,
  statusOf: (item) => item.status ?? "published",
  publishable: true,
  filter: (item, q, staff) =>
    (!q.country || item.countrySlug === q.country) &&
    (!q.university || item.universitySlug === q.university) &&
    (!q.degreeLevel || item.degreeLevel === q.degreeLevel) &&
    (!q.field || normalizeText(item.field).includes(normalizeText(q.field))) &&
    (!q.language ||
      normalizeText(item.languageRequirement).includes(normalizeText(q.language))) &&
    (!q.languageType || matchesLanguageRequirementType(item.languageRequirement, q.languageType)) &&
    (q.hasScholarship === undefined || item.hasScholarship === q.hasScholarship) &&
    (q.minTuition === undefined || programTuitionEur(item) >= q.minTuition) &&
    (q.maxTuition === undefined || programTuitionEur(item) <= q.maxTuition) &&
    (!q.intake || includesText(item.intakes, q.intake)) &&
    (!staff || !q.status || (item.status ?? "published") === q.status),
  searchText: (item) => [item.nameFa, item.slug, item.field, item.universitySlug, item.countrySlug],
  sorters: {
    tuition: programTuitionEur,
    deadline: (item) => item.deadline,
    nameFa: (item) => item.nameFa,
    createdAt: (item) => item.createdAt,
  },
  order: orderPrograms,
  create: (input, { id, now }, ctx) => ({
    ...input,
    id,
    status: input.status ?? "draft",
    sections: input.sections ? withSectionIds(input.sections) : undefined,
    updatedBy: ctx?.user?.name,
    createdAt: now,
    updatedAt: now,
  }),
  merge: (current, patch, now, ctx) => {
    const { sections, ...rest } = compact(patch);
    return {
      ...current,
      ...rest,
      ...(sections ? { sections: withSectionIds(sections) } : {}),
      updatedBy: ctx?.user?.name ?? current.updatedBy,
      updatedAt: now,
    };
  },
});

/* ----- Services ----- */

const services = contentResource<Service, ServiceCreate, ServiceUpdate, ServiceListQuery>({
  singular: "Service",
  plural: "Services",
  label: "خدمت",
  repo: (db) => db.services,
  bySlug: true,
  slugOf: (item) => item.slug,
  statusOf: (item) => item.status,
  publishable: true,
  reorderable: true,
  filter: (item, q, staff) =>
    !staff || !q.status || item.status === q.status,
  searchText: (item) => [item.title, item.shortDescription, item.slug],
  sorters: {
    order: (item) => item.order,
    title: (item) => item.title,
    price: (item) => item.price,
    createdAt: (item) => item.createdAt,
  },
  defaultSort: { sort: "order", order: "asc" },
  create: (input, { id, now }, ctx) => ({
    ...input,
    id,
    order: input.order ?? 0,
    status: input.status ?? "draft",
    faqs: withIds(input.faqs),
    sections: withSectionIds(input.sections),
    updatedBy: ctx?.user?.name,
    createdAt: now,
    updatedAt: now,
  }),
  merge: (current, patch, now, ctx) => {
    const { faqs, sections, ...rest } = compact(patch);
    return {
      ...current,
      ...rest,
      ...(faqs ? { faqs: withIds(faqs) } : {}),
      ...(sections ? { sections: withSectionIds(sections) } : {}),
      updatedBy: ctx?.user?.name ?? current.updatedBy,
      updatedAt: now,
    };
  },
});

/* ----- Consultants ----- */

const consultants = contentResource<
  Consultant,
  ConsultantCreate,
  ConsultantUpdate,
  ConsultantListQuery
>({
  singular: "Consultant",
  plural: "Consultants",
  label: "مشاور",
  repo: (db) => db.consultants,
  reorderable: true,
  filter: (item, q) =>
    (!q.country || includesText(item.countries, q.country)) &&
    (!q.language || includesText(item.languages, q.language)) &&
    (q.active === undefined || item.active === q.active) &&
    (q.showOnTeamPage === undefined || item.showOnTeamPage === q.showOnTeamPage),
  searchText: (item) => [item.name, item.role, item.bio],
  sorters: {
    order: (item) => item.order,
    name: (item) => item.name,
    createdAt: (item) => item.createdAt,
  },
  defaultSort: { sort: "order", order: "asc" },
  create: (input, { id, now }) => {
    const { userId, ...rest } = input;
    void userId;
    return {
      ...rest,
      id,
      order: input.order ?? 0,
      showOnTeamPage: input.showOnTeamPage ?? true,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
  },
  merge: (current, patch, now) => {
    const { userId, ...rest } = compact(patch);
    void userId;
    return { ...current, ...rest, updatedAt: now };
  },
  beforeDelete: (item, db) => {
    const hasLead = db.leads.find((lead) => lead.assignedTo === item.id);
    const hasActiveCase = db.cases.find(
      (entry) => entry.consultantId === item.id && entry.status === "active",
    );
    const hasBooking = db.bookings.find(
      (booking) =>
        booking.consultantId === item.id && booking.status !== "cancelled",
    );
    if (hasLead || hasActiveCase || hasBooking) {
      throw apiError.conflict(
        "به این مشاور سرنخ، پرونده فعال یا رزرو اختصاص دارد و قابل حذف نیست. به‌جای حذف، غیرفعال‌سازی کنید.",
      );
    }
  },
});

/* ----- Editorial content ----- */

const successStories = contentResource<
  SuccessStory,
  SuccessStoryCreate,
  SuccessStoryUpdate,
  SuccessStoryListQuery
>({
  singular: "SuccessStory",
  plural: "SuccessStories",
  label: "داستان موفقیت",
  repo: (db) => db.successStories,
  bySlug: true,
  slugOf: (item) => item.slug,
  statusOf: (item) => item.status,
  publishable: true,
  reorderable: true,
  filter: (item, q, staff) =>
    (!q.country || normalizeText(item.country).includes(normalizeText(q.country))) &&
    (q.year === undefined || item.year === q.year) &&
    (!staff || !q.status || item.status === q.status),
  searchText: (item) => [item.studentName, item.country, item.university, item.field, item.quote],
  sorters: {
    order: (item) => item.order,
    year: (item) => item.year,
    createdAt: (item) => item.createdAt,
  },
  defaultSort: { sort: "order", order: "asc" },
  create: (input, { id, now }, ctx) => ({
    ...input,
    id,
    order: input.order ?? 0,
    isAnonymous: input.isAnonymous ?? false,
    publicationConsent: input.publicationConsent ?? false,
    updatedBy: ctx?.user?.name,
    createdAt: now,
    updatedAt: now,
  }),
  merge: (current, patch, now, ctx) => {
    const next = {
      ...current,
      ...compact(patch),
      updatedBy: ctx?.user?.name ?? current.updatedBy,
      updatedAt: now,
    };
    if (
      (next.status === "published" || next.status === "scheduled") &&
      !next.publicationConsent
    ) {
      throw apiError.invalidField(
        "publicationConsent",
        "برای انتشار، رضایت انتشار الزامی است",
      );
    }
    return next;
  },
});

const blogCategories = contentResource<
  BlogCategory,
  BlogCategoryCreate,
  BlogCategoryUpdate,
  BlogCategoryListQuery
>({
  singular: "BlogCategory",
  plural: "BlogCategories",
  label: "دستهٔ وبلاگ",
  repo: (db) => db.blogCategories,
  bySlug: true,
  slugOf: (item) => item.slug,
  searchText: (item) => [item.title, item.slug],
  sorters: { title: (item) => item.title, createdAt: (item) => item.createdAt },
  create: (input, { id, now }) => ({ ...input, id, createdAt: now, updatedAt: now }),
  merge: (current, patch, now) => ({ ...current, ...compact(patch), updatedAt: now }),
  beforeDelete: (item, db) => {
    const inUse = db.blogPosts.find(
      (post) => post.categoryId === item.id || post.category === item.title,
    );
    if (inUse) {
      throw apiError.conflict(
        "این دسته دارای مقاله است و قابل حذف نیست. ابتدا مقاله‌ها را جابه‌جا یا حذف کنید.",
      );
    }
  },
});

const blogPosts = contentResource<BlogPost, BlogPostCreate, BlogPostUpdate, BlogPostListQuery>({
  singular: "BlogPost",
  plural: "BlogPosts",
  label: "مقاله",
  repo: (db) => db.blogPosts,
  bySlug: true,
  slugOf: (item) => item.slug,
  statusOf: (item) => item.status,
  publishable: true,
  filter: (item, q, staff) => {
    const publishedDay = item.publishedAt?.slice(0, 10);
    return (
      (!q.category || item.category === q.category) &&
      (!q.categoryId || item.categoryId === q.categoryId) &&
      (!q.tag || item.tags.includes(q.tag)) &&
      (!q.author || item.author === q.author) &&
      (!q.publishedFrom ||
        (publishedDay !== undefined && publishedDay >= q.publishedFrom)) &&
      (!q.publishedTo ||
        (publishedDay !== undefined && publishedDay <= q.publishedTo)) &&
      (q.featured === undefined || Boolean(item.featured) === q.featured) &&
      (!staff || !q.status || item.status === q.status)
    );
  },
  searchText: (item) => [
    item.title,
    item.excerpt,
    item.category,
    item.author,
    ...item.tags,
  ],
  sorters: {
    publishedAt: (item) => item.publishedAt,
    title: (item) => item.title,
    createdAt: (item) => item.createdAt,
  },
  defaultSort: { sort: "publishedAt", order: "desc" },
  create: (input, { id, now }, ctx) => ({
    ...input,
    id,
    updatedBy: ctx.user?.name,
    createdAt: now,
    updatedAt: now,
  }),
  merge: (current, patch, now, ctx) => ({
    ...current,
    ...compact(patch),
    updatedBy: ctx.user?.name ?? current.updatedBy,
    updatedAt: now,
  }),
});

const newsItems = contentResource<NewsItem, NewsItemCreate, NewsItemUpdate, NewsListQuery>({
  singular: "NewsItem",
  plural: "NewsItems",
  label: "خبر",
  repo: (db) => db.newsItems,
  bySlug: true,
  slugOf: (item) => item.slug,
  statusOf: (item) => item.status,
  publishable: true,
  filter: (item, q, staff) =>
    (!q.eventType || item.eventType === q.eventType) &&
    (!staff || !q.status || item.status === q.status),
  searchText: (item) => [item.title, item.excerpt],
  sorters: {
    publishedAt: (item) => item.publishedAt,
    title: (item) => item.title,
    createdAt: (item) => item.createdAt,
  },
  defaultSort: { sort: "publishedAt", order: "desc" },
  create: (input, { id, now }, ctx) => ({
    ...input,
    id,
    updatedBy: ctx?.user?.name,
    createdAt: now,
    updatedAt: now,
  }),
  merge: (current, patch, now, ctx) => ({
    ...current,
    ...compact(patch),
    updatedBy: ctx?.user?.name ?? current.updatedBy,
    updatedAt: now,
  }),
});

const faqs = contentResource<Faq, FaqCreate, FaqUpdate, FaqListQuery>({
  singular: "Faq",
  plural: "Faqs",
  label: "پرسش متداول",
  repo: (db) => db.faqs,
  reorderable: true,
  filter: (item, q) => !q.category || item.category === q.category,
  searchText: (item) => [item.question, item.answer, item.category],
  sorters: {
    order: (item) => item.order,
    createdAt: (item) => item.createdAt,
    category: (item) => item.category,
  },
  defaultSort: { sort: "order", order: "asc" },
  create: (input, { id, now }) => ({
    ...input,
    id,
    order: input.order ?? 0,
    createdAt: now,
    updatedAt: now,
  }),
  merge: (current, patch, now) => ({ ...current, ...compact(patch), updatedAt: now }),
});

export const contentHandlers: RouteImplementations = {
  ...countries,
  ...universities,
  ...programs,
  ...services,
  ...consultants,
  ...successStories,
  ...blogCategories,
  ...blogPosts,
  ...newsItems,
  ...faqs,
};
