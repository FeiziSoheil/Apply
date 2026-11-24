"use client";

import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { QuickSearchForm } from "@/components/home/quick-search-form";

type CountryOption = {
  slug: string;
  nameFa: string;
};

type QuickSearchProps = {
  countries: CountryOption[];
  fields: string[];
};

export function QuickSearch({ countries, fields }: QuickSearchProps) {
  return (
    <Section title="جستجوی سریع برنامه"
      subtitle="کشور، مقطع و رشته را انتخاب کنید تا برنامه‌های مرتبط را ببینید"
      className="bg-muted/40">
      <FadeIn>
        <QuickSearchForm countries={countries} fields={fields} />
      </FadeIn>
    </Section>
  );
}
