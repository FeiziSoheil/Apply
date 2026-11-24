import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

type AssessmentCtaProps = {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

export function AssessmentCta({
  title = "ارزیابی رایگان مسیر تحصیل",
  description = "با چند سؤال کوتاه، مناسب‌ترین کشورها و مسیر پذیرش را پیشنهاد می‌دهیم.",
  primaryHref = "/assessment",
  primaryLabel = "شروع ارزیابی رایگان",
  secondaryHref = "/booking",
  secondaryLabel = "رزرو مشاوره",
  className,
}: AssessmentCtaProps) {
  return (
    <Container>
      <section
        aria-labelledby="assessment-cta-heading"
        className={cn(
          "relative overflow-hidden rounded-2xl bg-muted px-6 py-10 text-center sm:px-10 sm:py-12",
          className,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -end-8 -top-8 size-36 rounded-full bg-primary/10 blur-2xl"
        />
        <h2
          id="assessment-cta-heading"
          className="relative text-balance text-xl font-semibold text-foreground sm:text-2xl"
        >
          {title}
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">
          {description}
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </section>
    </Container>
  );
}
