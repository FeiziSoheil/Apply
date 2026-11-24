import type { Metadata } from "next";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { FinanceManager } from "@/components/admin/finance/finance-manager";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "مالی",
  description: "فاکتورها، اقساط و وضعیت پرداخت‌ها.",
  path: "/admin/finance",
  noIndex: true,
});

export default function AdminFinancePage() {
  return (
    <AdminResourcePage permission="payment:read" areaLabel="مالی">
      <FinanceManager />
    </AdminResourcePage>
  );
}
