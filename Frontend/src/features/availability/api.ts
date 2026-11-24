import { z } from "zod";
import {
  consultantAvailabilitySchema,
  consultantAvailabilityUpsertSchema,
  globalHolidayCreateSchema,
  globalHolidaySchema,
  globalHolidaysReplaceSchema,
  leaveCreateSchema,
  leaveExceptionSchema,
  specialDayCreateSchema,
  specialDayExceptionSchema,
} from "@/contracts/availability";
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  segment,
  type RequestOptions,
} from "@/lib/api/client";
import { validateRequest } from "@/lib/api/validate";

const availabilityListSchema = z.array(consultantAvailabilitySchema);
const holidayListSchema = z.array(globalHolidaySchema);

const availabilityPath = (consultantId: string) =>
  `/availability/${segment(consultantId)}`;

export const availabilityApi = {
  list(options?: RequestOptions) {
    return apiGet("/availability", availabilityListSchema, options);
  },

  get(consultantId: string, options?: RequestOptions) {
    return apiGet(
      availabilityPath(consultantId),
      consultantAvailabilitySchema,
      options,
    );
  },

  upsert(
    consultantId: string,
    body: z.input<typeof consultantAvailabilityUpsertSchema>,
    options?: RequestOptions,
  ) {
    return apiPut(
      availabilityPath(consultantId),
      consultantAvailabilitySchema,
      validateRequest(consultantAvailabilityUpsertSchema, body),
      options,
    );
  },

  createLeave(
    consultantId: string,
    body: z.input<typeof leaveCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${availabilityPath(consultantId)}/leaves`,
      leaveExceptionSchema,
      validateRequest(leaveCreateSchema, body),
      options,
    );
  },

  deleteLeave(consultantId: string, leaveId: string, options?: RequestOptions) {
    return apiDelete(
      `${availabilityPath(consultantId)}/leaves/${segment(leaveId)}`,
      options,
    );
  },

  createSpecialDay(
    consultantId: string,
    body: z.input<typeof specialDayCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${availabilityPath(consultantId)}/special-days`,
      specialDayExceptionSchema,
      validateRequest(specialDayCreateSchema, body),
      options,
    );
  },

  deleteSpecialDay(
    consultantId: string,
    specialDayId: string,
    options?: RequestOptions,
  ) {
    return apiDelete(
      `${availabilityPath(consultantId)}/special-days/${segment(specialDayId)}`,
      options,
    );
  },

  listHolidays(options?: RequestOptions) {
    return apiGet("/availability/holidays", holidayListSchema, options);
  },

  replaceHolidays(
    body: z.input<typeof globalHolidaysReplaceSchema>,
    options?: RequestOptions,
  ) {
    return apiPut(
      "/availability/holidays",
      holidayListSchema,
      validateRequest(globalHolidaysReplaceSchema, body),
      options,
    );
  },

  createHoliday(
    body: z.input<typeof globalHolidayCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/availability/holidays",
      globalHolidaySchema,
      validateRequest(globalHolidayCreateSchema, body),
      options,
    );
  },

  deleteHoliday(id: string, options?: RequestOptions) {
    return apiDelete(`/availability/holidays/${segment(id)}`, options);
  },
};
