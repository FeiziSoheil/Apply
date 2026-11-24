import { newsItems } from "@/data/news";
import { mockDelay } from "@/lib/mock-delay";
import type { NewsEventType, NewsItem } from "@/types";

function sortByPublishedDesc(items: NewsItem[]): NewsItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.publishedAt ?? 0).getTime() -
      new Date(a.publishedAt ?? 0).getTime(),
  );
}

export async function getNews(params?: {
  eventType?: NewsEventType;
}): Promise<NewsItem[]> {
  "use cache";
  await mockDelay();
  const items = sortByPublishedDesc(newsItems);
  if (!params?.eventType) return items;
  return items.filter((n) => n.eventType === params.eventType);
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  "use cache";
  await mockDelay();
  return newsItems.find((n) => n.slug === slug) ?? null;
}

export async function getNewsEventTypes(): Promise<NewsEventType[]> {
  "use cache";
  await mockDelay();
  const order: NewsEventType[] = [
    "webinar",
    "exhibition",
    "visa",
    "deadline",
    "general",
  ];
  const present = new Set(newsItems.map((n) => n.eventType));
  return order.filter((t) => present.has(t));
}
