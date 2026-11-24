type HowItem = {
  id: string;
  title: string;
  description: string;
};

type PricingHowProps = {
  items: readonly HowItem[];
};

export function PricingHow({ items }: PricingHowProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <span className="text-xs font-medium text-primary">
            عامل {["اول", "دوم", "سوم"][index] ?? String(index + 1)}
          </span>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {item.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        </li>
      ))}
    </ul>
  );
}
