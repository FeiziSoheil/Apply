"use client";

import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type AccordionBlockItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

type AccordionBlockProps = {
  items: AccordionBlockItem[];
};

/** Client island: shadcn Accordion for RichContent FAQ blocks. */
export function AccordionBlock({ items }: AccordionBlockProps) {
  if (items.length === 0) return null;

  return (
    <Accordion type="multiple" className="w-full rounded-lg border border-border px-3">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger className="text-start text-base font-medium">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
