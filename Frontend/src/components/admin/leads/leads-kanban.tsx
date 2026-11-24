"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PipelineStage } from "@/contracts/crm";
import type { Lead, LeadListQuery } from "@/contracts/leads";
import { leadsApi } from "@/features/leads/api";
import { leadKeys } from "@/features/leads/keys";
import { useUpdateLeadStage } from "@/features/leads/mutations";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import { formatNumber, formatRialsAsToman } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LeadKanbanCard } from "./lead-kanban-card";
import { LeadKanbanColumn } from "./lead-kanban-column";
import { LostReasonDialog } from "./lost-reason-dialog";
import { VirtualList } from "./virtual-list";

type LeadsKanbanProps = {
  baseQuery: Omit<LeadListQuery, "page" | "pageSize" | "stageId" | "stageIds">;
  stages: readonly PipelineStage[];
  consultantName: (id: string | null) => string;
  countryName: (slug: string) => string;
  tagTitles: (ids: readonly string[]) => string[];
  onOpenLead: (lead: Lead) => void;
  isMobile: boolean;
};

const PAGE_SIZE = 20;

function columnQueryKey(
  stageId: string,
  base: LeadsKanbanProps["baseQuery"],
) {
  return [...leadKeys.lists(), "kanban", stageId, base] as const;
}

