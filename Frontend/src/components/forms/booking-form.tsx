"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format as formatIso } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormInputField } from "@/components/forms/form-input-field";
import { FormPhoneField } from "@/components/forms/form-phone-field";
import { FormTextareaField } from "@/components/forms/form-textarea-field";
import { FormSelectField } from "@/components/forms/form-select-field";
import { FormRadioField } from "@/components/forms/form-radio-field";
import { JalaliCalendar } from "@/components/forms/jalali-calendar";
import { focusFirstError } from "@/components/forms/focus-first-error";
import {
  CONSULTATION_TYPE_LABELS,
  CONSULTATION_TYPES,
  bookingSchema,
  type BookingFormValues,
} from "@/lib/validations/booking";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { toBookingRequest } from "@/features/bookings/mappers";
import { useCreateBooking } from "@/features/bookings/mutations";
import { useBookingSlots } from "@/features/bookings/queries";
import { QueryProvider } from "@/lib/api/query-provider";
import { FIELD_ERRORS_MESSAGE, useApiForm } from "@/lib/api/use-api-form";

/** Contract field → form field (`startsAt` is split into date + time slot) */
const BOOKING_FIELD_MAP = { startsAt: "timeSlot" } as const;
const BOOKING_FORM_FIELDS = [
  "consultationType",
  "consultantId",
  "date",
  "timeSlot",
  "name",
  "mobile",
  "notes",
] as const;

export type BookingConsultantOption = {
  id: string;
  name: string;
  role: string;
};

type BookingFormProps = {
  consultants: BookingConsultantOption[];
  /** Prefill notes from program/university CTA query params */
  initialNotes?: string;
  /** Prefill consultant from `?consultant=` deep-link */
  initialConsultantId?: string;
  initialName?: string;
  initialMobile?: string;
  onBookingSuccess?: (bookingId: string) => void;
};

type ConfirmationState = {
  bookingId: string;
  values: BookingFormValues;
  consultantName?: string;
  timeLabel?: string;
};

/** Public client island: brings its own `QueryProvider` (shared browser client) */
export function BookingForm(props: BookingFormProps) {
  return (
    <QueryProvider>
      <BookingFormContent {...props} />
    </QueryProvider>
  );
}

