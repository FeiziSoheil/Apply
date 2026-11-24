import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export default function CountriesLoading() {
  return <ListPageSkeleton cards={6} withFilters />;
}
