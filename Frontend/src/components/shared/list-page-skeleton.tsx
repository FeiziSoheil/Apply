import { Skeleton } from "@/components/ui/skeleton";

type ListPageSkeletonProps = {
  /** Number of card placeholders */
  cards?: number;
  /** Show sidebar filter skeleton (desktop) */
  withFilters?: boolean;
  className?: string;
};

/** Generic skeleton for catalog / list pages */
export function ListPageSkeleton({
  cards = 6,
  withFilters = false,
}: ListPageSkeletonProps) {
  return (
    <div className="flex flex-col gap-6 py-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری…</span>
      <Skeleton className="h-4 w-40" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      {withFilters ? (
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="hidden flex-col gap-3 lg:flex">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: cards }).map((_, i) => (
              <li key={i}>
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <li key={i}>
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              <Skeleton className="mt-3 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
