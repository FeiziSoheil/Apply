import { CallbackDialog } from "@/components/forms/callback-dialog";
import { Button } from "@/components/ui/button";
import { CONTACT } from "@/lib/constants";
import { Phone } from "lucide-react";

export function ContactInfo() {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <h2 className="text-base font-semibold text-foreground">اطلاعات تماس</h2>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        <li>
          <span className="block text-xs text-foreground/70">آدرس</span>
          {CONTACT.address}
        </li>
        <li>
          <span className="block text-xs text-foreground/70">تلفن</span>
          <a
            href={CONTACT.phoneHref}
            className="text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            dir="ltr"
          >
            {CONTACT.phone}
          </a>
        </li>
        <li>
          <span className="block text-xs text-foreground/70">ایمیل</span>
          <a
            href={CONTACT.emailHref}
            className="text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            dir="ltr"
          >
            {CONTACT.email}
          </a>
        </li>
        <li>
          <span className="block text-xs text-foreground/70">ساعات پاسخگویی</span>
          {CONTACT.hours}
        </li>
      </ul>
      <div className="mt-5">
        <CallbackDialog
          trigger={
            <Button type="button" variant="outline" className="w-full">
              <Phone data-icon="inline-start" />
              درخواست تماس سریع
            </Button>
          }
        />
      </div>
    </div>
  );
}
