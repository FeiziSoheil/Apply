import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { PROCESS_STEPS } from "@/components/home/home-content";
import { toPersianDigits } from "@/lib/format";

export function ProcessSteps() {
  return (
    <Section title="فرآیند همکاری"
      subtitle="از اولین مشاوره تا پرواز، شش گام مشخص و قابل پیگیری">
      <FadeIn>
        {/* Desktop: horizontal timeline */}
        <ol className="hidden md:grid md:grid-cols-6 md:gap-3">
          {PROCESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.id} className="relative flex flex-col items-center text-center">
                {index < PROCESS_STEPS.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute top-5 start-1/2 h-px w-full bg-border"
                  />
                ) : null}
                <span className="relative z-10 mb-3 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="mb-1 text-xs text-muted-foreground">
                  گام {toPersianDigits(index + 1)}
                </span>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>

        {/* Mobile: vertical timeline */}
        <ol className="relative flex flex-col gap-6 border-s border-border ps-6 md:hidden">
          {PROCESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.id} className="relative">
                <span className="absolute -start-[1.9rem] flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-xs text-muted-foreground">
                  گام {toPersianDigits(index + 1)}
                </span>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </FadeIn>
    </Section>
  );
}
