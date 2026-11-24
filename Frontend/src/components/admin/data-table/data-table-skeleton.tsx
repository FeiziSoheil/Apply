import { Skeleton } from "@/components/ui/skeleton";

/** Suspense fallback of a page holding a `DataTable` (toolbar + rows) */
export function DataTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="در حال بارگذاری جدول">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-full sm:w-64" />
        <Skeleton className="hidden h-8 w-36 sm:block" />
        <Skeleton className="hidden h-8 w-36 sm:block" />
      </div>
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}
