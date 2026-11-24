"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { Search } from "lucide-react";
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
  CONTINENT_OPTIONS,
  COST_BAND_OPTIONS,
} from "@/lib/continents";
import { formatNumber } from "@/lib/format";

const ALL_VALUE = "all";

type CountryFiltersProps = {
  initialSearch?: string;
  initialContinent?: string;
  initialCostBand?: string;
  resultCount: number;
};

export function CountryFilters({
  initialSearch = "",
  initialContinent,
  initialCostBand,
  resultCount,
}: CountryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchId = useId();
  const continentId = useId();
  const costId = useId();

  const [search, setSearch] = useState(initialSearch);
  const [continent, setContinent] = useState(initialContinent ?? ALL_VALUE);
  const [costBand, setCostBand] = useState(initialCostBand ?? ALL_VALUE);

  function applyFilters(next: {
    search?: string;
    continent?: string;
    costBand?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const q = (next.search ?? search).trim();
    const cont = next.continent ?? continent;
    const cost = next.costBand ?? costBand;

    if (q) params.set("q", q);
    else params.delete("q");

    if (cont && cont !== ALL_VALUE) params.set("continent", cont);
    else params.delete("continent");

    if (cost && cost !== ALL_VALUE) params.set("cost", cost);
    else params.delete("cost");

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/countries?${query}` : "/countries");
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters({ search });
  }

  function handleReset() {
    setSearch("");
    setContinent(ALL_VALUE);
    setCostBand(ALL_VALUE);
    startTransition(() => {
      router.push("/countries");
    });
  }

  const hasFilters =
    search.trim() !== "" ||
    continent !== ALL_VALUE ||
    costBand !== ALL_VALUE;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5"
      aria-busy={isPending}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
          <Label htmlFor={searchId}>جستجو</Label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={searchId}
              name="q"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="نام کشور یا رشته…"
              className="ps-9"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={continentId}>قاره</Label>
          <Select
            dir="rtl"
            value={continent}
            onValueChange={(value) => {
              const next = value ?? ALL_VALUE;
              setContinent(next);
              applyFilters({ continent: next });
            }}
          >
            <SelectTrigger id={continentId} className="w-full">
              <SelectValue placeholder="همه قاره‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>همه قاره‌ها</SelectItem>
              {CONTINENT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={costId}>سطح هزینه</Label>
          <Select
            dir="rtl"
            value={costBand}
            onValueChange={(value) => {
              const next = value ?? ALL_VALUE;
              setCostBand(next);
              applyFilters({ costBand: next });
            }}
          >
            <SelectTrigger id={costId} className="w-full">
              <SelectValue placeholder="همه سطوح" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>همه سطوح</SelectItem>
              {COST_BAND_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
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
            : `${formatNumber(resultCount)} کشور`}
        </p>
        <div className="flex flex-wrap gap-2">
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
              پاک کردن فیلترها
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={isPending}>
            اعمال جستجو
          </Button>
        </div>
      </div>
    </form>
  );
}
