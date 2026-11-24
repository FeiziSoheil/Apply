"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  LeadImportDuplicateBehavior,
  LeadImportReport,
} from "@/contracts/leads";
import {
  LEAD_IMPORT_DUPLICATE_BEHAVIORS,
  MAX_LEAD_IMPORT_FILE_BYTES,
  MAX_LEAD_IMPORT_ROWS,
} from "@/contracts/leads";
import { usePipelineStages } from "@/features/crm/queries";
import { leadsApi } from "@/features/leads/api";
import { useStaffUsers } from "@/features/users/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber, toPersianDigits } from "@/lib/format";
import {
  LEAD_IMPORT_FIELD_KEYS,
  LEAD_IMPORT_FIELD_LABELS,
  resolveColumnMapping,
  saveStoredImportMapping,
  type LeadImportFieldKey,
} from "@/lib/leads/import-mapping";
import {
  buildLeadImportSampleCsv,
  downloadTextFile,
  readSheetFile,
  type SheetTable,
} from "@/lib/leads/sheet-io";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "آپلود" },
  { id: 2, title: "نگاشت ستون‌ها" },
  { id: 3, title: "پیش‌نمایش" },
  { id: 4, title: "ثبت" },
] as const;

const DUPLICATE_LABELS: Record<LeadImportDuplicateBehavior, string> = {
  reject: "رد کردن تکراری‌ها",
  update: "به‌روزرسانی لید موجود",
  create: "ایجاد لید جدید",
};

const UNMAPPED = "__skip__";
const ASSIGN_RULES = "__rules__";
const ASSIGN_NONE = "__none__";

type MappedRow = {
  row: number;
  name?: string;
  mobile?: string;
  email?: string;
  country?: string;
  source?: string;
  notes?: string;
  priority?: string;
};

function mapSheetRows(
  table: SheetTable,
  mapping: Record<string, LeadImportFieldKey | "">,
): MappedRow[] {
  return table.rows.map((cells, index) => {
    const mapped: MappedRow = { row: index + 2 };
    table.headers.forEach((header, colIndex) => {
      const field = mapping[header];
      if (!field) return;
      const value = cells[colIndex]?.trim();
      if (!value) return;
      mapped[field] = value;
    });
    return mapped;
  });
}

function errorsToCsv(report: LeadImportReport): string {
  const lines = ["row,field,message"];
  for (const error of report.errors) {
    for (const [field, messages] of Object.entries(error.fields)) {
      for (const message of messages) {
        lines.push(
          `${error.row},"${field.replaceAll('"', '""')}","${message.replaceAll('"', '""')}"`,
        );
      }
    }
  }
  return `\uFEFF${lines.join("\n")}`;
}

