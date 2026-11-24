"use client";

import {
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Filter,
  Lock,
  MessageCircle,
  Upload,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/panel/page-container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DocumentView } from "@/contracts/student-panel";
import { useMyDocuments } from "@/features/student-panel/queries";
import { formatJalaliDate, formatRelativeFa, toPersianDigits } from "@/lib/format";
import { formatBytesFa } from "@/lib/student-documents/validate-file";
import { cn } from "@/lib/utils";
import { CaseLinkGate } from "../case-link-gate";
import dynamic from "next/dynamic";
import {
  StudentPanelEmpty,
  StudentPanelError,
  StudentPanelSkeleton,
} from "../panel-query-state";

const StudentFileUploader = dynamic(
  () =>
    import("./student-file-uploader").then((mod) => mod.StudentFileUploader),
  { ssr: false },
);

type QuickFilter = "all" | "needs_action" | "pending" | "approved";

const STATUS_LABEL: Record<DocumentView["status"], string> = {
  not_uploaded: "آپلود نشده",
  pending: "در انتظار بررسی",
  uploaded: "در انتظار بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
};

const STATUS_ICON: Record<
  DocumentView["status"],
  typeof CheckCircle2
> = {
  not_uploaded: Upload,
  pending: Clock3,
  uploaded: Clock3,
  approved: CheckCircle2,
  rejected: XCircle,
};

const STATUS_TONE: Record<DocumentView["status"], string> = {
  not_uploaded: "bg-muted text-muted-foreground",
  pending: "bg-accent/15 text-accent-foreground",
  uploaded: "bg-accent/15 text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const FILTER_LABEL: Record<QuickFilter, string> = {
  all: "همه",
  needs_action: "نیاز به اقدام",
  pending: "در انتظار",
  approved: "تأییدشده",
};

function needsAction(doc: DocumentView): boolean {
  return doc.status === "not_uploaded" || doc.status === "rejected";
}

function isAwaitingReview(doc: DocumentView): boolean {
  return doc.status === "pending" || doc.status === "uploaded";
}

function sortDocs(docs: DocumentView[]): DocumentView[] {
  const rank = (doc: DocumentView) => {
    if (doc.status === "rejected") return 0;
    if (doc.status === "not_uploaded") return 1;
    if (isAwaitingReview(doc)) return 2;
    return 3;
  };
  return [...docs].sort((a, b) => rank(a) - rank(b));
}

