"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileQuestion, ServerCrash } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { useUnsavedChangesGuard } from "@/components/admin/hooks/use-unsaved-changes-guard";
import { PageContainer } from "@/components/panel/page-container";
import { PanelErrorState } from "@/components/panel/panel-error-state";
import { ForbiddenPage } from "@/components/rbac/forbidden-page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Lead } from "@/contracts/leads";
import { useBookings } from "@/features/bookings/queries";
import { useCountries } from "@/features/content/queries";
import {
  useCaseTemplates,
  useMessageTemplates,
  usePipelineStages,
  useTags,
  useTasks,
} from "@/features/crm/queries";
import { useLead, useLeadDuplicates } from "@/features/leads/queries";
import { useStaffUsers } from "@/features/users/queries";
import { useIsMobile } from "@/hooks/use-mobile";
import { isApiError } from "@/lib/api";
import { LeadActivityCompose } from "./lead-activity-compose";
import { LeadActivityTimeline } from "./lead-activity-timeline";
import { LeadBookingDialog } from "./lead-booking-dialog";
import { LeadConvertDialog } from "./lead-convert-dialog";
import { LeadDetailHeader } from "./lead-detail-header";
import { LeadDetailSidebar } from "./lead-detail-sidebar";
import { LeadVersionBanner } from "./lead-version-banner";

type LeadDetailPageProps = {
  leadId: string;
};

