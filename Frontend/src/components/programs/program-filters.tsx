"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { Filter, Search, X } from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
import {
  ProgramFilterFields,
  type ProgramFilterOptions,
  type ProgramFilterValues,
} from "@/components/programs/program-filter-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import { formatNumber } from "@/lib/format";
import { LANGUAGE_REQUIREMENT_TYPE_LABELS } from "@/lib/language-requirements";
import { programSearchParams } from "@/lib/program-search-params";
import { PROGRAM_SORT_LABELS, PROGRAM_SORTS } from "@/lib/program-sort";
import { isDefaultTuitionRange, TUITION_RANGE } from "@/lib/tuition-range";
import type { ProgramSort } from "@/types";

type ProgramFiltersProps = {
  options: ProgramFilterOptions;
  resultCount: number;
};

type Chip = {
  key: string;
  label: string;
  clear: Record<string, string | number | boolean | null>;
};

function valuesFromParams(params: {
  country: string | null;
  degreeLevel: ProgramFilterValues["degreeLevel"];
  field: string | null;
  languageType: ProgramFilterValues["languageType"];
  intake: string | null;
  hasScholarship: boolean | null;
  minTuition: number;
  maxTuition: number;
}): ProgramFilterValues {
  return {
    country: params.country,
    degreeLevel: params.degreeLevel,
    field: params.field,
    languageType: params.languageType,
    intake: params.intake,
    hasScholarship: params.hasScholarship,
    minTuition: params.minTuition,
    maxTuition: params.maxTuition,
  };
}

