"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileQuestion, ServerCrash } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { PageContainer } from "@/components/panel/page-container";
import { PanelErrorState } from "@/components/panel/panel-error-state";
import { ForbiddenPage } from "@/components/rbac/forbidden-page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCaseTemplates, useTasks } from "@/features/crm/queries";
import { useCountries } from "@/features/content/queries";
import { useCase } from "@/features/students/queries";
import { useStaffUsers } from "@/features/users/queries";
import { isApiError } from "@/lib/api";
import { CaseActivityTimeline } from "./case-activity-timeline";
import { CaseDetailHeader } from "./case-detail-header";
import { CaseDocumentsTab } from "./case-documents-tab";
import { CaseOverviewTab } from "./case-overview-tab";
import { CasePaymentsTab } from "./case-payments-tab";
import { CaseStagesTab } from "./case-stages-tab";
import { CaseTicketsTab } from "./case-tickets-tab";
import { CASE_STAGE_LABELS } from "./case-labels";

type CaseDetailPageProps = {
  caseId: string;
};

export function CaseDetailPage({ caseId }: CaseDetailPageProps) {
  const { user } = useSession();
  const caseQuery = useCase(caseId);
  const [tab, setTab] = useState("overview");
  const [suggestAdvance, setSuggestAdvance] = useState(false);

  const countriesQuery = useCountries({
    page: 1,
    pageSize: 100,
    sort: "nameFa",
    order: "asc",
  });
  const templatesQuery = useCaseTemplates();
  const tasksQuery = useTasks({
    page: 1,
    pageSize: 50,
    relatedType: "case",
    relatedId: caseId,
    status: "open",
    order: "asc",
    sort: "dueAt",
  });
  const consultantsQuery = useStaffUsers({
    page: 1,
    pageSize: 100,
    role: "consultant",
    status: "active",
  });

  const studentCase = caseQuery.data;

  const countryName = useMemo(() => {
    const map = new Map(
      (countriesQuery.data?.items ?? []).map((country) => [
        country.slug,
        country.nameFa,
      ]),
    );
    return (slug: string) => map.get(slug) ?? slug;
  }, [countriesQuery.data?.items]);

  const consultantName = useMemo(() => {
    const map = new Map(
      (consultantsQuery.data?.items ?? []).map((person) => [
        person.id,
        person.name,
      ]),
    );
    return (id: string | null) => (id ? (map.get(id) ?? id) : "—");
  }, [consultantsQuery.data?.items]);

  const template = useMemo(() => {
    if (!studentCase) return null;
    const all = templatesQuery.data ?? [];
    if (studentCase.templateId) {
      return all.find((tpl) => tpl.id === studentCase.templateId) ?? null;
    }
    return (
      all.find((tpl) => tpl.countrySlug === studentCase.targetCountry) ??
      all.find((tpl) => tpl.countrySlug === null) ??
      null
    );
  }, [studentCase, templatesQuery.data]);

  if (caseQuery.isPending) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (caseQuery.isError) {
    if (isApiError(caseQuery.error) && caseQuery.error.isForbidden) {
      return (
        <ForbiddenPage
          areaLabel="این پرونده"
          homeHref="/admin/cases"
          homeLabel="بازگشت به فهرست پرونده‌ها"
        />
      );
    }
    if (isApiError(caseQuery.error) && caseQuery.error.isNotFound) {
      return (
        <PanelErrorState
          code="خطای ۴۰۴"
          icon={FileQuestion}
          title="پرونده پیدا نشد"
          description="این پرونده وجود ندارد یا حذف شده است."
        >
          <Button type="button" asChild>
            <Link href="/admin/cases">بازگشت به فهرست</Link>
          </Button>
        </PanelErrorState>
      );
    }
    return (
      <PanelErrorState
        code="خطا"
        icon={ServerCrash}
        title="خطا در بارگذاری پرونده"
        description={
          isApiError(caseQuery.error)
            ? caseQuery.error.message
            : "لطفاً دوباره تلاش کنید."
        }
      >
        <Button type="button" onClick={() => void caseQuery.refetch()}>
          تلاش مجدد
        </Button>
      </PanelErrorState>
    );
  }

  if (!studentCase) return null;

  if (
    user?.role === "consultant" &&
    studentCase.consultantId !== user.id
  ) {
    return (
      <ForbiddenPage
        areaLabel="این پرونده"
        homeHref="/admin/cases"
        homeLabel="بازگشت به فهرست پرونده‌ها"
      />
    );
  }

  return (
    <PageContainer>
      <CaseDetailHeader
        studentCase={studentCase}
        countryName={countryName}
      />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="documents">مدارک</TabsTrigger>
          <TabsTrigger value="stages">مراحل</TabsTrigger>
          <TabsTrigger value="timeline">تایم‌لاین</TabsTrigger>
          <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
          <TabsTrigger value="tickets">تیکت‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CaseOverviewTab
            studentCase={studentCase}
            tasks={tasksQuery.data?.items ?? []}
            template={template}
            templateLoading={templatesQuery.isPending}
            onGoDocuments={() => setTab("documents")}
            currentUserId={user?.id ?? ""}
          />
        </TabsContent>

        <TabsContent value="documents">
          <CaseDocumentsTab
            caseId={caseId}
            onSuggestAdvance={() => {
              setSuggestAdvance(true);
              setTab("stages");
            }}
          />
        </TabsContent>

        <TabsContent value="stages">
          <CaseStagesTab
            studentCase={studentCase}
            actorName={consultantName}
            suggestOpen={suggestAdvance}
            onSuggestOpenChange={setSuggestAdvance}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <CaseActivityTimeline
            caseId={caseId}
            stageTitle={(key) =>
              CASE_STAGE_LABELS[key as keyof typeof CASE_STAGE_LABELS] ?? key
            }
            consultantName={consultantName}
          />
        </TabsContent>

        <TabsContent value="payments">
          <CasePaymentsTab caseId={caseId} />
        </TabsContent>

        <TabsContent value="tickets">
          <CaseTicketsTab caseId={caseId} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
