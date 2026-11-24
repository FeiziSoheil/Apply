"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import type { PipelineStage } from "@/contracts/crm";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type LeadKanbanColumnProps = {
  stage: PipelineStage;
  droppableId: string;
  count: number;
  valueLabel?: string;
  wipLimit: number | null;
  wipExceeded: boolean;
  isLoading: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function LeadKanbanColumn({
  stage,
  droppableId,
  count,
  valueLabel,
  wipLimit,
  wipExceeded,
  isLoading,
  children,
  footer,
  className,
}: LeadKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <section
      ref={setNodeRef}
      aria-label={`مرحله ${stage.title}`}
      className={cn(
        "bg-muted/40 flex max-h-[70vh] flex-col rounded-xl border",
        isOver && "ring-primary/40 ring-2",
        wipExceeded && "border-destructive/50",
        className,
      )}
    >
      <header className="flex flex-col gap-1 border-b px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold">{stage.title}</h3>
          <Badge variant="secondary" className="tabular-nums">
            {formatNumber(count)}
            {wipLimit !== null ? ` / ${formatNumber(wipLimit)}` : ""}
          </Badge>
        </div>
        {valueLabel ? (
          <p className="text-muted-foreground truncate text-xs">{valueLabel}</p>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center text-xs">
            در حال بارگذاری…
          </p>
        ) : (
          children
        )}
      </div>
      {footer ? <div className="border-t p-1">{footer}</div> : null}
    </section>
  );
}
