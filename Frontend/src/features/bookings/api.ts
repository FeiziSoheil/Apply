import { z } from "zod";
import {
  bookingCancelSchema,
  bookingChangeSchema,
  bookingCreateSchema,
  bookingListQuerySchema,
  bookingPatchSchema,
  bookingReceiptSchema,
  bookingSchema,
  bookingStaffCreateSchema,
  bookingStatusUpdateSchema,
  slotsQuerySchema,
  timeSlotSchema,
} from "@/contracts/bookings";
import {
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
  segment,
  type RequestOptions,
} from "@/lib/api/client";
import type { ListFilters } from "@/lib/api/types";
import { validateRequest } from "@/lib/api/validate";

export type BookingListFilters = ListFilters<typeof bookingListQuerySchema>;
export type SlotsParams = z.input<typeof slotsQuerySchema>;

const bookingPath = (id: string) => `/bookings/${segment(id)}`;
const slotsSchema = z.array(timeSlotSchema);
const historySchema = z.array(bookingChangeSchema);

export const bookingsApi = {
  /** Slots of one day (Tehran time); public */
  listSlots(params: SlotsParams, options?: RequestOptions) {
    return apiGet("/bookings/slots", slotsSchema, {
      skipAuthRedirect: true,
      ...options,
      query: params,
    });
  },

  /** Book a consultation — works for guests and logged-in users */
  create(body: z.input<typeof bookingCreateSchema>, options?: RequestOptions) {
    return apiPost(
      "/bookings",
      bookingReceiptSchema,
      validateRequest(bookingCreateSchema, body),
      { skipAuthRedirect: true, ...options },
    );
  },

  /** Manual create from admin calendar / drawer */
  createStaff(
    body: z.input<typeof bookingStaffCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/bookings/staff",
      bookingSchema,
      validateRequest(bookingStaffCreateSchema, body),
      options,
    );
  },

  list(filters?: BookingListFilters, options?: RequestOptions) {
    return apiGetPage("/bookings", bookingSchema, { ...options, query: filters });
  },

  /** Bookings of the logged-in student */
  listMine(filters?: BookingListFilters, options?: RequestOptions) {
    return apiGetPage("/me/bookings", bookingSchema, { ...options, query: filters });
  },

  get(id: string, options?: RequestOptions) {
    return apiGet(bookingPath(id), bookingSchema, options);
  },

  history(id: string, options?: RequestOptions) {
    return apiGet(`${bookingPath(id)}/history`, historySchema, options);
  },

  cancel(
    id: string,
    body: z.input<typeof bookingCancelSchema> = {},
    options?: RequestOptions,
  ) {
    return apiPost(
      `${bookingPath(id)}/cancel`,
      bookingSchema,
      validateRequest(bookingCancelSchema, body),
      options,
    );
  },

  /** Staff: confirm / complete / cancel / mark no-show */
  updateStatus(
    id: string,
    body: z.input<typeof bookingStatusUpdateSchema>,
    options?: RequestOptions,
  ) {
    return apiPatch(
      `${bookingPath(id)}/status`,
      bookingSchema,
      validateRequest(bookingStatusUpdateSchema, body),
      options,
    );
  },

  patch(
    id: string,
    body: z.input<typeof bookingPatchSchema>,
    options?: RequestOptions,
  ) {
    return apiPatch(
      bookingPath(id),
      bookingSchema,
      validateRequest(bookingPatchSchema, body),
      options,
    );
  },

  remind(id: string, options?: RequestOptions) {
    return apiPost(`${bookingPath(id)}/remind`, bookingSchema, {}, options);
  },
};
