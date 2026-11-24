import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { JsonLd } from "@/components/shared/json-ld";
import { buildFaqPageJsonLd } from "@/lib/seo";
import type { Faq } from "@/types";
import { cn } from "@/lib/utils";

type FaqListProps = {
  faqs: Faq[];
  /** Emit FAQPage JSON-LD script (default true) */
  withJsonLd?: boolean;
  className?: string;
};

export function FaqList({
  faqs,
  withJsonLd = true,
  className,
}: FaqListProps) {
  if (faqs.length === 0) return null;

  const jsonLd = withJsonLd ? buildFaqPageJsonLd(faqs) : null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
