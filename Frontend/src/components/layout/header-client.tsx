"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Country } from "@/types";
import {
  HEADER_ACTIONS,
  MAIN_NAV,
  type NavItem,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SiteLogo } from "@/components/layout/site-logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

type HeaderClientProps = {
  countries: Country[];
};

export function HeaderClient({ countries }: HeaderClientProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md transition-[height,box-shadow] duration-200",
        scrolled && "shadow-sm",
      )}
    >
      <Container
        className={cn(
          "flex items-center justify-between gap-4 transition-[height] duration-200",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <SiteLogo compact={scrolled} />

        <NavigationMenu className="hidden max-w-none flex-1 justify-center lg:flex" viewport>
          <NavigationMenuList className="flex-wrap gap-0.5">
            {MAIN_NAV.map((item) => (
              <DesktopNavItem
                key={item.title}
                item={item}
                countries={countries}
              />
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            {HEADER_ACTIONS.map((action) => (
              <Button
                key={action.href}
                asChild
                variant={action.variant}
                size={scrolled ? "sm" : "default"}
              >
                <Link href={action.href}>{action.title}</Link>
              </Button>
            ))}
          </div>
          <MobileNav countries={countries} />
        </div>
      </Container>
    </header>
  );
}

function DesktopNavItem({
  item,
  countries,
}: {
  item: NavItem;
  countries: Country[];
}) {
  if (item.type === "link") {
    return (
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href={item.href}>{item.title}</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }

  if (item.type === "dropdown") {
    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[min(100vw-2rem,20rem)] gap-1 p-1">
            {item.items.map((sub) => (
              <li key={sub.href}>
                <NavigationMenuLink asChild>
                  <Link
                    href={sub.href}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="font-medium text-foreground">
                      {sub.title}
                    </span>
                    {sub.description ? (
                      <span className="text-xs text-muted-foreground">
                        {sub.description}
                      </span>
                    ) : null}
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="w-[min(100vw-2rem,28rem)] p-2">
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            مقاصد تحصیلی
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {countries.map((country) => (
              <li key={country.id}>
                <NavigationMenuLink asChild>
                  <Link
                    href={`/countries/${country.slug}`}
                    className="flex items-start gap-2"
                  >
                    <span className="text-lg leading-none" aria-hidden="true">
                      {country.flagEmoji ?? "🌐"}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">
                        {country.nameFa}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {country.summary}
                      </span>
                    </span>
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-border pt-2">
            <NavigationMenuLink asChild>
              <Link
                href={item.href}
                className="justify-center font-medium text-primary"
              >
                مشاهده همه کشورها
              </Link>
            </NavigationMenuLink>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
