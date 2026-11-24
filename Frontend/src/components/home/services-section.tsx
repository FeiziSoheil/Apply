import Link from "next/link";
import type { Service } from "@/types";
import { ServiceCard } from "@/components/services/service-card";
import { Section } from "@/components/shared/section";
import { FadeIn } from "@/components/home/fade-in";
import { Button } from "@/components/ui/button";

type ServicesSectionProps = {
  services: Service[];
};

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <Section
      title="خدمات ما"
      subtitle="از اپلای دانشگاه تا اسکان در مقصد، همه چیز در یک مسیر"
      headerAction={
        <Button asChild variant="outline" size="sm">
          <Link href="/services">مشاهده همه</Link>
        </Button>
      }
      className="bg-muted/40"
    >
      <FadeIn>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>
      </FadeIn>
    </Section>
  );
}