export function LeadImportWizard() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [table, setTable] = useState<SheetTable | null>(null);
  const [mapping, setMapping] = useState<Record<string, LeadImportFieldKey | "">>(
    {},
  );
  const [duplicateBehavior, setDuplicateBehavior] =
    useState<LeadImportDuplicateBehavior>("reject");
  const [stageId, setStageId] = useState<string>("");
  const [assigneeMode, setAssigneeMode] = useState<string>(ASSIGN_RULES);
  const [dryReport, setDryReport] = useState<LeadImportReport | null>(null);
  const [finalReport, setFinalReport] = useState<LeadImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const stagesQuery = usePipelineStages();
  const consultantsQuery = useStaffUsers({
    page: 1,
    pageSize: 100,
    role: "consultant",
    status: "active",
  });

  const stages = useMemo(
    () =>
      [...(stagesQuery.data ?? [])]
        .filter((stage) => stage.kind !== "won" && stage.kind !== "lost")
        .sort((a, b) => a.order - b.order),
    [stagesQuery.data],
  );

  const consultants = consultantsQuery.data?.items ?? [];

  const mappedRows = useMemo(
    () => (table ? mapSheetRows(table, mapping) : []),
    [table, mapping],
  );

  const mappingReady = useMemo(() => {
    const values = Object.values(mapping);
    return values.includes("name") && values.includes("mobile");
  }, [mapping]);

  async function onFileSelected(file: File | null) {
    if (!file) return;
    setBusy(true);
    setDryReport(null);
    setFinalReport(null);
    try {
      const result = await readSheetFile(file);
      if ("code" in result) {
        toast.error(result.message);
        return;
      }
      setFileName(file.name);
      setTable(result);
      setMapping(resolveColumnMapping(result.headers));
      setStep(2);
      toast.success(
        `${toPersianDigits(result.totalDataRows)} سطر از «${file.name}» خوانده شد`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function runDryRun() {
    if (!mappingReady) {
      toast.error("ستون‌های نام و موبایل باید نگاشت شوند");
      return;
    }
    saveStoredImportMapping(mapping);
    setBusy(true);
    setProgress(15);
    try {
      const assignedTo =
        assigneeMode === ASSIGN_RULES
          ? undefined
          : assigneeMode === ASSIGN_NONE
            ? null
            : assigneeMode;
      const report = await leadsApi.importLeads(
        {
          dryRun: true,
          duplicateBehavior,
          stageId: stageId || undefined,
          assignedTo,
          rows: mappedRows,
        },
        { dryRun: true },
      );
      setDryReport(report);
      setProgress(100);
      setStep(3);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  async function runCommit() {
    if (!dryReport) return;
    setBusy(true);
    setProgress(10);
    const tick = window.setInterval(() => {
      setProgress((value) => Math.min(90, value + 8));
    }, 200);
    try {
      const assignedTo =
        assigneeMode === ASSIGN_RULES
          ? undefined
          : assigneeMode === ASSIGN_NONE
            ? null
            : assigneeMode;
      const report = await leadsApi.importLeads(
        {
          dryRun: false,
          duplicateBehavior,
          stageId: stageId || undefined,
          assignedTo,
          rows: mappedRows,
        },
        { dryRun: false },
      );
      setFinalReport(report);
      setProgress(100);
      setStep(4);
      toast.success("ورود فایل انجام شد");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      window.clearInterval(tick);
      setBusy(false);
    }
  }

  async function revertImport() {
    if (!finalReport) return;
    setBusy(true);
    try {
      const result = await leadsApi.revertImport(finalReport.importId);
      toast.success(
        `${toPersianDigits(result.deletedCount)} لید حذف و ${toPersianDigits(result.skippedCount)} رد شد`,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="ورود لید از فایل"
        description={`CSV یا Excel تا ${formatNumber(MAX_LEAD_IMPORT_FILE_BYTES / (1024 * 1024))} مگابایت و ${formatNumber(MAX_LEAD_IMPORT_ROWS)} سطر.`}
        actions={
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/leads">
              <ArrowRight data-icon="inline-start" aria-hidden />
              بازگشت به لیدها
            </Link>
          </Button>
        }
      />

      <ol className="mb-6 flex flex-wrap gap-2" aria-label="مراحل ورود">
        {STEPS.map((item) => (
          <li
            key={item.id}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm",
              step === item.id
                ? "border-primary bg-primary/10 text-foreground"
                : step > item.id
                  ? "border-border bg-muted text-muted-foreground"
                  : "border-border text-muted-foreground",
            )}
          >
            {toPersianDigits(item.id)}. {item.title}
          </li>
        ))}
      </ol>

      {busy && progress > 0 ? (
        <Progress value={progress} className="mb-4" aria-label="پیشرفت ورود" />
      ) : null}

      {step === 1 ? (
        <section className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                downloadTextFile(
                  "leads-import-sample.csv",
                  buildLeadImportSampleCsv(),
                )
              }
            >
              <Download data-icon="inline-start" aria-hidden />
              دانلود نمونه
            </Button>
          </div>
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-12 text-center",
              busy && "opacity-60",
            )}
          >
            {busy ? (
              <Loader2 className="size-8 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-8 text-muted-foreground" aria-hidden />
            )}
            <span className="text-sm font-medium">
              فایل CSV یا XLSX را انتخاب کنید
            </span>
            <span className="text-xs text-muted-foreground">
              حداکثر {formatNumber(MAX_LEAD_IMPORT_FILE_BYTES / (1024 * 1024))}{" "}
              مگابایت
            </span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void onFileSelected(file);
                event.target.value = "";
              }}
            />
          </label>
        </section>
      ) : null}

      {step === 2 && table ? (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            فایل: {fileName} — {toPersianDigits(table.totalDataRows)} سطر
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-lg text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">ستون فایل</th>
                  <th className="px-3 py-2 text-start font-medium">نمونه</th>
                  <th className="px-3 py-2 text-start font-medium">فیلد لید</th>
                </tr>
              </thead>
              <tbody>
                {table.headers.map((header) => (
                  <tr key={header} className="border-t border-border">
                    <td className="px-3 py-2">{header || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {table.rows[0]?.[table.headers.indexOf(header)] || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={mapping[header] || UNMAPPED}
                        onValueChange={(value) =>
                          setMapping((prev) => ({
                            ...prev,
                            [header]:
                              value === UNMAPPED
                                ? ""
                                : (value as LeadImportFieldKey),
                          }))
                        }
                      >
                        <SelectTrigger aria-label={`نگاشت ${header}`}>
                          <SelectValue placeholder="نادیده گرفتن" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNMAPPED}>نادیده گرفتن</SelectItem>
                          {LEAD_IMPORT_FIELD_KEYS.map((key) => (
                            <SelectItem key={key} value={key}>
                              {LEAD_IMPORT_FIELD_LABELS[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="import-stage">مرحله پیش‌فرض</Label>
              <Select
                value={stageId || stages[0]?.id || ""}
                onValueChange={setStageId}
              >
                <SelectTrigger id="import-stage">
                  <SelectValue placeholder="مرحله جدید" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-assignee">مسئول</Label>
              <Select value={assigneeMode} onValueChange={setAssigneeMode}>
                <SelectTrigger id="import-assignee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ASSIGN_RULES}>قوانین تخصیص</SelectItem>
                  <SelectItem value={ASSIGN_NONE}>بدون مسئول</SelectItem>
                  {consultants.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-dup">تکراری‌ها</Label>
              <Select
                value={duplicateBehavior}
                onValueChange={(value) =>
                  setDuplicateBehavior(value as LeadImportDuplicateBehavior)
                }
              >
                <SelectTrigger id="import-dup">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_IMPORT_DUPLICATE_BEHAVIORS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {DUPLICATE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              قبلی
            </Button>
            <Button
              type="button"
              disabled={!mappingReady || busy}
              onClick={() => void runDryRun()}
            >
              {busy ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <ArrowLeft data-icon="inline-start" aria-hidden />
              )}
              پیش‌نمایش و اعتبارسنجی
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 && dryReport ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="کل سطرها" value={dryReport.totalRows} />
            <Stat label="معتبر" value={dryReport.validRows} />
            <Stat label="تکراری" value={dryReport.duplicateRows} />
            <Stat label="خطا / رد" value={dryReport.rejectedRows} />
          </div>
          <p className="text-sm text-muted-foreground">
            در ثبت واقعی: {toPersianDigits(dryReport.createdRows)} ایجاد و{" "}
            {toPersianDigits(dryReport.updatedRows)} به‌روزرسانی.
          </p>
          {dryReport.errors.length > 0 ? (
            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80">
                  <tr>
                    <th className="px-3 py-2 text-start">سطر</th>
                    <th className="px-3 py-2 text-start">دلیل</th>
                  </tr>
                </thead>
                <tbody>
                  {dryReport.errors.slice(0, 50).map((error) => (
                    <tr key={error.row} className="border-t border-border">
                      <td className="px-3 py-2">
                        {toPersianDigits(error.row)}
                      </td>
                      <td className="px-3 py-2 text-destructive">
                        {Object.entries(error.fields)
                          .flatMap(([field, messages]) =>
                            messages.map(
                              (message) =>
                                `${LEAD_IMPORT_FIELD_LABELS[field as LeadImportFieldKey] ?? field}: ${message}`,
                            ),
                          )
                          .join("؛ ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4" aria-hidden />
              خطای سطری گزارش نشد.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              قبلی
            </Button>
            <Button
              type="button"
              disabled={busy || dryReport.validRows === 0}
              onClick={() => void runCommit()}
            >
              {busy ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <FileSpreadsheet data-icon="inline-start" aria-hidden />
              )}
              ثبت نهایی
            </Button>
          </div>
        </section>
      ) : null}

      {step === 4 && finalReport ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="ایجاد شده" value={finalReport.createdRows} />
            <Stat label="به‌روز شده" value={finalReport.updatedRows} />
            <Stat label="رد شده" value={finalReport.rejectedRows} />
            <Stat label="تکراری" value={finalReport.duplicateRows} />
          </div>
          <p className="text-sm text-muted-foreground">
            شناسه ورود:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {finalReport.importId}
            </code>
          </p>
          <div className="flex flex-wrap gap-2">
            {finalReport.errors.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  downloadTextFile(
                    `lead-import-errors-${finalReport.importId}.csv`,
                    errorsToCsv(finalReport),
                  )
                }
              >
                <Download data-icon="inline-start" aria-hidden />
                دانلود خطاها
              </Button>
            ) : null}
            <Can permission="lead:import">
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => void revertImport()}
              >
                <RotateCcw data-icon="inline-start" aria-hidden />
                بازگردانی ورودی
              </Button>
            </Can>
            <Button type="button" variant="outline" asChild>
              <Link href={`/admin/leads?source=import`}>مشاهده لیدهای واردشده</Link>
            </Button>
            <Button
              type="button"
              onClick={() => {
                setStep(1);
                setTable(null);
                setFileName(null);
                setDryReport(null);
                setFinalReport(null);
              }}
            >
              ورود جدید
            </Button>
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{toPersianDigits(value)}</p>
    </div>
  );
}
