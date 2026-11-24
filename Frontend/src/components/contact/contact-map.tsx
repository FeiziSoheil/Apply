import { MapPin } from "lucide-react";
import { CONTACT } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function ContactMap() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div
        className="relative flex aspect-[16/10] flex-col items-center justify-center gap-3 bg-gradient-to-bl from-primary/15 via-muted to-secondary px-4 text-center"
        role="img"
        aria-label="نقشه تقریبی موقعیت دفتر — بدون نقشه خارجی"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(color-mix(in_oklab,var(--border)_70%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklab,var(--border)_70%,transparent)_1px,transparent_1px)] bg-size-[1.5rem_1.5rem]"
        />
        <span className="relative flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MapPin className="size-6" aria-hidden />
        </span>
        <p className="relative max-w-sm text-sm text-muted-foreground">
          {CONTACT.address}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border p-4">
        <Button asChild variant="outline" size="sm">
          <a
            href={CONTACT.neshanHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            باز کردن در نشان
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href={CONTACT.baladHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            باز کردن در بلد
          </a>
        </Button>
      </div>
    </div>
  );
}
