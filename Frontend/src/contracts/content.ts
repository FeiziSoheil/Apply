import {
  SERVER_FIELDS,
  auditFields,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  listQuerySchema,
  queryBooleanSchema,
  rialsSchema,
  currencyCodeSchema,
  slugSchema,
} from "./common";
import {
  contentSectionsInputSchema,
  contentSectionsSchema,
  richContentSchema,
} from "./richcontent";
import { z } from "./zod";

export * from "./richcontent";

/**
 * Content contracts. Entity shapes mirror `src/types/*` field-for-field
 * (see `type-alignment.ts`); the only additions are server-managed audit
 * fields (`createdAt`, `updatedAt`) and publication fields on editorial
 * content. Create/Update inputs never contain server-managed fields.
 */

/* -------------------------------------------------------------------------- */
/*  Shared value objects                                                      */
/* -------------------------------------------------------------------------- */

export const DEGREE_LEVELS = [
  "bachelor",
  "master",
  "phd",
  "language",
  "foundation",
] as const;
export const degreeLevelSchema = z.enum(DEGREE_LEVELS).openapi("DegreeLevel");
export type DegreeLevel = z.infer<typeof degreeLevelSchema>;

export const seoMetaSchema = z
  .object({
    metaTitle: z.string().min(1).max(70).optional(),
    metaDescription: z.string().min(1).max(160).optional(),
    /** Uploaded file id (not an external URL) */
    ogImageId: idSchema.optional(),
    noindex: z.boolean().optional(),
  })
  .strict()
  .openapi("SeoMeta");
export type SeoMeta = z.infer<typeof seoMetaSchema>;

export const PUBLICATION_STATUSES = [
  "draft",
  "published",
  "scheduled",
] as const;
export const publicationStatusSchema = z
  .enum(PUBLICATION_STATUSES)
  .openapi("PublicationStatus");
export type PublicationStatus = z.infer<typeof publicationStatusSchema>;

/** Public list endpoints return published items only unless staff asks otherwise */
const statusFilter = { status: publicationStatusSchema.optional() } as const;

/**
 * Last editor — display name or user id (server-managed on write).
 */
export const updatedBySchema = z
  .string()
  .min(1)
  .max(80)
  .optional()
  .describe("نام نمایشی یا شناسهٔ آخرین ویرایشگر");

/** Editorial / publication fields shared by content entities */
export const editorialFields = {
  seo: seoMetaSchema.optional(),
  status: publicationStatusSchema,
  publishedAt: isoDateTimeSchema.optional(),
  scheduledAt: isoDateTimeSchema.optional(),
  updatedBy: updatedBySchema,
} as const;

/** Display order for sortable lists (services, consultants, …) */
export const orderFieldSchema = z.number().int().min(0).max(100_000);

export const reorderItemSchema = z
  .object({
    id: idSchema,
    order: orderFieldSchema,
  })
  .strict()
  .openapi("ReorderItem");

export const reorderBodySchema = z
  .object({
    items: z.array(reorderItemSchema).min(1).max(500),
  })
  .strict()
  .openapi("ReorderBody");
export type ReorderBody = z.infer<typeof reorderBodySchema>;

export const reorderResultSchema = z
  .object({
    updated: z.number().int().min(0),
  })
  .strict()
  .openapi("ReorderResult");
export type ReorderResult = z.infer<typeof reorderResultSchema>;

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                       */
/* -------------------------------------------------------------------------- */

/** Embedded FAQ (inside country/service) — same shape as `Faq` in types */
export const embeddedFaqSchema = z
  .object({
    id: idSchema,
    question: z.string().min(3).max(300),
    answer: z.string().min(1).max(5000),
    category: z.string().min(1).max(80).optional(),
  })
  .openapi("EmbeddedFaq");

export const embeddedFaqInputSchema = embeddedFaqSchema
  .omit({ id: true })
  .openapi("EmbeddedFaqInput");