function DocumentCard({
  doc,
  onUpload,
}: {
  doc: DocumentView;
  onUpload: (doc: DocumentView) => void;
}) {
  const Icon = STATUS_ICON[doc.status];
  const statusLabel = STATUS_LABEL[doc.status];

  return (
    <li
      className={cn(
        "rounded-2xl border bg-card p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        doc.status === "rejected" && "border-destructive/40",
      )}
      tabIndex={0}
      aria-label={`${doc.title}، وضعیت ${statusLabel}`}
      data-testid={`student-doc-${doc.id}`}
      data-status={doc.status}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {doc.title}
            {doc.required ? (
              <span className="ms-1 text-xs text-destructive" title="الزامی">
                *
              </span>
            ) : (
              <span className="ms-1 text-xs text-muted-foreground">(اختیاری)</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {doc.stageTitle}
            {" · "}
            به‌روز شده {formatRelativeFa(doc.updatedAt)}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={cn("shrink-0 gap-1", STATUS_TONE[doc.status])}
          aria-label={`وضعیت: ${statusLabel}`}
        >
          <Icon className="size-3.5" aria-hidden />
          {statusLabel}
        </Badge>
      </div>

      {doc.status === "rejected" && doc.rejectionReason ? (
        <p
          className="mt-3 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {doc.rejectionReason}
        </p>
      ) : null}

      <Accordion type="single" collapsible className="mt-2">
        <AccordionItem value="prep" className="border-0">
          <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:no-underline">
            چگونه آماده کنم
          </AccordionTrigger>
          <AccordionContent className="space-y-1 text-sm text-muted-foreground">
            <p>{doc.prepGuide}</p>
            <p>
              فرمت: {doc.prepFormats.join("، ")} · حداکثر{" "}
              {formatBytesFa(doc.prepMaxSizeBytes)}
            </p>
            {doc.prepSampleHint ? <p>نمونه: {doc.prepSampleHint}</p> : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {doc.file ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <a
            href={doc.file.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border px-2.5 text-foreground hover:bg-muted"
          >
            <Download className="size-3.5" aria-hidden />
            مشاهده / دانلود
          </a>
          {doc.reviewedAt ? (
            <span>بررسی: {formatJalaliDate(doc.reviewedAt)}</span>
          ) : null}
          {doc.versions.length > 0 ? (
            <span>{toPersianDigits(doc.versions.length)} نسخه قبلی</span>
          ) : null}
        </div>
      ) : null}

      {doc.versions.length > 0 ? (
        <details className="mt-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">تاریخچه نسخه‌ها</summary>
          <ul className="mt-2 space-y-1 ps-3">
            {doc.versions.map((version) => (
              <li key={version.version}>
                نسخه {toPersianDigits(version.version)} ·{" "}
                {STATUS_LABEL[version.status]} ·{" "}
                {formatJalaliDate(version.uploadedAt)}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {doc.locked ? (
        <div className="mt-3 space-y-2 rounded-xl bg-muted/60 p-3">
          <p className="flex items-center gap-2 text-sm">
            <Lock className="size-4 shrink-0" aria-hidden />
            برای تغییر با مشاور تماس بگیرید
          </p>
          <Button asChild variant="outline" size="sm" className="min-h-10">
            <Link href="/panel/tickets">
              <MessageCircle data-icon="inline-start" aria-hidden />
              پیام به مشاور
            </Link>
          </Button>
        </div>
      ) : null}

      {doc.canReplace && needsAction(doc) ? (
        <Button
          type="button"
          className={cn(
            "mt-3 min-h-11 w-full sm:w-auto",
            doc.status === "rejected" && "min-h-12 text-base",
          )}
          onClick={() => onUpload(doc)}
          data-testid={`student-doc-upload-${doc.id}`}
        >
          <Upload data-icon="inline-start" aria-hidden />
          {doc.status === "rejected" ? "آپلود مجدد" : "بارگذاری"}
        </Button>
      ) : null}

      {doc.canReplace && isAwaitingReview(doc) ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3 min-h-11 w-full sm:w-auto"
          onClick={() => onUpload(doc)}
        >
          <Upload data-icon="inline-start" aria-hidden />
          جایگزینی فایل
        </Button>
      ) : null}
    </li>
  );
}

function DocumentsContent() {
  const docsQuery = useMyDocuments();
  const [filter, setFilter] = useState<QuickFilter>("all");
  const [uploadTarget, setUploadTarget] = useState<DocumentView | null>(null);

  const payload = docsQuery.data;
  const docs = useMemo(() => payload?.items ?? [], [payload?.items]);

  const filtered = useMemo(() => {
    let list = docs;
    if (filter === "needs_action") list = docs.filter(needsAction);
    else if (filter === "pending") list = docs.filter(isAwaitingReview);
    else if (filter === "approved") {
      list = docs.filter((doc) => doc.status === "approved");
    }
    return sortDocs(list);
  }, [docs, filter]);

  const groups = useMemo(() => {
    const current = filtered.filter((doc) => doc.stageGroup === "current");
    const upcoming = filtered.filter((doc) => doc.stageGroup === "upcoming");
    const other = filtered.filter(
      (doc) => doc.stageGroup !== "current" && doc.stageGroup !== "upcoming",
    );
    return { current, upcoming, other };
  }, [filtered]);

  if (docsQuery.isLoading) return <StudentPanelSkeleton />;
  if (docsQuery.isError) {
    return (
      <StudentPanelError
        error={docsQuery.error}
        onRetry={() => void docsQuery.refetch()}
      />
    );
  }

  const approved = payload?.progress.approvedRequired ?? 0;
  const total = payload?.progress.totalRequired ?? 0;
  const percent = total > 0 ? Math.round((approved / total) * 100) : 0;
  const settings = payload?.settings;

  return (
    <PageContainer className="gap-5 pb-4" data-testid="student-documents">
      <header className="space-y-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold">مدارک</h1>
          <p className="text-sm text-muted-foreground">
            {toPersianDigits(approved)} از {toPersianDigits(total)} مدرک تأیید شد
          </p>
        </div>
        <Progress
          value={percent}
          aria-label={`پیشرفت مدارک ${toPersianDigits(percent)} درصد`}
          className="h-2"
        />
      </header>

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="toolbar"
        aria-label="فیلتر سریع مدارک"
      >
        {(Object.keys(FILTER_LABEL) as QuickFilter[]).map((key) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={filter === key ? "default" : "outline"}
            className="shrink-0 min-h-9"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {key === "all" ? <Filter data-icon="inline-start" aria-hidden /> : null}
            {FILTER_LABEL[key]}
          </Button>
        ))}
      </div>

      {docs.length === 0 ? (
        <StudentPanelEmpty
          icon={FileText}
          title="مدرکی ثبت نشده"
          description="وقتی مشاور مدارک لازم را مشخص کند، اینجا می‌بینید."
        />
      ) : filtered.length === 0 ? (
        <StudentPanelEmpty
          icon={FileText}
          title="موردی در این فیلتر نیست"
          description="فیلتر دیگری را امتحان کنید."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {(
            [
              ["current", "مرحله فعلی", groups.current],
              ["upcoming", "مرحله بعد", groups.upcoming],
              ["other", "سایر مراحل", groups.other],
            ] as const
          ).map(([key, title, items]) =>
            items.length > 0 ? (
              <section key={key} aria-labelledby={`docs-group-${key}`}>
                <h2
                  id={`docs-group-${key}`}
                  className="mb-3 text-sm font-semibold text-muted-foreground"
                >
                  {title}
                </h2>
                <ul className="flex flex-col gap-3" role="list">
                  {items.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onUpload={setUploadTarget}
                    />
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      )}

      {uploadTarget && settings ? (
        <StudentFileUploader
          document={uploadTarget}
          reviewEtaMessage={settings.reviewEtaMessage}
          maxUploadBytes={settings.maxUploadBytes}
          open={Boolean(uploadTarget)}
          onOpenChange={(next) => {
            if (!next) setUploadTarget(null);
          }}
          onUploaded={() => {
            setUploadTarget(null);
            void docsQuery.refetch();
          }}
        />
      ) : null}
    </PageContainer>
  );
}

export function StudentDocumentsView() {
  return (
    <CaseLinkGate>
      <DocumentsContent />
    </CaseLinkGate>
  );
}
