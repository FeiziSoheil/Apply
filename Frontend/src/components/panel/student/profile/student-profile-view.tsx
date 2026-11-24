/* eslint-disable react-hooks/set-state-in-effect -- hydrate editable form fields from TanStack Query */
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Download,
  GraduationCap,
  Info,
  Laptop,
  Loader2,
  LogOut,
  Phone,
  Save,
  Shield,
  Smartphone,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/panel/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import type { DegreeLevel } from "@/types";
import type { NotificationType } from "@/contracts/crm";
import {
  useMyStudentProfile,
  useMyPrivacyRequests,
  useMyExportData,
} from "@/features/student-panel/queries";
import {
  useUpdateMyProfile,
  useRequestMobileChange,
  useVerifyMobileChange,
  useCreatePrivacyRequest,
} from "@/features/student-panel/mutations";
import { useMySessions } from "@/features/users/queries";
import {
  useRevokeMySession,
  useRevokeOtherSessions,
} from "@/features/users/mutations";
import {
  useNotificationPreferences,
} from "@/features/notifications/queries";
import {
  useUpdateNotificationPreferences,
} from "@/features/notifications/mutations";
import { CaseLinkGate } from "../case-link-gate";
import {
  StudentPanelError,
  StudentPanelSkeleton,
} from "../panel-query-state";

const NOTIFICATION_LABELS: Record<
  string,
  { title: string; description: string; isVital?: boolean }
> = {
  document_rejected: {
    title: "رد مدرک ارسالی",
    description: "اطلاع فوری از ردشدن یا نیاز به اصلاح مدارک بارگذاری‌شده",
    isVital: true,
  },
  installment_due: {
    title: "سررسید اقساط و پرداخت‌ها",
    description: "یادآوری موعد سررسید اقساط قرارداد ۳ روز و ۱ روز قبل",
    isVital: true,
  },
  stage_changed: {
    title: "تغییر مرحله پرونده",
    description: "پیشروی و ارتقای پرونده به مراحل بعدی اعزام تحصیلی",
  },
  ticket_reply: {
    title: "پاسخ مشاور به تیکت",
    description: "ارسال پیام و پاسخ جدید توسط کارشناس در پیام‌های پشتیبانی",
  },
  appointment_reminder: {
    title: "یادآوری جلسات مشاوره",
    description: "یادآوری ۲۴ ساعت قبل از شروع جلسات مشاوره حضوری یا آنلاین",
  },
  document_approved: {
    title: "تأیید مدارک",
    description: "تأیید مدارک آپلودشده توسط کارشناس ارشد پرونده",
  },
  announcement: {
    title: "اطلاعیه‌ها و اخبار مهم",
    description: "اخبار ددلاین‌ها، تغییرات قوانین ویزا و تخفیف‌های ویژه",
  },
};

export function StudentProfileView() {
  return (
    <CaseLinkGate requireCase={false}>
      <ProfileInner />
    </CaseLinkGate>
  );
}