export const faqSchema = embeddedFaqSchema
  .extend({
    order: orderFieldSchema,
    ...auditFields,
  })
  .openapi("Faq");
export type Faq = z.infer<typeof faqSchema>;

export const faqCreateSchema = faqSchema
  .omit(SERVER_FIELDS)
  .extend({ order: orderFieldSchema.default(0) })
  .openapi("FaqCreate");
export type FaqCreate = z.infer<typeof faqCreateSchema>;

export const faqUpdateSchema = faqCreateSchema.partial().openapi("FaqUpdate");
export type FaqUpdate = z.infer<typeof faqUpdateSchema>;

export const FAQ_SORT_FIELDS = ["order", "createdAt", "category"] as const;
export const faqListQuerySchema = listQuerySchema(FAQ_SORT_FIELDS, {
  category: z.string().optional(),
});
export type FaqListQuery = z.infer<typeof faqListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Country                                                                   */
/* -------------------------------------------------------------------------- */

export const CONTINENTS = [
  "europe",
  "north-america",
  "asia",
  "oceania",
] as const;
export const continentSchema = z.enum(CONTINENTS).openapi("Continent");
export type Continent = z.infer<typeof continentSchema>;

export const COST_BANDS = ["low", "medium", "high"] as const;
export const costBandSchema = z.enum(COST_BANDS).openapi("CostBand");
export type CostBand = z.infer<typeof costBandSchema>;

export const costBreakdownItemSchema = z
  .object({
    id: idSchema,
    label: z.string().min(1).max(120),
    amount: z.string().min(1).max(120).describe("مبلغ نمایشی همراه با واحد پول"),
    note: z.string().max(300).optional(),
  })
  .openapi("CostBreakdownItem");

export const costBreakdownItemInputSchema = costBreakdownItemSchema
  .omit({ id: true })
  .openapi("CostBreakdownItemInput");

export const countrySchema = z
  .object({
    id: idSchema,
    slug: slugSchema,
    nameFa: z.string().min(1).max(80),
    nameEn: z.string().min(1).max(80),
    continent: continentSchema,
    costBand: costBandSchema,
    flagEmoji: z.string().max(16).optional(),
    flagPath: z.string().max(300).optional(),
    heroImage: z.string().min(1).max(500),
    summary: z.string().min(1).max(1000),
    benefits: z.array(z.string().min(1)).max(20),
    language: z.string().min(1).max(120),
    visaDuration: z.string().min(1).max(120),
    costOfLiving: z
      .number()
      .min(0)
      .describe("هزینه ماهانه زندگی (تقریبی) به ارز `currency`"),
    tuitionRange: z
      .string()
      .min(1)
      .max(120)
      .describe("بازه شهریه سالانه (متن نمایشی) به ارز `currency`"),
    currency: currencyCodeSchema.describe(
      "ارز `costOfLiving` و `tuitionRange` (ISO 4217، پیش‌فرض EUR)",
    ),
    costBreakdown: z.array(costBreakdownItemSchema),
    /** Short checklist for cards / filters; long-form copy lives in `sections` */
    requirements: z.array(z.string().min(1)).max(50),
    popularFields: z.array(z.string().min(1)).max(50),
    faqs: z.array(embeddedFaqSchema),
    sections: contentSectionsSchema,
    seo: seoMetaSchema,
    status: publicationStatusSchema,
    publishedAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    updatedBy: updatedBySchema,
    ...auditFields,
  })
  .openapi("Country");
export type Country = z.infer<typeof countrySchema>;

export const countryCreateSchema = countrySchema
  .omit({ ...SERVER_FIELDS, updatedBy: true })
  .extend({
    costBreakdown: z.array(costBreakdownItemInputSchema),
    faqs: z.array(embeddedFaqInputSchema),
    sections: contentSectionsInputSchema,
    status: publicationStatusSchema.default("draft"),
  })
  .openapi("CountryCreate");
