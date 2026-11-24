"use client";

import { useMemo, useState } from "react";
import type { NewsEventType, NewsItem } from "@/types";
import { NewsCard } from "@/components/news/news-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NEWS_EVENT_TYPE_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

const ALL = "all";

type NewsBrowserProps = {
  items: NewsItem[];
  eventTypes: NewsEventType[];
};

export function NewsBrowser({ items, eventTypes }: NewsBrowserProps) {
  const [filter, setFilter] = useState(ALL);

  const filtered = useMemo(() => {
    if (filter === ALL) return items;
    return items.filter((item) => item.eventType === filter);
  }, [filter, items]);

  return (
    <Tabs value={filter} onValueChange={setFilter} className="w-full">
      <TabsList
        variant="line"
        className="h-auto w-full flex-wrap justify-start gap-1"
      >
        <TabsTrigger value={ALL}>همه</TabsTrigger>
        {eventTypes.map((type) => (
          <TabsTrigger key={type} value={type}>
            {NEWS_EVENT_TYPE_LABELS[type]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={filter} className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          {formatNumber(filtered.length)} خبر
        </p>
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            خبری با این فیلتر یافت نشد.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <li key={item.id}>
                <NewsCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}