function ProfileInner() {
  const profileQuery = useMyStudentProfile();
  const updateProfileMutation = useUpdateMyProfile();
  const sessionsQuery = useMySessions();
  const revokeSessionMutation = useRevokeMySession();
  const revokeOtherSessionsMutation = useRevokeOtherSessions();
  const notifPrefsQuery = useNotificationPreferences();
  const updateNotifPrefsMutation = useUpdateNotificationPreferences();
  const privacyRequestsQuery = useMyPrivacyRequests();
  const createPrivacyRequestMutation = useCreatePrivacyRequest();
  const exportDataQuery = useMyExportData({ enabled: false });

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [highestDegree, setHighestDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [gpa, setGpa] = useState("");

  // Mobile Change Dialog State
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const [newMobile, setNewMobile] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileStep, setMobileStep] = useState<"phone" | "otp">("phone");
  const requestMobileMutation = useRequestMobileChange();
  const verifyMobileMutation = useVerifyMobileChange();

  // Privacy Dialog State
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Sync profile data to local state
  useEffect(() => {
    if (profileQuery.data) {
      const p = profileQuery.data;
      setName(p.name ?? "");
      setEmail(p.email ?? "");
      setCity(p.city ?? "");
      setBirthDate(p.birthDate ?? "");
      setHighestDegree(p.education?.highestDegree ?? "");
      setFieldOfStudy(p.education?.fieldOfStudy ?? "");
      setUniversityName(p.education?.universityName ?? "");
      setGpa(p.education?.gpa ? String(p.education.gpa) : "");
    }
  }, [profileQuery.data]);

  // Handle Profile Save with optimistic concurrency versioning
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileQuery.data) return;

    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim() || undefined,
        email: email.trim() || null,
        city: city.trim() || null,
        birthDate: birthDate.trim() || null,
        version: profileQuery.data.version,
        education: {
          highestDegree: highestDegree ? (highestDegree as DegreeLevel) : null,
          fieldOfStudy: fieldOfStudy.trim() || null,
          universityName: universityName.trim() || null,
          gpa: gpa ? Number(gpa) : null,
        },
      });
      toast.success("اطلاعات پروفایل با موفقیت ذخیره شد");
      void profileQuery.refetch();
    } catch (error: unknown) {
      const err = error as { status?: number; code?: string };
      if (err?.status === 409 || err?.code === "CONFLICT") {
        toast.error(
          "اطلاعات توسط نشست دیگری تغییر کرده است. لطفاً صفحه را تازه‌سازی کنید.",
        );
        void profileQuery.refetch();
      } else {
        toast.error("خطا در ذخیره اطلاعات پروفایل");
      }
    }
  };

  // Mobile change handlers
  const handleRequestMobileOtp = async () => {
    if (!newMobile || newMobile.length < 10) {
      toast.error("شماره موبایل جدید معتبر نیست");
      return;
    }
    try {
      const res = await requestMobileMutation.mutateAsync({ mobile: newMobile });
      toast.success(res.message);
      setMobileStep("otp");
    } catch {
      toast.error("خطا در ارسال کد تأیید به شماره جدید");
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (!mobileOtp || mobileOtp.length !== 6) {
      toast.error("کد تأیید باید ۶ رقم باشد");
      return;
    }
    try {
      await verifyMobileMutation.mutateAsync({
        mobile: newMobile,
        code: mobileOtp,
      });
      toast.success("شماره موبایل شما با موفقیت تغییر کرد");
      setIsMobileDialogOpen(false);
      setMobileStep("phone");
      setNewMobile("");
      setMobileOtp("");
      void profileQuery.refetch();
    } catch {
      toast.error("کد تأیید نامعتبر یا منقضی شده است");
    }
  };

  // Notification preference toggle
  const handleTogglePreference = async (
    type: string,
    channel: "inApp" | "sms",
    currentValue: boolean,
  ) => {
    const isVital = NOTIFICATION_LABELS[type]?.isVital;
    if (channel === "inApp" && isVital) {
      toast.info("این اعلان به دلیل اهمیت حیاتی در پرونده قابل غیرفعال‌سازی نیست.");
      return;
    }

    const currentPrefs = notifPrefsQuery.data?.preferences ?? [];
    const existing = currentPrefs.find((p) => p.type === type);
    const updatedPref = existing
      ? { ...existing, [channel]: !currentValue }
      : {
          type: type as NotificationType,
          inApp: channel === "inApp" ? !currentValue : true,
          sms: channel === "sms" ? !currentValue : false,
        };

    const nextPreferences = currentPrefs.some((p) => p.type === type)
      ? currentPrefs.map((p) => (p.type === type ? updatedPref : p))
      : [...currentPrefs, updatedPref];

    try {
      await updateNotifPrefsMutation.mutateAsync({ preferences: nextPreferences });
      toast.success("تنظیمات اعلان به‌روزرسانی شد");
    } catch {
      toast.error("خطا در ذخیره تنظیمات اعلان");
    }
  };

  // Data Export Handler
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const result = await exportDataQuery.refetch();
      if (result.data) {
        const jsonStr = JSON.stringify(result.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `student-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("فایل اطلاعات کامل حساب شما با موفقیت دانلود شد");
      }
    } catch {
      toast.error("خطا در دریافت اطلاعات حساب");
    } finally {
      setIsExporting(false);
    }
  };

  // Account Deletion Handler
  const handleDeleteAccountSubmit = async () => {
    try {
      await createPrivacyRequestMutation.mutateAsync({
        type: "account_deletion",
        reason: deleteReason.trim() || undefined,
      });
      toast.success(
        "درخواست حذف حساب شما ثبت شد و توسط تیم پشتیبانی بررسی خواهد شد.",
      );
      setIsDeleteAccountOpen(false);
      setDeleteReason("");
      void privacyRequestsQuery.refetch();
    } catch {
      toast.error("خطا در ثبت درخواست حذف حساب");
    }
  };

  if (profileQuery.isLoading) return <StudentPanelSkeleton />;
  if (profileQuery.isError) {
    return (
      <StudentPanelError
        error={profileQuery.error}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data;
  const assessment = profile?.assessment;

  return (
    <PageContainer className="gap-5 pb-24 md:gap-6 md:pb-16">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
          پروفایل و تنظیمات
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          مدیریت اطلاعات فردی، تحصیلی، امنیت نشست‌ها و تنظیمات اعلان
        </p>
      </header>

      <Tabs defaultValue="personal" className="w-full space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl bg-muted/70 p-1.5 sm:max-w-lg">
          <TabsTrigger
            value="personal"
            className="min-h-11 rounded-xl px-2 text-xs font-medium sm:text-sm"
          >
            اطلاعات فردی و تحصیلی
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="min-h-11 rounded-xl px-2 text-xs font-medium sm:text-sm"
          >
            امنیت و حریم خصوصی
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="min-h-11 rounded-xl px-2 text-xs font-medium sm:text-sm"
          >
            تنظیمات اعلان‌ها
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Personal & Education Info */}
        <TabsContent value="personal" className="space-y-5">
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Main Form */}
            <form
              onSubmit={handleSaveProfile}
              className="space-y-5 lg:col-span-2"
            >
              <Card className="rounded-2xl shadow-xs">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <User className="size-4 text-primary" />
                    اطلاعات پایه دانشجو
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    مشخصات هویتی و راه‌های ارتباطی شما
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs sm:text-sm">
                        نام و نام خانوادگی
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="نام شما"
                        required
                        className="min-h-11 rounded-xl text-base sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-xs sm:text-sm">
                        شماره موبایل ورود
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="mobile"
                          value={profile?.mobile ?? ""}
                          disabled
                          className="min-h-11 rounded-xl bg-muted font-mono text-base text-muted-foreground sm:text-sm"
                          dir="ltr"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-11 shrink-0 rounded-xl px-4 text-xs font-semibold sm:text-sm"
                          onClick={() => {
                            setIsMobileDialogOpen(true);
                            setMobileStep("phone");
                            setNewMobile("");
                            setMobileOtp("");
                          }}
                        >
                          تغییر
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm">
                        ایمیل
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.com"
                        dir="ltr"
                        className="min-h-11 rounded-xl text-base sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-xs sm:text-sm">
                        شهر محل سکونت
                      </Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="تهران"
                        className="min-h-11 rounded-xl text-base sm:text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-xs">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <GraduationCap className="size-4 text-primary" />
                    اطلاعات تحصیلی و سوابق
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    اطلاعات آخرین مدرک تحصیلی برای تطبیق با پیش‌نیازهای پذیرش
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="highestDegree" className="text-xs sm:text-sm">
                        آخرین مقطع تحصیلی
                      </Label>
                      <select
                        id="highestDegree"
                        value={highestDegree}
                        onChange={(e) => setHighestDegree(e.target.value)}
                        className="flex min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                      >
                        <option value="">انتخاب مقطع...</option>
                        <option value="high_school">دیپلم / پیش‌دانشگاهی</option>
                        <option value="bachelor">کارشناسی (لیسانس)</option>
                        <option value="master">کارشناسی ارشد (فوق لیسانس)</option>
                        <option value="phd">دکتری (PhD)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fieldOfStudy" className="text-xs sm:text-sm">
                        رشته تحصیلی
                      </Label>
                      <Input
                        id="fieldOfStudy"
                        value={fieldOfStudy}
                        onChange={(e) => setFieldOfStudy(e.target.value)}
                        placeholder="مهندسی کامپیوتر"
                        className="min-h-11 rounded-xl text-base sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="universityName" className="text-xs sm:text-sm">
                        دانشگاه محل تحصیل
                      </Label>
                      <Input
                        id="universityName"
                        value={universityName}
                        onChange={(e) => setUniversityName(e.target.value)}
                        placeholder="دانشگاه تهران"
                        className="min-h-11 rounded-xl text-base sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gpa" className="text-xs sm:text-sm">
                        معدل کل (از ۲۰)
                      </Label>
                      <Input
                        id="gpa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="20"
                        value={gpa}
                        onChange={(e) => setGpa(e.target.value)}
                        placeholder="۱۷.۵"
                        dir="ltr"
                        className="min-h-11 rounded-xl font-mono text-base sm:text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t p-4 sm:p-6 sm:justify-start">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="min-h-12 w-full gap-2 rounded-xl text-base font-semibold sm:w-auto sm:text-sm"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    ذخیره تغییرات پروفایل
                  </Button>
                </CardFooter>
              </Card>
            </form>

            {/* Assessment Profile Card */}
            <div className="space-y-5">
              <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs">
                <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-1.5 text-base font-bold text-foreground">
                      <Info className="size-4 text-primary" />
                      پروفایل ارزیابی اولیه
                    </CardTitle>
                    <Badge variant="outline" className="rounded-full text-[11px]">
                      مشاهده توسط مشاور
                    </Badge>
                  </div>
                  <CardDescription className="text-xs leading-relaxed">
                    نتایج ثبت‌شده در فرم ارزیابی اولیه شما که کارشناسان پرونده
                    برای ارائه پیشنهادات تحصیلی به آن استناد می‌کنند.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 pt-0">
                  {assessment ? (
                    <dl className="space-y-2.5 divide-y divide-border/40 text-xs">
                      {assessment.targetDegree && (
                        <div className="flex items-center justify-between pt-2">
                          <dt className="text-muted-foreground">مقطع هدف:</dt>
                          <dd className="font-semibold text-foreground">
                            {DEGREE_LEVEL_LABELS[assessment.targetDegree] ??
                              assessment.targetDegree}
                          </dd>
                        </div>
                      )}

                      {assessment.targetCountries && assessment.targetCountries.length > 0 && (
                        <div className="flex items-center justify-between pt-2">
                          <dt className="text-muted-foreground">کشورهای هدف:</dt>
                          <dd className="font-semibold text-foreground">
                            {assessment.targetCountries.join("، ")}
                          </dd>
                        </div>
                      )}

                      {assessment.fieldOfStudy && (
                        <div className="flex items-center justify-between pt-2">
                          <dt className="text-muted-foreground">رشته تحصیلی:</dt>
                          <dd className="font-semibold text-foreground">
                            {assessment.fieldOfStudy}
                          </dd>
                        </div>
                      )}

                      {assessment.gpa !== undefined && (
                        <div className="flex items-center justify-between pt-2">
                          <dt className="text-muted-foreground">معدل ارزیابی:</dt>
                          <dd className="font-semibold tabular-nums text-foreground">
                            {toPersianDigits(assessment.gpa)}
                          </dd>
                        </div>
                      )}

                      {assessment.languageStatus && (
                        <div className="flex items-center justify-between pt-2">
                          <dt className="text-muted-foreground">وضعیت زبان:</dt>
                          <dd className="font-semibold text-foreground">
                            {assessment.languageStatus}
                            {assessment.languageScore
                              ? ` (نمره: ${toPersianDigits(assessment.languageScore)})`
                              : ""}
                          </dd>
                        </div>
                      )}

                      {assessment.annualBudget !== undefined && (
                        <div className="flex items-center justify-between pt-2">
                          <dt className="text-muted-foreground">بودجه سالانه:</dt>
                          <dd className="font-semibold tabular-nums text-foreground">
                            {toPersianDigits(assessment.annualBudget)} {assessment.currency}
                          </dd>
                        </div>
                      )}

                      {assessment.needsScholarship && (
                        <div className="flex items-center justify-between pt-2">
                          <dt className="text-muted-foreground">نیاز به بورسیه:</dt>
                          <dd className="font-semibold text-foreground">دارد</dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      فرم ارزیابی تکمیلی هنوز ثبت نشده است. مشاور پرونده در اولین
                      جلسه اطلاعات ارزیابی شما را تنظیم خواهد کرد.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Security & Privacy */}
        <TabsContent value="security" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            {/* Active Sessions */}
            <Card className="rounded-2xl shadow-xs">
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Laptop className="size-4 text-primary" />
                    نشست‌های فعال شما
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      revokeOtherSessionsMutation.mutate(undefined, {
                        onSuccess: () => {
                          toast.success("از سایر دستگاه‌ها با موفقیت خارج شدید");
                          void sessionsQuery.refetch();
                        },
                      });
                    }}
                    disabled={revokeOtherSessionsMutation.isPending}
                    className="min-h-10 w-full gap-1.5 rounded-xl text-xs text-destructive hover:bg-destructive/10 sm:w-auto"
                  >
                    <LogOut className="size-3.5" />
                    خروج از همه دستگاه‌ها
                  </Button>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  دستگاه‌ها و مرورگرهایی که در حال حاضر به حساب کاربری شما متصل
                  هستند
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                {sessionsQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground">
                    در حال دریافت نشست‌ها...
                  </p>
                ) : (sessionsQuery.data ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    تنها همین نشست جاری فعال است.
                  </p>
                ) : (
                  <div className="divide-y rounded-2xl border">
                    {(sessionsQuery.data ?? []).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between gap-3 p-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Smartphone className="size-3.5 text-muted-foreground sm:hidden" />
                            <Laptop className="hidden size-3.5 text-muted-foreground sm:inline-block" />
                            <span className="font-semibold text-foreground">
                              {session.userAgent || "مرورگر وب"}
                            </span>
                            {session.current && (
                              <Badge variant="default" className="py-0 text-[10px]">
                                این دستگاه
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">
                            IP: {session.ipAddress} · آخرین فعالیت:{" "}
                            {formatJalaliDate(
                              session.lastSeenAt,
                              "yyyy/MM/dd HH:mm",
                            )}
                          </p>
                        </div>

                        {!session.current && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              revokeSessionMutation.mutate(session.id, {
                                onSuccess: () => {
                                  toast.success("نشست با موفقیت پایان یافت");
                                  void sessionsQuery.refetch();
                                },
                              });
                            }}
                            className="min-h-9 rounded-lg text-xs text-destructive hover:bg-destructive/10"
                          >
                            خروج
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Privacy & Account Management */}
            <Card className="rounded-2xl shadow-xs">
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Shield className="size-4 text-primary" />
                  حریم خصوصی و داده‌های من
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  دریافت نسخه پشتیبان داده‌ها یا ثبت درخواست حذف حساب
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <div className="space-y-2 rounded-2xl border p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Download className="size-4 text-primary" />
                    دریافت داده‌های من (Data Export)
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    یک نسخه کامل با فرمت استاندارد JSON از تمامی اطلاعات شما
                    شامل مدارک، پیام‌ها، فاکتورها، اقساط و رزروها را دانلود کنید.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="mt-1 min-h-11 w-full gap-2 rounded-xl text-xs font-semibold sm:w-auto sm:text-sm"
                  >
                    {isExporting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    دریافت نسخه کامل داده‌ها
                  </Button>
                </div>

                <div className="space-y-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <Trash2 className="size-4" />
                    حذف حساب کاربری
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    در صورت ثبت درخواست حذف، موضوع پس از تسویه مالی و بایگانی
                    پرونده توسط مدیریت موسسه بررسی و پردازش خواهد شد.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteAccountOpen(true)}
                    className="mt-1 min-h-11 w-full gap-2 rounded-xl text-xs font-semibold sm:w-auto sm:text-sm"
                  >
                    ثبت درخواست حذف حساب
                  </Button>
                </div>

                {/* Existing privacy requests history */}
                {(privacyRequestsQuery.data ?? []).length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-semibold text-foreground">
                      تاریخچه درخواست‌های حریم خصوصی شما:
                    </p>
                    <ul className="space-y-2 text-xs">
                      {(privacyRequestsQuery.data ?? []).map((req) => (
                        <li
                          key={req.id}
                          className="flex items-center justify-between rounded-xl border bg-muted/30 p-3"
                        >
                          <div>
                            <span className="font-medium text-foreground">
                              {req.type === "account_deletion"
                                ? "درخواست حذف حساب"
                                : "خروجی داده"}
                            </span>
                            <p className="text-[11px] text-muted-foreground">
                              ثبت: {formatJalaliDate(req.createdAt)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              req.status === "completed"
                                ? "default"
                                : req.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="rounded-full text-[10px]"
                          >
                            {req.status === "completed"
                              ? "انجام‌شده"
                              : req.status === "rejected"
                                ? "ردشده"
                                : "در حال بررسی مدیر"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Notification Preferences */}
        <TabsContent value="notifications" className="space-y-5">
          <Card className="rounded-2xl shadow-xs">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Info className="size-4 text-primary" />
                کانال‌ها و اولویت‌های دریافت اعلان
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                می‌توانید اعلان‌های مختلف را در بستر برنامه یا پیامک مدیریت کنید.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  <strong className="font-semibold text-foreground">
                    نکته درباره اعلان‌های حیاتی:{" "}
                  </strong>
                  اعلان‌های مهم نظیر{" "}
                  <span className="font-medium text-primary">
                    «رد مدارک بارگذاری‌شده»
                  </span>{" "}
                  و{" "}
                  <span className="font-medium text-primary">
                    «سررسید اقساط و موعد پرداخت»
                  </span>{" "}
                  جهت جلوگیری از وقفه در روند پرونده، به‌صورت همیشگی در برنامه
                  روشن هستند و امکان غیرفعال‌سازی آن‌ها وجود ندارد.
                </p>
              </div>

              <div className="divide-y rounded-2xl border">
                {Object.entries(NOTIFICATION_LABELS).map(([key, config]) => {
                  const prefs = notifPrefsQuery.data?.preferences ?? [];
                  const pref = prefs.find((p) => p.type === key);
                  const inApp = config.isVital ? true : (pref?.inApp ?? true);
                  const sms = pref?.sms ?? false;

                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="max-w-md space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground">
                            {config.title}
                          </h4>
                          {config.isVital && (
                            <Badge variant="secondary" className="rounded-full text-[10px]">
                              حیاتی
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-6 border-t pt-2.5 sm:border-0 sm:pt-0">
                        {/* In-App Toggle */}
                        <div className="flex min-h-10 items-center gap-2">
                          <Label
                            htmlFor={`inapp-${key}`}
                            className="cursor-pointer text-xs font-medium"
                          >
                            در برنامه
                          </Label>
                          <Switch
                            id={`inapp-${key}`}
                            checked={inApp}
                            disabled={config.isVital}
                            onCheckedChange={() =>
                              handleTogglePreference(key, "inApp", inApp)
                            }
                          />
                        </div>

                        {/* SMS Toggle */}
                        <div className="flex min-h-10 items-center gap-2">
                          <Label
                            htmlFor={`sms-${key}`}
                            className="cursor-pointer text-xs font-medium"
                          >
                            پیامک
                          </Label>
                          <Switch
                            id={`sms-${key}`}
                            checked={sms}
                            onCheckedChange={() =>
                              handleTogglePreference(key, "sms", sms)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Mobile Modal */}
      <Dialog open={isMobileDialogOpen} onOpenChange={setIsMobileDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg">
              <Phone className="size-5 text-primary" />
              تغییر شماره موبایل ورود
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {mobileStep === "phone"
                ? "شماره موبایل جدید خود را وارد کنید تا کد تأیید ارسال شود."
                : `کد تأیید ۶ رقمی به شماره ${toPersianDigits(newMobile)} پیامک شد.`}
            </DialogDescription>
          </DialogHeader>

          {mobileStep === "phone" ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-mobile" className="text-xs sm:text-sm">
                  شماره موبایل جدید
                </Label>
                <Input
                  id="new-mobile"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  placeholder="09123456789"
                  dir="ltr"
                  className="min-h-11 rounded-xl font-mono text-base sm:text-sm"
                  inputMode="tel"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="mobile-otp" className="text-xs sm:text-sm">
                  کد تأیید ۶ رقمی
                </Label>
                <Input
                  id="mobile-otp"
                  value={mobileOtp}
                  onChange={(e) => setMobileOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  dir="ltr"
                  inputMode="numeric"
                  className="min-h-12 rounded-xl text-center font-mono text-xl tracking-widest"
                />
                <p className="text-center text-[11px] text-muted-foreground">
                  کد آزمایشی برای تأیید:{" "}
                  <span className="font-mono font-semibold" dir="ltr">
                    123456
                  </span>
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setIsMobileDialogOpen(false)}
              className="min-h-11 w-full rounded-xl sm:w-auto"
            >
              انصراف
            </Button>
            {mobileStep === "phone" ? (
              <Button
                onClick={handleRequestMobileOtp}
                disabled={requestMobileMutation.isPending}
                className="min-h-11 w-full rounded-xl sm:w-auto"
              >
                {requestMobileMutation.isPending && (
                  <Loader2 className="ml-2 size-4 animate-spin" />
                )}
                ارسال کد تأیید
              </Button>
            ) : (
              <Button
                onClick={handleVerifyMobileOtp}
                disabled={verifyMobileMutation.isPending}
                className="min-h-11 w-full rounded-xl sm:w-auto"
              >
                {verifyMobileMutation.isPending && (
                  <Loader2 className="ml-2 size-4 animate-spin" />
                )}
                تأیید و ذخیره شماره
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg text-destructive">
              <AlertTriangle className="size-5" />
              درخواست حذف حساب کاربری
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              این درخواست جهت بررسی سوابق قراردادها و اقدامات قانونی به مدیریت
              ارسال می‌شود.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs leading-relaxed text-muted-foreground">
              با حذف حساب، دسترسی شما به پنل دانشجو و کلیه مستندات قطع خواهد شد.
              لطفاً در صورت تمایل دلیل انصراف را ذکر نمایید:
            </p>
            <Textarea
              placeholder="دلیل درخواست حذف حساب کاربری..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              className="rounded-xl text-base sm:text-sm"
            />
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setIsDeleteAccountOpen(false)}
              className="min-h-11 w-full rounded-xl sm:w-auto"
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccountSubmit}
              disabled={createPrivacyRequestMutation.isPending}
              className="min-h-11 w-full rounded-xl sm:w-auto"
            >
              {createPrivacyRequestMutation.isPending && (
                <Loader2 className="ml-2 size-4 animate-spin" />
              )}
              تأیید و ارسال درخواست به مدیر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
