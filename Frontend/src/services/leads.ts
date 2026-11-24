/**
 * Lead submissions go through `src/features/leads` and bookings through
 * `src/features/bookings` (`GET /bookings/slots` for availability).
 *
 * @deprecated Prefer `useBookingSlots` / `bookingsApi.listSlots`. Kept for
 * any leftover static consumers.
 */

export type TimeSlot = {
  id: string;
  label: string;
  /** "HH:mm" 24h (Tehran time) */
  value: string;
};

const TIME_SLOTS: TimeSlot[] = [
  { id: "slot-09", label: "۰۹:۰۰", value: "09:00" },
  { id: "slot-10", label: "۱۰:۰۰", value: "10:00" },
  { id: "slot-11", label: "۱۱:۰۰", value: "11:00" },
  { id: "slot-12", label: "۱۲:۰۰", value: "12:00" },
  { id: "slot-14", label: "۱۴:۰۰", value: "14:00" },
  { id: "slot-15", label: "۱۵:۰۰", value: "15:00" },
  { id: "slot-16", label: "۱۶:۰۰", value: "16:00" },
  { id: "slot-17", label: "۱۷:۰۰", value: "17:00" },
];

export async function getTimeSlots(): Promise<TimeSlot[]> {
  return TIME_SLOTS;
}
