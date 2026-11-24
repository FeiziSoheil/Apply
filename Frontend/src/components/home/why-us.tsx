import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { WHY_US_ADVANTAGES } from "@/components/home/home-content";

export function WhyUs() {
  return (
    <Section title="چرا اِپلای؟"
      subtitle="مزیت‌هایی که مسیر تحصیل خارج را ساده‌تر و مطمئن‌تر می‌کند">
      <FadeIn>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_US_ADVANTAGES.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </FadeIn>
    </Section>
  );
}
