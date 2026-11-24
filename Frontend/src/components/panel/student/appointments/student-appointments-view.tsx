"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarPlus,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  User,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/panel/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { downloadIcsFile } from "@/lib/calendar";
import { consultants } from "@/data/consultants";
import { BookingForm } from "@/components/forms/booking-form";
import { JalaliCalendar } from "@/components/forms/jalali-calendar";
import { useMyBookings, useBookingSlots } from "@/features/bookings/queries";
import {
  useCancelBooking,
  usePatchBooking,
} from "@/features/bookings/mutations";
import {
  useMyCase,
  useMyStudentProfile,
} from "@/features/student-panel/queries";
import type { Booking } from "@/contracts/bookings";
import { CaseLinkGate } from "../case-link-gate";
import {
  StudentPanelEmpty,
  StudentPanelError,
  StudentPanelSkeleton,
} from "../panel-query-state";

const STATUS_LABELS: Record<
  Booking["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  confirmed: { label: "تأییدشده", variant: "default" },
  pending: { label: "در انتظار بررسی", variant: "secondary" },
  completed: { label: "انجام‌شده", variant: "outline" },
  cancelled: { label: "لغوشده", variant: "destructive" },
  no_show: { label: "عدم حضور", variant: "destructive" },
};

const INSTITUTE_ADDRESS =
  "تهران، خیابان ولیعصر، بالاتر از میرداماد، برج سرو، طبقه ۷، واحد ۷۰۴";
const INSTITUTE_MAP_URL =
  "https://maps.google.com/?q=35.7575,51.4099";

const CANCELLATION_WINDOW_HOURS = 24;

export function StudentAppointmentsView() {
  return (
    <CaseLinkGate requireCase={false}>
      <AppointmentsInner />
    </CaseLinkGate>
  );
}

