"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format as formatIso } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { WEEKDAY_LABELS } from "@/components/admin/bookings/booking-labels";
import { DateTimeJalaliPicker } from "@/components/admin/fields/date-time-jalali-picker";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ConsultantAvailability } from "@/contracts/availability";
import {
  useCreateAvailabilityLeave,
  useCreateGlobalHoliday,
  useDeleteAvailabilityLeave,
  useDeleteGlobalHoliday,
  useUpsertAvailability,
} from "@/features/availability/mutations";
import {
  useAvailabilities,
  useGlobalHolidays,
} from "@/features/availability/queries";
import { useBookingSlots } from "@/features/bookings/queries";
import { useConsultants } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import {
  availabilitySettingsSchema,
  holidayFormSchema,
  leaveFormSchema,
  type AvailabilitySettingsValues,
  type HolidayFormValues,
  type LeaveFormValues,
} from "@/lib/validations/availability";
import { defaultWeeklySchedule } from "@/contracts/availability";

function toFormValues(
  availability: ConsultantAvailability | undefined,
): AvailabilitySettingsValues {
  const weekly = availability?.weekly ?? defaultWeeklySchedule();
  const byDay = new Map(weekly.map((day) => [day.dayOfWeek, day.ranges]));
  return {
    slotDurationMinutes: availability?.slotDurationMinutes ?? 60,
    gapMinutes: availability?.gapMinutes ?? 0,
    maxDailyBookings: availability?.maxDailyBookings ?? 8,
    weekly: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      ranges: byDay.get(dayOfWeek) ?? [],
    })),
  };
}

function SlotPreview({
  consultantId,
}: {
  consultantId: string;
}) {
  const today = formatIso(new Date(), "yyyy-MM-dd");
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        formatIso(addDays(new Date(`${today}T12:00:00`), index), "yyyy-MM-dd"),
      ),
    [today],
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">پیش‌نمایش اسلات ۷ روز آینده</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {days.map((date) => (
          <DaySlots key={date} date={date} consultantId={consultantId} />
        ))}
      </div>
    </div>
  );
}

