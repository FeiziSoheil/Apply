import { faqs } from "@/data/faq";
import { mockDelay } from "@/lib/mock-delay";
import type { Faq } from "@/types";

export async function getFaqs(category?: string): Promise<Faq[]> {
  "use cache";
  await mockDelay();
  if (!category || category === "all") {
    return faqs;
  }
  return faqs.filter((item) => item.category === category);
}

/** Unique FAQ categories in display order */
export async function getFaqCategories(): Promise<string[]> {
  "use cache";
  await mockDelay();
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const item of faqs) {
    if (item.category && !seen.has(item.category)) {
      seen.add(item.category);
      categories.push(item.category);
    }
  }
  return categories;
}

/** Compatibility alias used by /faq page */
export async function getFaqItems(category?: string): Promise<Faq[]> {
  return getFaqs(category);
}
