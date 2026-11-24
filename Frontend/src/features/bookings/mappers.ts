import type { z } from "zod";
import type { bookingCreateSchema } from "@/contracts/bookings";
import { idSchema } from "@/contracts/common";
import type { BookingFormValues } from "@/lib/validations/booking";
import { toNormalizedMobile } from "@/lib/validations/common";

/**
 * Map public form values to `BookingCreate`.
 * `timeSlot` is the UTC ISO `startsAt` returned by `GET /bookings/slots`.
 */
export function toBookingRequest(
  values: BookingFormValues,
): z.input<typeof bookingCreateSchema> {
  const consultantId =
    values.consultantId && values.consultantId !== "none"
      ? values.consultantId
      : undefined;

  return {
    consultationType: values.consultationType,
    startsAt: values.timeSlot,
    name: values.name,
    mobile: toNormalizedMobile(values.mobile),
    notes: values.notes?.trim() || undefined,
    consultantId:
      consultantId && idSchema.safeParse(consultantId).success
        ? consultantId
        : undefined,
  };
}
