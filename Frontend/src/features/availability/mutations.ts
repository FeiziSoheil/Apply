"use client";

import type { z } from "zod";
import type {
  consultantAvailabilityUpsertSchema,
  globalHolidayCreateSchema,
  leaveCreateSchema,
  specialDayCreateSchema,
} from "@/contracts/availability";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { availabilityApi } from "./api";
import { availabilityKeys } from "./keys";
import { bookingKeys } from "@/features/bookings/keys";

type Availability = Awaited<ReturnType<typeof availabilityApi.get>>;
type Leave = Awaited<ReturnType<typeof availabilityApi.createLeave>>;
type SpecialDay = Awaited<ReturnType<typeof availabilityApi.createSpecialDay>>;
type Holiday = Awaited<ReturnType<typeof availabilityApi.createHoliday>>;
type Holidays = Awaited<ReturnType<typeof availabilityApi.listHolidays>>;

type UpsertVars = {
  consultantId: string;
  body: z.input<typeof consultantAvailabilityUpsertSchema>;
};

export function useUpsertAvailability(
  options?: ApiMutationOptions<Availability, UpsertVars>,
) {
  return useApiMutation({
    mutationFn: ({ consultantId, body }: UpsertVars) =>
      availabilityApi.upsert(consultantId, body),
    invalidates: (_data, { consultantId }) => [
      availabilityKeys.lists(),
      availabilityKeys.detail(consultantId),
      bookingKeys.allSlots(),
    ],
    options,
  });
}

type LeaveVars = {
  consultantId: string;
  body: z.input<typeof leaveCreateSchema>;
};

export function useCreateAvailabilityLeave(
  options?: ApiMutationOptions<Leave, LeaveVars>,
) {
  return useApiMutation({
    mutationFn: ({ consultantId, body }: LeaveVars) =>
      availabilityApi.createLeave(consultantId, body),
    invalidates: (_data, { consultantId }) => [
      availabilityKeys.detail(consultantId),
      availabilityKeys.lists(),
      bookingKeys.allSlots(),
    ],
    options,
  });
}

type DeleteLeaveVars = { consultantId: string; leaveId: string };

export function useDeleteAvailabilityLeave(
  options?: ApiMutationOptions<void, DeleteLeaveVars>,
) {
  return useApiMutation({
    mutationFn: ({ consultantId, leaveId }: DeleteLeaveVars) =>
      availabilityApi.deleteLeave(consultantId, leaveId),
    invalidates: (_data, { consultantId }) => [
      availabilityKeys.detail(consultantId),
      availabilityKeys.lists(),
      bookingKeys.allSlots(),
    ],
    options,
  });
}

type SpecialVars = {
  consultantId: string;
  body: z.input<typeof specialDayCreateSchema>;
};

export function useCreateAvailabilitySpecialDay(
  options?: ApiMutationOptions<SpecialDay, SpecialVars>,
) {
  return useApiMutation({
    mutationFn: ({ consultantId, body }: SpecialVars) =>
      availabilityApi.createSpecialDay(consultantId, body),
    invalidates: (_data, { consultantId }) => [
      availabilityKeys.detail(consultantId),
      availabilityKeys.lists(),
      bookingKeys.allSlots(),
    ],
    options,
  });
}

type DeleteSpecialVars = { consultantId: string; specialDayId: string };

export function useDeleteAvailabilitySpecialDay(
  options?: ApiMutationOptions<void, DeleteSpecialVars>,
) {
  return useApiMutation({
    mutationFn: ({ consultantId, specialDayId }: DeleteSpecialVars) =>
      availabilityApi.deleteSpecialDay(consultantId, specialDayId),
    invalidates: (_data, { consultantId }) => [
      availabilityKeys.detail(consultantId),
      availabilityKeys.lists(),
      bookingKeys.allSlots(),
    ],
    options,
  });
}

export function useCreateGlobalHoliday(
  options?: ApiMutationOptions<Holiday, z.input<typeof globalHolidayCreateSchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof globalHolidayCreateSchema>) =>
      availabilityApi.createHoliday(body),
    invalidates: () => [availabilityKeys.holidays(), bookingKeys.allSlots()],
    options,
  });
}

export function useDeleteGlobalHoliday(
  options?: ApiMutationOptions<void, string>,
) {
  return useApiMutation({
    mutationFn: (id: string) => availabilityApi.deleteHoliday(id),
    invalidates: () => [availabilityKeys.holidays(), bookingKeys.allSlots()],
    options,
  });
}

export function useReplaceGlobalHolidays(
  options?: ApiMutationOptions<
    Holidays,
    { holidays: z.input<typeof globalHolidayCreateSchema>[] }
  >,
) {
  return useApiMutation({
    mutationFn: (body: { holidays: z.input<typeof globalHolidayCreateSchema>[] }) =>
      availabilityApi.replaceHolidays(body),
    invalidates: () => [availabilityKeys.holidays(), bookingKeys.allSlots()],
    options,
  });
}
