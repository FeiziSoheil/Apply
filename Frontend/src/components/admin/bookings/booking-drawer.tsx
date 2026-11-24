"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { AdminSideDrawer } from "@/components/admin/admin-side-drawer";
import { StatusBadge } from "@/components/admin/status-badge";
import { Can } from "@/components/rbac/can";
import { useCan } from "@/components/rbac/use-can";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Booking, BookingStatus } from "@/contracts/bookings";
import {
  usePatchBooking,
  useSendBookingReminder,
  useUpdateBookingStatus,
} from "@/features/bookings/mutations";
import { useBookingHistory, useBookingSlots } from "@/features/bookings/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import {
  BOOKING_CHANGE_LABELS,
  BOOKING_STATUS_MAP,
  BOOKING_STATUS_SET_OPTIONS,
  CONSULTATION_TYPE_LABELS,
} from "./booking-labels";

type ConsultantOption = { id: string; name: string };

type BookingDrawerProps = {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultants: readonly ConsultantOption[];
};

export function BookingDrawer({
  booking,
  open,
  onOpenChange,
  consultants,
}: BookingDrawerProps) {
  return (
    <AdminSideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={booking ? `جزئیات رزرو ${booking.code}` : "جزئیات رزرو"}
      description={
        booking
          ? formatJalaliDate(booking.startsAt, "EEEE d MMMM yyyy — HH:mm")
          : undefined
      }
    >
      {booking ? (
        <BookingDrawerBody
          key={booking.id}
          booking={booking}
          consultants={consultants}
        />
      ) : null}
    </AdminSideDrawer>
  );
}

