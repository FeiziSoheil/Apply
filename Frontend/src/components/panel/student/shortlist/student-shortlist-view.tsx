"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  Layers,
  Loader2,
  MessageSquare,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/panel/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { formatTuition } from "@/lib/format-tuition";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import {
  useConsultMyShortlist,
  usePutMyShortlist,
} from "@/features/student-panel/mutations";
import {
  useMyShortlist,
  useMyShortlistCompare,
} from "@/features/student-panel/queries";
import type { ShortlistCompareItem } from "@/contracts/student-panel";
import { CaseLinkGate } from "../case-link-gate";
import {
  StudentPanelEmpty,
  StudentPanelError,
  StudentPanelSkeleton,
} from "../panel-query-state";

export function StudentShortlistView() {
  return (
    <CaseLinkGate requireCase={false}>
      <ShortlistInner />
    </CaseLinkGate>
  );
}

function ShortlistInner() {
  const router = useRouter();
  const shortlistQuery = useMyShortlist();
  const compareQuery = useMyShortlistCompare();
  const putMutation = usePutMyShortlist();
  const consultMutation = useConsultMyShortlist();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [consultNote, setConsultNote] = useState("");

  const items = useMemo(
    () => compareQuery.data?.items ?? [],
    [compareQuery.data?.items],
  );

  // Group items by country
  const groupedByCountry = useMemo(() => {
    const groups: Record<string, ShortlistCompareItem[]> = {};
    for (const item of items) {
      const country = item.countryName || "سایر مقاصد";
      if (!groups[country]) groups[country] = [];
      groups[country].push(item);
    }
    return groups;
  }, [items]);

  const programItems = useMemo(
    () => items.filter((item) => Boolean(item.programId)),
    [items],
  );

  const selectedPrograms = useMemo(
    () =>
      programItems.filter(
        (item) => item.programId && selectedIds.includes(item.programId),
      ),
    [programItems, selectedIds],
  );

  const toggleSelectProgram = (programId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(programId)) {
        return prev.filter((id) => id !== programId);
      }
      if (prev.length >= 4) {
        toast.error("امکان مقایسه حداکثر ۴ برنامه به‌طور همزمان وجود دارد");
        return prev;
      }
      return [...prev, programId];
    });
  };

  const handleRemove = async (item: ShortlistCompareItem) => {
    try {
      await putMutation.mutateAsync({
        programId: item.programId ?? undefined,
        universityId: item.universityId ?? undefined,
        countrySlug: item.countrySlug ?? undefined,
      });
      if (item.programId) {
        setSelectedIds((prev) => prev.filter((id) => id !== item.programId));
      }
      toast.success("از علاقه‌مندی‌ها حذف شد");
    } catch {
      toast.error("خطا در حذف مورد");
    }
  };

  const handleConsultSubmit = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await consultMutation.mutateAsync({
        programIds: selectedIds,
        note: consultNote.trim() || undefined,
      });
      toast.success(res.message);
      setIsConsultOpen(false);
      setConsultNote("");
      router.push("/panel/tickets");
    } catch {
      toast.error("خطا در ارسال درخواست مشاوره");
    }
  };

  if (shortlistQuery.isLoading || compareQuery.isLoading) {
    return <StudentPanelSkeleton />;
  }
  if (shortlistQuery.isError || compareQuery.isError) {
    return (
      <StudentPanelError
        error={shortlistQuery.error || compareQuery.error}
        onRetry={() => {
          void shortlistQuery.refetch();
          void compareQuery.refetch();
        }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <PageContainer className="gap-5 pb-24 md:pb-16">
        <header className="space-y-1">
          <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
            علاقه‌مندی‌ها
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            برنامه‌ها و دانشگاه‌های نشان‌شده
          </p>
        </header>
        <StudentPanelEmpty
          title="لیست علاقه‌مندی‌های شما خالی است"
          description="با کلیک روی آیکون قلب در صفحات برنامه‌ها، دانشگاه‌ها یا کشورها می‌توانید آن‌ها را در اینجا ذخیره کنید."
        >
          <Button asChild className="min-h-12 w-full rounded-xl text-base font-semibold sm:w-auto sm:text-sm">
            <Link href="/programs">مشاهده و جستجوی برنامه‌ها</Link>
          </Button>
        </StudentPanelEmpty>
      </PageContainer>
    );
  }

  // Best values computation for comparison highlight
  const lowestTuition = selectedPrograms.reduce<number | null>((min, item) => {
    if (item.tuition === null || item.tuition === undefined) return min;
    return min === null ? item.tuition : Math.min(min, item.tuition);
  }, null);

  const lowestGpa = selectedPrograms.reduce<number | null>((min, item) => {
    if (item.minGpa === null || item.minGpa === undefined) return min;
    return min === null ? item.minGpa : Math.min(min, item.minGpa);
  }, null);

  return (
    <PageContainer className="gap-5 pb-32 md:gap-6 md:pb-24">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
            علاقه‌مندی‌ها
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {toPersianDigits(items.length)} مورد در لیست علاقه‌مندی‌های شما
          </p>
        </div>

        {programItems.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-10 w-full rounded-xl text-xs font-semibold sm:w-auto sm:text-sm"
              onClick={() => {
                if (selectedIds.length === 0) {
                  setSelectedIds(
                    programItems.slice(0, 4).map((p) => p.programId!),
                  );
                } else {
                  setSelectedIds([]);
                }
              }}
            >
              {selectedIds.length > 0 ? "لغو انتخاب" : "انتخاب برنامه‌ها"}
            </Button>
          </div>
        )}
      </header>

      {/* Grouped lists */}
      <div className="space-y-7">
        {Object.entries(groupedByCountry).map(([country, groupItems]) => (
          <section key={country} className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2.5">
              <span className="text-xl">🌍</span>
              <h2 className="font-heading text-base font-bold sm:text-lg">{country}</h2>
              <Badge variant="secondary" className="mr-auto rounded-full text-xs tabular-nums">
                {toPersianDigits(groupItems.length)} مورد
              </Badge>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {groupItems.map((item) => {
                const isProgram = Boolean(item.programId);
                const isSelected =
                  isProgram && item.programId
                    ? selectedIds.includes(item.programId)
                    : false;

                return (
                  <div
                    key={
                      item.programId || item.universityId || item.countrySlug
                    }
                    className={`relative flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-xs transition-all ${
                      isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isProgram && (
                            <div className="flex min-h-8 min-w-8 items-center justify-center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  toggleSelectProgram(item.programId!)
                                }
                                aria-label={`انتخاب ${item.title} برای مقایسه`}
                                className="size-5 rounded-md"
                              />
                            </div>
                          )}
                          <Badge
                            variant={isProgram ? "default" : "outline"}
                            className="rounded-full text-xs"
                          >
                            {isProgram
                              ? "برنامه"
                              : item.universityId
                                ? "دانشگاه"
                                : "کشور"}
                          </Badge>
                          {item.hasScholarship && (
                            <Badge variant="secondary" className="rounded-full text-xs">
                              بورسیه
                            </Badge>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item)}
                          disabled={putMutation.isPending}
                          className="size-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="حذف از علاقه‌مندی‌ها"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <h3 className="mt-2.5 font-bold text-foreground text-sm sm:text-base line-clamp-2">
                        {item.title}
                      </h3>

                      {item.universityName && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          {item.universityName}
                        </p>
                      )}

                      <dl className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2.5 text-xs">
                        {item.degreeLevel && (
                          <div>
                            <dt className="text-muted-foreground">مقطع</dt>
                            <dd className="font-semibold text-foreground">
                              {DEGREE_LEVEL_LABELS[
                                item.degreeLevel as keyof typeof DEGREE_LEVEL_LABELS
                              ] ?? item.degreeLevel}
                            </dd>
                          </div>
                        )}
                        {item.tuition !== null && item.tuition !== undefined && (
                          <div>
                            <dt className="text-muted-foreground">
                              شهریه سالانه
                            </dt>
                            <dd className="font-semibold text-foreground">
                              {formatTuition(
                                item.tuition,
                                item.currency ?? "EUR",
                              )}
                            </dd>
                          </div>
                        )}
                        {item.deadline && (
                          <div>
                            <dt className="text-muted-foreground">ددلاین</dt>
                            <dd className="font-semibold text-foreground">
                              {formatJalaliDate(item.deadline)}
                            </dd>
                          </div>
                        )}
                        {item.duration && (
                          <div>
                            <dt className="text-muted-foreground">طول دوره</dt>
                            <dd className="font-semibold text-foreground">
                              {item.duration}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between border-t pt-3 text-xs">
                      {isProgram && (
                        <button
                          type="button"
                          onClick={() => toggleSelectProgram(item.programId!)}
                          className="min-h-9 font-semibold text-primary hover:underline"
                        >
                          {isSelected ? "حذف از مقایسه" : "افزودن به مقایسه"}
                        </button>
                      )}
                      {item.programId && (
                        <Link
                          href={`/programs`}
                          className="mr-auto inline-flex min-h-9 items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                        >
                          مشاهده
                          <ExternalLink className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Floating comparison & consultation bar (positioned safely above bottom nav on mobile) */}
      {selectedIds.length > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-lg md:inset-x-0 md:bottom-6 md:max-w-2xl md:px-4">
          <div className="flex items-center justify-between gap-2 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur supports-backdrop-filter:bg-background/85">
            <div className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground tabular-nums">
                {toPersianDigits(selectedIds.length)}
              </span>
              <span>برنامه انتخاب شده</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCompareOpen(true)}
                disabled={selectedIds.length < 2}
                className="min-h-10 gap-1.5 rounded-xl text-xs font-medium"
              >
                <Layers className="size-3.5 sm:size-4" />
                مقایسه ({toPersianDigits(selectedIds.length)})
              </Button>

              <Button
                size="sm"
                onClick={() => setIsConsultOpen(true)}
                className="min-h-10 gap-1.5 rounded-xl text-xs font-semibold shadow-xs"
              >
                <MessageSquare className="size-3.5 sm:size-4" />
                درخواست مشاوره
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedIds([])}
                className="size-9 rounded-xl text-muted-foreground"
                aria-label="بستن نوار"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Program Comparison Modal */}
      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-4xl max-h-[88svh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg sm:text-xl">
              <Layers className="size-5 text-primary" />
              مقایسه برنامه‌های تحصیلی منتخب
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              مقایسه مشخصات و ویژگی‌های {toPersianDigits(selectedPrograms.length)}{" "}
              برنامه انتخابی شما. مقادیر برتر با رنگ متمایز برجسته شده‌اند.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="border-b bg-muted/60">
                <tr>
                  <th className="p-2.5 sm:p-3 font-semibold text-muted-foreground whitespace-nowrap">
                    ویژگی
                  </th>
                  {selectedPrograms.map((p) => (
                    <th key={p.programId} className="p-2.5 sm:p-3 font-bold text-foreground min-w-36">
                      {p.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-2.5 sm:p-3 font-medium text-muted-foreground whitespace-nowrap">
                    دانشگاه
                  </td>
                  {selectedPrograms.map((p) => (
                    <td key={p.programId} className="p-2.5 sm:p-3 font-medium">
                      {p.universityName ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 font-medium text-muted-foreground whitespace-nowrap">
                    کشور
                  </td>
                  {selectedPrograms.map((p) => (
                    <td key={p.programId} className="p-2.5 sm:p-3">
                      {p.countryName ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 font-medium text-muted-foreground whitespace-nowrap">
                    مقطع
                  </td>
                  {selectedPrograms.map((p) => (
                    <td key={p.programId} className="p-2.5 sm:p-3">
                      {p.degreeLevel
                        ? DEGREE_LEVEL_LABELS[
                            p.degreeLevel as keyof typeof DEGREE_LEVEL_LABELS
                          ] ?? p.degreeLevel
                        : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 font-medium text-muted-foreground whitespace-nowrap">
                    شهریه سالانه
                  </td>
                  {selectedPrograms.map((p) => {
                    const isBest =
                      p.tuition !== null &&
                      p.tuition !== undefined &&
                      p.tuition === lowestTuition;
                    return (
                      <td
                        key={p.programId}
                        className={`p-2.5 sm:p-3 font-bold ${
                          isBest
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold"
                            : ""
                        }`}
                      >
                        {p.tuition !== null && p.tuition !== undefined
                          ? formatTuition(p.tuition, p.currency ?? "EUR")
                          : "—"}
                        {isBest && (
                          <span className="mr-1 inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                            ★ بهترین
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 font-medium text-muted-foreground whitespace-nowrap">
                    طول دوره
                  </td>
                  {selectedPrograms.map((p) => (
                    <td key={p.programId} className="p-2.5 sm:p-3">
                      {p.duration ?? "۲ سال"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 font-medium text-muted-foreground whitespace-nowrap">
                    مهلت درخواست (ددلاین)
                  </td>
                  {selectedPrograms.map((p) => (
                    <td key={p.programId} className="p-2.5 sm:p-3">
                      {p.deadline ? formatJalaliDate(p.deadline) : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 font-medium text-muted-foreground whitespace-nowrap">
                    شرط زبان
                  </td>
                  {selectedPrograms.map((p) => (
                    <td key={p.programId} className="p-2.5 sm:p-3">
                      {p.languageRequirement ?? "IELTS 6.5 یا معادل"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 font-medium text-muted-foreground whitespace-nowrap">
                    حداقل معدل
                  </td>
                  {selectedPrograms.map((p) => {
                    const isBest =
                      p.minGpa !== null &&
                      p.minGpa !== undefined &&
                      p.minGpa === lowestGpa;
                    return (
                      <td
                        key={p.programId}
                        className={`p-2.5 sm:p-3 ${
                          isBest
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                            : ""
                        }`}
                      >
                        {p.minGpa !== null && p.minGpa !== undefined
                          ? toPersianDigits(p.minGpa)
                          : "۱۴"}
                        {isBest && lowestGpa !== null && (
                          <span className="mr-1 text-xs"> (آسان‌ترین)</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 font-medium text-muted-foreground whitespace-nowrap">
                    بورسیه تحصیلی
                  </td>
                  {selectedPrograms.map((p) => (
                    <td
                      key={p.programId}
                      className={`p-2.5 sm:p-3 ${
                        p.hasScholarship
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                          : ""
                      }`}
                    >
                      {p.hasScholarship ? "دارد (قابل تقاضا)" : "ندارد"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setIsCompareOpen(false)}
              className="min-h-11 w-full rounded-xl sm:w-auto"
            >
              بستن
            </Button>
            <Button
              onClick={() => {
                setIsCompareOpen(false);
                setIsConsultOpen(true);
              }}
              className="min-h-11 w-full gap-1.5 rounded-xl sm:w-auto"
            >
              <MessageSquare className="size-4" />
              درخواست مشاوره درباره این برنامه‌ها
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consultation Request Modal */}
      <Dialog open={isConsultOpen} onOpenChange={setIsConsultOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg max-h-[88svh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg sm:text-xl">
              <MessageSquare className="size-5 text-primary" />
              درخواست مشاوره درباره برنامه‌های انتخابی
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              مشاور پرونده شما جزئیات این برنامه‌ها را بررسی کرده و راهنمایی‌های
              لازم را در قالب یک تیکت به شما ارائه می‌دهد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs font-semibold text-foreground sm:text-sm">
                برنامه‌های انتخاب‌شده:
              </p>
              <ul className="mt-2 space-y-1.5 rounded-xl border bg-muted/40 p-3 text-xs sm:text-sm">
                {selectedPrograms.map((p) => (
                  <li key={p.programId} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-primary" />
                    <span className="font-medium line-clamp-1">{p.title}</span>
                    {p.universityName && (
                      <span className="text-xs text-muted-foreground">
                        ({p.universityName})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="consult-note"
                className="text-xs font-semibold text-foreground sm:text-sm"
              >
                توضیحات یا سوالات شما (اختیاری):
              </label>
              <Textarea
                id="consult-note"
                placeholder="نکات، سوالات و اولویت‌های خود را بنویسید..."
                value={consultNote}
                onChange={(e) => setConsultNote(e.target.value)}
                rows={4}
                className="rounded-xl text-base sm:text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setIsConsultOpen(false)}
              disabled={consultMutation.isPending}
              className="min-h-11 w-full rounded-xl sm:w-auto"
            >
              انصراف
            </Button>
            <Button
              onClick={handleConsultSubmit}
              disabled={consultMutation.isPending}
              className="min-h-11 w-full gap-1.5 rounded-xl sm:w-auto font-semibold"
            >
              {consultMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              ثبت تیکت مشاوره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
