"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSession } from "@/components/auth/auth-provider";
import {
  FormInputField,
  FormPasswordField,
} from "@/components/forms";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationPreferencesForm } from "@/components/admin/notifications/notification-preferences-form";
import {
  useChangePassword,
  useUpdateProfile,
} from "@/features/users/mutations";
import { useMySessions } from "@/features/users/queries";
import { getApiErrorMessage } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/auth/role-labels";
import { formatJalaliDate } from "@/lib/format";
import {
  changePasswordFormSchema,
  profileNameFormSchema,
  type ChangePasswordFormValues,
  type ProfileNameFormValues,
} from "@/lib/validations/users";

export function ProfileSettings() {
  const { user, status } = useSession();
  const sessionsQuery = useMySessions({
    enabled: status === "authenticated",
  });
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const nameForm = useForm<ProfileNameFormValues>({
    resolver: zodResolver(profileNameFormSchema),
    values: { name: user?.name ?? "" },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (status !== "authenticated" || !user) {
    return (
      <PageContainer>
        <Skeleton className="h-48 w-full" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="پروفایل من"
        description="نام نمایشی، رمز عبور، نشست‌ها و ترجیحات اعلان."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-border p-4 sm:p-6">
          <div>
            <h2 className="text-base font-semibold">اطلاعات حساب</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              نقش: {ROLE_LABELS[user.role]}
              {user.email ? (
                <>
                  {" · "}
                  <span dir="ltr">{user.email}</span>
                </>
              ) : null}
            </p>
          </div>
          <Form {...nameForm}>
            <form
              className="space-y-4"
              onSubmit={nameForm.handleSubmit((values) => {
                updateProfile.mutate(
                  { name: values.name },
                  {
                    onSuccess: () => toast.success("نام به‌روز شد"),
                    onError: (error) =>
                      toast.error(getApiErrorMessage(error)),
                  },
                );
              })}
              noValidate
            >
              <FormInputField
                control={nameForm.control}
                name="name"
                label="نام و نام خانوادگی"
              />
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                ذخیره نام
              </Button>
            </form>
          </Form>
        </section>

        <section className="space-y-4 rounded-xl border border-border p-4 sm:p-6">
          <div>
            <h2 className="text-base font-semibold">تغییر رمز عبور</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              حداقل ۸ کاراکتر شامل حرف بزرگ، کوچک، رقم و کاراکتر ویژه.
            </p>
          </div>
          <Form {...passwordForm}>
            <form
              className="space-y-4"
              onSubmit={passwordForm.handleSubmit((values) => {
                changePassword.mutate(
                  {
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                  },
                  {
                    onSuccess: () => {
                      toast.success("رمز عبور تغییر کرد");
                      passwordForm.reset();
                    },
                    onError: (error) =>
                      toast.error(getApiErrorMessage(error)),
                  },
                );
              })}
              noValidate
            >
              <FormPasswordField
                control={passwordForm.control}
                name="currentPassword"
                label="رمز فعلی"
                autoComplete="current-password"
              />
              <FormPasswordField
                control={passwordForm.control}
                name="newPassword"
                label="رمز جدید"
                autoComplete="new-password"
              />
              <FormPasswordField
                control={passwordForm.control}
                name="confirmPassword"
                label="تکرار رمز جدید"
                autoComplete="new-password"
              />
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                تغییر رمز
              </Button>
            </form>
          </Form>
        </section>
      </div>

      <section className="mt-8 space-y-4 rounded-xl border border-border p-4 sm:p-6">
        <div>
          <h2 className="text-base font-semibold">ترجیحات اعلان</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            کنترل کانال درون‌برنامه و پیامک برای هر نوع اعلان.
          </p>
        </div>
        <NotificationPreferencesForm />
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold">نشست‌های فعال</h2>
        {sessionsQuery.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : sessionsQuery.error ? (
          <p className="text-sm text-destructive">
            {getApiErrorMessage(sessionsQuery.error)}
          </p>
        ) : (sessionsQuery.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">نشست فعالی نیست.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {(sessionsQuery.data ?? []).map((session) => (
              <li
                key={session.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium">
                    {session.userAgent}
                    {session.current ? (
                      <span className="ms-2 text-xs text-primary">
                        (نشست فعلی)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {session.ipAddress}
                  </p>
                </div>
                <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  آخرین فعالیت:{" "}
                  {formatJalaliDate(session.lastSeenAt, "d MMMM yyyy — HH:mm")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