export type CountryCreate = z.infer<typeof countryCreateSchema>;

export const countryUpdateSchema = countryCreateSchema
  .partial()
  .openapi("CountryUpdate");
export type CountryUpdate = z.infer<typeof countryUpdateSchema>;

export const COUNTRY_SORT_FIELDS = [
  "nameFa",
  "costOfLiving",
  "createdAt",
] as const;
export const countryListQuerySchema = listQuerySchema(COUNTRY_SORT_FIELDS, {
  continent: continentSchema.optional(),
  costBand: costBandSchema.optional(),
  ...statusFilter,
});
export type CountryListQuery = z.infer<typeof countryListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  University                                                                */
/* -------------------------------------------------------------------------- */

export const universityDeadlineSchema = z
  .object({
    label: z.string().min(1).max(120),
    date: isoDateSchema,
  })
  .openapi("UniversityDeadline");

export const universitySchema = z
  .object({
    id: idSchema,
    slug: slugSchema,
    nameFa: z.string().min(1).max(120),
    nameEn: z.string().min(1).max(120),
    countrySlug: slugSchema,
    city: z.string().min(1).max(80),
    ranking: z.number().int().min(1),
    tuitionPerYear: z
      .number()
      .min(0)
      .describe("شهریه سالانه (تقریبی) به ارز `currency`"),
    currency: currencyCodeSchema.describe(
      "ارز `tuitionPerYear` (ISO 4217، پیش‌فرض EUR)",
    ),
    logo: z.string().min(1).max(500),
    heroImage: z.string().min(1).max(500),
    /** Short card blurb; long-form copy lives in `sections` */
    summary: z.string().min(1).max(500),
    deadlines: z.array(universityDeadlineSchema),
    requirements: z.array(z.string().min(1)).max(50),
    sections: contentSectionsSchema,
    programsCount: z
      .number()
      .int()
      .min(0)
      .describe("فقط‌خواندنی؛ توسط سرور محاسبه می‌شود"),
    seo: seoMetaSchema.optional(),
    status: publicationStatusSchema,
    publishedAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    updatedBy: updatedBySchema,
    ...auditFields,
  })
  .openapi("University");
export type University = z.infer<typeof universitySchema>;

export const universityCreateSchema = universitySchema
  .omit({ ...SERVER_FIELDS, programsCount: true, updatedBy: true })
  .extend({
    sections: contentSectionsInputSchema,
    status: publicationStatusSchema.default("draft"),
  })
  .openapi("UniversityCreate");
export type UniversityCreate = z.infer<typeof universityCreateSchema>;

export const universityUpdateSchema = universityCreateSchema
  .partial()
  .openapi("UniversityUpdate");
export type UniversityUpdate = z.infer<typeof universityUpdateSchema>;

export const UNIVERSITY_SORT_FIELDS = [
  "ranking",
  "tuitionPerYear",
  "nameFa",
  "createdAt",
] as const;
export const universityListQuerySchema = listQuerySchema(
  UNIVERSITY_SORT_FIELDS,
  {
    country: slugSchema.optional().describe("اسلاگ کشور"),
    minTuition: z.coerce
      .number()
      .min(0)
      .optional()
      .describe("حداقل شهریه سالانه، معادل یورو"),
    maxTuition: z.coerce
      .number()
      .min(0)
      .optional()
      .describe("حداکثر شهریه سالانه، معادل یورو"),
    ...statusFilter,
  },
);
export type UniversityListQuery = z.infer<typeof universityListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Program                                                                   */
/* -------------------------------------------------------------------------- */

export const PROGRAM_SORTS = ["relevant", "cheapest", "nearest_deadline"] as const;
export const programSortSchema = z.enum(PROGRAM_SORTS).openapi("ProgramSort");
export type ProgramSort = z.infer<typeof programSortSchema>;

