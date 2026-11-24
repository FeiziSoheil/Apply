"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileWarning,
  MessageCircle,
  Phone,
  Video,
} from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { PageContainer } from "@/components/panel/page-container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CONSULTATION_TYPE_LABELS } from "@/components/admin/bookings/booking-labels";
import { useMyBookings } from "@/features/bookings/queries";
import {
  useMyAnnouncements,
  useMyCase,
  useMyStudentTasks,
} from "@/features/student-panel/queries";
import type { StudentTaskView } from "@/contracts/student-panel";
import {
  formatJalaliDate,
  formatRelativeFa,
  toPersianDigits,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { CaseLinkGate } from "../case-link-gate";
import {
  StudentPanelError,
  StudentPanelSkeleton,
} from "../panel-query-state";

function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function prioritizeTasks(tasks: StudentTaskView[]): StudentTaskView[] {
  const rank = (task: StudentTaskView) => {
    if (task.status === "overdue") return 0;
    if (task.status === "todo" && task.dueDate) return 1;
    if (task.kind === "upload_document") return 2;
    if (task.kind === "pay_installment") return 3;
    return 4;
  };
  return [...tasks]
    .filter((task) => task.status !== "done")
    .sort((a, b) => {
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
      return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    });
}

function nextStepFromTasks(tasks: StudentTaskView[]): {
  title: string;
  href: string;
  cta: string;
} | null {
  const prioritized = prioritizeTasks(tasks);
  if (prioritized.length === 0) return null;
  const uploads = prioritized.filter((t) => t.kind === "upload_document");
  if (uploads.length >= 2) {
    return {
      title: `${toPersianDigits(uploads.length)} مدرک آپلود نشده`,
      href: "/panel/documents",
      cta: "رفتن به مدارک",
    };
  }
  const top = prioritized[0];
  return {
    title: top.title,
    href: top.actionHref ?? "/panel/case",
    cta:
      top.kind === "upload_document"
        ? "بارگذاری مدرک"
        : top.kind === "pay_installment"
          ? "پرداخت"
          : top.kind === "attend_session"
            ? "مشاهده رزرو"
            : "ادامه",
  };
}

function HomeContent() {
  const { user } = useSession();
  const caseQuery = useMyCase();
  const tasksQuery = useMyStudentTasks();
  const announcementsQuery = useMyAnnouncements();
  const bookingsQuery = useMyBookings({
    page: 1,
    pageSize: 5,
    sort: "startsAt",
    order: "asc",
  });

  if (caseQuery.isLoading || tasksQuery.isLoading) {
    return <StudentPanelSkeleton />;
  }

  if (caseQuery.isError) {
    return (
      <StudentPanelError
        error={caseQuery.error}
        onRetry={() => void caseQuery.refetch()}
      />
    );
  }

  const studentCase = caseQuery.data;
  if (!studentCase || !user) return <StudentPanelSkeleton />;

  const tasks = prioritizeTasks(tasksQuery.data ?? []);
  const nextStep =
    nextStepFromTasks(tasksQuery.data ?? []) ?? {
      title: studentCase.nextStepHint,
      href: "/panel/case",
      cta: "مشاهده پرونده",
    };
  const nearestDeadline = studentCase.deadlines[0];
  const deadlineDays = nearestDeadline
    ? daysUntil(nearestDeadline.dueDate)
    : null;
  const upcomingBooking = bookingsQuery.data?.items.find(
    (booking) =>
      booking.status === "confirmed" || booking.status === "pending",
  );
  const latestAnnouncement = announcementsQuery.data?.[0];
  const latestUpdate = studentCase.recentUpdates[0];
  const advisor = studentCase.advisor;
  const phoneDigits = advisor?.publicPhone?.replace(/\D/g, "") ?? "";
  const waPhone = phoneDigits.startsWith("0")
    ? `98${phoneDigits.slice(1)}`
    : phoneDigits;

  return (
    <PageContainer className="gap-5 pb-4">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          سلام {user.name.split(/\s+/)[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          پرونده {studentCase.code} · مرحله {studentCase.currentStageTitle}
        </p>
      </header>

      {/* قدم بعدی */}
      <section
        aria-labelledby="next-step-heading"
        className="rounded-2xl border bg-card p-4 shadow-sm"
        data-testid="student-next-step"
      >
        <p className="text-xs font-medium text-muted-foreground">
          قدم بعدی شما
        </p>
        <h2
          id="next-step-heading"
          className="mt-1 font-heading text-lg font-bold leading-snug"
        >
          {nextStep.title}
        </h2>
        <Button asChild className="mt-4 min-h-12 w-full text-base sm:w-auto">
          <Link href={nextStep.href}>
            {nextStep.cta}
            <ArrowLeft data-icon="inline-end" aria-hidden />
          </Link>
        </Button>
      </section>

      {/* پیشرفت */}
      <section
        aria-labelledby="progress-heading"
        className="rounded-2xl border bg-card p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="progress-heading" className="font-medium">
            پیشرفت پرونده
          </h2>
          <Badge variant="secondary" className="tabular-nums">
            {toPersianDigits(studentCase.progressPercent)}٪
          </Badge>
        </div>
        <ol className="relative space-y-0 border-s border-border ps-4">
          {studentCase.stages.map((stage) => (
            <li key={stage.key} className="relative pb-4 last:pb-0">
              <span
                className={cn(
                  "absolute start-[-1.3rem] top-1 size-2.5 rounded-full ring-2 ring-background",
                  stage.status === "done" && "bg-primary",
                  stage.status === "current" && "bg-accent",
                  stage.status === "upcoming" && "bg-muted-foreground/30",
                )}
                aria-hidden
              />
              <p
                className={cn(
                  "text-sm",
                  stage.status === "current"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {stage.title}
                {stage.status === "current" ? " (الان اینجا هستید)" : null}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* کارها */}
      <section aria-labelledby="tasks-heading" className="space-y-3">
        <h2 id="tasks-heading" className="font-medium">
          کارهای شما
        </h2>
        {tasksQuery.isError ? (
          <StudentPanelError
            error={tasksQuery.error}
            onRetry={() => void tasksQuery.refetch()}
            title="کارها بارگذاری نشد"
          />
        ) : tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            فعلاً کار بازی ندارید. آفرین!
          </p>
        ) : (
          <ul className="flex flex-col gap-2" role="list">
            {tasks.slice(0, 5).map((task) => (
              <li
                key={task.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card p-3",
                  task.status === "overdue" && "border-destructive/40",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      task.status === "overdue" && "text-destructive",
                    )}
                  >
                    {task.title}
                  </p>
                  {task.dueDate ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      سررسید {formatJalaliDate(task.dueDate)}
                      {task.status === "overdue" ? " · عقب‌افتاده" : null}
                    </p>
                  ) : null}
                </div>
                {task.actionHref ? (
                  <Button asChild size="sm" className="min-h-11 shrink-0">
                    <Link href={task.actionHref}>انجام</Link>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ددلاین */}
      {nearestDeadline && deadlineDays !== null ? (
        <section
          aria-labelledby="deadline-heading"
          className="flex items-start gap-3 rounded-2xl border bg-card p-4"
        >
          <Clock className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <h2 id="deadline-heading" className="font-medium">
              نزدیک‌ترین مهلت
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {nearestDeadline.title}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {deadlineDays < 0
                ? `${toPersianDigits(Math.abs(deadlineDays))} روز گذشته`
                : deadlineDays === 0
                  ? "امروز"
                  : `${toPersianDigits(deadlineDays)} روز مانده`}{" "}
              · {formatJalaliDate(nearestDeadline.dueDate)}
            </p>
          </div>
        </section>
      ) : null}

      {/* مشاور */}
      {advisor ? (
        <section
          aria-labelledby="advisor-heading"
          className="rounded-2xl border bg-card p-4"
        >
          <h2 id="advisor-heading" className="mb-3 font-medium">
            مشاور شما
          </h2>
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {advisor.photoUrl ? (
                <AvatarImage src={advisor.photoUrl} alt="" />
              ) : null}
              <AvatarFallback>
                {advisor.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium">{advisor.name}</p>
              <p className="text-xs text-muted-foreground">مشاور اختصاصی</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/panel/tickets">
                <MessageCircle data-icon="inline-start" aria-hidden />
                پیام
              </Link>
            </Button>
            {advisor.publicPhone ? (
              <Button asChild variant="outline" className="min-h-11">
                <a href={`tel:${advisor.publicPhone}`}>
                  <Phone data-icon="inline-start" aria-hidden />
                  تماس
                </a>
              </Button>
            ) : (
              <Button variant="outline" className="min-h-11" disabled>
                <Phone data-icon="inline-start" aria-hidden />
                تماس
              </Button>
            )}
            {waPhone ? (
              <Button asChild variant="outline" className="min-h-11">
                <a
                  href={`https://wa.me/${waPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  واتساپ
                </a>
              </Button>
            ) : (
              <Button variant="outline" className="min-h-11" disabled>
                واتساپ
              </Button>
            )}
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/panel/bookings">
                <CalendarClock data-icon="inline-start" aria-hidden />
                رزرو جلسه
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      {/* اعلان‌ها و به‌روزرسانی */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="mb-2 flex items-center gap-2 font-medium">
            <FileWarning className="size-4" aria-hidden />
            آخرین به‌روزرسانی
          </h2>
          {latestUpdate ? (
            <>
              <p className="text-sm">{latestUpdate.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatRelativeFa(latestUpdate.occurredAt)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              هنوز به‌روزرسانی جدیدی نیست.
            </p>
          )}
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="mb-2 font-medium">آخرین اطلاعیه</h2>
          {announcementsQuery.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : latestAnnouncement ? (
            <>
              <p className="text-sm font-medium">{latestAnnouncement.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {latestAnnouncement.body}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">اطلاعیه‌ای نیست.</p>
          )}
        </div>
      </section>

      {/* رزرو آینده */}
      <section
        aria-labelledby="booking-heading"
        className="rounded-2xl border bg-card p-4"
      >
        <h2 id="booking-heading" className="mb-2 font-medium">
          رزرو نزدیک
        </h2>
        {bookingsQuery.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : upcomingBooking ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {formatJalaliDate(upcomingBooking.startsAt, "yyyy/MM/dd HH:mm")}
            </p>
            <p className="text-sm text-muted-foreground">
              {CONSULTATION_TYPE_LABELS[upcomingBooking.consultationType]}
            </p>
            {upcomingBooking.consultationType === "online" ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="size-4 shrink-0" aria-hidden />
                لینک جلسه آنلاین پس از تأیید برای شما ارسال می‌شود.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                آدرس جلسه حضوری را مشاور تأیید می‌کند.
              </p>
            )}
            <Button asChild variant="outline" className="min-h-11">
              <Link href="/panel/bookings">جزئیات رزرو</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              رزرو فعالی ندارید.
            </p>
            <Button asChild className="min-h-11">
              <Link href="/panel/bookings">رزرو جلسه</Link>
            </Button>
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3.5" aria-hidden />
        آخرین تغییر پرونده {formatRelativeFa(studentCase.lastUpdated)}
      </p>
    </PageContainer>
  );
}

export function StudentHomeView() {
  return (
    <CaseLinkGate>
      <HomeContent />
    </CaseLinkGate>
  );
}
