"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Copy, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PipelineStage, Tag } from "@/contracts/crm";
import type { Lead } from "@/contracts/leads";
import {
  formatJalaliDate,
  formatRelativeFa,
  toPersianDigits,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  LEAD_PRIORITY_MAP,
  LEAD_SOURCE_LABELS,
  leadStageTone,
} from "./lead-labels";

export type LeadColumnContext = {
  stagesById: Map<string, PipelineStage>;
  tagsById: Map<string, Tag>;
  consultantName: (id: string | null) => string;
  countryName: (slug: string) => string;
  onOpenLead: (lead: Lead) => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`;
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} کپی شد`);
  } catch {
    toast.error("کپی انجام نشد");
  }
}

export function createLeadColumns(
  ctx: LeadColumnContext,
): ColumnDef<Lead, unknown>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: "نام و موبایل",
      enableSorting: false,
      enableHiding: false,
      meta: { mobile: "title", label: "نام و موبایل" },
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex min-w-44 flex-col gap-1">
            <button
              type="button"
              className="text-start font-medium text-foreground hover:underline"
              onClick={() => ctx.onOpenLead(lead)}
            >
              {lead.name}
            </button>
            <div className="flex flex-wrap items-center gap-1">
              <span dir="ltr" className="text-muted-foreground tabular-nums text-xs">
                {toPersianDigits(lead.mobile)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label="کپی موبایل"
                onClick={() => void copyText(lead.mobile, "موبایل")}
              >
                <Copy aria-hidden className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label="تماس"
                asChild
              >
                <a href={`tel:${lead.mobile}`}>
                  <Phone aria-hidden className="size-3.5" />
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label="واتساپ"
                asChild
              >
                <a
                  href={`https://wa.me/98${lead.mobile.replace(/^0/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle aria-hidden className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        );
      },
    },
    {
      id: "countries",
      header: "کشورها",
      enableSorting: false,
      meta: { label: "کشورهای هدف", mobile: "hidden" },
      cell: ({ row }) => {
        const slugs =
          row.original.targetCountries.length > 0
            ? row.original.targetCountries
            : row.original.interestCountry
              ? [row.original.interestCountry]
              : [];
        if (slugs.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {slugs.slice(0, 3).map((slug) => (
              <Badge key={slug} variant="secondary" className="font-normal">
                {ctx.countryName(slug)}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "stageId",
      accessorKey: "stageId",
      header: "مرحله",
      enableSorting: true,
      meta: { label: "مرحله" },
      cell: ({ row }) => {
        const stage = ctx.stagesById.get(row.original.stageId);
        const label = stage?.title ?? row.original.stageKind;
        const tone = leadStageTone(stage?.color, row.original.stageKind);
        return <StatusBadge status={row.original.stageKind} map={{
          [row.original.stageKind]: { label, tone },
        }} />;
      },
    },
    {
      id: "assignedTo",
      header: "مسئول",
      enableSorting: false,
      meta: { label: "مسئول" },
      cell: ({ row }) => {
        const name = ctx.consultantName(row.original.assignedTo);
        if (!row.original.assignedTo) {
          return (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              بدون مسئول
            </Badge>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="text-[0.65rem]">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{name}</span>
          </div>
        );
      },
    },
    {
      id: "source",
      accessorKey: "source",
      header: "منبع",
      enableSorting: false,
      meta: { label: "منبع", mobile: "hidden" },
      cell: ({ row }) => LEAD_SOURCE_LABELS[row.original.source],
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: "اولویت",
      enableSorting: true,
      meta: { label: "اولویت", mobile: "hidden" },
      cell: ({ row }) => (
        <StatusBadge status={row.original.priority} map={LEAD_PRIORITY_MAP} />
      ),
    },
    {
      id: "tags",
      header: "تگ‌ها",
      enableSorting: false,
      meta: { label: "تگ‌ها", mobile: "hidden" },
      cell: ({ row }) => {
        if (row.original.tagIds.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex max-w-40 flex-wrap gap-1">
            {row.original.tagIds.slice(0, 3).map((id) => {
              const tag = ctx.tagsById.get(id);
              return (
                <Badge key={id} variant="outline" className="font-normal">
                  {tag?.title ?? "تگ"}
                </Badge>
              );
            })}
          </div>
        );
      },
    },
    {
      id: "lastActivityAt",
      accessorKey: "lastActivityAt",
      header: "آخرین فعالیت",
      enableSorting: true,
      meta: { label: "آخرین فعالیت", mobile: "hidden" },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {formatRelativeFa(row.original.lastActivityAt)}
        </span>
      ),
    },
    {
      id: "nextFollowUpAt",
      accessorKey: "nextFollowUpAt",
      header: "پیگیری بعدی",
      enableSorting: true,
      meta: { label: "پیگیری بعدی" },
      cell: ({ row }) => {
        const value = row.original.nextFollowUpAt;
        if (!value) return <span className="text-muted-foreground">—</span>;
        const overdue = new Date(value).getTime() < Date.now();
        return (
          <span
            className={cn(
              "text-sm tabular-nums",
              overdue ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            {formatJalaliDate(value, "d MMMM yyyy")}
          </span>
        );
      },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "ایجاد",
      enableSorting: true,
      meta: { label: "تاریخ ایجاد", mobile: "hidden" },
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">
          {formatJalaliDate(row.original.createdAt, "d MMMM yyyy")}
        </span>
      ),
    },
  ];
}
