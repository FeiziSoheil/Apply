import type { Metadata } from "next";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { TasksManager } from "@/components/admin/tasks/tasks-manager";
import { createPageMetadata } from "@/lib/seo";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "کارهای من",
  description: "فهرست، تقویم و یادآور کارهای CRM.",
  path: "/admin/tasks",
  noIndex: true,
});

export default function AdminTasksPage() {
  return (
    <AdminResourcePage permission="task:read" areaLabel="کارها">
      <TasksManager />
    </AdminResourcePage>
  );
}
