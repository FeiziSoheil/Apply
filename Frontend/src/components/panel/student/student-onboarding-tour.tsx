"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyStudentProfile } from "@/features/student-panel/queries";
import { useUpdateMyProfile } from "@/features/student-panel/mutations";

const LOCAL_STORAGE_KEY = "apply_onboarding_completed";

type Step = {
  id: "case" | "documents" | "messages";
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Briefcase;
  color: string;
};

const STEPS: Step[] = [
  {
    id: "case",
    title: "پیگیری پرونده و پذیرش",
    subtitle: "قدم اول: پرونده تحصیلی شما",
    description:
      "در بخش پرونده، مراحل مختلف اپلای، دانشگاه‌های هدف، وضعیت پرونده و مهلت‌های پیش‌رو را با شفافیت کامل دنبال کنید.",
    icon: Briefcase,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    id: "documents",
    title: "مدارک و چک‌لیست اپلای",
    subtitle: "قدم دوم: بارگذاری آسان مدارک",
    description:
      "مدارک تحصیلی، هویتی و زبانی خود را مستقیماً بارگذاری کنید. در صورت نیاز به اصلاح یا تأیید نهایی، وضعیت آن سریعاً به‌روز می‌شود.",
    icon: FileText,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    id: "messages",
    title: "پیام‌ها و ارتباط با مشاور",
    subtitle: "قدم سوم: همراهی اختصاصی شما",
    description:
      "مشاور اختصاصی شما در تمام مسیر پاسخگوی سؤالات است. هرگونه پرسش یا نیاز به راهنمایی را از طریق بخش پیام‌ها ارسال کنید.",
    icon: MessageSquare,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
];

export function StudentOnboardingTour() {
  const profileQuery = useMyStudentProfile();
  const updateProfileMutation = useUpdateMyProfile();
  const [open, setOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!profileQuery.data) return;

    // Check if onboarding is already completed in profile or localStorage
    const localDone = typeof window !== "undefined" && localStorage.getItem(LOCAL_STORAGE_KEY) === "true";
    const profileDone = profileQuery.data.onboardingCompleted === true;

    if (!localDone && !profileDone) {
      setOpen(true);
    }
  }, [profileQuery.data]);

  const handleFinish = (skipped = false) => {
    setOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, "true");
    }
    if (profileQuery.data && !profileQuery.data.onboardingCompleted) {
      updateProfileMutation.mutate({
        onboardingCompleted: true,
        version: profileQuery.data.version,
      });
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish(false);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!open) return null;

  const currentStep = STEPS[currentStepIndex];
  const IconComponent = currentStep.icon;
  const isLast = currentStepIndex === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-step-title"
      data-testid="student-onboarding-tour"
      dir="rtl"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border bg-card p-6 shadow-2xl transition-all">
        {/* Header with skip button */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <span className="text-xs font-medium text-muted-foreground">
            راهنمای شروع به کار ({currentStepIndex + 1} از {STEPS.length})
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => handleFinish(true)}
            data-testid="onboarding-skip"
          >
            رد کردن تور
            <X className="mr-1 size-3.5" aria-hidden="true" />
          </Button>
        </div>

        {/* Step Icon & Content */}
        <div className="mt-6 flex flex-col items-center text-center">
          <div
            className={`flex size-20 items-center justify-center rounded-2xl border ${currentStep.color} shadow-xs transition-transform duration-300 scale-100`}
          >
            <IconComponent className="size-10" aria-hidden="true" />
          </div>

          <span className="mt-4 text-xs font-semibold text-primary">
            {currentStep.subtitle}
          </span>
          <h2
            id="onboarding-step-title"
            className="mt-1 font-heading text-xl font-bold text-foreground"
          >
            {currentStep.title}
          </h2>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Dots indicator */}
        <div className="mt-8 flex justify-center gap-1.5" aria-hidden="true">
          {STEPS.map((step, idx) => (
            <span
              key={step.id}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-border/40">
          {currentStepIndex > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-1"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
              قبلی
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleNext}
            className="gap-1 min-w-28"
            data-testid="onboarding-next"
          >
            {isLast ? (
              <>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                شروع استفاده
              </>
            ) : (
              <>
                بعدی
                <ChevronLeft className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
