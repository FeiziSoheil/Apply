import { ListPageSkeleton } from "@/components/shared/list-page-skeleton";

export default function ProgramsLoading() {
  return <ListPageSkeleton cards={9} withFilters />;
}
