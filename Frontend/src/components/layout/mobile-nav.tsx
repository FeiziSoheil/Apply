"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import type { Country } from "@/types";
import {
  HEADER_ACTIONS,
  MAIN_NAV,
  type NavItem,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileNavProps = {
  countries: Country[];
};

function countryHref(slug: string) {
  return `/countries/${slug}`;
}

export function MobileNav({ countries }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="باز کردن منو"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="start" className="w-full max-w-sm gap-0 p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle>منوی اصلی</SheetTitle>
          <SheetDescription className="sr-only">
            پیوندهای ناوبری سایت
          </SheetDescription>
        </SheetHeader>

        <nav
          className="flex-1 overflow-y-auto px-4 py-2"
          aria-label="منوی موبایل"
        >
          <Accordion type="multiple" className="w-full">
            {MAIN_NAV.map((item) => (
              <MobileNavEntry
                key={item.title}
                item={item}
                countries={countries}
                onNavigate={close}
              />
            ))}
          </Accordion>
        </nav>

        <SheetFooter className="border-t border-border">
          {HEADER_ACTIONS.map((action) => (
            <Button
              key={action.href}
              asChild
              variant={action.variant}
              className="w-full"
            >
              <Link href={action.href} onClick={close}>
                {action.title}
              </Link>
            </Button>
          ))}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavEntry({
  item,
  countries,
  onNavigate,
}: {
  item: NavItem;
  countries: Country[];
  onNavigate: () => void;
}) {
  if (item.type === "link") {
    return (
      <div className="border-b border-border py-1">
        <Link
          href={item.href}
          onClick={onNavigate}
          className="block rounded-lg py-2.5 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {item.title}
        </Link>
      </div>
    );
  }

  if (item.type === "dropdown") {
    return (
      <AccordionItem value={item.title}>
        <AccordionTrigger>{item.title}</AccordionTrigger>
        <AccordionContent className="flex flex-col gap-1 ps-2">
          {item.items.map((sub) => (
            <Link
              key={sub.href}
              href={sub.href}
              onClick={onNavigate}
              className="rounded-lg px-2 py-2 text-sm text-muted-foreground no-underline outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {sub.title}
            </Link>
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <AccordionItem value={item.title}>
      <AccordionTrigger>{item.title}</AccordionTrigger>
      <AccordionContent className="flex flex-col gap-1 ps-2">
        {countries.map((country) => (
          <Link
            key={country.id}
            href={countryHref(country.slug)}
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground no-underline outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {country.flagEmoji ? (
              <span aria-hidden="true">{country.flagEmoji}</span>
            ) : null}
            <span>{country.nameFa}</span>
          </Link>
        ))}
        <Link
          href={item.href}
          onClick={onNavigate}
          className="rounded-lg px-2 py-2 text-sm font-medium text-primary no-underline outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          مشاهده کشورها
        </Link>
      </AccordionContent>
    </AccordionItem>
  );
}