export function LeadsKanban({
  baseQuery,
  stages,
  consultantName,
  countryName,
  tagTitles,
  onOpenLead,
  isMobile,
}: LeadsKanbanProps) {
  const queryClient = useQueryClient();
  const updateStage = useUpdateLeadStage();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [lostPending, setLostPending] = useState<{
    lead: Lead;
    toStage: PipelineStage;
  } | null>(null);
  const [mobileStageId, setMobileStageId] = useState(stages[0]?.id ?? "");
  const activeMobileStageId = stages.some((stage) => stage.id === mobileStageId)
    ? mobileStageId
    : (stages[0]?.id ?? "");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const moveLead = useCallback(
    async (
      lead: Lead,
      toStage: PipelineStage,
      lostReasonId?: string,
    ) => {
      if (lead.stageId === toStage.id) return;
      const previous = lead;
      // Optimistic: patch every kanban cache that may hold this lead
      for (const stage of stages) {
        queryClient.setQueriesData(
          { queryKey: columnQueryKey(stage.id, baseQuery) },
          (old: unknown) => {
            if (!old || typeof old !== "object") return old;
            const data = old as {
              pages: { items: Lead[]; pagination: { total: number } }[];
            };
            if (!data.pages) return old;
            return {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items:
                  stage.id === toStage.id
                    ? page.items.some((item) => item.id === lead.id)
                      ? page.items.map((item) =>
                          item.id === lead.id
                            ? {
                                ...item,
                                stageId: toStage.id,
                                stageKind: toStage.kind,
                                version: item.version + 1,
                              }
                            : item,
                        )
                      : stage.id === previous.stageId
                        ? page.items
                        : [
                            {
                              ...lead,
                              stageId: toStage.id,
                              stageKind: toStage.kind,
                              version: lead.version + 1,
                            },
                            ...page.items,
                          ]
                    : page.items.filter((item) => item.id !== lead.id),
              })),
            };
          },
        );
      }

      try {
        await updateStage.mutateAsync({
          id: lead.id,
          version: lead.version,
          body: {
            stageId: toStage.id,
            lostReasonId,
          },
        });
        toast.success(`به «${toStage.title}» منتقل شد`);
        if (toStage.kind === "won") {
          toast.message("برای ساخت پرونده از منوی لید استفاده کنید.");
        }
      } catch (error) {
        void queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
        if (error instanceof ApiError && error.isVersionMismatch) {
          toast.error("این لید هم‌زمان تغییر کرده؛ کارت تازه شد");
        } else {
          toast.error(getApiErrorMessage(error));
        }
      }
    },
    [baseQuery, queryClient, stages, updateStage],
  );

  const onDragStart = (event: DragStartEvent) => {
    const lead = event.active.data.current?.lead as Lead | undefined;
    setActiveLead(lead ?? null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const lead = event.active.data.current?.lead as Lead | undefined;
    const overId = event.over?.id;
    if (!lead || !overId) return;
    const toStageId = String(overId).replace(/^stage:/, "");
    const toStage = stages.find((stage) => stage.id === toStageId);
    if (!toStage) return;
    if (toStage.kind === "lost") {
      setLostPending({ lead, toStage });
      return;
    }
    void moveLead(lead, toStage);
  };

  const board = (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 pb-2">
        {stages.map((stage) => (
          <KanbanStageColumn
            key={stage.id}
            stage={stage}
            baseQuery={baseQuery}
            consultantName={consultantName}
            countryName={countryName}
            tagTitles={tagTitles}
            onOpenLead={onOpenLead}
            onMoveViaMenu={(lead, target) => {
              if (target.kind === "lost") {
                setLostPending({ lead, toStage: target });
                return;
              }
              void moveLead(lead, target);
            }}
            stages={stages}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <LeadKanbanCard
            lead={activeLead}
            consultantName={consultantName}
            countryName={countryName}
            tagTitles={tagTitles}
            dragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  return (
    <>
      {isMobile ? (
        <Tabs
          value={activeMobileStageId}
          onValueChange={setMobileStageId}
          className="w-full"
        >
          <TabsList className="mb-3 h-auto w-full flex-wrap justify-start">
            {stages.map((stage) => (
              <TabsTrigger key={stage.id} value={stage.id} className="text-xs">
                {stage.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {stages.map((stage) => (
            <TabsContent key={stage.id} value={stage.id} className="mt-0">
              <KanbanStageColumn
                stage={stage}
                baseQuery={baseQuery}
                consultantName={consultantName}
                countryName={countryName}
                tagTitles={tagTitles}
                onOpenLead={onOpenLead}
                onMoveViaMenu={(lead, target) => {
                  if (target.kind === "lost") {
                    setLostPending({ lead, toStage: target });
                    return;
                  }
                  void moveLead(lead, target);
                }}
                stages={stages}
                vertical
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap">
          {board}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <LostReasonDialog
        open={lostPending !== null}
        leadName={lostPending?.lead.name ?? ""}
        onOpenChange={(open) => {
          if (!open) setLostPending(null);
        }}
        onConfirm={(lostReasonId) => {
          if (!lostPending) return;
          const pending = lostPending;
          setLostPending(null);
          void moveLead(pending.lead, pending.toStage, lostReasonId);
        }}
      />
    </>
  );
}

function KanbanStageColumn({
  stage,
  baseQuery,
  consultantName,
  countryName,
  tagTitles,
  onOpenLead,
  onMoveViaMenu,
  stages,
  vertical = false,
}: {
  stage: PipelineStage;
  baseQuery: LeadsKanbanProps["baseQuery"];
  consultantName: (id: string | null) => string;
  countryName: (slug: string) => string;
  tagTitles: (ids: readonly string[]) => string[];
  onOpenLead: (lead: Lead) => void;
  onMoveViaMenu: (lead: Lead, stage: PipelineStage) => void;
  stages: readonly PipelineStage[];
  vertical?: boolean;
}) {
  const query = useInfiniteQuery({
    queryKey: columnQueryKey(stage.id, baseQuery),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      leadsApi.list(
        {
          ...baseQuery,
          stageId: stage.id,
          page: pageParam,
          pageSize: PAGE_SIZE,
          sort: "lastActivityAt",
          order: "desc",
        },
        { signal },
      ),
    getNextPageParam: (last) => {
      const { page, totalPages } = last.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });

  const leads = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );
  const total = query.data?.pages[0]?.pagination.total ?? 0;
  const valueSum = leads.reduce((sum, lead) => sum + (lead.value ?? 0), 0);
  const wipExceeded =
    stage.wipLimit !== null && total > stage.wipLimit;

  return (
    <LeadKanbanColumn
      stage={stage}
      droppableId={`stage:${stage.id}`}
      count={total}
      valueLabel={valueSum > 0 ? formatRialsAsToman(valueSum) : undefined}
      wipExceeded={wipExceeded}
      wipLimit={stage.wipLimit}
      className={cn(vertical ? "w-full" : "w-72 shrink-0")}
      isLoading={query.isPending}
      footer={
        query.hasNextPage ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage
              ? "در حال بارگذاری…"
              : `بارگذاری بیشتر (${formatNumber(total - leads.length)})`}
          </Button>
        ) : null
      }
    >
      {leads.length === 0 && !query.isPending ? (
        <p className="px-2 py-6 text-center text-xs text-muted-foreground">
          لیدی در این مرحله نیست
        </p>
      ) : (
        <VirtualList
          items={leads}
          estimateSize={128}
          getKey={(lead) => lead.id}
          className="flex min-h-0 flex-1 flex-col gap-2"
          renderItem={(lead) => (
            <LeadKanbanCard
              lead={lead}
              consultantName={consultantName}
              countryName={countryName}
              tagTitles={tagTitles}
              onOpen={() => onOpenLead(lead)}
              moveMenu={
                <>
                  <p className="text-muted-foreground px-2 py-1 text-xs">
                    انتقال به مرحله…
                  </p>
                  {stages
                    .filter((entry) => entry.id !== stage.id)
                    .map((entry) => (
                      <Button
                        key={entry.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onMoveViaMenu(lead, entry)}
                      >
                        {entry.title}
                      </Button>
                    ))}
                </>
              }
            />
          )}
        />
      )}
      {wipExceeded ? (
        <Badge variant="destructive" className="mx-2 mb-2 font-normal">
          سقف WIP ({stage.wipLimit}) رد شده
        </Badge>
      ) : null}
    </LeadKanbanColumn>
  );
}
