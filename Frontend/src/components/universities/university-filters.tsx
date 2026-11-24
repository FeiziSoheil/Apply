"use client";

import { useId, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
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
import { formatNumber } from "@/lib/format";
import { universitySearchParams } from "@/lib/university-search-params";

const ALL_VALUE = "__all__";

type UniversityFiltersProps = {
  countries: { slug: string; nameFa: string }[];
  resultCount: number;
};

export function UniversityFilters({
  countries,
  resultCount,
}: UniversityFiltersProps) {
  const searchId = useId();
  const countryId = useId();
  const [isPending, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(universitySearchParams, {
    history: "replace",
    shallow: false,
    startTransition,
  });
  const [searchDraft, setSearchDraft] = useState(params.q);
  const [syncedQuery, setSyncedQuery] = useState(params.q);

  if (params.q !== syncedQuery) {
    setSyncedQuery(params.q);
    setSearchDraft(params.q);
  }

  const hasFilters = params.q.trim() !== "" || params.country !== null;

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5"
      aria-busy={isPending}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
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
              placeholder="نام دانشگاه یا شهر…"
              className="ps-9"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={countryId}>کشور</Label>
          <Select
            dir="rtl"
            value={params.country ?? ALL_VALUE}
            onValueChange={(value) =>
              void setParams({
                country: !value || value === ALL_VALUE ? null : value,
                page: 1,
              })
            }
          >
            <SelectTrigger id={countryId} className="w-full">
              <SelectValue placeholder="همه کشورها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>همه کشورها</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country.slug} value={country.slug}>
                  {country.nameFa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isPending
            ? "در حال فیلتر…"
            : `${formatNumber(resultCount)} دانشگاه`}
        </p>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchDraft("");
              setSyncedQuery("");
              void setParams({ q: "", country: null, page: 1 });
            }}
          >
            پاک کردن فیلترها
          </Button>
        ) : null}
      </div>
    </div>
  );
}
