"use client";

import type { ReactNode } from "react";
import { FolderSearch, Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/panel/page-container";
import { isApiError } from "@/lib/api/errors";
import { useSelectMyCase } from "@/features/student-panel/mutations";
import {
  useMyCase,
  useMyCaseLink,
} from "@/features/student-panel/queries";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import type { DegreeLevel } from "@/types";
import {
  StudentPanelEmpty,
  StudentPanelError,
  StudentPanelSkeleton,
} from "./panel-query-state";
import { RequestConsultationButton } from "./request-consultation";

type CaseLinkGateProps = {
  children: ReactNode;
  /** When false, still load case-link but skip requiring an active case */
  requireCase?: boolean;
};

function degreeLabel(degree: string): string {
  return DEGREE_LEVEL_LABELS[degree as DegreeLevel] ?? degree;
}

/**
 * Resolves OTP case-link before panel content:
 * - none → «پرونده‌ای پیدا نشد» + CTA مشاوره
 * - select → انتخاب پرونده
 * - linked / ready → children
 */
export function CaseLinkGate({
  children,
  requireCase = true,
}: CaseLinkGateProps) {
  const { status: sessionStatus } = useSession();
  const caseLink = useMyCaseLink({
    enabled: sessionStatus === "authenticated",
  });
  const myCase = useMyCase({
    enabled:
      sessionStatus === "authenticated" &&
      requireCase &&
      caseLink.data?.status === "linked",
  });
  const selectCase = useSelectMyCase();

  if (sessionStatus === "loading" || caseLink.isLoading) {
    return <StudentPanelSkeleton />;
  }

  if (caseLink.isError) {
    return (
      <StudentPanelError
        error={caseLink.error}
        onRetry={() => void caseLink.refetch()}
      />
    );
  }

  const link = caseLink.data;
  if (!link) return <StudentPanelSkeleton />;

  if (link.status === "none") {
    return (
      <PageContainer className="justify-center">
        <StudentPanelEmpty
          icon={FolderSearch}
          title="پرونده‌ای پیدا نشد"
          description="با این شماره هنوز پرونده‌ای در سیستم نداریم. اگر می‌خواهید شروع کنید، درخواست مشاوره بگذارید تا با شما تماس بگیریم."
        >
          <RequestConsultationButton />
        </StudentPanelEmpty>
      </PageContainer>
    );
  }

  if (link.status === "select") {
    return (
      <PageContainer>
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
          <header className="space-y-1">
            <h1 className="font-heading text-xl font-bold">انتخاب پرونده</h1>
            <p className="text-sm text-muted-foreground">
              {link.message ??
                "چند پرونده مرتبط پیدا شد؛ یکی را انتخاب کنید."}
            </p>
          </header>
          <ul className="flex flex-col gap-3" role="list">
            {link.cases.map((item) => (
              <li key={item.id}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto min-h-14 w-full flex-col items-stretch gap-1 px-4 py-3 text-start"
                  disabled={selectCase.isPending}
                  onClick={() =>
                    selectCase.mutate(
                      { caseId: item.id },
                      {
                        onError: (error) => {
                          console.error(error);
                        },
                      },
                    )
                  }
                >
                  <span className="font-medium">{item.studentName}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.code} · {item.currentStageTitle} ·{" "}
                    {degreeLabel(item.targetDegree)} · {item.targetCountry}
                  </span>
                  {selectCase.isPending ? (
                    <Loader2
                      className="size-4 animate-spin self-end text-muted-foreground"
                      aria-hidden
                    />
                  ) : null}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </PageContainer>
    );
  }

  if (!requireCase) return <>{children}</>;

  if (myCase.isLoading) return <StudentPanelSkeleton />;

  if (myCase.isError) {
    if (isApiError(myCase.error) && myCase.error.isNotFound) {
      return (
        <PageContainer className="justify-center">
          <StudentPanelEmpty
            icon={FolderSearch}
            title="پرونده‌ای پیدا نشد"
            description="پرونده فعالی به حساب شما وصل نیست. برای شروع، درخواست مشاوره بگذارید."
          >
            <RequestConsultationButton />
          </StudentPanelEmpty>
        </PageContainer>
      );
    }
    return (
      <StudentPanelError
        error={myCase.error}
        onRetry={() => void myCase.refetch()}
      />
    );
  }

  return <>{children}</>;
}
