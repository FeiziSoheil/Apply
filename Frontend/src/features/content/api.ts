import type { z } from "zod";
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
  reorderBodySchema,
  reorderResultSchema,
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
  type ReorderBody,
  type ReorderResult,
} from "@/contracts/content";
import { slugAvailabilitySchema } from "@/contracts/common";
import {
  apiDelete,
  apiGet,
  apiGetPage,
  apiPost,
  apiPatch,
  segment,
  type Paginated,
  type RequestOptions,
} from "@/lib/api/client";
import type { ListFilters } from "@/lib/api/types";
import { validateRequest } from "@/lib/api/validate";

/* -------------------------------------------------------------------------- */
/*  Generic content resource (list / get / create / update / delete)          */
/* -------------------------------------------------------------------------- */

export type ResourceApi<TItem, TFilters, TCreate, TUpdate> = {
  list(filters?: TFilters, options?: RequestOptions): Promise<Paginated<TItem>>;
  get(id: string, options?: RequestOptions): Promise<TItem>;
  create(body: TCreate, options?: RequestOptions): Promise<TItem>;
  /** `PATCH`: only the sent fields change */
  update(id: string, body: TUpdate, options?: RequestOptions): Promise<TItem>;
  remove(id: string, options?: RequestOptions): Promise<void>;
};

export type ReorderableResourceApi<TItem, TFilters, TCreate, TUpdate> =
  ResourceApi<TItem, TFilters, TCreate, TUpdate> & {
    reorder(
      body: ReorderBody,
      options?: RequestOptions,
    ): Promise<ReorderResult>;
  };

export type SlugAvailabilityResult = {
  slug: string;
  available: boolean;
};

export type SluggedResourceApi<TItem, TFilters, TCreate, TUpdate> = ResourceApi<
  TItem,
  TFilters,
  TCreate,
  TUpdate
> & {
  getBySlug(slug: string, options?: RequestOptions): Promise<TItem>;
  checkSlugAvailable(
    slug: string,
    options?: RequestOptions & { excludeId?: string },
  ): Promise<SlugAvailabilityResult>;
};

type ResourceSpec<
  E extends z.ZodTypeAny,
  C extends z.ZodTypeAny,
  U extends z.ZodTypeAny,
  Q extends z.ZodTypeAny,
> = {
  basePath: string;
  entity: E;
  create: C;
  update: U;
  /** Only used for typing the filters */
  query: Q;
};

type ResourceApiOf<
  E extends z.ZodTypeAny,
  C extends z.ZodTypeAny,
  U extends z.ZodTypeAny,
  Q extends z.ZodTypeAny,
> = ResourceApi<z.output<E>, ListFilters<Q>, z.input<C>, z.input<U>>;

function createResourceApi<
  E extends z.ZodTypeAny,
  C extends z.ZodTypeAny,
  U extends z.ZodTypeAny,
  Q extends z.ZodTypeAny,
>(spec: ResourceSpec<E, C, U, Q>): ResourceApiOf<E, C, U, Q> {
  const { basePath, entity } = spec;
  const itemPath = (id: string) => `${basePath}/${segment(id)}`;

  return {
    list: (filters, options) =>
      apiGetPage(basePath, entity, { ...options, query: filters }),
    get: (id, options) => apiGet(itemPath(id), entity, options),
    create: (body, options) =>
      apiPost(basePath, entity, validateRequest(spec.create, body), options),
    update: (id, body, options) =>
      apiPatch(itemPath(id), entity, validateRequest(spec.update, body), options),
    remove: (id, options) => apiDelete(itemPath(id), options),
  };
}

function withReorder<TApi extends ResourceApi<unknown, unknown, unknown, unknown>>(
  api: TApi,
  basePath: string,
): TApi & {
  reorder(
    body: ReorderBody,
    options?: RequestOptions,
  ): Promise<ReorderResult>;
} {
  return {
    ...api,
    reorder: (body, options) =>
      apiPost(
        `${basePath}/reorder`,
        reorderResultSchema,
        validateRequest(reorderBodySchema, body),
        options,
      ),
  };
}

function createSluggedResourceApi<
  E extends z.ZodTypeAny,
  C extends z.ZodTypeAny,
  U extends z.ZodTypeAny,
  Q extends z.ZodTypeAny,
>(
  spec: ResourceSpec<E, C, U, Q>,
): ResourceApiOf<E, C, U, Q> & {
  getBySlug(slug: string, options?: RequestOptions): Promise<z.output<E>>;
  checkSlugAvailable(
    slug: string,
    options?: RequestOptions & { excludeId?: string },
  ): Promise<SlugAvailabilityResult>;
} {
  return {
    ...createResourceApi(spec),
    getBySlug: (slug, options) =>
      apiGet(`${spec.basePath}/slug/${segment(slug)}`, spec.entity, options),
    checkSlugAvailable: (slug, options = {}) => {
      const { excludeId, ...request } = options;
      return apiGet(`${spec.basePath}/slug-available`, slugAvailabilitySchema, {
        ...request,
        query: { slug, ...(excludeId ? { excludeId } : {}) },
      });
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Resources (public read, admin write)                                      */
/* -------------------------------------------------------------------------- */

export const countriesApi = createSluggedResourceApi({
  basePath: "/countries",
  entity: countrySchema,
  create: countryCreateSchema,
  update: countryUpdateSchema,
  query: countryListQuerySchema,
});

export const universitiesApi = createSluggedResourceApi({
  basePath: "/universities",
  entity: universitySchema,
  create: universityCreateSchema,
  update: universityUpdateSchema,
  query: universityListQuerySchema,
});

export const programsApi = createSluggedResourceApi({
  basePath: "/programs",
  entity: programSchema,
  create: programCreateSchema,
  update: programUpdateSchema,
  query: programListQuerySchema,
});

export const servicesApi = withReorder(
  createSluggedResourceApi({
    basePath: "/services",
    entity: serviceSchema,
    create: serviceCreateSchema,
    update: serviceUpdateSchema,
    query: serviceListQuerySchema,
  }),
  "/services",
);

export const consultantsApi = withReorder(
  createResourceApi({
    basePath: "/consultants",
    entity: consultantSchema,
    create: consultantCreateSchema,
    update: consultantUpdateSchema,
    query: consultantListQuerySchema,
  }),
  "/consultants",
);

export const successStoriesApi = withReorder(
  createSluggedResourceApi({
    basePath: "/success-stories",
    entity: successStorySchema,
    create: successStoryCreateSchema,
    update: successStoryUpdateSchema,
    query: successStoryListQuerySchema,
  }),
  "/success-stories",
);

export const blogCategoriesApi = createSluggedResourceApi({
  basePath: "/blog-categories",
  entity: blogCategorySchema,
  create: blogCategoryCreateSchema,
  update: blogCategoryUpdateSchema,
  query: blogCategoryListQuerySchema,
});

export const blogPostsApi = createSluggedResourceApi({
  basePath: "/blog-posts",
  entity: blogPostSchema,
  create: blogPostCreateSchema,
  update: blogPostUpdateSchema,
  query: blogPostListQuerySchema,
});

export const newsApi = createSluggedResourceApi({
  basePath: "/news",
  entity: newsItemSchema,
  create: newsItemCreateSchema,
  update: newsItemUpdateSchema,
  query: newsListQuerySchema,
});

export const faqsApi = withReorder(
  createResourceApi({
    basePath: "/faqs",
    entity: faqSchema,
    create: faqCreateSchema,
    update: faqUpdateSchema,
    query: faqListQuerySchema,
  }),
  "/faqs",
);
