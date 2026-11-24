"use client";

import Link from "next/link";
import type { Faq } from "@/types";
import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqSectionProps = {
  faqs: Faq[];
};

export function FaqSection({ faqs }: FaqSectionProps) {
  return (
    <Section title="سوالات متداول"
      subtitle="پاسخ کوتاه به پرسش‌های پرتکرار متقاضیان"
      headerAction={
        <Button asChild variant="outline" size="sm">
          <Link href="/faq">همه سوالات</Link>
        </Button>
      }
    >
      <FadeIn>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </FadeIn>
    </Section>
  );
}