export const LANGUAGE_REQUIREMENT_TYPES = [
  "ielts",
  "toefl",
  "testdaf",
  "none",
  "other",
] as const;
export const languageRequirementTypeSchema = z
  .enum(LANGUAGE_REQUIREMENT_TYPES)
  .openapi("LanguageRequirementType");
export type LanguageRequirementType = z.infer<
  typeof languageRequirementTypeSchema
>;

export const programSchema = z
  .object({
    id: idSchema,
    slug: slugSchema,
    nameFa: z.string().min(1).max(160),
    universitySlug: slugSchema,
    countrySlug: slugSchema,
    degreeLevel: degreeLevelSchema,
    field: z.string().min(1).max(120),
    duration: z.string().min(1).max(60).openapi({ example: "۲ سال" }),
    tuition: z.number().min(0).describe("شهریه سالانه به ارز `currency`"),
    currency: currencyCodeSchema.describe(
      "ارز `tuition` (ISO 4217، پیش‌فرض EUR)",
    ),
    languageRequirement: z.string().min(1).max(120).openapi({
      example: "IELTS 6.5",
    }),
    minGpa: z.number().min(0).max(4).describe("حداقل معدل در مقیاس ۴"),
    intakes: z.array(z.string().min(1)).max(8),
    deadline: isoDateSchema,
    hasScholarship: z.boolean(),
    sections: contentSectionsSchema.optional(),
    seo: seoMetaSchema.optional(),
    status: publicationStatusSchema.optional(),
    publishedAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    updatedBy: updatedBySchema,
    ...auditFields,
  })
  .openapi("Program");
export type Program = z.infer<typeof programSchema>;

export const programCreateSchema = programSchema
  .omit({ ...SERVER_FIELDS, updatedBy: true })
  .extend({
    sections: contentSectionsInputSchema.optional(),
  })
  .openapi("ProgramCreate");
export type ProgramCreate = z.infer<typeof programCreateSchema>;

export const programUpdateSchema = programCreateSchema
  .partial()
  .openapi("ProgramUpdate");
export type ProgramUpdate = z.infer<typeof programUpdateSchema>;

export const PROGRAM_SORT_FIELDS = [
  "tuition",
  "deadline",
  "nameFa",
  "createdAt",
] as const;
export const programListQuerySchema = listQuerySchema(PROGRAM_SORT_FIELDS, {
  country: slugSchema.optional().describe("اسلاگ کشور"),
  university: slugSchema.optional().describe("اسلاگ دانشگاه"),
  degreeLevel: degreeLevelSchema.optional(),
  field: z.string().optional(),
  language: z.string().optional().describe("تطبیق متنی با languageRequirement"),
  languageType: languageRequirementTypeSchema.optional(),
  hasScholarship: queryBooleanSchema.optional(),
  minTuition: z.coerce
      .number()
      .min(0)
      .optional()
      .describe("حداقل شهریه سالانه، معادل یورو"),
  maxTuition: z.coerce
      .number()
      .min(0)
      .optional()
      .describe("حداکثر شهریه سالانه، معادل یورو"),
  intake: z.string().optional(),
  preset: programSortSchema
    .optional()
    .describe("مرتب‌سازی پیش‌فرض UI؛ در صورت وجود `sort` نادیده گرفته می‌شود"),
  ...statusFilter,
});
export type ProgramListQuery = z.infer<typeof programListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Service                                                                   */
/* -------------------------------------------------------------------------- */

export const serviceSchema = z
  .object({
    id: idSchema,
    slug: slugSchema,
    title: z.string().min(1).max(120),
    shortDescription: z.string().min(1).max(300),
    icon: z.string().min(1).max(60).describe("کلید آیکن lucide"),
    steps: z.array(z.string().min(1)).max(30),
    requiredDocuments: z.array(z.string().min(1)).max(50),
    duration: z.string().min(1).max(120),
    faqs: z.array(embeddedFaqSchema),
    relatedServiceSlugs: z.array(slugSchema).max(10),
    price: rialsSchema
      .optional()
      .describe("هزینه تقریبی به ریال (عدد صحیح)"),
    order: orderFieldSchema,
    sections: contentSectionsSchema,
    seo: seoMetaSchema,
    status: publicationStatusSchema,
    publishedAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    updatedBy: updatedBySchema,
    ...auditFields,
  })
  .openapi("Service");
