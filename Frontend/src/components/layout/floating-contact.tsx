import Link from "next/link";
import { CalendarDays, MessageCircle, Phone } from "lucide-react";
import { FLOATING_CONTACT } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Mobile bottom action bar + desktop WhatsApp FAB */
export function FloatingContact() {
  return (
    <>
      {/* Mobile fixed bottom bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-(--demo-banner-height) z-40 border-t border-border bg-background/95 p-2 backdrop-blur-md md:hidden",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        )}
        role="navigation"
        aria-label="تماس سریع"
      >
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <Button asChild variant="outline" size="sm" className="h-11 flex-col gap-0.5">
            <a href={FLOATING_CONTACT.call.href}>
              <Phone data-icon="inline-start" className="size-4" />
              <span className="text-xs">{FLOATING_CONTACT.call.title}</span>
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-11 flex-col gap-0.5">
            <a
              href={FLOATING_CONTACT.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle data-icon="inline-start" className="size-4" />
              <span className="text-xs">{FLOATING_CONTACT.whatsapp.title}</span>
            </a>
          </Button>
          <Button asChild size="sm" className="h-11 flex-col gap-0.5">
            <Link href={FLOATING_CONTACT.booking.href}>
              <CalendarDays data-icon="inline-start" className="size-4" />
              <span className="text-xs">{FLOATING_CONTACT.booking.title}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Desktop WhatsApp FAB — logical inline-end + block-end */}
      <div className="pointer-events-none fixed z-40 hidden md:block [inset-block-end:calc(1rem+var(--demo-banner-height))] [inset-inline-end:1rem]">
        <Button
          asChild
          size="icon-lg"
          className="pointer-events-auto size-14 rounded-full bg-accent text-accent-foreground shadow-md hover:bg-accent/90"
        >
          <a
            href={FLOATING_CONTACT.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="گفتگو در واتساپ"
          >
            <MessageCircle className="size-6" />
          </a>
        </Button>
      </div>
    </>
  );
}
