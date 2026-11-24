import Link from "next/link";
import { FOOTER_CTA } from "@/lib/constants";
import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <Section className="pb-16 sm:pb-20" aria-labelledby="final-cta-heading">
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground sm:px-10 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -end-10 -top-10 size-40 rounded-full bg-primary-foreground/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -start-8 size-48 rounded-full bg-accent/30 blur-2xl"
          />
          <h2
            id="final-cta-heading"
            className="relative text-balance text-primary-foreground"
          >
            {FOOTER_CTA.title}
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/85">
            {FOOTER_CTA.description}
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href={FOOTER_CTA.primary.href}>
                {FOOTER_CTA.primary.title}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href={FOOTER_CTA.secondary.href}>
                {FOOTER_CTA.secondary.title}
              </Link>
            </Button>
          </div>
        </div>
      </FadeIn>
    </Section>
  );
}