export function LeadDetailPage({ leadId }: LeadDetailPageProps) {
  const { user } = useSession();
  const isMobile = useIsMobile();
  const leadQuery = useLead(leadId);
  const duplicatesQuery = useLeadDuplicates(leadId, {
    enabled: Boolean(leadId) && !leadQuery.isError,
  });
  const stagesQuery = usePipelineStages();
  const tagsQuery = useTags();
  const templatesQuery = useMessageTemplates();
  const caseTemplatesQuery = useCaseTemplates();
  const countriesQuery = useCountries({
    page: 1,
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });
  const consultantsQuery = useStaffUsers({
    page: 1,
    pageSize: 100,
    role: "consultant",
    status: "active",
  });
  const tasksQuery = useTasks({
    page: 1,
    pageSize: 50,
    relatedType: "lead",
    relatedId: leadId,
    order: "asc",
    sort: "dueAt",
  });
  const bookingsQuery = useBookings({
    page: 1,
    pageSize: 100,
    sort: "startsAt",
    order: "desc",
  });

  const [optimisticLead, setOptimisticLead] = useState<Lead | null>(null);
  const [versionConflict, setVersionConflict] = useState<{
    currentVersion?: number;
  } | null>(null);
  const [composeDirty, setComposeDirty] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [focusCompose, setFocusCompose] = useState(false);

  useUnsavedChangesGuard({ isDirty: composeDirty });

  const serverLead = leadQuery.data;
  const lead = optimisticLead ?? serverLead;

  const stages = useMemo(
    () => [...(stagesQuery.data ?? [])].sort((a, b) => a.order - b.order),
    [stagesQuery.data],
  );
  const tagsById = useMemo(
    () => new Map((tagsQuery.data ?? []).map((tag) => [tag.id, tag])),
    [tagsQuery.data],
  );
  const consultants = useMemo(
    () =>
      (consultantsQuery.data?.items ?? []).map((item) => ({
        value: item.id,
        label: item.name,
      })),
    [consultantsQuery.data?.items],
  );
  const countries = useMemo(
    () =>
      (countriesQuery.data?.items ?? []).map((item) => ({
        value: item.slug,
        label: item.nameFa,
      })),
    [countriesQuery.data?.items],
  );

  const consultantName = useCallback(
    (id: string | null) => {
      if (!id) return "بدون مسئول";
      return consultants.find((item) => item.value === id)?.label ?? "—";
    },
    [consultants],
  );
  const countryName = useCallback(
    (slug: string) =>
      countries.find((item) => item.value === slug)?.label ?? slug,
    [countries],
  );
  const stageTitle = useCallback(
    (id: string) => stages.find((stage) => stage.id === id)?.title ?? id,
    [stages],
  );

  const relatedBookings = useMemo(
    () =>
      (bookingsQuery.data?.items ?? []).filter(
        (booking) => booking.leadId === leadId,
      ),
    [bookingsQuery.data?.items, leadId],
  );

  const onLeadUpdated = useCallback((updated: Lead) => {
    setOptimisticLead(updated);
    setVersionConflict(null);
    void leadQuery.refetch();
  }, [leadQuery]);

  if (leadQuery.isPending) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (leadQuery.error && isApiError(leadQuery.error)) {
    if (leadQuery.error.isForbidden) {
      return (
        <ForbiddenPage
          areaLabel="این لید"
          homeHref="/admin/leads"
          homeLabel="بازگشت به فهرست لیدها"
        />
      );
    }
    if (leadQuery.error.isNotFound) {
      return (
        <PanelErrorState
          code="خطای ۴۰۴"
          icon={FileQuestion}
          title="لید پیدا نشد"
          description="این سرنخ حذف شده یا شناسه آن نامعتبر است."
        >
          <Button asChild size="lg">
            <Link href="/admin/leads">
              <ArrowRight data-icon="inline-start" />
              بازگشت به فهرست
            </Link>
          </Button>
        </PanelErrorState>
      );
    }
    return (
      <PanelErrorState
        code="خطا"
        icon={ServerCrash}
        title="بارگذاری لید ناموفق بود"
        description={leadQuery.error.message}
      >
        <Button type="button" onClick={() => void leadQuery.refetch()}>
          تلاش دوباره
        </Button>
      </PanelErrorState>
    );
  }

  if (!lead) {
    return (
      <PanelErrorState
        code="خطای ۴۰۴"
        icon={FileQuestion}
        title="لید پیدا نشد"
        description="این سرنخ در دسترس نیست."
      >
        <Button asChild>
          <Link href="/admin/leads">بازگشت</Link>
        </Button>
      </PanelErrorState>
    );
  }

  // Extra client guard: consultant who is not assignee (API also enforces)
  if (
    user?.role === "consultant" &&
    lead.assignedTo !== null &&
    lead.assignedTo !== user.id
  ) {
    return (
      <ForbiddenPage
        areaLabel="این لید"
        homeHref="/admin/leads"
        homeLabel="بازگشت به فهرست لیدها"
      />
    );
  }

  const duplicates = duplicatesQuery.data?.leads ?? [];
  const version = lead.version;

  const mainColumn = (
    <div className="space-y-4">
      <LeadActivityCompose
        lead={lead}
        templates={templatesQuery.data ?? []}
        consultantName={consultantName(lead.assignedTo)}
        countryName={countryName}
        onDirtyChange={setComposeDirty}
      />
      <LeadActivityTimeline
        leadId={lead.id}
        stageTitle={stageTitle}
        consultantName={consultantName}
      />
    </div>
  );

  const sideColumn = (
    <div id="duplicates">
      <LeadDetailSidebar
        lead={lead}
        version={version}
        countryName={countryName}
        tasks={tasksQuery.data?.items ?? []}
        bookings={relatedBookings}
        duplicates={duplicates}
        currentUserId={user?.id ?? ""}
        onVersionMismatch={(currentVersion) =>
          setVersionConflict({ currentVersion })
        }
        onLeadUpdated={onLeadUpdated}
      />
    </div>
  );

  return (
    <PageContainer>
      <div className="mb-3">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/admin/leads">
            <ArrowRight data-icon="inline-start" aria-hidden />
            بازگشت به فهرست
          </Link>
        </Button>
      </div>

      {versionConflict ? (
        <div className="mb-3">
          <LeadVersionBanner
            currentVersion={versionConflict.currentVersion}
            hasLocalDraft={composeDirty || optimisticLead !== null}
            onKeepLocal={() => setVersionConflict(null)}
            onReload={() => {
              setOptimisticLead(null);
              setVersionConflict(null);
              void leadQuery.refetch();
            }}
          />
        </div>
      ) : null}

      <LeadDetailHeader
        lead={lead}
        version={version}
        stages={stages}
        tagsById={tagsById}
        consultants={consultants}
        duplicateCount={duplicates.length}
        onVersionMismatch={(currentVersion) =>
          setVersionConflict({ currentVersion })
        }
        onLeadUpdated={onLeadUpdated}
        onConvert={() => setConvertOpen(true)}
        onCreateTask={() => {
          /* sidebar has create; scroll on mobile */
          if (isMobile) setFocusCompose(false);
        }}
        onCreateBooking={() => setBookingOpen(true)}
        onSendMessage={() => setFocusCompose(true)}
      />

      {isMobile ? (
        <Tabs defaultValue={focusCompose ? "timeline" : "timeline"} className="mt-4">
          <TabsList className="mb-3 w-full">
            <TabsTrigger value="timeline" className="flex-1">
              تایم‌لاین
            </TabsTrigger>
            <TabsTrigger value="info" className="flex-1">
              اطلاعات
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">{mainColumn}</TabsContent>
          <TabsContent value="info">{sideColumn}</TabsContent>
        </Tabs>
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {mainColumn}
          {sideColumn}
        </div>
      )}

      <LeadConvertDialog
        open={convertOpen}
        lead={lead}
        countries={countries}
        consultants={consultants}
        caseTemplates={caseTemplatesQuery.data ?? []}
        onOpenChange={setConvertOpen}
      />
      <LeadBookingDialog
        open={bookingOpen}
        lead={lead}
        consultants={consultants}
        onOpenChange={setBookingOpen}
      />
    </PageContainer>
  );
}
