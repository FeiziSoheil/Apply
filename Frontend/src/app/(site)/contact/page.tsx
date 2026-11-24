import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { ContactInfo } from "@/components/contact/contact-info";
import { ContactMap } from "@/components/contact/contact-map";
import { ContactForm } from "@/components/forms/contact-form";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";

export const instant = false;

export const metadata: Metadata = createPageMetadata({
  title: "تماس با ما",
  description:
    "فرم تماس، اطلاعات دفتر، ساعات پاسخگویی و مسیر دسترسی به مؤسسه اِپلای.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[{ label: "تماس با ما" }]}
      />

      <PageHero
        title="تماس با ما"
        description="پیام بگذارید، تماس بگیرید یا مسیر دفتر را در نشان و بلد باز کنید"
        primaryCta={{ label: "رزرو مشاوره", href: "/booking" }}
        secondaryCta={{ label: "ارزیابی رایگان", href: "/assessment" }}
      />

      <Section title="ارسال پیام"
        subtitle="پیام شما را در کوتاه‌ترین زمان پاسخ می‌دهیم."
        padding="none">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <ContactForm />
          <aside className="space-y-6">
            <ContactInfo />
            <div className="rounded-2xl border border-border p-5">
              <NewsletterForm />
            </div>
          </aside>
        </div>
      </Section>

      <Section title="موقعیت دفتر"
        subtitle="نقشه داخلی نمایشی است؛ برای مسیریابی از نشان یا بلد استفاده کنید"
        padding="none">
        <ContactMap />
      </Section>
    </div>
  );
}
