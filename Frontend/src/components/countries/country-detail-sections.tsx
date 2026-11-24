import { Badge } from "@/components/ui/badge";
import { CostTable } from "@/components/shared/cost-table";
import { FaqList } from "@/components/shared/faq-list";
import type { Country } from "@/types";
import { CountryUniversities } from "@/components/countries/country-universities";
import type { University } from "@/types";
import { SectionsView } from "@/components/shared/richcontent/sections-view";
import { sectionsNav } from "@/components/shared/richcontent/sections-nav";

type CountryDetailSectionsProps = {
  country: Country;
  universities: University[];
};

export function CountryDetailSections({
  country,
  universities,
}: CountryDetailSectionsProps) {
  return (
    <div className="flex flex-col gap-12">
      <SectionsView sections={country.sections} />

      <section id="cost-table" className="scroll-mt-28">
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          جدول هزینه‌ها
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          برآورد تقریبی برای برنامه‌ریزی مالی؛ مبالغ بسته به شهر و سبک زندگی
          تغییر می‌کند. زمان تقریبی ویزا: {country.visaDuration}
        </p>
        <CostTable
          items={country.costBreakdown}
          caption={`هزینه‌های تحصیل در ${country.nameFa}`}
        />
      </section>

      <section id="fields" className="scroll-mt-28">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          رشته‌های محبوب
        </h2>
        <div className="flex flex-wrap gap-2">
          {country.popularFields.map((field) => (
            <Badge key={field} variant="secondary">
              {field}
            </Badge>
          ))}
        </div>
      </section>

      <section id="universities" className="scroll-mt-28">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          دانشگاه‌های پیشنهادی
        </h2>
        <CountryUniversities
          universities={universities}
          countryNameFa={country.nameFa}
        />
      </section>

      <section id="faq" className="scroll-mt-28">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          سوالات متداول
        </h2>
        <FaqList faqs={country.faqs} />
      </section>
    </div>
  );
}

export function getCountrySectionNav(country: Country) {
  return [
    ...sectionsNav(country.sections),
    { id: "cost-table", label: "جدول هزینه‌ها" },
    { id: "fields", label: "رشته‌ها" },
    { id: "universities", label: "دانشگاه‌ها" },
    { id: "faq", label: "سوالات" },
  ] as const;
}

/** @deprecated Prefer getCountrySectionNav(country) */
export const COUNTRY_SECTION_NAV = [
  { id: "benefits", label: "مزایا" },
  { id: "costs", label: "هزینه‌ها" },
  { id: "requirements", label: "شرایط پذیرش" },
  { id: "visa", label: "ویزا" },
  { id: "work", label: "کار حین تحصیل" },
  { id: "post-study", label: "اقامت بعد از تحصیل" },
  { id: "fields", label: "رشته‌ها" },
  { id: "universities", label: "دانشگاه‌ها" },
  { id: "faq", label: "سوالات" },
] as const;
