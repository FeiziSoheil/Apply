"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { PageContainer } from "@/components/panel/page-container";
import { Button } from "@/components/ui/button";
import { formatJalaliDate } from "@/lib/format";
import { useMyBookings } from "@/features/bookings/queries";
import {
  useMyShortlist,
  useMyStudentProfile,
} from "@/features/student-panel/queries";
import { CONSULTATION_TYPE_LABELS } from "@/components/admin/bookings/booking-labels";
import { CaseLinkGate } from "./case-link-gate";
import {
  StudentPanelEmpty,
  StudentPanelError,
  StudentPanelSkeleton,
} from "./panel-query-state";

export { StudentPaymentsView } from "./payments/student-payments-view";

export function StudentBookingsView() {
  return (
    <CaseLinkGate requireCase={false}>
      <BookingsInner />
    </CaseLinkGate>
  );
}

function BookingsInner() {
  const query = useMyBookings({
    page: 1,
    pageSize: 20,
    sort: "startsAt",
    order: "desc",
  });
  if (query.isLoading) return <StudentPanelSkeleton />;
  if (query.isError) {
    return (
      <StudentPanelError
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    );
  }
  const items = query.data?.items ?? [];
  return (
    <PageContainer className="gap-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">رزروها</h1>
        <p className="text-sm text-muted-foreground">جلسات مشاوره شما</p>
      </header>
      {items.length === 0 ? (
        <StudentPanelEmpty
          title="رزروی ندارید"
          description="از صفحه خانه می‌توانید جلسه رزرو کنید."
        >
          <Button asChild className="min-h-11">
            <Link href="/panel">بازگشت به خانه</Link>
          </Button>
        </StudentPanelEmpty>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {items.map((booking) => (
            <li key={booking.id} className="rounded-2xl border bg-card p-4">
              <p className="font-medium tabular-nums">
                {formatJalaliDate(booking.startsAt, "yyyy/MM/dd HH:mm")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {CONSULTATION_TYPE_LABELS[booking.consultationType]} ·{" "}
                {booking.code}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}

export function StudentShortlistView() {
  return (
    <CaseLinkGate requireCase={false}>
      <ShortlistInner />
    </CaseLinkGate>
  );
}

function ShortlistInner() {
  const query = useMyShortlist();
  if (query.isLoading) return <StudentPanelSkeleton />;
  if (query.isError) {
    return (
      <StudentPanelError
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    );
  }
  const items = query.data?.items ?? [];
  return (
    <PageContainer className="gap-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">علاقه‌مندی‌ها</h1>
        <p className="text-sm text-muted-foreground">
          برنامه‌ها و دانشگاه‌هایی که ذخیره کرده‌اید
        </p>
      </header>
      {items.length === 0 ? (
        <StudentPanelEmpty
          title="لیست خالی است"
          description="از صفحات برنامه‌ها در سایت می‌توانید موارد را ذخیره کنید."
        >
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/programs">مشاهده برنامه‌ها</Link>
          </Button>
        </StudentPanelEmpty>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border bg-card px-4 py-3 text-sm"
            >
              {item.programId
                ? `برنامه · ${item.programId.slice(0, 8)}…`
                : `دانشگاه · ${item.universityId?.slice(0, 8) ?? "—"}…`}
              <span className="ms-2 text-xs text-muted-foreground">
                {formatJalaliDate(item.addedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}

export function StudentProfileView() {
  const query = useMyStudentProfile();
  if (query.isLoading) return <StudentPanelSkeleton />;
  if (query.isError) {
    return (
      <StudentPanelError
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    );
  }
  const profile = query.data;
  if (!profile) return <StudentPanelSkeleton />;
  return (
    <PageContainer className="gap-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">پروفایل</h1>
        <p className="text-sm text-muted-foreground">اطلاعات حساب شما</p>
      </header>
      <dl className="grid gap-3 rounded-2xl border bg-card p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">نام</dt>
          <dd className="font-medium">{profile.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">موبایل</dt>
          <dd className="font-medium tabular-nums" dir="ltr">
            {profile.mobile}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">ایمیل</dt>
          <dd className="font-medium">{profile.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">شهر</dt>
          <dd className="font-medium">{profile.city ?? "—"}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        ویرایش کامل پروفایل به‌زودی فعال می‌شود.
      </p>
    </PageContainer>
  );
}

export function StudentHelpView() {
  return (
    <PageContainer className="gap-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">راهنما</h1>
        <p className="text-sm text-muted-foreground">
          نکات کوتاه برای کار با پنل
        </p>
      </header>
      <ol className="list-decimal space-y-3 pe-5 text-sm leading-7 text-muted-foreground">
        <li>
          از «خانه» قدم بعدی و کارهای باز را ببینید و با یک دکمه ادامه دهید.
        </li>
        <li>
          در «مدارک» وضعیت هر فایل و دلیل رد (در صورت وجود) را پیگیری کنید.
        </li>
        <li>
          برای صحبت با مشاور از «پیام‌ها» یا دکمه‌های کارت مشاور استفاده کنید.
        </li>
        <li>
          اگر پرونده‌ای پیدا نشد، از همان صفحه درخواست مشاوره بگذارید.
        </li>
      </ol>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <HelpCircle className="size-4" aria-hidden />
        برای پشتیبانی بیشتر با موسسه تماس بگیرید.
      </p>
      <Button asChild variant="outline" className="min-h-11 w-fit">
        <Link href="/contact">تماس با ما</Link>
      </Button>
    </PageContainer>
  );
}
