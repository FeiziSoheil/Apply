"use client";

import { useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useCreateQuickContactLead } from "@/features/leads/mutations";

type RequestConsultationButtonProps = {
  className?: string;
  label?: string;
};

/**
 * S1 — وقتی پرونده‌ای پیدا نشد، لید مشاوره از شماره/نام نشست می‌سازد.
 */
export function RequestConsultationButton({
  className,
  label = "درخواست مشاوره",
}: RequestConsultationButtonProps) {
  const { user } = useSession();
  const createLead = useCreateQuickContactLead();
  const [done, setDone] = useState(false);

  const onClick = () => {
    if (!user?.mobile) {
      toast.error("شماره موبایل شما در حساب ثبت نشده است.");
      return;
    }
    createLead.mutate(
      {
        source: "callback",
        name: user.name,
        mobile: user.mobile,
        message:
          "درخواست مشاوره از پنل دانشجو — پرونده‌ای برای این شماره پیدا نشد.",
      },
      {
        onSuccess: () => {
          setDone(true);
          toast.success("درخواست مشاوره ثبت شد. به‌زودی با شما تماس می‌گیریم.");
        },
        onError: (error) => {
          toast.error(error.message || "ثبت درخواست ممکن نشد.");
        },
      },
    );
  };

  if (done) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        درخواست شما ثبت شد. مشاور به‌زودی تماس می‌گیرد.
      </p>
    );
  }

  return (
    <Button
      type="button"
      className={`min-h-11 ${className ?? ""}`}
      disabled={createLead.isPending}
      onClick={onClick}
    >
      {createLead.isPending ? (
        <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />
      ) : (
        <MessageCircle data-icon="inline-start" aria-hidden />
      )}
      {label}
    </Button>
  );
}
