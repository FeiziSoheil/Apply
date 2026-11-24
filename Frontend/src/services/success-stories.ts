import { successStories } from "@/data/success-stories";
import { mockDelay } from "@/lib/mock-delay";
import type { SuccessStory } from "@/types";

export async function getSuccessStories(): Promise<SuccessStory[]> {
  "use cache";
  await mockDelay();
  return successStories;
}

export async function getSuccessStoryBySlug(
  slug: string,
): Promise<SuccessStory | null> {
  "use cache";
  await mockDelay();
  return successStories.find((s) => s.slug === slug) ?? null;
}
