"use client";

import { useEffect, useMemo, useState } from "react";
import { startOfWeek } from "date-fns";
import { CalendarDays, Eye, List } from "lucide-react";
import { DataTable } from "@/components/admin/data-table/data-table";
import {
  DateRangeFilter,
  SelectFilter,
} from "@/components/admin/data-table/filters";
import { RowActionsMenu } from "@/components/admin/data-table/row-actions-menu";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Booking } from "@/contracts/bookings";
import { useBookings } from "@/features/bookings/queries";
import { useConsultants } from "@/features/content/queries";
import { createBookingColumns } from "./booking-columns";
import { BookingDrawer } from "./booking-drawer";
import { BookingsCalendar } from "./bookings-calendar";
import {
  BOOKING_STATUS_FILTER_OPTIONS,
  CONSULTATION_TYPE_OPTIONS,
} from "./booking-labels";
import {
  bookingFilterParsers,
  toBookingListQuery,
} from "./bookings-table-params";
import { CreateBookingDialog } from "./create-booking-dialog";

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return mobile;
}

export function BookingsManager() {
  const table = useTableUrlState(bookingFilterParsers);
  const { params, filters, setFilters } = table;
  const listQuery = useBookings(toBookingListQuery(params, filters));
  const consultantsQuery = useConsultants({
    page: 1,
    pageSize: 100,
    sort: "order",
    order: "asc",
    active: true,
  });

  const consultants = useMemo(
    () =>
      (consultantsQuery.data?.items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
      })),
    [consultantsQuery.data?.items],
  );

  const consultantName = useMemo(() => {
    const map = new Map(consultants.map((item) => [item.id, item.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—");
  }, [consultants]);

  const columns = useMemo(
    () => createBookingColumns({ consultantName }),
    [consultantName],
  );

  const [selected, setSelected] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTarget, setCreateTarget] = useState<{
    consultantId: string;
    startsAt: string;
  } | null>(null);

  const mobile = useIsMobile();
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 6 }),
  );
  const [dayCursor, setDayCursor] = useState(() => new Date());

  // Calendar loads a broader window without pagination
  const calendarFrom = useMemo(() => {
    const start = mobile ? dayCursor : weekStart;
    return new Date(
      `${start.toISOString().slice(0, 10)}T00:00:00+03:30`,
    ).toISOString();
  }, [mobile, dayCursor, weekStart]);
  const calendarTo = useMemo(() => {
    const end = mobile
      ? dayCursor
      : new Date(weekStart.getTime() + 6 * 86_400_000);
    return new Date(
      `${end.toISOString().slice(0, 10)}T23:59:59.999+03:30`,
    ).toISOString();
  }, [mobile, dayCursor, weekStart]);

  const calendarQuery = useBookings({
    page: 1,
    pageSize: 100,
    sort: "startsAt",
    order: "asc",
    from: calendarFrom,
    to: calendarTo,
    consultantId: filters.consultantId ?? undefined,
    status: filters.status ?? undefined,
  });

  const data = listQuery.data;

  return (
    <PageContainer>
      <PageHeader
        title="رزروها"
        description="فهرست و تقویم نوبت‌های مشاوره؛ مشاور فقط رزروهای خودش را می‌بیند."
      />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">
            <List data-icon="inline-start" aria-hidden />
            فهرست
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays data-icon="inline-start" aria-hidden />
            تقویم
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <DataTable
            caption="فهرست رزروها"
            columns={columns}
            data={data?.items}
            pagination={data?.pagination}
            getRowId={(booking) => booking.id}
            controller={table}
            isLoading={listQuery.isPending}
            isFetching={listQuery.isFetching}
            error={listQuery.error}
            onRetry={() => void listQuery.refetch()}
            searchPlaceholder="جستجوی کد، نام یا موبایل…"
            filters={
              <>
                <SelectFilter
                  label="وضعیت"
                  value={filters.status}
                  options={BOOKING_STATUS_FILTER_OPTIONS}
                  onChange={(status) =>
                    setFilters({
                      status: status as Booking["status"] | null,
                    })
                  }
                />
                <SelectFilter
                  label="مشاور"
                  value={filters.consultantId}
                  options={consultants.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  onChange={(consultantId) => setFilters({ consultantId })}
                />
                <SelectFilter
                  label="نوع"
                  value={filters.consultationType}
                  options={CONSULTATION_TYPE_OPTIONS}
                  onChange={(consultationType) =>
                    setFilters({
                      consultationType:
                        consultationType as Booking["consultationType"] | null,
                    })
                  }
                />
                <DateRangeFilter
                  label="بازه تاریخ"
                  value={{ from: filters.from, to: filters.to }}
                  onChange={({ from, to }) => setFilters({ from, to })}
                />
              </>
            }
            rowActions={(booking) => (
              <RowActionsMenu label={`عملیات رزرو ${booking.code}`}>
                <DropdownMenuItem
                  onSelect={() => {
                    setSelected(booking);
                    setDrawerOpen(true);
                  }}
                >
                  <Eye aria-hidden />
                  جزئیات
                </DropdownMenuItem>
              </RowActionsMenu>
            )}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <SelectFilter
              label="وضعیت"
              value={filters.status}
              options={BOOKING_STATUS_FILTER_OPTIONS}
              onChange={(status) =>
                setFilters({
                  status: status as Booking["status"] | null,
                })
              }
            />
            <SelectFilter
              label="مشاور"
              value={filters.consultantId}
              options={consultants.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(consultantId) => setFilters({ consultantId })}
            />
          </div>
          <BookingsCalendar
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            mobile={mobile}
            dayCursor={dayCursor}
            onDayChange={setDayCursor}
            bookings={calendarQuery.data?.items ?? []}
            consultants={
              filters.consultantId
                ? consultants.filter((item) => item.id === filters.consultantId)
                : consultants
            }
            onSelectBooking={(booking) => {
              setSelected(booking);
              setDrawerOpen(true);
            }}
            onSelectEmptySlot={(input) => {
              setCreateTarget(input);
              setCreateOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      <BookingDrawer
        booking={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        consultants={consultants}
      />

      {createTarget ? (
        <CreateBookingDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          consultantId={createTarget.consultantId}
          consultantName={consultantName(createTarget.consultantId)}
          startsAt={createTarget.startsAt}
        />
      ) : null}
    </PageContainer>
  );
}
