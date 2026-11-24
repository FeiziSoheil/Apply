import type { Metadata } from "next";
import { StudentPaymentsView } from "@/components/panel/student/section-simple-view";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "پرداخت‌ها",
  description: "خلاصه اقساط و پرداخت‌های شما.",
  path: "/panel/payments",
  noIndex: true,
});

export default function PanelPaymentsPage() {
  return <StudentPaymentsView />;
}
