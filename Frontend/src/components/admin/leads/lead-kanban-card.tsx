"use client";

import { useState, type ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Lead } from "@/contracts/leads";
import { formatJalaliDate, formatRelativeFa, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LEAD_PRIORITY_MAP, LEAD_SOURCE_LABELS } from "./lead-labels";

type LeadKanbanCardProps = {
  lead: Lead;
  consultantName: (id: string | null) => string;
  countryName: (slug: string) => string;
  tagTitles: (ids: readonly string[]) => string[];
  onOpen?: () => void;
  moveMenu?: ReactNode;
  dragging?: boolean;
};

const STALE_MS = 3 * 86_400_000;

export function LeadKanbanCard({
  lead,
  consultantName,
  countryName,
  tagTitles,
  onOpen,
  moveMenu,
  dragging,
}: LeadKanbanCardProps) {
  const [nowMs] = useState(() => Date.now());
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
      data: { lead },
      disabled: dragging,
    });

  const country =
    lead.targetCountries[0] ?? lead.interestCountry ?? null;
  const overdue =
    lead.nextFollowUpAt !== null &&
    new Date(lead.nextFollowUpAt).getTime() < nowMs;
  const stale =
    nowMs - new Date(lead.lastActivityAt).getTime() > STALE_MS;
  const tags = tagTitles(lead.tagIds).slice(0, 2);

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
      }}
      className={cn(
        "bg-card touch-none rounded-lg border p-2.5 shadow-xs",
        (isDragging || dragging) && "opacity-60",
        stale && "border-warning/60",
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-1">
        <button
          type="button"
          className="text-start text-sm font-medium hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onOpen?.();
          }}
        >
          {lead.name}
        </button>
        {moveMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 shrink-0"
                aria-label="انتقال به مرحله"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <MoreHorizontal aria-hidden className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onPointerDown={(event) => event.stopPropagation()}
            >
              {moveMenu}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <p dir="ltr" className="text-muted-foreground mt-0.5 text-xs tabular-nums">
        {toPersianDigits(lead.mobile)}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {country ? (
          <Badge variant="secondary" className="font-normal">
            {countryName(country)}
          </Badge>
        ) : null}
        <Badge variant="outline" className="font-normal">
          {LEAD_PRIORITY_MAP[lead.priority].label}
        </Badge>
        <Badge variant="outline" className="font-normal">
          {LEAD_SOURCE_LABELS[lead.source]}
        </Badge>
        {tags.map((title) => (
          <Badge key={title} variant="outline" className="font-normal">
            {title}
          </Badge>
        ))}
      </div>
      <div className="text-muted-foreground mt-2 flex flex-col gap-0.5 text-[0.7rem]">
        <span>مسئول: {consultantName(lead.assignedTo)}</span>
        {lead.nextFollowUpAt ? (
          <span className={cn(overdue && "font-medium text-destructive")}>
            پیگیری: {formatJalaliDate(lead.nextFollowUpAt, "d MMM")}
          </span>
        ) : null}
        <span className={cn(stale && "text-warning-foreground")}>
          فعالیت: {formatRelativeFa(lead.lastActivityAt)}
          {stale ? " · قدیمی" : ""}
        </span>
      </div>
    </article>
  );
}