function BookingDrawerBody({
  booking,
  consultants,
}: {
  booking: Booking;
  consultants: readonly ConsultantOption[];
}) {
  const canReassign = useCan("user:manage");
  const updateStatus = useUpdateBookingStatus();
  const patchBooking = usePatchBooking();
  const remind = useSendBookingReminder();
  const historyQuery = useBookingHistory(booking.id);

  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [consultantId, setConsultantId] = useState(booking.consultantId ?? "");
  const [internalNotes, setInternalNotes] = useState(
    booking.internalNotes ?? "",
  );
  const [moveDate, setMoveDate] = useState(booking.startsAt.slice(0, 10));
  const [moveSlot, setMoveSlot] = useState(booking.startsAt);

  const slotsQuery = useBookingSlots(
    {
      date: moveDate,
      consultantId: consultantId || undefined,
    },
    { enabled: Boolean(moveDate) },
  );

  const freeSlots = useMemo(() => {
    const slots = slotsQuery.data ?? [];
    return slots.filter(
      (slot) =>
        slot.available ||
        (slot.startsAt === booking.startsAt &&
          slot.consultantId === booking.consultantId),
    );
  }, [slotsQuery.data, booking]);

  function onStatusSave() {
    updateStatus.mutate(
      { id: booking.id, body: { status } },
      {
        onSuccess: () => toast.success("وضعیت به‌روز شد"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  function onNotesSave() {
    patchBooking.mutate(
      { id: booking.id, body: { internalNotes: internalNotes || null } },
      {
        onSuccess: () => toast.success("یادداشت ذخیره شد"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  function onMoveSave() {
    const body: {
      startsAt?: string;
      consultantId?: string;
    } = {};
    if (moveSlot && moveSlot !== booking.startsAt) body.startsAt = moveSlot;
    if (
      canReassign &&
      consultantId &&
      consultantId !== booking.consultantId
    ) {
      body.consultantId = consultantId;
    }
    if (!body.startsAt && !body.consultantId) {
      toast.message("تغییری برای ذخیره نیست");
      return;
    }
    patchBooking.mutate(
      { id: booking.id, body },
      {
        onSuccess: () => toast.success("زمان/مشاور به‌روز شد"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  function onRemind() {
    remind.mutate(booking.id, {
      onSuccess: () =>
        toast.success("یادآوری ثبت شد (ارسال واقعی پیکربندی نشده)"),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }

  const consultantName =
    consultants.find((item) => item.id === booking.consultantId)?.name ?? "—";

  return (
    <div className="flex flex-col gap-6 p-4">
      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">متقاضی</dt>
          <dd className="font-medium">{booking.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">موبایل</dt>
          <dd className="font-medium tabular-nums" dir="ltr">
            {toPersianDigits(booking.mobile)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">نوع</dt>
          <dd>{CONSULTATION_TYPE_LABELS[booking.consultationType]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">مشاور</dt>
          <dd>{consultantName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">وضعیت</dt>
          <dd>
            <StatusBadge status={booking.status} map={BOOKING_STATUS_MAP} />
          </dd>
        </div>
        {booking.notes ? (
          <div>
            <dt className="text-muted-foreground">یادداشت متقاضی</dt>
            <dd>{booking.notes}</dd>
          </div>
        ) : null}
        {booking.leadId ? (
          <div>
            <dt className="text-muted-foreground">سرنخ مرتبط</dt>
            <dd>
              <Link
                href={`/admin/leads?q=${encodeURIComponent(booking.mobile)}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                مشاهده سرنخ
              </Link>
            </dd>
          </div>
        ) : null}
      </dl>

      <Can permission="booking:manage">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">تغییر وضعیت</h3>
          <div className="flex flex-wrap gap-2">
            <Select
              dir="rtl"
              value={status}
              onValueChange={(value) => setStatus(value as BookingStatus)}
            >
              <SelectTrigger className="min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOKING_STATUS_SET_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={onStatusSave}
              disabled={updateStatus.isPending || status === booking.status}
            >
              ذخیره وضعیت
            </Button>
          </div>
        </div>
      </Can>

      <Can permission="booking:manage">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">جابه‌جایی / مشاور</h3>
          {canReassign ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="drawer-consultant">مشاور</Label>
              <Select
                dir="rtl"
                value={consultantId}
                onValueChange={setConsultantId}
              >
                <SelectTrigger id="drawer-consultant">
                  <SelectValue placeholder="انتخاب مشاور" />
                </SelectTrigger>
                <SelectContent>
                  {consultants.map((consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="drawer-date">تاریخ (میلادی YYYY-MM-DD)</Label>
            <input
              id="drawer-date"
              type="date"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              dir="ltr"
              value={moveDate}
              onChange={(event) => {
                setMoveDate(event.target.value);
                setMoveSlot("");
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>اسلات آزاد</Label>
            <Select dir="rtl" value={moveSlot} onValueChange={setMoveSlot}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب ساعت" />
              </SelectTrigger>
              <SelectContent>
                {freeSlots.map((slot) => (
                  <SelectItem key={slot.startsAt} value={slot.startsAt}>
                    {formatJalaliDate(slot.startsAt, "HH:mm")}
                    {!slot.available ? " (فعلی)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onMoveSave}
            disabled={patchBooking.isPending}
          >
            ذخیره جابه‌جایی
          </Button>
        </div>
      </Can>

      <Can permission="booking:manage">
        <div className="flex flex-col gap-2">
          <Label htmlFor="internal-notes">یادداشت داخلی</Label>
          <Textarea
            id="internal-notes"
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            rows={3}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNotesSave}
            disabled={patchBooking.isPending}
          >
            ذخیره یادداشت
          </Button>
        </div>
      </Can>

      <Can permission="booking:manage">
        <Button
          type="button"
          variant="secondary"
          onClick={onRemind}
          disabled={remind.isPending}
        >
          {remind.isPending ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <Send data-icon="inline-start" aria-hidden />
          )}
          ارسال یادآوری
        </Button>
      </Can>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">تاریخچه تغییرات</h3>
        {historyQuery.isPending ? (
          <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
        ) : (historyQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">هنوز تغییری ثبت نشده.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {(historyQuery.data ?? []).map((change) => (
              <li
                key={change.id}
                className="rounded-md border border-border px-3 py-2"
              >
                <p className="font-medium">
                  {BOOKING_CHANGE_LABELS[change.action]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatJalaliDate(change.at, "d MMMM yyyy — HH:mm")} —{" "}
                  {change.byName}
                </p>
                {change.detail ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {change.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
