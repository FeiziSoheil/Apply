"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DateTimeJalaliPicker } from "@/components/admin/fields/date-time-jalali-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONSULTATION_TYPES } from "@/contracts/bookings";
import type { Lead } from "@/contracts/leads";
import { useCreateStaffBooking } from "@/features/bookings/mutations";
import { getApiErrorMessage } from "@/lib/api";
import { CONSULTATION_TYPE_LABELS } from "@/components/admin/bookings/booking-labels";

type ConsultantOption = { value: string; label: string };

type LeadBookingDialogProps = {
  open: boolean;
  lead: Lead;
  consultants: readonly ConsultantOption[];
  onOpenChange: (open: boolean) => void;
};

export function LeadBookingDialog({
  open,
  lead,
  consultants,
  onOpenChange,
}: LeadBookingDialogProps) {
  const create = useCreateStaffBooking();
  const [consultantId, setConsultantId] = useState(
    lead.assignedTo ?? consultants[0]?.value ?? "",
  );
  const [startsAt, setStartsAt] = useState<string | null>(() =>
    new Date(Date.now() + 86_400_000).toISOString(),
  );
  const [consultationType, setConsultationType] = useState<
    (typeof CONSULTATION_TYPES)[number]
  >("online");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>رزرو مشاوره برای {lead.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>مشاور</Label>
            <Select
              value={consultantId || undefined}
              onValueChange={setConsultantId}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب مشاور…" />
              </SelectTrigger>
              <SelectContent>
                {consultants.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>زمان</Label>
            <DateTimeJalaliPicker
              value={startsAt}
              onChange={setStartsAt}
              mode="datetime"
            />
          </div>
          <div className="space-y-1.5">
            <Label>نوع</Label>
            <Select
              value={consultationType}
              onValueChange={(value) =>
                setConsultationType(value as (typeof CONSULTATION_TYPES)[number])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSULTATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CONSULTATION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            type="button"
            disabled={!consultantId || !startsAt || create.isPending}
            onClick={() => {
              if (!startsAt) return;
              create.mutate(
                {
                  consultantId,
                  startsAt,
                  consultationType,
                  name: lead.name,
                  mobile: lead.mobile,
                  leadId: lead.id,
                  status: "confirmed",
                },
                {
                  onSuccess: () => {
                    toast.success("رزرو ثبت شد");
                    onOpenChange(false);
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }}
          >
            ثبت رزرو
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
