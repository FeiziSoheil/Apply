import Link from "next/link";
import { ArrowRight, Home, LockKeyhole } from "lucide-react";
import { PanelErrorState } from "@/components/panel/panel-error-state";
import { Button } from "@/components/ui/button";

type ForbiddenPageProps = {
  /** The user's own home (`/panel` or `/admin`), offered as the way out */
  homeHref: string;
  homeLabel: string;
  /** Short description of the area that was refused, e.g. «پنل مدیریت» */
  areaLabel: string;
};

/**
 * 403 screen of a protected area, styled for the panel shell (the sidebar and
 * top bar stay visible so the user can log out or leave). Server-renderable
 * (no hooks) so it can be reused by the route guard, the section guard and any
 * future `forbidden()` boundary.
 */
export function ForbiddenPage({
  homeHref,
  homeLabel,
  areaLabel,
}: ForbiddenPageProps) {
  return (
    <PanelErrorState
      code="خطای ۴۰۳"
      tone="destructive"
      icon={LockKeyhole}
      title="دسترسی شما به این بخش مجاز نیست"
      description={`حساب کاربری شما اجازه ورود به «${areaLabel}» را ندارد. اگر فکر می‌کنید این یک اشتباه است، با مدیر سیستم تماس بگیرید یا با حساب دیگری وارد شوید.`}
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
