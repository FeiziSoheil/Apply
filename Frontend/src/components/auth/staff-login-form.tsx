"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import { useSession } from "@/components/auth/auth-provider";
import { focusFirstError } from "@/components/forms/focus-first-error";
import { FormInputField } from "@/components/forms/form-input-field";
import { FormPasswordField } from "@/components/forms/form-password-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useStaffLogin } from "@/features/auth/mutations";
import { useApiForm } from "@/lib/api/use-api-form";
import {
  staffLoginFormSchema,
  type StaffLoginFormValues,
} from "@/lib/validations/login";

const STAFF_FIELDS = ["email", "password"] as const;

export function StaffLoginForm() {
  const { signIn } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const login = useStaffLogin();

  const { form, handleApiError } = useApiForm<StaffLoginFormValues>({
    resolver: zodResolver(staffLoginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const isBusy = login.isPending || signedIn;

  function onSubmit(values: StaffLoginFormValues) {
    setFormError(null);
    login.mutate(values, {
      onSuccess: (session) => {
        setSignedIn(true);
        toast.success(`خوش آمدید، ${session.user.name}`);
        // GuestOnly (login layout) redirects to returnUrl / the admin area
        signIn(session.user);
      },
      onError: (error) => {
        form.setValue("password", "");
        const { applied, message } = handleApiError(error, {
          knownFields: STAFF_FIELDS,
        });
        if (applied === 0) {
          // 401 = wrong credentials; same message for both fields on purpose
          setFormError(message);
          form.setFocus("password");
        }
      },
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" aria-hidden />
        </div>
        <CardTitle className="text-xl font-bold">ورود کارمندان</CardTitle>
        <CardDescription>
          ویژه مشاوران و مدیران موسسه. با ایمیل و رمز عبور سازمانی وارد شوید.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={(event) => {
              void form.handleSubmit(onSubmit, (errors) => {
                focusFirstError(errors, form.setFocus);
              })(event);
            }}
            className="grid gap-4"
            noValidate
          >
            {formError ? (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {formError}
              </p>
            ) : null}
            <FormInputField
              control={form.control}
              name="email"
              label="ایمیل"
              type="email"
              autoComplete="username"
              placeholder="name@example.com"
              dir="ltr"
              disabled={isBusy}
            />
            <FormPasswordField
              control={form.control}
              name="password"
              disabled={isBusy}
            />
            <div className="-mt-1 flex justify-end">
              <ForgotPasswordDialog />
            </div>
            <Button type="submit" size="lg" disabled={isBusy}>
              {isBusy ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  {signedIn ? "در حال انتقال…" : "در حال ورود…"}
                </>
              ) : (
                "ورود"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
