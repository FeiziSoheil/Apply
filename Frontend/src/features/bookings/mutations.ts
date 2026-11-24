"use client";

import type { z } from "zod";
import type {
  bookingCancelSchema,
  bookingCreateSchema,
  bookingPatchSchema,
  bookingStaffCreateSchema,
  bookingStatusUpdateSchema,
} from "@/contracts/bookings";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { bookingsApi } from "./api";
import { bookingKeys } from "./keys";

type BookingReceipt = Awaited<ReturnType<typeof bookingsApi.create>>;
type Booking = Awaited<ReturnType<typeof bookingsApi.get>>;

/** The booked slot is no longer free, so slot lists are invalidated too */
export function useCreateBooking(
  options?: ApiMutationOptions<BookingReceipt, z.input<typeof bookingCreateSchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof bookingCreateSchema>) =>
      bookingsApi.create(body),
    invalidates: () => [bookingKeys.lists(), bookingKeys.allSlots(), bookingKeys.mine()],
    options,
  });
}

export function useCreateStaffBooking(
  options?: ApiMutationOptions<Booking, z.input<typeof bookingStaffCreateSchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof bookingStaffCreateSchema>) =>
      bookingsApi.createStaff(body),
    invalidates: () => [bookingKeys.lists(), bookingKeys.allSlots()],
    options,
  });
}

type CancelBookingVariables = {
  id: string;
  body?: z.input<typeof bookingCancelSchema>;
};

export function useCancelBooking(
  options?: ApiMutationOptions<Booking, CancelBookingVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: CancelBookingVariables) =>
      bookingsApi.cancel(id, body),
    invalidates: (_data, { id }) => [
      bookingKeys.all,
      bookingKeys.detail(id),
      bookingKeys.history(id),
      bookingKeys.allSlots(),
    ],
    options,
  });
}

type UpdateBookingStatusVariables = {
  id: string;
  body: z.input<typeof bookingStatusUpdateSchema>;
};

export function useUpdateBookingStatus(
  options?: ApiMutationOptions<Booking, UpdateBookingStatusVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: UpdateBookingStatusVariables) =>
      bookingsApi.updateStatus(id, body),
    invalidates: (_data, { id }) => [
      bookingKeys.all,
      bookingKeys.detail(id),
      bookingKeys.history(id),
    ],
    options,
  });
}

type PatchBookingVariables = {
  id: string;
  body: z.input<typeof bookingPatchSchema>;
};

export function usePatchBooking(
  options?: ApiMutationOptions<Booking, PatchBookingVariables>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: PatchBookingVariables) =>
      bookingsApi.patch(id, body),
    invalidates: (_data, { id }) => [
      bookingKeys.all,
      bookingKeys.detail(id),
      bookingKeys.history(id),
      bookingKeys.allSlots(),
    ],
    options,
  });
}

export function useSendBookingReminder(
  options?: ApiMutationOptions<Booking, string>,
) {
  return useApiMutation({
    mutationFn: (id: string) => bookingsApi.remind(id),
    invalidates: (_data, id) => [bookingKeys.detail(id), bookingKeys.history(id)],
    options,
  });
}