export type Service = z.infer<typeof serviceSchema>;

export const serviceCreateSchema = serviceSchema
  .omit({ ...SERVER_FIELDS, updatedBy: true })
  .extend({
    faqs: z.array(embeddedFaqInputSchema),
    sections: contentSectionsInputSchema,
    status: publicationStatusSchema.default("draft"),
    order: orderFieldSchema.default(0),
  })
  .openapi("ServiceCreate");
export type ServiceCreate = z.infer<typeof serviceCreateSchema>;

export const serviceUpdateSchema = serviceCreateSchema
  .partial()
  .openapi("ServiceUpdate");
export type ServiceUpdate = z.infer<typeof serviceUpdateSchema>;

export const SERVICE_SORT_FIELDS = ["order", "title", "price", "createdAt"] as const;
export const serviceListQuerySchema = listQuerySchema(SERVICE_SORT_FIELDS, {
  ...statusFilter,
});
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Consultant                                                                */
/* -------------------------------------------------------------------------- */

export const consultantSchema = z
  .object({
    id: idSchema,
    name: z.string().min(3).max(80),
    role: z.string().min(1).max(120).describe("عنوان شغلی نمایشی"),
    countries: z.array(z.string().min(1)).max(20),
    bio: z.string().min(1).max(2000),
    photo: z.string().min(1).max(500),
    languages: z.array(z.string().min(1)).max(10),
    /** نمایش در صفحه تیم عمومی */
    showOnTeamPage: z.boolean(),
    /** غیرفعال‌سازی نرم (به‌جای حذف سخت هنگام وابستگی) */
    active: z.boolean(),
    order: orderFieldSchema,
    ...auditFields,
  })
  .openapi("Consultant");
export type Consultant = z.infer<typeof consultantSchema>;

export const consultantCreateSchema = consultantSchema
  .omit(SERVER_FIELDS)
  .extend({
    userId: idSchema
      .optional()
      .describe("حساب کاربری (نقش consultant) مرتبط با این مشاور"),
    order: orderFieldSchema.default(0),
    showOnTeamPage: z.boolean().default(true),
    active: z.boolean().default(true),
  })
  .openapi("ConsultantCreate");
export type ConsultantCreate = z.infer<typeof consultantCreateSchema>;

export const consultantUpdateSchema = consultantCreateSchema
  .partial()
  .openapi("ConsultantUpdate");
export type ConsultantUpdate = z.infer<typeof consultantUpdateSchema>;

export const CONSULTANT_SORT_FIELDS = ["order", "name", "createdAt"] as const;
export const consultantListQuerySchema = listQuerySchema(
  CONSULTANT_SORT_FIELDS,
  {
    country: z.string().optional(),
    language: z.string().optional(),
    active: queryBooleanSchema.optional(),
    showOnTeamPage: queryBooleanSchema.optional(),
  },
);
export type ConsultantListQuery = z.infer<typeof consultantListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Success story                                                             */
/* -------------------------------------------------------------------------- */

export const successStorySchema = z
  .object({
    id: idSchema,
    slug: slugSchema.optional(),
    studentName: z.string().min(3).max(80),
    /** اگر true، نام در نمایش عمومی ناشناس می‌شود */
    isAnonymous: z.boolean(),
    country: z.string().min(1).max(80),
    university: z.string().min(1).max(160),
    field: z.string().min(1).max(120),
    year: z.number().int().min(1990).max(2100),
    quote: z.string().min(1).max(500),
    body: z.string().max(10000).optional(),
    videoUrl: z.string().max(500).optional(),
    photo: z.string().max(500).optional(),
    /** رضایت انتشار برای نمایش عمومی؛ برای publish الزامی است */
    publicationConsent: z.boolean(),
    order: orderFieldSchema,
    status: publicationStatusSchema,
    publishedAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    updatedBy: updatedBySchema,
    seo: seoMetaSchema.optional(),
    ...auditFields,
  })
  .openapi("SuccessStory");
