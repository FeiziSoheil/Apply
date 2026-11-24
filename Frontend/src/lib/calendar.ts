import type { Booking } from "@/contracts/bookings";

/**
 * Formats an ISO date string into iCalendar UTC format: YYYYMMDDTHHMMSSZ
 */
function toIcsUtc(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generates RFC 5545 iCalendar format text (.ics)
 */
export function generateIcsContent(
  booking: Booking,
  consultantName?: string,
  locationInfo?: { meetingUrl?: string; address?: string },
): string {
  const nowUtc = toIcsUtc(new Date().toISOString());
  const startUtc = toIcsUtc(booking.startsAt);
  const endUtc = toIcsUtc(booking.endsAt);

  const consultant = consultantName || "مشاور تحصیلی";
  const isOnline = booking.consultationType === "online";
  const location = isOnline
    ? locationInfo?.meetingUrl || `https://meet.apply.ir/c/${booking.code}`
    : locationInfo?.address || "دفتر موسسه اعزام دانشجو";

  const description = [
    `جلسه مشاوره مهاجرت تحصیلی`,
    `کد پیگیری: ${booking.code}`,
    `مشاور: ${consultant}`,
    `نوع مشاوره: ${isOnline ? "آنلاین" : "حضوری"}`,
    isOnline ? `لینک جلسه: ${location}` : `آدرس: ${location}`,
    booking.notes ? `یادداشت دانشجو: ${booking.notes}` : "",
  ]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Apply//Consultation Booking//FA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:booking-${booking.id}@apply.ir`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:جلسه مشاوره تحصیلی - ${consultant}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Triggers browser download of a .ics calendar file
 */
export function downloadIcsFile(
  booking: Booking,
  consultantName?: string,
  locationInfo?: { meetingUrl?: string; address?: string },
): void {
  const icsText = generateIcsContent(booking, consultantName, locationInfo);
  const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `appointment-${booking.code}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