function BookingFormContent({
  consultants,
  initialNotes = "",
  initialConsultantId,
  initialName = "",
  initialMobile = "",
  onBookingSuccess,
}: BookingFormProps) {
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  );

  const resolvedConsultantId =
    initialConsultantId &&
    consultants.some((c) => c.id === initialConsultantId)
      ? initialConsultantId
      : "none";

  const { form, handleApiError } = useApiForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      consultationType: "online",
      consultantId: resolvedConsultantId,
      date: undefined,
      timeSlot: "",
      name: initialName,
      mobile: initialMobile,
      notes: initialNotes,
    },
    mode: "onTouched",
  });

  const consultantOptions = useMemo(
    () => [
      { value: "none", label: "فرقی ندارد — اولین مشاور آزاد" },
      ...consultants.map((consultant) => ({
        value: consultant.id,
        label: `${consultant.name} — ${consultant.role}`,
      })),
    ],
    [consultants],
  );

  const selectedDate = form.watch("date");
  const selectedConsultant = form.watch("consultantId");
  const consultationType = form.watch("consultationType");

  const dateParam = selectedDate
    ? formatIso(selectedDate, "yyyy-MM-dd")
    : "";

  const slotsQuery = useBookingSlots(
    {
      date: dateParam,
      consultationType,
      consultantId:
        selectedConsultant && selectedConsultant !== "none"
          ? selectedConsultant
          : undefined,
    },
    { enabled: Boolean(dateParam) },
  );

  /** Unique start times that have at least one available consultant */
  const timeOptions = useMemo(() => {
    const slots = (slotsQuery.data ?? []).filter((slot) => slot.available);
    const byStart = new Map<string, string>();
    for (const slot of slots) {
      const label = formatJalaliDate(slot.startsAt, "HH:mm");
      if (!byStart.has(slot.startsAt)) {
        byStart.set(slot.startsAt, label);
      }
    }
    return [...byStart.entries()].map(([startsAt, label]) => ({
      value: startsAt,
      label: toPersianDigits(label),
    }));
  }, [slotsQuery.data]);

  useEffect(() => {
    form.setValue("timeSlot", "");
  }, [dateParam, selectedConsultant, consultationType, form]);

  const createBooking = useCreateBooking();
  const isPending = createBooking.isPending;

  function onSubmit(values: BookingFormValues) {
    createBooking.mutate(toBookingRequest(values), {
      onSuccess: (receipt) => {
        const consultantName = consultants.find(
          (c) => c.id === values.consultantId,
        )?.name;
        const timeLabel = timeOptions.find(
          (slot) => slot.value === values.timeSlot,
        )?.label;

        setConfirmation({
          bookingId: receipt.code,
          values,
          consultantName,
          timeLabel,
        });
        onBookingSuccess?.(receipt.id);
        toast.success("رزرو شما ثبت شد");
        form.reset({
          consultationType: "online",
          consultantId: resolvedConsultantId,
          date: undefined,
          timeSlot: "",
          name: "",
          mobile: "",
          notes: "",
        });
      },
      onError: (error) => {
        const { applied, message } = handleApiError(error, {
          fieldMap: BOOKING_FIELD_MAP,
          knownFields: BOOKING_FORM_FIELDS,
          fallbackMessage:
            "رزرو مشاوره با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
        });
        toast.error(applied > 0 ? FIELD_ERRORS_MESSAGE : message);
      },
    });
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-border bg-muted/30 p-6">
        <h2 className="text-xl font-semibold text-foreground">
          رزرو با موفقیت ثبت شد
        </h2>
        <p className="text-sm text-muted-foreground">
          کد پیگیری:{" "}
          <span className="font-medium text-foreground" dir="ltr">
            {confirmation.bookingId}
          </span>
        </p>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">نوع مشاوره</dt>
            <dd className="font-medium">
              {CONSULTATION_TYPE_LABELS[confirmation.values.consultationType]}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">مشاور</dt>
            <dd className="font-medium">
              {confirmation.consultantName ?? "اولین مشاور آزاد"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">تاریخ</dt>
            <dd className="font-medium">
              {formatJalaliDate(confirmation.values.date, "EEEE d MMMM yyyy")}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">ساعت</dt>
            <dd className="font-medium">
              {confirmation.timeLabel ??
                toPersianDigits(confirmation.values.timeSlot)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">نام</dt>
            <dd className="font-medium">{confirmation.values.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">موبایل</dt>
            <dd className="font-medium" dir="ltr">
              {toPersianDigits(confirmation.values.mobile)}
            </dd>
          </div>
        </dl>
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirmation(null)}
        >
          رزرو جدید
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          focusFirstError(errors, form.setFocus);
        })}
        className="mx-auto grid w-full max-w-3xl gap-6"
        noValidate
      >
        <FormRadioField
          control={form.control}
          name="consultationType"
          label="نوع مشاوره"
          orientation="horizontal"
          options={CONSULTATION_TYPES.map((value) => ({
            value,
            label: CONSULTATION_TYPE_LABELS[value],
          }))}
        />

        <FormSelectField
          control={form.control}
          name="consultantId"
          label="انتخاب مشاور (اختیاری)"
          options={consultantOptions}
          placeholder="انتخاب مشاور"
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_14rem]">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاریخ مشاوره</FormLabel>
                <FormControl>
                  <div className="rounded-xl border border-border p-2">
                    <JalaliCalendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      {...(field.value ? { defaultMonth: field.value } : {})}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ساعت</FormLabel>
                <FormControl>
                  <div
                    className="grid grid-cols-2 gap-2 lg:grid-cols-1"
                    role="listbox"
                    aria-label="ساعت مشاوره"
                  >
                    {!selectedDate ? (
                      <p className="col-span-full text-[0.8rem] text-muted-foreground">
                        ابتدا تاریخ را انتخاب کنید
                      </p>
                    ) : slotsQuery.isPending ? (
                      <p className="col-span-full text-[0.8rem] text-muted-foreground">
                        در حال بارگذاری اسلات‌ها…
                      </p>
                    ) : timeOptions.length === 0 ? (
                      <p className="col-span-full text-[0.8rem] text-muted-foreground">
                        برای این روز اسلات آزادی نیست
                      </p>
                    ) : (
                      timeOptions.map((slot) => {
                        const active = field.value === slot.value;
                        return (
                          <Button
                            key={slot.value}
                            type="button"
                            variant={active ? "default" : "outline"}
                            className="justify-center"
                            onClick={() => field.onChange(slot.value)}
                            aria-selected={active}
                            role="option"
                          >
                            {slot.label}
                          </Button>
                        );
                      })
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInputField
            control={form.control}
            name="name"
            label="نام و نام خانوادگی"
            autoComplete="name"
          />
          <FormPhoneField control={form.control} name="mobile" />
        </div>

        <FormTextareaField
          control={form.control}
          name="notes"
          label="یادداشت (اختیاری)"
          placeholder="موضوع مشاوره یا سوالات خود را بنویسید"
        />

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              در حال ثبت رزرو…
            </>
          ) : (
            "ثبت رزرو"
          )}
        </Button>
      </form>
    </Form>
  );
}
