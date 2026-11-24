import {
  blogCategoryCreateSchema,
  blogCategoryListQuerySchema,
  blogCategorySchema,
  blogCategoryUpdateSchema,
  blogPostCreateSchema,
  blogPostListQuerySchema,
  blogPostSchema,
  blogPostUpdateSchema,
  consultantCreateSchema,
  consultantListQuerySchema,
  consultantSchema,
  consultantUpdateSchema,
  countryCreateSchema,
  countryListQuerySchema,
  countrySchema,
  countryUpdateSchema,
  faqCreateSchema,
  faqListQuerySchema,
  faqSchema,
  faqUpdateSchema,
  newsItemCreateSchema,
  newsItemSchema,
  newsItemUpdateSchema,
  newsListQuerySchema,
  programCreateSchema,
  programListQuerySchema,
  programSchema,
  programUpdateSchema,
  serviceCreateSchema,
  serviceListQuerySchema,
  serviceSchema,
  serviceUpdateSchema,
  successStoryCreateSchema,
  successStoryListQuerySchema,
  successStorySchema,
  successStoryUpdateSchema,
  universityCreateSchema,
  universityListQuerySchema,
  universitySchema,
  universityUpdateSchema,
} from "../content";
import { PUBLIC, requires, type RouteRegistrar } from "./helpers";

/** Reading is public; editing and deleting are guarded by RBAC permissions */
const access = {
  read: PUBLIC,
  write: requires("content:write"),
  delete: requires("content:delete"),
} as const;

export function registerContentRoutes(r: RouteRegistrar): void {
  r.crud({
    tag: "Countries",
    basePath: "/countries",
    singular: "Country",
    plural: "Countries",
    fa: { singular: "کشور", plural: "کشورها" },
    entity: countrySchema,
    create: countryCreateSchema,
    update: countryUpdateSchema,
    query: countryListQuerySchema,
    access,
    bySlug: true,
  });

  r.crud({
    tag: "Universities",
    basePath: "/universities",
    singular: "University",
    plural: "Universities",
    fa: { singular: "دانشگاه", plural: "دانشگاه‌ها" },
    entity: universitySchema,
    create: universityCreateSchema,
    update: universityUpdateSchema,
    query: universityListQuerySchema,
    access,
    bySlug: true,
  });

  r.crud({
    tag: "Programs",
    basePath: "/programs",
    singular: "Program",
    plural: "Programs",
    fa: { singular: "برنامه تحصیلی", plural: "برنامه‌های تحصیلی" },
    entity: programSchema,
    create: programCreateSchema,
    update: programUpdateSchema,
    query: programListQuerySchema,
    access,
    bySlug: true,
  });

  r.crud({
    tag: "Services",
    basePath: "/services",
    singular: "Service",
    plural: "Services",
    fa: { singular: "خدمت", plural: "خدمات" },
    entity: serviceSchema,
    create: serviceCreateSchema,
    update: serviceUpdateSchema,
    query: serviceListQuerySchema,
    access,
    bySlug: true,
    reorderable: true,
  });

  r.crud({
    tag: "Consultants",
    basePath: "/consultants",
    singular: "Consultant",
    plural: "Consultants",
    fa: { singular: "مشاور", plural: "مشاوران" },
    entity: consultantSchema,
    create: consultantCreateSchema,
    update: consultantUpdateSchema,
    query: consultantListQuerySchema,
    access,
    reorderable: true,
  });

  r.crud({
    tag: "Success stories",
    basePath: "/success-stories",
    singular: "SuccessStory",
    plural: "SuccessStories",
    fa: { singular: "داستان موفقیت", plural: "داستان‌های موفقیت" },
    entity: successStorySchema,
    create: successStoryCreateSchema,
    update: successStoryUpdateSchema,
    query: successStoryListQuerySchema,
    access,
    bySlug: true,
    reorderable: true,
  });

  r.crud({
    tag: "Blog categories",
    basePath: "/blog-categories",
    singular: "BlogCategory",
    plural: "BlogCategories",
    fa: { singular: "دستهٔ وبلاگ", plural: "دسته‌های وبلاگ" },
    entity: blogCategorySchema,
    create: blogCategoryCreateSchema,
    update: blogCategoryUpdateSchema,
    query: blogCategoryListQuerySchema,
    access,
    bySlug: true,
  });

  r.crud({
    tag: "Blog",
    basePath: "/blog-posts",
    singular: "BlogPost",
    plural: "BlogPosts",
    fa: { singular: "مقاله", plural: "مقاله‌ها" },
    entity: blogPostSchema,
    create: blogPostCreateSchema,
    update: blogPostUpdateSchema,
    query: blogPostListQuerySchema,
    access,
    bySlug: true,
  });

  r.crud({
    tag: "News",
    basePath: "/news",
    singular: "NewsItem",
    plural: "NewsItems",
    fa: { singular: "خبر", plural: "اخبار" },
    entity: newsItemSchema,
    create: newsItemCreateSchema,
    update: newsItemUpdateSchema,
    query: newsListQuerySchema,
    access,
    bySlug: true,
  });

  r.crud({
    tag: "FAQ",
    basePath: "/faqs",
    singular: "Faq",
    plural: "Faqs",
    fa: { singular: "پرسش متداول", plural: "پرسش‌های متداول" },
    entity: faqSchema,
    create: faqCreateSchema,
    update: faqUpdateSchema,
    query: faqListQuerySchema,
    access,
    reorderable: true,
  });
}
