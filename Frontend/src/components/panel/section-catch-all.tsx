import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthArea } from "@/lib/auth/routes";
import {
  findGroupByBasePath,
  findSection,
  navHref,
} from "./nav-config";
import { PageContainer } from "./page-container";
import { SectionPlaceholder } from "./section-placeholder";

type SectionCatchAllProps = {
  area: AuthArea;
  params: Promise<{ slug: string[] }>;
};

function SectionFallback() {
  return (
    <PageContainer aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="min-h-64 w-full" />
    </PageContainer>
  );
}

async function SectionCatchAllContent({
  area,
  params,
}: SectionCatchAllProps) {
  const { slug } = await params;
  const path = slug.join("/");

  const group = findGroupByBasePath(area, path);
  const first = group?.items[0];
  if (first) redirect(navHref(area, first));

  if (!findSection(area, path)) notFound();
  return <SectionPlaceholder area={area} slug={path} />;
}

/**
 * Catch-all section page for `/admin/[...slug]` and `/panel/[...slug]`.
 * Params stay inside Suspense so Partial Prefetching can share one App Shell
 * across every link into the route.
 */
export function SectionCatchAll(props: SectionCatchAllProps) {
  return (
    <Suspense fallback={<SectionFallback />}>
      <SectionCatchAllContent {...props} />
    </Suspense>
  );
}