function AppointmentsInner() {
  const [nowMs] = useState(() => Date.now());
  const bookingsQuery = useMyBookings({
    page: 1,
    pageSize: 50,
    sort: "startsAt",
    order: "desc",
  });
  const profileQuery = useMyStudentProfile();
  const caseQuery = useMyCase();

  const cancelMutation = useCancelBooking();
  const patchMutation = usePatchBooking();

  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [reschedulingBooking, setReschedulingBooking] =
    useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(
    undefined,
  );
  const [selectedSlot, setSelectedSlot] = useState("");

  const allBookings = bookingsQuery.data?.items;

  const { upcomingBookings, pastBookings } = useMemo(() => {
    const items = allBookings ?? [];
    const upcoming: Booking[] = [];
    const past: Booking[] = [];

    for (const b of items) {
      const isPast =
        new Date(b.startsAt).getTime() < nowMs ||
        b.status === "completed" ||
        b.status === "cancelled" ||
        b.status === "no_show";

      if (isPast) {
        past.push(b);
      } else {
        upcoming.push(b);
      }
    }

    return {
      upcomingBookings: upcoming.sort((a, b) =>
        a.startsAt.localeCompare(b.startsAt),
      ),
      pastBookings: past.sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
    };
  }, [allBookings, nowMs]);

  // Slots query for rescheduling
  const rescheduleDateStr = rescheduleDate
    ? rescheduleDate.toISOString().split("T")[0]
    : "";
  const slotsQuery = useBookingSlots(
    {
      date: rescheduleDateStr,
      consultantId: reschedulingBooking?.consultantId ?? undefined,
      consultationType: reschedulingBooking?.consultationType,
    },
    { enabled: Boolean(rescheduleDateStr) },
  );

  const getConsultant = (consultantId: string | null) => {
    if (!consultantId) return null;
    return consultants.find((c) => c.id === consultantId) ?? null;
  };

  const getHoursRemaining = (startsAt: string) => {
    return (new Date(startsAt).getTime() - nowMs) / (1000 * 60 * 60);
  };

  const handleCancelSubmit = async () => {
    if (!cancellingBooking) return;
    try {
      await cancelMutation.mutateAsync({
        id: cancellingBooking.id,
        body: { reason: cancelReason.trim() || undefined },
      });
      toast.success("رزرو با موفقیت لغو شد");
      setCancellingBooking(null);
      setCancelReason("");
      void bookingsQuery.refetch();
    } catch {
      toast.error("خطا در لغو رزرو");
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!reschedulingBooking || !selectedSlot) return;
    try {
      await patchMutation.mutateAsync({
        id: reschedulingBooking.id,
        body: { startsAt: selectedSlot },
      });
      toast.success("زمان جلسه با موفقیت تغییر کرد");
      setReschedulingBooking(null);
      setRescheduleDate(undefined);
      setSelectedSlot("");
      void bookingsQuery.refetch();
    } catch {
      toast.error("خطا در تغییر زمان جلسه");
    }
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("لینک جلسه در کلیپ‌بورد کپی شد");
  };

  if (bookingsQuery.isLoading) return <StudentPanelSkeleton />;
  if (bookingsQuery.isError) {
    return (
      <StudentPanelError
        error={bookingsQuery.error}
        onRetry={() => void bookingsQuery.refetch()}
      />
    );
  }

  return (
    <PageContainer className="gap-5 pb-24 md:gap-6 md:pb-16">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
            رزروها و جلسات مشاوره
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            مدیریت نوبت‌ها، ورود به جلسه آنلاین یا مسیریابی به دفتر موسسه
          </p>
        </div>

        <Button
          onClick={() => setIsNewBookingOpen(true)}
          className="min-h-11 w-full gap-2 rounded-xl text-sm font-semibold shadow-xs sm:w-auto"
        >
          <Plus className="size-4" />
          رزرو وقت جدید
        </Button>
      </header>

      <Tabs defaultValue="upcoming" className="w-full space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1.5 sm:max-w-md">
          <TabsTrigger
            value="upcoming"
            className="min-h-11 gap-2 rounded-xl text-xs font-medium sm:text-sm"
          >
            جلسات پیش‌رو
            {upcomingBookings.length > 0 && (
              <Badge variant="secondary" className="rounded-full px-1.5 py-0.5 text-[11px] tabular-nums">
                {toPersianDigits(upcomingBookings.length)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="min-h-11 gap-2 rounded-xl text-xs font-medium sm:text-sm"
          >
            سوابق جلسات
            {pastBookings.length > 0 && (
              <Badge variant="outline" className="rounded-full px-1.5 py-0.5 text-[11px] tabular-nums">
                {toPersianDigits(pastBookings.length)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Upcoming appointments tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <StudentPanelEmpty
              title="جلسه پیش‌رویی ندارید"
              description="برای انتخاب برنامه تحصیلی، بررسی مدارک یا اخذ ویزا می‌توانید یک جلسه مشاوره رزرو کنید."
            >
              <Button
                onClick={() => setIsNewBookingOpen(true)}
                className="min-h-11 gap-2 rounded-xl text-sm font-semibold"
              >
                <CalendarPlus className="size-4" />
                رزرو اولین جلسه مشاوره
              </Button>
            </StudentPanelEmpty>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {upcomingBookings.map((booking) => {
                const consultant = getConsultant(booking.consultantId);
                const isOnline = booking.consultationType === "online";
                const meetingUrl = `https://meet.apply.ir/c/${booking.code}`;

                return (
                  <div
                    key={booking.id}
                    className="flex flex-col justify-between rounded-2xl border bg-card p-4 shadow-xs space-y-4 sm:p-5"
                  >
                    <div className="space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-sm font-bold tracking-wider text-muted-foreground"
                            dir="ltr"
                          >
                            {booking.code}
                          </span>
                          <Badge
                            variant={STATUS_LABELS[booking.status]?.variant ?? "default"}
                            className="rounded-full text-xs"
                          >
                            {STATUS_LABELS[booking.status]?.label ?? booking.status}
                          </Badge>
                        </div>
                        <Badge
                          variant={isOnline ? "secondary" : "outline"}
                          className="gap-1 rounded-full text-xs"
                        >
                          {isOnline ? (
                            <Video className="size-3 text-primary" />
                          ) : (
                            <MapPin className="size-3 text-primary" />
                          )}
                          {isOnline ? "مشاوره آنلاین" : "مشاوره حضوری"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground sm:text-base">
                          <Clock className="size-4 shrink-0 text-primary" />
                          <span>
                            {formatJalaliDate(
                              booking.startsAt,
                              "EEEE d MMMM yyyy - ساعت HH:mm",
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                          <User className="size-4 shrink-0 text-muted-foreground" />
                          <span>
                            مشاور:{" "}
                            <span className="font-semibold text-foreground">
                              {consultant?.name ?? "مشاور موسسه"}
                            </span>
                            {consultant?.role ? ` (${consultant.role})` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Online meeting link or Physical address */}
                      {isOnline ? (
                        <div className="space-y-2.5 rounded-2xl border bg-primary/5 p-3.5 sm:p-4">
                          <p className="text-xs font-semibold text-muted-foreground">
                            لینک ورود به جلسه اختصاصی:
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={meetingUrl}
                              aria-label="لینک ورود به جلسه اختصاصی"
                              className="min-h-10 w-full rounded-xl border bg-background px-3 py-1 font-mono text-xs text-muted-foreground"
                              dir="ltr"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-10 shrink-0 rounded-xl"
                              onClick={() => handleCopyLink(meetingUrl)}
                              aria-label="کپی لینک جلسه"
                              title="کپی لینک"
                            >
                              <Copy className="size-4" />
                            </Button>
                          </div>
                          <Button
                            asChild
                            className="min-h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-xs"
                          >
                            <a
                              href={meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              ورود به اتاق جلسه آنلاین
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2.5 rounded-2xl border bg-muted/40 p-3.5 text-xs sm:p-4">
                          <p className="flex items-center gap-1 font-semibold text-muted-foreground">
                            <MapPin className="size-3.5 text-primary" />
                            آدرس محل مراجعه حضوری:
                          </p>
                          <p className="leading-relaxed text-foreground">
                            {INSTITUTE_ADDRESS}
                          </p>
                          <Button
                            asChild
                            variant="outline"
                            className="min-h-11 w-full gap-2 rounded-xl text-xs font-semibold sm:text-sm"
                          >
                            <a
                              href={INSTITUTE_MAP_URL}
                              target="_blank"
                              rel="noreferrer"
                            >
                              مسیریابی روی نقشه
                              <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                        </div>
                      )}

                      {booking.notes && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          <span className="font-medium">یادداشت: </span>
                          {booking.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadIcsFile(booking, consultant?.name, {
                            meetingUrl,
                            address: INSTITUTE_ADDRESS,
                          })
                        }
                        className="min-h-10 w-full gap-1.5 rounded-xl text-xs font-medium sm:w-auto"
                      >
                        <CalendarPlus className="size-3.5" />
                        افزودن به تقویم (.ics)
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReschedulingBooking(booking);
                            setRescheduleDate(undefined);
                            setSelectedSlot("");
                          }}
                          className="min-h-10 flex-1 rounded-xl text-xs font-medium sm:flex-initial"
                        >
                          تغییر زمان
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCancellingBooking(booking);
                            setCancelReason("");
                          }}
                          className="min-h-10 flex-1 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-initial"
                        >
                          لغو رزرو
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Past appointments tab */}
        <TabsContent value="past" className="space-y-4">
          {pastBookings.length === 0 ? (
            <StudentPanelEmpty
              title="سابقه‌ای از جلسات قبلی ندارید"
              description="جلساتی که قبلاً برگزار یا لغو شده‌اند در این بخش نمایش داده می‌شوند."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {pastBookings.map((booking) => {
                const consultant = getConsultant(booking.consultantId);
                const isOnline = booking.consultationType === "online";

                return (
                  <div
                    key={booking.id}
                    className="flex flex-col justify-between rounded-2xl border bg-card/60 p-4 shadow-xs space-y-3 opacity-90 sm:p-5"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                        <span
                          className="font-mono text-xs font-bold text-muted-foreground"
                          dir="ltr"
                        >
                          {booking.code}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={STATUS_LABELS[booking.status]?.variant ?? "outline"}
                            className="rounded-full text-xs"
                          >
                            {STATUS_LABELS[booking.status]?.label ?? booking.status}
                          </Badge>
                          <Badge variant="outline" className="rounded-full text-xs">
                            {isOnline ? "آنلاین" : "حضوری"}
                          </Badge>
                        </div>
                      </div>

                      <p className="font-semibold text-foreground text-sm sm:text-base">
                        {formatJalaliDate(
                          booking.startsAt,
                          "EEEE d MMMM yyyy - HH:mm",
                        )}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        مشاور: {consultant?.name ?? "مشاور موسسه"}
                      </p>

                      {booking.cancellationReason && (
                        <p className="text-xs text-destructive">
                          دلیل لغو: {booking.cancellationReason}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end border-t pt-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadIcsFile(booking, consultant?.name)
                        }
                        className="min-h-10 w-full gap-1.5 rounded-xl text-xs sm:w-auto"
                      >
                        <CalendarPlus className="size-3.5" />
                        دریافت .ics
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Booking Modal */}
      <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90svh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg sm:text-xl">
              <CalendarPlus className="size-5 text-primary" />
              رزرو وقت مشاوره تحصیلی
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              زمان مورد نظر خود را در تقویم انتخاب کنید. اطلاعات شما به‌طور
              خودکار از پرونده تکمیل شده است.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <BookingForm
              consultants={consultants.map((c) => ({
                id: c.id,
                name: c.name,
                role: c.role,
              }))}
              initialName={profileQuery.data?.name ?? ""}
              initialMobile={profileQuery.data?.mobile ?? ""}
              initialConsultantId={
                caseQuery.data?.advisor
                  ? consultants.find(
                      (c) => c.name === caseQuery.data?.advisor?.name,
                    )?.id
                  : undefined
              }
              onBookingSuccess={() => {
                void bookingsQuery.refetch();
                setTimeout(() => setIsNewBookingOpen(false), 2000);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog
        open={Boolean(cancellingBooking)}
        onOpenChange={(open) => !open && setCancellingBooking(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg text-destructive">
              <AlertTriangle className="size-5" />
              لغو جلسه مشاوره
            </DialogTitle>
          </DialogHeader>

          {cancellingBooking && (
            <div className="space-y-4 py-2">
              {getHoursRemaining(cancellingBooking.startsAt) <
              CANCELLATION_WINDOW_HOURS ? (
                <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                  <p className="text-sm font-semibold text-destructive">
                    امکان لغو نوبت از پنل وجود ندارد
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    طبق قوانین موسسه، لغو یا تغییر زمان جلسه فقط تا ۲۴ ساعت قبل
                    از شروع نوبت امکان‌پذیر است. از زمان نوبت شما کمتر از ۲۴ ساعت
                    باقی مانده است. برای هرگونه هماهنگی اضطراری لطفاً به مشاور خود
                    پیام ارسال کنید.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="min-h-11 w-full gap-2 rounded-xl border-destructive/40 text-xs font-semibold text-destructive hover:bg-destructive/10 sm:text-sm"
                  >
                    <Link href="/panel/tickets">
                      <MessageSquare className="size-4" />
                      پیام به مشاور پرونده
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-foreground">
                    آیا از لغو جلسه مشاوره مورخ{" "}
                    <span className="font-semibold">
                      {formatJalaliDate(
                        cancellingBooking.startsAt,
                        "EEEE d MMMM",
                      )}
                    </span>{" "}
                    اطمینان دارید؟
                  </p>

                  <div className="space-y-2">
                    <label
                      htmlFor="cancel-reason"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      دلیل لغو (اختیاری):
                    </label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="علت لغو نوبت..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                      className="rounded-xl text-base sm:text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setCancellingBooking(null)}
              className="min-h-11 w-full rounded-xl sm:w-auto"
            >
              بستن
            </Button>
            {cancellingBooking &&
            getHoursRemaining(cancellingBooking.startsAt) >=
              CANCELLATION_WINDOW_HOURS ? (
              <Button
                variant="destructive"
                onClick={handleCancelSubmit}
                disabled={cancelMutation.isPending}
                className="min-h-11 w-full rounded-xl sm:w-auto"
              >
                تأیید و لغو جلسه
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Booking Dialog */}
      <Dialog
        open={Boolean(reschedulingBooking)}
        onOpenChange={(open) => !open && setReschedulingBooking(null)}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85svh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg">
              <RefreshCw className="size-5 text-primary" />
              تغییر زمان جلسه مشاوره
            </DialogTitle>
          </DialogHeader>

          {reschedulingBooking && (
            <div className="space-y-4 py-2">
              {getHoursRemaining(reschedulingBooking.startsAt) <
              CANCELLATION_WINDOW_HOURS ? (
                <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                  <p className="text-sm font-semibold text-destructive">
                    امکان تغییر زمان نوبت وجود ندارد
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    تغییر زمان نوبت فقط تا ۲۴ ساعت قبل از موعد جلسه امکان‌پذیر
                    است. لطفاً برای هماهنگی زمان جدید با مشاور پرونده خود گفتگو
                    کنید.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="min-h-11 w-full gap-2 rounded-xl border-destructive/40 text-xs font-semibold text-destructive hover:bg-destructive/10 sm:text-sm"
                  >
                    <Link href="/panel/tickets">
                      <MessageSquare className="size-4" />
                      پیام به مشاور پرونده
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <p className="text-xs text-muted-foreground">
                    تاریخ جدید مورد نظر خود را انتخاب کرده و سپس یکی از ساعت‌های
                    آزاد مشاور را برگزینید:
                  </p>

                  <div className="flex justify-center rounded-2xl border bg-card p-2 shadow-xs">
                    <JalaliCalendar
                      mode="single"
                      selected={rescheduleDate}
                      onSelect={(date) => {
                        setRescheduleDate(date);
                        setSelectedSlot("");
                      }}
                      disabled={(date) =>
                        date < new Date(nowMs + 24 * 60 * 60 * 1000)
                      }
                    />
                  </div>

                  {rescheduleDate && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">
                        ساعت‌های قابل رزرو:
                      </p>
                      {slotsQuery.isLoading ? (
                        <p className="text-xs text-muted-foreground">
                          در حال دریافت اسلات‌ها...
                        </p>
                      ) : (slotsQuery.data ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          در این روز اسلات بازی وجود ندارد. روز دیگری را انتخاب کنید.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 sm:grid-cols-4">
                          {(slotsQuery.data ?? []).map((slot) => {
                            const timeStr = formatJalaliDate(
                              slot.startsAt,
                              "HH:mm",
                            );
                            const isSelected = selectedSlot === slot.startsAt;
                            return (
                              <button
                                key={slot.startsAt}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setSelectedSlot(slot.startsAt)}
                                className={`min-h-11 rounded-xl border px-2 py-1.5 text-xs font-semibold transition-colors flex items-center justify-center ${
                                  !slot.available
                                    ? "cursor-not-allowed bg-muted opacity-40"
                                    : isSelected
                                      ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                                      : "hover:bg-muted/70"
                                }`}
                              >
                                {toPersianDigits(timeStr)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setReschedulingBooking(null)}
              className="min-h-11 w-full rounded-xl sm:w-auto"
            >
              انصراف
            </Button>
            {reschedulingBooking &&
            getHoursRemaining(reschedulingBooking.startsAt) >=
              CANCELLATION_WINDOW_HOURS ? (
              <Button
                onClick={handleRescheduleSubmit}
                disabled={!selectedSlot || patchMutation.isPending}
                className="min-h-11 w-full rounded-xl sm:w-auto"
              >
                ثبت زمان جدید
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