export type SuccessStory = z.infer<typeof successStorySchema>;

const successStoryWriteBaseSchema = successStorySchema
  .omit({ ...SERVER_FIELDS, updatedBy: true })
  .extend({
    status: publicationStatusSchema.default("draft"),
    order: orderFieldSchema.default(0),
    isAnonymous: z.boolean().default(false),
    publicationConsent: z.boolean().default(false),
  });

function refinePublicationConsent<T extends {
  status?: (typeof PUBLICATION_STATUSES)[number];
  publicationConsent?: boolean;
}>(value: T, ctx: z.RefinementCtx) {
  if (
    (value.status === "published" || value.status === "scheduled") &&
    value.publicationConsent === false
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["publicationConsent"],
      message: "برای انتشار، رضایت انتشار الزامی است",
    });
  }
}

export const successStoryCreateSchema = successStoryWriteBaseSchema
  .superRefine(refinePublicationConsent)
  .openapi("SuccessStoryCreate");
export type SuccessStoryCreate = z.infer<typeof successStoryCreateSchema>;

export const successStoryUpdateSchema = successStoryWriteBaseSchema
  .partial()
  .superRefine(refinePublicationConsent)
  .openapi("SuccessStoryUpdate");
export type SuccessStoryUpdate = z.infer<typeof successStoryUpdateSchema>;

export const SUCCESS_STORY_SORT_FIELDS = ["order", "year", "createdAt"] as const;
export const successStoryListQuerySchema = listQuerySchema(
  SUCCESS_STORY_SORT_FIELDS,
  {
    country: z.string().optional(),
    year: z.coerce.number().int().optional(),
    ...statusFilter,
  },
);
export type SuccessStoryListQuery = z.infer<typeof successStoryListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Blog category                                                             */
/* -------------------------------------------------------------------------- */

export const blogCategorySchema = z
  .object({
    id: idSchema,
    slug: slugSchema,
    title: z.string().min(1).max(80),
    ...auditFields,
  })
  .openapi("BlogCategory");
export type BlogCategory = z.infer<typeof blogCategorySchema>;

export const blogCategoryCreateSchema = blogCategorySchema
  .omit(SERVER_FIELDS)
  .openapi("BlogCategoryCreate");
export type BlogCategoryCreate = z.infer<typeof blogCategoryCreateSchema>;

export const blogCategoryUpdateSchema = blogCategoryCreateSchema
  .partial()
  .openapi("BlogCategoryUpdate");
export type BlogCategoryUpdate = z.infer<typeof blogCategoryUpdateSchema>;

export const BLOG_CATEGORY_SORT_FIELDS = ["title", "createdAt"] as const;
export const blogCategoryListQuerySchema = listQuerySchema(
  BLOG_CATEGORY_SORT_FIELDS,
);
export type BlogCategoryListQuery = z.infer<typeof blogCategoryListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Blog post                                                                 */
/* -------------------------------------------------------------------------- */

export const blogPostSchema = z
  .object({
    id: idSchema,
    slug: slugSchema,
    title: z.string().min(1).max(200),
    excerpt: z.string().min(1).max(500),
    content: richContentSchema,
    /** Denormalized category title for cards; source of truth is `categoryId` */
    category: z.string().min(1).max(80),
    categoryId: idSchema.optional(),
    tags: z.array(z.string().min(1).max(40)).max(20),
    author: z.string().min(1).max(80),
    publishedAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    readingTime: z.number().int().min(1).describe("زمان مطالعه به دقیقه"),
    coverImage: z.string().min(1).max(500),
    /** Accessible alt text for the cover image */
    coverImageAlt: z.string().min(1).max(200).optional(),
    featured: z.boolean().optional(),
    seo: seoMetaSchema,
    status: publicationStatusSchema,
    updatedBy: updatedBySchema,
    ...auditFields,
  })
  .openapi("BlogPost");
