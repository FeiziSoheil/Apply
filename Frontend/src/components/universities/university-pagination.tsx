import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatNumber } from "@/lib/format";
import {
  serializeUniversitySearchParams,
  type UniversitySearchParams,
} from "@/lib/university-search-params";

type UniversityPaginationProps = {
  page: number;
  totalPages: number;
  params: UniversitySearchParams;
};

function pageHref(params: UniversitySearchParams, page: number): string {
  return serializeUniversitySearchParams("/universities", { ...params, page });
}

function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current]);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i > 1 && i < total) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export function UniversityPagination({
  page,
  totalPages,
  params,
}: UniversityPaginationProps) {
  if (totalPages <= 1) return null;

  const items = buildPageList(page, totalPages);

  return (
    <Pagination dir="rtl" aria-label="صفحه‌بندی دانشگاه‌ها">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={page > 1 ? pageHref(params, page - 1) : undefined}
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>

        {items.map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`e-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href={pageHref(params, item)}
                isActive={item === page}
                aria-label={`صفحه ${formatNumber(item)}`}
              >
                {formatNumber(item)}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href={page < totalPages ? pageHref(params, page + 1) : undefined}
            aria-disabled={page >= totalPages}
            className={
              page >= totalPages ? "pointer-events-none opacity-50" : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
