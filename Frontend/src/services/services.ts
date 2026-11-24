import { services } from "@/data/services";
import { mockDelay } from "@/lib/mock-delay";
import type { Service } from "@/types";

export async function getServices(): Promise<Service[]> {
  "use cache";
  await mockDelay();
  return services;
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  "use cache";
  await mockDelay();
  return services.find((s) => s.slug === slug) ?? null;
}

/** Resolve related services by slug, preserving order and skipping missing */
export async function getRelatedServices(
  slugs: string[],
): Promise<Service[]> {
  "use cache";
  await mockDelay();
  const bySlug = new Map(services.map((s) => [s.slug, s]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((s): s is Service => s !== undefined);
}
