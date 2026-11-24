import Link from "next/link";
import {
  Camera,
  Link2,
  MessageCircle,
  Send,
  type LucideIcon,
} from "lucide-react";
import type { Country } from "@/types";
import {
  CONTACT,
  FOOTER_CTA,
  FOOTER_LEGAL_LINKS,
  FOOTER_QUICK_LINKS,
  INSTITUTE,
  SOCIAL_LINKS,
  TRUST_BADGES,
  type SocialLink,
} from "@/lib/constants";
import { getCountries } from "@/services/countries";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/forms/newsletter-form";

const SOCIAL_ICONS: Record<SocialLink["icon"], LucideIcon> = {
  camera: Camera,
  send: Send,
  "link-2": Link2,
  "message-circle": MessageCircle,
};

/** Static Jalali year for prerender-safe copyright (avoid `new Date()` in RSC) */
const COPYRIGHT_YEAR = "۱۴۰۴";

export async function Footer() {
  const countries = await getCountries();
  return <FooterContent countries={countries} />;
}

function FooterContent({ countries }: { countries: Country[] }) {
  return (
    <footer className="mt-auto">
      <div className="border-y border-border bg-primary text-primary-foreground">
        <Container className="flex flex-col items-start gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-xl font-bold text-primary-foreground sm:text-2xl">
              {FOOTER_CTA.title}
            </p>
            <p className="text-sm text-primary-foreground/85">
              {FOOTER_CTA.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href={FOOTER_CTA.primary.href}>
                {FOOTER_CTA.primary.title}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href={FOOTER_CTA.secondary.href}>
                {FOOTER_CTA.secondary.title}
              </Link>
            </Button>
          </div>
        </Container>
      </div>

      <div className="bg-muted/40">
        <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-base font-bold text-foreground">
                {INSTITUTE.name}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {INSTITUTE.about}
              </p>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label="شبکه‌های اجتماعی">
              {SOCIAL_LINKS.map((social) => {
                const Icon = SOCIAL_ICONS[social.icon];
                return (
                  <li key={social.title}>
                    <Button asChild variant="outline" size="icon-sm">
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.title}
                      >
                        <Icon />
                      </a>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>

          <nav aria-label="دسترسی سریع" className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">دسترسی سریع</p>
            <ul className="flex flex-col gap-2">
              {FOOTER_QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="کشورها" className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-foreground">کشورها</p>
            <ul className="flex flex-col gap-2">
              {countries.map((country) => (
                <li key={country.id}>
                  <Link
                    href={`/countries/${country.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {country.flagEmoji ? (
                      <span aria-hidden="true">{country.flagEmoji}</span>
                    ) : null}
                    {country.nameFa}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">تماس با ما</p>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li>
                  <span className="block text-xs text-muted-foreground/80">
                    آدرس
                  </span>
                  {CONTACT.address}
                </li>
                <li>
                  <span className="block text-xs text-muted-foreground/80">
                    تلفن
                  </span>
                  <a
                    href={CONTACT.phoneHref}
                    className="outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    dir="ltr"
                  >
                    {CONTACT.phone}
                  </a>
                </li>
                <li>
                  <span className="block text-xs text-muted-foreground/80">
                    ایمیل
                  </span>
                  <a
                    href={CONTACT.emailHref}
                    className="outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    dir="ltr"
                  >
                    {CONTACT.email}
                  </a>
                </li>
                <li>
                  <span className="block text-xs text-muted-foreground/80">
                    ساعات پاسخگویی
                  </span>
                  {CONTACT.hours}
                </li>
              </ul>
            </div>
            <NewsletterForm compact className="rounded-lg border border-border bg-background p-3" />
          </div>
        </Container>

        <Container className="pb-8">
          <ul
            className="flex flex-wrap items-center gap-3"
            aria-label="نشان‌های اعتماد"
          >
            {TRUST_BADGES.map((badge) => (
              <li key={badge.title}>
                <a
                  href={badge.href}
                  className="inline-flex h-14 min-w-24 items-center justify-center rounded-lg border border-dashed border-border bg-background px-3 text-center text-xs text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {badge.title}
                </a>
              </li>
            ))}
          </ul>
        </Container>

        <div className="border-t border-border">
          <Container className="flex flex-col gap-3 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {COPYRIGHT_YEAR} {INSTITUTE.name}. تمامی حقوق محفوظ است.
            </p>
            <nav aria-label="قوانین" className="flex flex-wrap gap-4">
              {FOOTER_LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {link.title}
                </Link>
              ))}
            </nav>
          </Container>
        </div>
      </div>
    </footer>
  );
}
