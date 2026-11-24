"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { blogSearchParams } from "@/lib/blog-search-params";
import { formatNumber } from "@/lib/format";

const ALL = "all";

type BlogFiltersProps = {
  categories: string[];
  resultCount: number;
};

export function BlogFilters({ categories, resultCount }: BlogFiltersProps) {
  const searchId = useId();
  const [isPending, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(blogSearchParams, {
    shallow: false,
    startTransition,
  });
  const [query, setQuery] = useState(params.q);
  const [syncedQuery, setSyncedQuery] = useState(params.q);

  // Sync the draft when the URL query changes (e.g. back/forward navigation)
  if (params.q !== syncedQuery) {
    setSyncedQuery(params.q);
    setQuery(params.q);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = query.trim();
      if (next === params.q) return;
      void setParams({ q: next || null, page: 1 });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [query, params.q, setParams]);

  const categoryValue = params.category ?? ALL;

  return (
    <div
      className="flex flex-col gap-6"
      data-pending={isPending ? "" : undefined}
    >
      <div className="flex flex-col gap-2 sm:max-w-md">
        <Label htmlFor={searchId}>جستجو در مقالات</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="عنوان، موضوع یا برچسب…"
            className="ps-9"
          />
        </div>
      </div>

      <Tabs
        value={categoryValue}
        onValueChange={(value) => {
          void setParams({
            category: value === ALL ? null : value,
            page: 1,
          });
        }}
        className="w-full"
      >
        <TabsList
          variant="line"
          className="h-auto w-full flex-wrap justify-start gap-1"
        >
          <TabsTrigger value={ALL}>همه</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {formatNumber(resultCount)} مقاله
      </p>
    </div>
  );
}
