"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  CheckSquare,
  MessageCircle,
  MessageSquare,
  Phone,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/status-badge";
import { Can } from "@/components/rbac/can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PipelineStage, Tag } from "@/contracts/crm";
import type { Lead, LeadPriority } from "@/contracts/leads";
import { useAssignLead, useUpdateLead, useUpdateLeadStage } from "@/features/leads/mutations";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import { toPersianDigits } from "@/lib/format";
import { LEAD_PRIORITY_MAP, leadStageTone } from "./lead-labels";
import { LostReasonDialog } from "./lost-reason-dialog";

type ConsultantOption = { value: string; label: string };

type LeadDetailHeaderProps = {
  lead: Lead;
  version: number;
  stages: readonly PipelineStage[];
  tagsById: Map<string, Tag>;
  consultants: readonly ConsultantOption[];
  duplicateCount: number;
  onVersionMismatch: (currentVersion?: number) => void;
  onLeadUpdated: (lead: Lead) => void;
  onConvert: () => void;
  onCreateTask: () => void;
  onCreateBooking: () => void;
  onSendMessage: () => void;
};

export function LeadDetailHeader({
  lead,
  version,
  stages,
  tagsById,
  consultants,
  duplicateCount,
  onVersionMismatch,
  onLeadUpdated,
  onConvert,
  onCreateTask,
  onCreateBooking,
  onSendMessage,
}: LeadDetailHeaderProps) {
  const updateStage = useUpdateLeadStage();
  const assignLead = useAssignLead();
  const updateLead = useUpdateLead();
  const [lostPending, setLostPending] = useState<PipelineStage | null>(null);

  const stage = stages.find((item) => item.id === lead.stageId);

  function handleStageError(error: unknown) {
    if (error instanceof ApiError && error.isVersionMismatch) {
      onVersionMismatch(error.currentVersion);
      return;
    }
    toast.error(getApiErrorMessage(error));
  }

  function moveToStage(target: PipelineStage, lostReasonId?: string) {
    updateStage.mutate(
      {
        id: lead.id,
        version,
        body: { stageId: target.id, lostReasonId },
      },
      {
        onSuccess: (updated) => {
          toast.success(`به «${target.title}» منتقل شد`);
          onLeadUpdated(updated);
          if (target.kind === "won") {
            toast.message("می‌توانید پرونده بسازید", {
              action: { label: "تبدیل", onClick: onConvert },
            });
          }
        },
        onError: handleStageError,
      },
    );
  }

  return (
    <header className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{lead.name}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-md">
                  <StatusBadge
                    status={lead.stageKind}
                    map={{
                      [lead.stageKind]: {
                        label: stage?.title ?? lead.stageKind,
                        tone: leadStageTone(stage?.color, lead.stageKind),
                      },
                    }}
                  />
                </button>
              </DropdownMenuTrigger>
              <Can permission="lead:write">
                <DropdownMenuContent align="start">
                  {stages
                    .filter((item) => item.id !== lead.stageId)
                    .map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onSelect={() => {
                          if (item.kind === "lost") {
                            setLostPending(item);
                            return;
                          }
                          moveToStage(item);
                        }}
                      >
                        {item.title}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </Can>
            </DropdownMenu>
            <StatusBadge status={lead.priority} map={LEAD_PRIORITY_MAP} />
            {duplicateCount > 0 ? (
              <Badge variant="destructive" className="font-normal">
                {toPersianDigits(duplicateCount)} لید تکراری
              </Badge>
            ) : null}
          </div>
          <p dir="ltr" className="text-muted-foreground text-sm tabular-nums">
            {toPersianDigits(lead.mobile)}
          </p>
          <div className="flex flex-wrap gap-1">
            {lead.tagIds.map((id) => (
              <Badge key={id} variant="outline" className="font-normal">
                {tagsById.get(id)?.title ?? "تگ"}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Can permission="lead:assign">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <UserRoundPlus data-icon="inline-start" aria-hidden />
                  {lead.assignedTo
                    ? consultants.find((item) => item.value === lead.assignedTo)
                        ?.label ?? "مسئول"
                    : "بدون مسئول"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    assignLead.mutate(
                      { id: lead.id, body: { assigneeId: null }, version },
                      {
                        onSuccess: onLeadUpdated,
                        onError: handleStageError,
                      },
                    );
                  }}
                >
                  بدون مسئول
                </DropdownMenuItem>
                {consultants.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    onSelect={() => {
                      assignLead.mutate(
                        {
                          id: lead.id,
                          body: { assigneeId: item.value },
                          version,
                        },
                        {
                          onSuccess: (updated) => {
                            toast.success("تخصیص به‌روز شد");
                            onLeadUpdated(updated);
                          },
                          onError: handleStageError,
                        },
                      );
                    }}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Can>
          <Can permission="lead:write">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  اولویت
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(LEAD_PRIORITY_MAP) as LeadPriority[]).map(
                  (priority) => (
                    <DropdownMenuItem
                      key={priority}
                      onSelect={() => {
                        updateLead.mutate(
                          { id: lead.id, body: { priority }, version },
                          {
                            onSuccess: onLeadUpdated,
                            onError: handleStageError,
                          },
                        );
                      }}
                    >
                      {LEAD_PRIORITY_MAP[priority].label}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </Can>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={`tel:${lead.mobile}`}>
            <Phone data-icon="inline-start" aria-hidden />
            تماس
          </a>
        </Button>
        <Button type="button" size="sm" variant="outline" asChild>
          <a
            href={`https://wa.me/98${lead.mobile.replace(/^0/, "")}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle data-icon="inline-start" aria-hidden />
            واتساپ
          </a>
        </Button>
        <Can permission="lead:write">
          <Button type="button" size="sm" variant="outline" onClick={onSendMessage}>
            <MessageSquare data-icon="inline-start" aria-hidden />
            پیامک
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCreateBooking}>
            <CalendarPlus data-icon="inline-start" aria-hidden />
            رزرو مشاوره
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCreateTask}>
            <CheckSquare data-icon="inline-start" aria-hidden />
            ساخت کار
          </Button>
          <Button type="button" size="sm" onClick={onConvert}>
            تبدیل به پرونده
          </Button>
        </Can>
        {duplicateCount > 0 ? (
          <Button type="button" size="sm" variant="secondary" asChild>
            <Link href="#duplicates">مشاهده تکراری‌ها</Link>
          </Button>
        ) : null}
      </div>

      <LostReasonDialog
        open={lostPending !== null}
        leadName={lead.name}
        onOpenChange={(open) => {
          if (!open) setLostPending(null);
        }}
        onConfirm={(lostReasonId) => {
          if (!lostPending) return;
          const target = lostPending;
          setLostPending(null);
          moveToStage(target, lostReasonId);
        }}
      />
    </header>
  );
}
