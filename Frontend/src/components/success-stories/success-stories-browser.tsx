"use client";

import { useMemo, useState } from "react";
import type { SuccessStory } from "@/types";
import { SuccessStoryCard } from "@/components/success-stories/success-story-card";
import { SuccessStoryDialog } from "@/components/success-stories/success-story-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/format";

const ALL = "all";

type SuccessStoriesBrowserProps = {
  stories: SuccessStory[];
};

export function SuccessStoriesBrowser({ stories }: SuccessStoriesBrowserProps) {
  const [country, setCountry] = useState(ALL);
  const [active, setActive] = useState<SuccessStory | null>(null);

  const countries = useMemo(() => {
    const set = new Set(stories.map((s) => s.country));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fa"));
  }, [stories]);

  const filtered = useMemo(() => {
    if (country === ALL) return stories;
    return stories.filter((s) => s.country === country);
  }, [stories, country]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor="story-country-filter">فیلتر بر اساس کشور</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger id="story-country-filter" className="w-full">
            <SelectValue placeholder="همه کشورها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>همه کشورها</SelectItem>
            {countries.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {formatNumber(filtered.length)} داستان
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          داستانی برای این کشور یافت نشد.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((story) => (
            <li key={story.id}>
              <SuccessStoryCard
                story={story}
                onOpen={(s) => setActive(s)}
              />
            </li>
          ))}
        </ul>
      )}

      <SuccessStoryDialog
        story={active}
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      />
    </div>
  );
}