export type BlogPost = z.infer<typeof blogPostSchema>;

export const blogPostCreateSchema = blogPostSchema
  .omit({ ...SERVER_FIELDS, updatedBy: true })
  .extend({ status: publicationStatusSchema.default("draft") })
  .openapi("BlogPostCreate");
export type BlogPostCreate = z.infer<typeof blogPostCreateSchema>;

export const blogPostUpdateSchema = blogPostCreateSchema
  .partial()
  .openapi("BlogPostUpdate");
export type BlogPostUpdate = z.infer<typeof blogPostUpdateSchema>;

export const BLOG_POST_SORT_FIELDS = ["publishedAt", "title", "createdAt"] as const;
export const blogPostListQuerySchema = listQuerySchema(BLOG_POST_SORT_FIELDS, {
  category: z.string().optional(),
  categoryId: idSchema.optional(),
  tag: z.string().optional(),
  author: z.string().optional(),
  /** Inclusive Gregorian date (`YYYY-MM-DD`) on `publishedAt` */
  publishedFrom: isoDateSchema.optional(),
  publishedTo: isoDateSchema.optional(),
  featured: queryBooleanSchema.optional(),
  ...statusFilter,
});
export type BlogPostListQuery = z.infer<typeof blogPostListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  News                                                                      */
/* -------------------------------------------------------------------------- */

export const NEWS_EVENT_TYPES = [
  "webinar",
  "exhibition",
  "visa",
  "deadline",
  "general",
] as const;
export const newsEventTypeSchema = z
  .enum(NEWS_EVENT_TYPES)
  .openapi("NewsEventType");
export type NewsEventType = z.infer<typeof newsEventTypeSchema>;

export const newsItemSchema = z
  .object({
    id: idSchema,
    slug: slugSchema,
    title: z.string().min(1).max(200),
    excerpt: z.string().min(1).max(1000),
    content: richContentSchema,
    publishedAt: isoDateTimeSchema.optional(),
    scheduledAt: isoDateTimeSchema.optional(),
    coverImage: z.string().max(500).optional(),
    coverImageAlt: z.string().min(1).max(200).optional(),
    eventType: newsEventTypeSchema,
    /** Calendar date of the event (webinar / exhibition / …) */
    eventDate: isoDateSchema.optional(),
    /** Optional registration / RSVP URL */
    registrationUrl: z.string().url().max(500).optional(),
    status: publicationStatusSchema,
    updatedBy: updatedBySchema,
    seo: seoMetaSchema.optional(),
    ...auditFields,
  })
  .openapi("NewsItem");
export type NewsItem = z.infer<typeof newsItemSchema>;

export const newsItemCreateSchema = newsItemSchema
  .omit({ ...SERVER_FIELDS, updatedBy: true })
  .extend({ status: publicationStatusSchema.default("draft") })
  .openapi("NewsItemCreate");
export type NewsItemCreate = z.infer<typeof newsItemCreateSchema>;

export const newsItemUpdateSchema = newsItemCreateSchema
  .partial()
  .openapi("NewsItemUpdate");
export type NewsItemUpdate = z.infer<typeof newsItemUpdateSchema>;

export const NEWS_SORT_FIELDS = ["publishedAt", "title", "createdAt"] as const;
export const newsListQuerySchema = listQuerySchema(NEWS_SORT_FIELDS, {
  eventType: newsEventTypeSchema.optional(),
  ...statusFilter,
});
export type NewsListQuery = z.infer<typeof newsListQuerySchema>;
