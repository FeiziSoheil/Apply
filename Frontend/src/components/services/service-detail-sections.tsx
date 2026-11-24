import { SectionsView } from "@/components/shared/richcontent/sections-view";
import { sectionsNav } from "@/components/shared/richcontent/sections-nav";
import { FaqList } from "@/components/shared/faq-list";
import { toPersianDigits } from "@/lib/format";
import type { Service } from "@/types";

type ServiceDetailSectionsProps = {
  service: Service;
};

export function getServiceSectionNav(service: Service) {
  return [
    ...sectionsNav(service.sections),
    { id: "process", label: "مراحل" },
    { id: "documents", label: "مدارک" },
    { id: "faq", label: "سوالات" },
  ] as const;
}

export function ServiceDetailSections({ service }: ServiceDetailSectionsProps) {
  return (
    <div className="flex flex-col gap-12">
      <SectionsView sections={service.sections} />

      <section id="process" className="scroll-mt-28">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          مراحل انجام
        </h2>
        <ol className="relative flex flex-col gap-6 border-s border-border ps-6">
          {service.steps.map((step, index) => (
            <li key={step} className="relative">
              <span className="absolute -start-[1.9rem] flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {toPersianDigits(index + 1)}
              </span>
              <p className="pt-1 text-foreground">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="documents" className="scroll-mt-28">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          مدارک لازم
        </h2>
        <ul className="list-disc space-y-2 pe-1 ps-5 text-foreground">
          {service.requiredDocuments.map((doc) => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      </section>

      <section id="faq" className="scroll-mt-28">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          سوالات متداول
        </h2>
        <FaqList faqs={service.faqs} />
      </section>
    </div>
  );
}

export const SERVICE_SECTION_NAV = [
  { id: "overview", label: "توضیح" },
  { id: "benefits", label: "مزایا" },
  { id: "process", label: "مراحل" },
  { id: "documents", label: "مدارک" },
  { id: "faq", label: "سوالات" },
] as const;
