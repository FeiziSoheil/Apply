"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/auth/auth-provider";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StudentCase } from "@/contracts/students";
import { CASE_STAGES } from "@/contracts/students";
import { useAdvanceCaseStage } from "@/features/students/mutations";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import { formatJalaliDate } from "@/lib/format";
import { CASE_STAGE_LABELS } from "./case-labels";
import { CaseStageStepper } from "./case-stage-stepper";

type CaseStagesTabProps = {
  studentCase: StudentCase;
  actorName: (id: string | null) => string;
  suggestOpen?: boolean;
  onSuggestOpenChange?: (open: boolean) => void;
};

export function CaseStagesTab({
  studentCase,
  actorName,
  suggestOpen,
  onSuggestOpenChange,
}: CaseStagesTabProps) {
  const { user } = useSession();
  const advance = useAdvanceCaseStage();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [pendingOverride, setPendingOverride] = useState(false);

  const currentIndex = CASE_STAGES.indexOf(studentCase.currentStage);
  const canAdvance =
    studentCase.status === "active" &&
    currentIndex >= 0 &&
    currentIndex < CASE_STAGES.length - 1;

  function doAdvance(opts?: { override?: boolean; reason?: string }) {
    advance.mutate(
      {
        id: studentCase.id,
        version: studentCase.version,
        body: {
          overrideIncomplete: opts?.override || undefined,
          overrideReason: opts?.reason,
        },
      },
      {
        onSuccess: () => {
          toast.success("مرحله پرونده پیش رفت");
          setOverrideOpen(false);
          onSuggestOpenChange?.(false);
          setOverrideReason("");
          setPendingOverride(false);
        },
        onError: (error) => {
          if (
            isApiError(error) &&
            error.isConflict &&
            error.message.includes("مدارک الزامی")
          ) {
            if (user?.role === "admin") {
              setPendingOverride(true);
              setOverrideOpen(true);
              toast.message("مدارک ناقص است؛ برای نادیده گرفتن دلیل وارد کنید.");
            } else {
              toast.error(error.message);
            }
            return;
          }
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <CaseStageStepper
        stages={studentCase.stages}
        currentStage={studentCase.currentStage}
      />

      <div className="flex flex-wrap gap-2">
        <Can permission="case:write">
          <Button
            type="button"
            disabled={!canAdvance || advance.isPending}
            onClick={() => doAdvance()}
          >
            رفتن به مرحله بعد
          </Button>
        </Can>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">تاریخچه مراحل</h2>
        {studentCase.stageHistory.length === 0 ? (
          <p className="text-muted-foreground text-sm">تاریخچه‌ای ثبت نشده است.</p>
        ) : (
          <ol className="space-y-2">
            {[...studentCase.stageHistory]
              .reverse()
              .map((entry, index) => (
                <li
                  key={`${entry.stageKey}-${entry.enteredAt}-${index}`}
                  className="bg-card rounded-lg border p-3 text-sm"
                >
                  <p className="font-medium">
                    {CASE_STAGE_LABELS[
                      entry.stageKey as keyof typeof CASE_STAGE_LABELS
                    ] ?? entry.stageKey}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    ورود:{" "}
                    {formatJalaliDate(entry.enteredAt, "d MMM yyyy HH:mm")}
                    {entry.exitedAt
                      ? ` · خروج: ${formatJalaliDate(entry.exitedAt, "d MMM yyyy HH:mm")}`
                      : " · جاری"}
                    {" · "}
                    {actorName(entry.actorId)}
                  </p>
                  {entry.note ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {entry.note}
                    </p>
                  ) : null}
                </li>
              ))}
          </ol>
        )}
      </section>

      <Dialog
        open={Boolean(suggestOpen)}
        onOpenChange={(open) => onSuggestOpenChange?.(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>پیشنهاد پیشبرد مرحله</DialogTitle>
            <DialogDescription>
              چک‌لیست مرحله فعلی کامل به‌نظر می‌رسد. به مرحله بعد بروید؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuggestOpenChange?.(false)}
            >
              بعداً
            </Button>
            <Button type="button" onClick={() => doAdvance()}>
              پیشبرد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نادیده گرفتن الزامات (فقط مدیر)</DialogTitle>
            <DialogDescription>
              مدارک الزامی تأیید نشده‌اند. برای پیشبرد اجباری دلیل را بنویسید.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="override-reason">دلیل</Label>
            <Textarea
              id="override-reason"
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              minLength={3}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOverrideOpen(false)}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={
                overrideReason.trim().length < 3 ||
                advance.isPending ||
                !pendingOverride
              }
              onClick={() =>
                doAdvance({ override: true, reason: overrideReason.trim() })
              }
            >
              پیشبرد با نادیده گرفتن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
