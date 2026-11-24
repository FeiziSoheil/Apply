"use client";

import Link from "next/link";
import type { CaseTemplate } from "@/contracts/crm";
import { Badge } from "@/components/ui/badge";
import { toPersianDigits } from "@/lib/format";

type CaseTemplateCardProps = {
  template: CaseTemplate | null | undefined;
  loading?: boolean;
};

/** Display-only template summary; edit in CRM settings. */
export function CaseTemplateCard({ template, loading }: CaseTemplateCardProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">در حال بارگذاری قالب…</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <h3 className="text-sm font-semibold">قالب این پرونده</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          قالبی به این پرونده متصل نیست.
        </p>
      </div>
    );
  }

  const stages = [...template.stages].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-card space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">قالب این پرونده</h3>
          <p className="text-muted-foreground text-sm">{template.title}</p>
        </div>
        <Badge variant="outline" dir="ltr">
          {template.countrySlug ?? "عمومی"}
        </Badge>
      </div>
      <ul className="space-y-3">
        {stages.map((stage) => (
          <li key={stage.key} className="space-y-1.5">
            <p className="text-sm font-medium">
              {toPersianDigits(stage.order + 1)}. {stage.title}
            </p>
            {stage.requiredDocuments.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                مدارک:{" "}
                {stage.requiredDocuments
                  .map((doc) => `${doc.title}${doc.required ? "" : " (اختیاری)"}`)
                  .join("، ")}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">بدون مدرک الزامی</p>
            )}
            {stage.defaultTasks.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                وظایف پیش‌فرض:{" "}
                {stage.defaultTasks
                  .map(
                    (task) =>
                      `${task.title} (+${toPersianDigits(task.dueOffsetDays)} روز)`,
                  )
                  .join("، ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">
        برای ویرایش به{" "}
        <Link
          href="/admin/settings/crm?tab=caseTemplates"
          className="underline"
        >
          تنظیمات CRM
        </Link>{" "}
        بروید.
      </p>
    </div>
  );
}
