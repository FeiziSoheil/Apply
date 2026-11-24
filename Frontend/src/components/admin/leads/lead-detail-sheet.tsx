"use client";

import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PipelineStage, Tag } from "@/contracts/crm";
import type { Lead } from "@/contracts/leads";
import { useLead } from "@/features/leads/queries";
import {
  formatJalaliDate,
  formatRelativeFa,
  toPersianDigits,
} from "@/lib/format";
import { LEAD_PRIORITY_MAP, LEAD_SOURCE_LABELS, leadStageTone } from "./lead-labels";

type LeadDetailSheetProps = {
  leadId: string | null;
  stagesById: Map<string, PipelineStage>;
  tagsById: Map<string, Tag>;
  consultantName: (id: string | null) => string;
  countryName: (slug: string) => string;
  onOpenChange: (open: boolean) => void;
};

export function LeadDetailSheet({
  leadId,
  stagesById,
  tagsById,
  consultantName,
  countryName,
  onOpenChange,
}: LeadDetailSheetProps) {
  const query = useLead(leadId ?? "", { enabled: Boolean(leadId) });
  const lead = query.data;

  return (
    <Sheet open={leadId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md" side="start">
        <SheetHeader>
          <SheetTitle>{lead?.name ?? "جزئیات لید"}</SheetTitle>
          <SheetDescription>
            فیلترهای فهرست هنگام بازگشت حفظ می‌شوند.
          </SheetDescription>
        </SheetHeader>
        {query.isPending ? (
          <p className="text-muted-foreground px-4 text-sm">در حال بارگذاری…</p>
        ) : query.error ? (
          <p className="text-destructive px-4 text-sm">بارگذاری لید ناموفق بود.</p>
        ) : lead ? (
          <LeadSummary
            lead={lead}
            stagesById={stagesById}
            tagsById={tagsById}
            consultantName={consultantName}
            countryName={countryName}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function LeadSummary({
  lead,
  stagesById,
  tagsById,
  consultantName,
  countryName,
}: {
  lead: Lead;
  stagesById: Map<string, PipelineStage>;
  tagsById: Map<string, Tag>;
  consultantName: (id: string | null) => string;
  countryName: (slug: string) => string;
}) {
  const stage = stagesById.get(lead.stageId);
  const countries =
    lead.targetCountries.length > 0
      ? lead.targetCountries
      : lead.interestCountry
        ? [lead.interestCountry]
        : [];

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          status={lead.stageKind}
          map={{
            [lead.stageKind]: {
              label: stage?.title ?? lead.stageKind,
              tone: leadStageTone(stage?.color, lead.stageKind),
            },
          }}
        />
        <StatusBadge status={lead.priority} map={LEAD_PRIORITY_MAP} />
        <Badge variant="outline">{LEAD_SOURCE_LABELS[lead.source]}</Badge>
      </div>
      <dl className="grid gap-3">
        <div>
          <dt className="text-muted-foreground text-xs">موبایل</dt>
          <dd dir="ltr" className="tabular-nums">
            {toPersianDigits(lead.mobile)}
          </dd>
        </div>
        {lead.email ? (
          <div>
            <dt className="text-muted-foreground text-xs">ایمیل</dt>
            <dd dir="ltr">{lead.email}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted-foreground text-xs">مسئول</dt>
          <dd>{consultantName(lead.assignedTo)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">کشورهای هدف</dt>
          <dd>
            {countries.length > 0
              ? countries.map(countryName).join("، ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">تگ‌ها</dt>
          <dd className="flex flex-wrap gap-1">
            {lead.tagIds.length === 0
              ? "—"
              : lead.tagIds.map((id) => (
                  <Badge key={id} variant="outline" className="font-normal">
                    {tagsById.get(id)?.title ?? "تگ"}
                  </Badge>
                ))}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">آخرین فعالیت</dt>
          <dd>{formatRelativeFa(lead.lastActivityAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">پیگیری بعدی</dt>
          <dd>
            {lead.nextFollowUpAt
              ? formatJalaliDate(lead.nextFollowUpAt, "d MMMM yyyy")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">ایجاد</dt>
          <dd>{formatJalaliDate(lead.createdAt, "d MMMM yyyy")}</dd>
        </div>
        {lead.message ? (
          <div>
            <dt className="text-muted-foreground text-xs">یادداشت</dt>
            <dd className="whitespace-pre-wrap">{lead.message}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