function DaySlots({
  date,
  consultantId,
}: {
  date: string;
  consultantId: string;
}) {
  const query = useBookingSlots(
    { date, consultantId },
    { enabled: Boolean(consultantId) },
  );
  const available = (query.data ?? []).filter((slot) => slot.available);

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {formatJalaliDate(`${date}T12:00:00+03:30`, "EEEE d MMMM")}
      </p>
      {query.isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : available.length === 0 ? (
        <p className="text-xs text-muted-foreground">اسلات آزادی نیست</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {available.slice(0, 8).map((slot) => (
            <li
              key={slot.startsAt}
              className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums"
              dir="ltr"
            >
              {toPersianDigits(formatJalaliDate(slot.startsAt, "HH:mm"))}
            </li>
          ))}
          {available.length > 8 ? (
            <li className="text-xs text-muted-foreground">
              +{toPersianDigits(available.length - 8)}
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

export function AvailabilitySettings() {
  const consultantsQuery = useConsultants({
    page: 1,
    pageSize: 100,
    sort: "order",
    order: "asc",
    active: true,
  });
  const availabilitiesQuery = useAvailabilities();
  const holidaysQuery = useGlobalHolidays();

  const consultants = useMemo(
    () => consultantsQuery.data?.items ?? [],
    [consultantsQuery.data?.items],
  );
  const [consultantId, setConsultantId] = useState<string>("");
  const activeConsultantId = consultantId || consultants[0]?.id || "";

  const availability = availabilitiesQuery.data?.find(
    (item) => item.consultantId === activeConsultantId,
  );

  const form = useForm<AvailabilitySettingsValues>({
    resolver: zodResolver(availabilitySettingsSchema),
    values: toFormValues(availability),
  });

  const weeklyArray = useFieldArray({
    control: form.control,
    name: "weekly",
  });

  const upsert = useUpsertAvailability();
  const createLeave = useCreateAvailabilityLeave();
  const deleteLeave = useDeleteAvailabilityLeave();
  const createHoliday = useCreateGlobalHoliday();
  const deleteHoliday = useDeleteGlobalHoliday();

  const leaveForm = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: { from: "", to: "", reason: "" },
  });

  const holidayForm = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: { date: "", name: "" },
  });

  function onSaveSettings(values: AvailabilitySettingsValues) {
    if (!activeConsultantId) return;
    upsert.mutate(
      { consultantId: activeConsultantId, body: values },
      {
        onSuccess: () => toast.success("ساعات کاری ذخیره شد"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  function onAddLeave(values: LeaveFormValues) {
    if (!activeConsultantId) return;
    createLeave.mutate(
      {
        consultantId: activeConsultantId,
        body: {
          from: values.from,
          to: values.to,
          reason: values.reason?.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("مرخصی ثبت شد");
          leaveForm.reset({ from: "", to: "", reason: "" });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  function onAddHoliday(values: HolidayFormValues) {
    createHoliday.mutate(
      { date: values.date, name: values.name.trim() },
      {
        onSuccess: () => {
          toast.success("تعطیلی اضافه شد");
          holidayForm.reset({ date: "", name: "" });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  const loading =
    consultantsQuery.isPending || availabilitiesQuery.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="ساعات کاری و در دسترس‌بودن"
        description="برنامه هفتگی مشاوران، مدت جلسه، سقف روزانه، مرخصی و تعطیلات سراسری."
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs defaultValue="weekly" className="space-y-6">
          <TabsList>
            <TabsTrigger value="weekly">برنامه مشاور</TabsTrigger>
            <TabsTrigger value="holidays">تعطیلات سراسری</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-6">
            <div className="max-w-sm space-y-2">
              <label className="text-sm font-medium" htmlFor="consultant-select">
                مشاور
              </label>
              <Select
                dir="rtl"
                value={activeConsultantId}
                onValueChange={setConsultantId}
              >
                <SelectTrigger id="consultant-select">
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

            {activeConsultantId ? (
              <>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSaveSettings)}
                    className="space-y-6"
                  >
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="slotDurationMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>مدت هر جلسه (دقیقه)</FormLabel>
                            <FormControl>
                              <Input type="number" min={15} max={180} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gapMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>فاصله بین جلسات (دقیقه)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} max={120} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="maxDailyBookings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>سقف رزرو روزانه</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={40} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">شبکه هفتگی</h3>
                      <p className="text-xs text-muted-foreground">
                        جمعه به‌طور پیش‌فرض تعطیل است. می‌توانید چند بازه در هر
                        روز تعریف کنید.
                      </p>
                      <div className="space-y-4">
                        {weeklyArray.fields.map((field, dayIndex) => (
                          <DayRangesEditor
                            key={field.id}
                            dayIndex={dayIndex}
                            form={form}
                          />
                        ))}
                      </div>
                    </div>

                    <Can permission="user:manage">
                      <Button type="submit" disabled={upsert.isPending}>
                        {upsert.isPending ? (
                          <>
                            <Loader2
                              className="animate-spin"
                              data-icon="inline-start"
                            />
                            در حال ذخیره…
                          </>
                        ) : (
                          "ذخیره برنامه"
                        )}
                      </Button>
                    </Can>
                  </form>
                </Form>

                <div className="space-y-4 rounded-lg border border-border p-4">
                  <h3 className="text-sm font-medium">مرخصی‌ها</h3>
                  <ul className="space-y-2">
                    {(availability?.leaves ?? []).map((leave) => (
                      <li
                        key={leave.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
                      >
                        <span>
                          {formatJalaliDate(leave.from)} تا{" "}
                          {formatJalaliDate(leave.to)}
                          {leave.reason ? ` — ${leave.reason}` : ""}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="حذف مرخصی"
                          onClick={() =>
                            deleteLeave.mutate(
                              {
                                consultantId: activeConsultantId,
                                leaveId: leave.id,
                              },
                              {
                                onSuccess: () => toast.success("مرخصی حذف شد"),
                                onError: (error) =>
                                  toast.error(getApiErrorMessage(error)),
                              },
                            )
                          }
                        >
                          <Trash2 data-icon="inline-start" aria-hidden />
                          حذف
                        </Button>
                      </li>
                    ))}
                    {(availability?.leaves ?? []).length === 0 ? (
                      <li className="text-sm text-muted-foreground">
                        مرخصی ثبت نشده است.
                      </li>
                    ) : null}
                  </ul>

                  <Form {...leaveForm}>
                    <form
                      onSubmit={leaveForm.handleSubmit(onAddLeave)}
                      className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                      <FormField
                        control={leaveForm.control}
                        name="from"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>از تاریخ</FormLabel>
                            <FormControl>
                              <DateTimeJalaliPicker
                                mode="date"
                                value={field.value || null}
                                onChange={(value) => field.onChange(value ?? "")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={leaveForm.control}
                        name="to"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تا تاریخ</FormLabel>
                            <FormControl>
                              <DateTimeJalaliPicker
                                mode="date"
                                value={field.value || null}
                                onChange={(value) => field.onChange(value ?? "")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={leaveForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>دلیل (اختیاری)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={createLeave.isPending}
                        >
                          <Plus data-icon="inline-start" aria-hidden />
                          افزودن
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>

                <SlotPreview consultantId={activeConsultantId} />
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="holidays" className="space-y-4">
            <ul className="space-y-2">
              {(holidaysQuery.data ?? []).map((holiday) => (
                <li
                  key={holiday.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>
                    {formatJalaliDate(holiday.date)} — {holiday.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      deleteHoliday.mutate(holiday.id, {
                        onSuccess: () => toast.success("تعطیلی حذف شد"),
                        onError: (error) =>
                          toast.error(getApiErrorMessage(error)),
                      })
                    }
                  >
                    <Trash2 data-icon="inline-start" aria-hidden />
                    حذف
                  </Button>
                </li>
              ))}
            </ul>

            <Form {...holidayForm}>
              <form
                onSubmit={holidayForm.handleSubmit(onAddHoliday)}
                className="grid max-w-xl gap-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <FormField
                  control={holidayForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ</FormLabel>
                      <FormControl>
                        <DateTimeJalaliPicker
                          mode="date"
                          value={field.value || null}
                          onChange={(value) => field.onChange(value ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={holidayForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثلاً نوروز" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button type="submit" disabled={createHoliday.isPending}>
                    <Plus data-icon="inline-start" aria-hidden />
                    افزودن
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  );
}

function DayRangesEditor({
  dayIndex,
  form,
}: {
  dayIndex: number;
  form: ReturnType<typeof useForm<AvailabilitySettingsValues>>;
}) {
  const ranges = useFieldArray({
    control: form.control,
    name: `weekly.${dayIndex}.ranges`,
  });
  const dayOfWeek = form.watch(`weekly.${dayIndex}.dayOfWeek`);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {WEEKDAY_LABELS[dayOfWeek] ?? `روز ${dayOfWeek}`}
          {dayOfWeek === 5 ? (
            <span className="ms-2 text-xs font-normal text-muted-foreground">
              (پیش‌فرض تعطیل)
            </span>
          ) : null}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => ranges.append({ start: "09:00", end: "12:00" })}
        >
          <Plus data-icon="inline-start" aria-hidden />
          بازه جدید
        </Button>
      </div>
      {ranges.fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">بدون بازه — روز تعطیل</p>
      ) : (
        <div className="space-y-2">
          {ranges.fields.map((range, rangeIndex) => (
            <div
              key={range.id}
              className="grid grid-cols-[1fr_1fr_auto] items-start gap-2"
            >
              <FormField
                control={form.control}
                name={`weekly.${dayIndex}.ranges.${rangeIndex}.start`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">شروع</FormLabel>
                    <FormControl>
                      <Input type="time" dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`weekly.${dayIndex}.ranges.${rangeIndex}.end`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">پایان</FormLabel>
                    <FormControl>
                      <Input type="time" dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="حذف بازه"
                onClick={() => ranges.remove(rangeIndex)}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
