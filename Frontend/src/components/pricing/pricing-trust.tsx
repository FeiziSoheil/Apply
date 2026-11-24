import { Ban, ShieldCheck } from "lucide-react";

type PricingTrustProps = {
  neverCharge: readonly string[];
  guarantees: readonly string[];
};

export function PricingTrust({ neverCharge, guarantees }: PricingTrustProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section
        aria-labelledby="never-charge-heading"
        className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6"
      >
        <h3
          id="never-charge-heading"
          className="flex items-center gap-2 text-base font-semibold text-foreground"
        >
          <Ban className="size-5 text-destructive" aria-hidden />
          چه چیزی هیچ‌وقت دریافت نمی‌کنیم
        </h3>
        <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
          {neverCharge.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="guarantees-heading"
        className="rounded-2xl border border-border p-5 sm:p-6"
      >
        <h3
          id="guarantees-heading"
          className="flex items-center gap-2 text-base font-semibold text-foreground"
        >
          <ShieldCheck className="size-5 text-primary" aria-hidden />
          تعهدات ما
        </h3>
        <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
          {guarantees.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
