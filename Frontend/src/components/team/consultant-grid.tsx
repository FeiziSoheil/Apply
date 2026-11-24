import type { Consultant, Country } from "@/types";
import { ConsultantCard } from "@/components/team/consultant-card";

type ConsultantGridProps = {
  consultants: Consultant[];
  countries: Country[];
};

export function ConsultantGrid({
  consultants,
  countries,
}: ConsultantGridProps) {
  const countryNames = new Map(countries.map((c) => [c.slug, c.nameFa]));

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {consultants.map((consultant) => (
        <li key={consultant.id}>
          <ConsultantCard
            consultant={consultant}
            countryNames={countryNames}
          />
        </li>
      ))}
    </ul>
  );
}
