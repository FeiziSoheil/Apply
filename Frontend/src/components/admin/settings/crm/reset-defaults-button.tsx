"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ResetDefaultsButtonProps = {
  disabled?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  label?: string;
};

export function ResetDefaultsButton({
  disabled,
  isPending,
  onConfirm,
  label = "بازگشت به پیش‌فرض",
}: ResetDefaultsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isPending}
        >
          <RotateCcw className="size-4" aria-hidden />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>بازگشت به پیش‌فرض؟</AlertDialogTitle>
          <AlertDialogDescription>
            تغییرات این بخش با مقادیر seed جایگزین می‌شود. این عمل قابل بازگشت
            نیست مگر با ویرایش دوباره.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            تأیید بازگشت
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
