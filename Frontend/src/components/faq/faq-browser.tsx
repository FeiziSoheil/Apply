"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Faq } from "@/types";
import { FaqList } from "@/components/shared/faq-list";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/format";

const ALL = "all";

type FaqBrowserProps = {
  faqs: Faq[];
  categories: string[];
};

export function FaqBrowser({ faqs, categories }: FaqBrowserProps) {
  const searchId = useId();
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return faqs.filter((item) => {
      const categoryMatch =
        category === ALL || item.category === category;
      if (!categoryMatch) return false;
      if (!normalized) return true;
      return (
        item.question.toLowerCase().includes(normalized) ||
        item.answer.toLowerCase().includes(normalized)
      );
    });
  }, [faqs, category, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:max-w-md">
        <Label htmlFor={searchId}>جستجو در سوالات</Label>
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
            placeholder="عبارت سوال یا پاسخ را بنویسید…"
            className="ps-9"
          />
        </div>
      </div>

      <Tabs
        value={category}
        onValueChange={setCategory}
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

        <TabsContent value={category} className="mt-6">
          <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
            {formatNumber(filtered.length)} سوال
          </p>
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              سوالی با این فیلتر یافت نشد.
            </p>
          ) : (
            <FaqList faqs={filtered} withJsonLd={false} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
