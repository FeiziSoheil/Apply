import type { Metadata } from "next";
import { StudentAppointmentsView } from "@/components/panel/student/appointments/student-appointments-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "رزروها و جلسات مشاوره",
  description: "جلسات مشاوره رزرو‌شده.",
  path: "/panel/bookings",
  noIndex: true,
});

export default function PanelBookingsPage() {
  return <StudentAppointmentsView />;
}
