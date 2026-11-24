import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { StatsCounter } from "@/components/home/stats-counter";

// TODO(settings-api): bind to `InstituteSettings.info.homepageStats`
// (`docs/settings-binding.md`) instead of this hardcoded list.
const STATS = [
  { label: "دانشجوی اعزام‌شده", value: 3200, suffix: "+" },
  { label: "کشور مقصد", value: 12, suffix: "+" },
  { label: "دانشگاه همکار", value: 180, suffix: "+" },
  { label: "سال تجربه", value: 14, suffix: "" },
] as const;

export function StatsBar() {
  return (
    <Section
      className="relative z-20 -mt-15 py-8 sm:py-10"
      aria-label="آمار مؤسسه"
    >
      <FadeIn>
        <ul className="grid grid-cols-2 gap-6 rounded-2xl bg-primary px-4 py-8 text-primary-foreground sm:grid-cols-4 sm:gap-4 sm:px-8">
          {STATS.map((stat) => (
            <li
              key={stat.label}
              className="flex flex-col items-center gap-1 text-center"
            >
              <p className="text-2xl font-bold sm:text-3xl">
                <StatsCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-primary-foreground/80">{stat.label}</p>
            </li>
          ))}
        </ul>
      </FadeIn>
    </Section>
  );
}
