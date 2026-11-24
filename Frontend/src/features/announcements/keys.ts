import { createEntityKeys } from "@/lib/api/query-keys";
import type { AnnouncementListFilters } from "./api";

export const announcementKeys =
  createEntityKeys<Partial<AnnouncementListFilters>>(["announcements"]);
