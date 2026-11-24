import {
  announcementCreateSchema,
  announcementListQuerySchema,
  announcementSchema,
  announcementUpdateSchema,
  type Announcement,
  type AnnouncementCreate,
  type AnnouncementListQuery,
  type AnnouncementUpdate,
} from "@/contracts/student-panel";
import {
  apiDelete,
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
  segment,
  type Paginated,
  type RequestOptions,
} from "@/lib/api/client";
import type { ListFilters } from "@/lib/api/types";
import { validateRequest } from "@/lib/api/validate";

export type AnnouncementListFilters = ListFilters<typeof announcementListQuerySchema>;

const BASE = "/announcements";

export const announcementsApi = {
  list(
    filters?: AnnouncementListFilters,
    options?: RequestOptions,
  ): Promise<Paginated<Announcement>> {
    return apiGetPage(BASE, announcementSchema, { ...options, query: filters });
  },

  get(id: string, options?: RequestOptions): Promise<Announcement> {
    return apiGet(`${BASE}/${segment(id)}`, announcementSchema, options);
  },

  create(body: AnnouncementCreate, options?: RequestOptions): Promise<Announcement> {
    return apiPost(
      BASE,
      announcementSchema,
      validateRequest(announcementCreateSchema, body),
      options,
    );
  },

  update(
    id: string,
    body: AnnouncementUpdate,
    options?: RequestOptions,
  ): Promise<Announcement> {
    return apiPatch(
      `${BASE}/${segment(id)}`,
      announcementSchema,
      validateRequest(announcementUpdateSchema, body),
      options,
    );
  },

  remove(id: string, options?: RequestOptions): Promise<void> {
    return apiDelete(`${BASE}/${segment(id)}`, options);
  },
};

export type { Announcement, AnnouncementCreate, AnnouncementUpdate, AnnouncementListQuery };