function useProgramFilterState() {
  const [isPending, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(programSearchParams, {
    history: "replace",
    shallow: false,
    startTransition,
  });
  return { params, setParams, isPending };
}

export function ProgramFilterSidebar({
  options,
}: {
  options: ProgramFilterOptions;
}) {
  const { params, setParams, isPending } = useProgramFilterState();

  return (
    <aside className="hidden rounded-xl border border-border bg-card p-4 lg:sticky lg:top-24 lg:block lg:self-start">
      <h2 className="mb-4 text-sm font-semibold text-foreground">فیلترها</h2>
      <ProgramFilterFields
        options={options}
        values={valuesFromParams(params)}
        onChange={(patch) => void setParams({ ...patch, page: 1 })}
        disabled={isPending}
      />
    </aside>
  );
}

export function ProgramFilters({ options, resultCount }: ProgramFiltersProps) {
  const searchId = useId();
  const sortId = useId();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { params, setParams, isPending } = useProgramFilterState();

  const [searchDraft, setSearchDraft] = useState(params.q);
  const [syncedQuery, setSyncedQuery] = useState(params.q);
  const [sheetDraft, setSheetDraft] = useState<ProgramFilterValues>(() =>
    valuesFromParams(params),
  );

  // Sync local search draft when URL query changes from chips / clear-all
  if (params.q !== syncedQuery) {
    setSyncedQuery(params.q);
    setSearchDraft(params.q);
  }

  const countryName = useMemo(() => {
    const map = new Map(options.countries.map((c) => [c.slug, c.nameFa]));
    return (slug: string) => map.get(slug) ?? slug;
  }, [options.countries]);

  // Typed view of the URL params (nuqs infers `any` for the raw params here)
  const { degreeLevel, languageType } = valuesFromParams(params);

  const chips: Chip[] = [];
  if (params.q.trim()) {
    chips.push({
      key: "q",
      label: `جستجو: ${params.q.trim()}`,
      clear: { q: "", page: 1 },
    });
  }
  if (params.country) {
    chips.push({
      key: "country",
      label: `کشور: ${countryName(params.country)}`,
      clear: { country: null, page: 1 },
    });
  }
  if (degreeLevel) {
    chips.push({
      key: "degreeLevel",
      label: `مقطع: ${DEGREE_LEVEL_LABELS[degreeLevel]}`,
      clear: { degreeLevel: null, page: 1 },
    });
  }
  if (params.field) {
    chips.push({
      key: "field",
      label: `رشته: ${params.field}`,
      clear: { field: null, page: 1 },
    });
  }
  if (languageType) {
    chips.push({
      key: "languageType",
      label: `زبان: ${LANGUAGE_REQUIREMENT_TYPE_LABELS[languageType]}`,
      clear: { languageType: null, page: 1 },
    });
  }
  if (params.intake) {
    chips.push({
      key: "intake",
      label: `پذیرش: ${params.intake}`,
      clear: { intake: null, page: 1 },
    });
  }
  if (params.hasScholarship) {
    chips.push({
      key: "hasScholarship",
      label: "دارای بورسیه",
      clear: { hasScholarship: null, page: 1 },
    });
  }
  if (!isDefaultTuitionRange(params.minTuition, params.maxTuition)) {
    chips.push({
      key: "tuition",
      label: `شهریه: ${formatNumber(params.minTuition)}–${formatNumber(params.maxTuition)} یورو`,
      clear: {
        minTuition: TUITION_RANGE.min,
        maxTuition: TUITION_RANGE.max,
        page: 1,
      },
    });
  }

  function clearAll() {
    setSearchDraft("");
    setSyncedQuery("");
    void setParams({
      q: "",
      country: null,
      degreeLevel: null,
      field: null,
      languageType: null,
      intake: null,
      hasScholarship: null,
      minTuition: TUITION_RANGE.min,
      maxTuition: TUITION_RANGE.max,
      sort: "relevant",
      page: 1,
    });
  }

  function applySheet() {
    void setParams({
      ...sheetDraft,
      page: 1,
    });
    setSheetOpen(false);
  }

  return (
    <div className="flex flex-col gap-4" aria-busy={isPending}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Label htmlFor={searchId}>جستجو</Label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={searchId}
              value={searchDraft}
              onChange={(e) => {
                const value = e.target.value;
                setSearchDraft(value);
                void setParams(
                  { q: value, page: 1 },
                  { limitUrlUpdates: debounce(350) },
                );
              }}
              placeholder="نام برنامه، دانشگاه یا رشته…"
              className="ps-9"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:w-56">
          <Label htmlFor={sortId}>مرتب‌سازی</Label>
          <Select
            dir="rtl"
            value={params.sort}
            onValueChange={(value) => {
              if (!value) return;
              void setParams({
                sort: value as ProgramSort,
                page: 1,
              });
            }}
          >
            <SelectTrigger id={sortId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROGRAM_SORTS.map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {PROGRAM_SORT_LABELS[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:hidden">
          <Sheet
            open={sheetOpen}
            onOpenChange={(open) => {
              setSheetOpen(open);
              if (open) {
                setSheetDraft(valuesFromParams(params));
              }
            }}
          >
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Filter className="size-4" aria-hidden />
                فیلترها
                {chips.length > 0 ? (
                  <Badge variant="secondary" className="ms-1">
                    {formatNumber(chips.length)}
                  </Badge>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>فیلتر برنامه‌ها</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4">
                <ProgramFilterFields
                  options={options}
                  values={sheetDraft}
                  onChange={(patch) =>
                    setSheetDraft((prev) => ({ ...prev, ...patch }))
                  }
                />
              </div>
              <SheetFooter className="gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSheetOpen(false)}
                >
                  انصراف
                </Button>
                <Button type="button" className="flex-1" onClick={applySheet}>
                  اعمال فیلترها
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isPending
            ? "در حال به‌روزرسانی نتایج…"
            : `${formatNumber(resultCount)} برنامه`}
        </p>
        {chips.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            پاک کردن همه
          </Button>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="فیلترهای فعال">
          {chips.map((chip) => (
            <li key={chip.key}>
              <Badge variant="secondary" className="gap-1 pe-1">
                {chip.label}
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`حذف فیلتر ${chip.label}`}
                  onClick={() => {
                    if ("q" in chip.clear) {
                      setSearchDraft(String(chip.clear.q ?? ""));
                    }
                    void setParams(chip.clear);
                  }}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
