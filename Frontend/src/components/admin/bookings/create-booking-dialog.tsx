"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormInputField } from "@/components/forms/form-input-field";
import { FormPhoneField } from "@/components/forms/form-phone-field";
import { FormRadioField } from "@/components/forms/form-radio-field";
import { FormTextareaField } from "@/components/forms/form-textarea-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { CONSULTATION_TYPES } from "@/contracts/bookings";
import { useCreateStaffBooking } from "@/features/bookings/mutations";
import { getApiErrorMessage } from "@/lib/api";
import { formatJalaliDate } from "@/lib/format";
import { mobileSchema, nameSchema } from "@/lib/validations/common";
import { CONSULTATION_TYPE_LABELS } from "./booking-labels";

const createSchema = z.object({
  consultationType: z.enum(CONSULTATION_TYPES),
  name: nameSchema,
  mobile: mobileSchema,
  notes: z.string().trim().max(1000).optional(),
  internalNotes: z.string().trim().max(2000).optional(),
});

type CreateValues = z.infer<typeof createSchema>;

type CreateBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultantId: string;
  consultantName: string;
  startsAt: string;
};

export function CreateBookingDialog({
  open,
  onOpenChange,
  consultantId,
  consultantName,
  startsAt,
}: CreateBookingDialogProps) {
  const create = useCreateStaffBooking();
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      consultationType: "online",
      name: "",
      mobile: "",
      notes: "",
      internalNotes: "",
    },
  });

  function onSubmit(values: CreateValues) {
    create.mutate(
      {
        consultationType: values.consultationType,
        consultantId,
        startsAt,
        name: values.name,
        mobile: values.mobile,
        notes: values.notes?.trim() || undefined,
        internalNotes: values.internalNotes?.trim() || undefined,
        status: "confirmed",
      },
      {
        onSuccess: () => {
          toast.success("رزرو ثبت شد");
          form.reset();
          onOpenChange(false);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ایجاد رزرو دستی</DialogTitle>
          <DialogDescription>
            {consultantName} —{" "}
            {formatJalaliDate(startsAt, "EEEE d MMMM yyyy — HH:mm")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
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
            <FormInputField
              control={form.control}
              name="name"
              label="نام و نام خانوادگی"
            />
            <FormPhoneField control={form.control} name="mobile" />
            <FormTextareaField
              control={form.control}
              name="notes"
              label="یادداشت متقاضی (اختیاری)"
            />
            <FormTextareaField
              control={form.control}
              name="internalNotes"
              label="یادداشت داخلی (اختیاری)"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? (
                  <>
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                    در حال ثبت…
                  </>
                ) : (
                  "ثبت رزرو"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
