import Link from "next/link";
import { ArrowRight, Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelErrorState } from "./panel-error-state";

type PanelNotFoundProps = {
  /** The area's dashboard, offered as the way out */
  homeHref: string;
  homeLabel: string;
};

/** Panel-styled 404 shown inside the shell (`not-found.tsx` of each area) */
export function PanelNotFound({ homeHref, homeLabel }: PanelNotFoundProps) {
  return (
    <PanelErrorState
      code="خطای ۴۰۴"
      icon={SearchX}
      title="صفحه پیدا نشد"
      description="صفحه‌ای که دنبال آن هستید وجود ندارد، حذف شده یا آدرس آن تغییر کرده است. از منوی کناری یا جستجوی بالای صفحه (Ctrl+K) مسیر خود را پیدا کنید."
    >
      <Button asChild size="lg">
        <Link href={homeHref}>
          <ArrowRight data-icon="inline-start" />
          {homeLabel}
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href="/">
          <Home data-icon="inline-start" />
          بازگشت به سایت
        </Link>
      </Button>
    </PanelErrorState>
  );
}
