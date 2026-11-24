import Link from "next/link";
import { ProgramCard } from "@/components/programs/program-card";
import { Button } from "@/components/ui/button";
import type { ProgramListItem } from "@/services/programs";

type ProgramResultsProps = {
  items: ProgramListItem[];
};

export function ProgramResults({ items }: ProgramResultsProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-muted/30 p-6 sm:p-8">
        <p className="text-muted-foreground">
          برنامه‌ای با این فیلترها پیدا نشد. فیلترها را تغییر دهید یا جستجوی
          گسترده‌تری امتحان کنید.
        </p>
        <Button asChild variant="outline">
          <Link href="/programs">پاک کردن فیلترها</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
      {items.map((program) => (
        <li key={program.id}>
          <ProgramCard program={program} />
        </li>
      ))}
    </ul>
  );
}
