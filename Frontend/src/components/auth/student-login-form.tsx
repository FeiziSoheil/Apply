"use client";

import { useId, useState } from "react";
import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/auth/auth-provider";
import { OtpInput } from "@/components/auth/otp-input";
import { focusFirstError } from "@/components/forms/focus-first-error";
import { FormPhoneField } from "@/components/forms/form-phone-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useRequestOtp, useVerifyOtp } from "@/features/auth/mutations";
import { mergeGuestShortlist } from "@/features/shortlist/use-shortlist";
import { useApiForm } from "@/lib/api/use-api-form";
import { isApiError } from "@/lib/api/errors";
import { DEMO_ACCOUNTS } from "@/mocks/config";
import { toPersianDigits } from "@/lib/format";
import { useCountdown } from "@/lib/use-countdown";
import { normalizeDigits, toNormalizedMobile } from "@/lib/validations/common";
import {
  loginOtpSchema,
  loginPhoneSchema,
  type LoginOtpFormValues,
  type LoginPhoneFormValues,
} from "@/lib/validations/login";

type LoginStep = "phone" | "otp";

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return toPersianDigits(`${minutes}:${String(seconds).padStart(2, "0")}`);
}

/**
 * Hint of the mock SMS gateway (development and demo builds only). The
 * conditions are build-time constants, so the mock config is dead-code-
 * eliminated from production.
 */
function MockOtpHint() {
  // Static `process.env` reads so the bundler can drop this (and DEMO_ACCOUNTS)
  // from builds without the mock API. Production shows it only in a demo build.
  if (
    process.env.NEXT_PUBLIC_API_MOCKING !== "enabled" ||
    (process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_DEMO_BUILD !== "enabled")
  ) {
    return null;
  }
  return (
    <p className="rounded-lg bg-secondary px-3 py-2 text-center text-xs text-secondary-foreground">
      حالت آزمایشی: کد تأیید همیشه{" "}
      <span className="font-semibold tabular-nums" dir="ltr">
        {toPersianDigits(DEMO_ACCOUNTS.student.otp)}
      </span>{" "}
      است.
    </p>
  );
}

export function StudentLoginForm() {
  const { signIn } = useSession();
  const [step, setStep] = useState<LoginStep>("phone");
  const [mobile, setMobile] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const resend = useCountdown();
  const expiry = useCountdown();
  const errorId = useId();
  const hintId = useId();

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const { form: phoneForm, handleApiError: handlePhoneError } =
    useApiForm<LoginPhoneFormValues>({
      resolver: zodResolver(loginPhoneSchema),
      defaultValues: { mobile: "" },
    });
  const { form: otpForm, handleApiError: handleOtpError } =
    useApiForm<LoginOtpFormValues>({
      resolver: zodResolver(loginOtpSchema),
      defaultValues: { code: "" },
    });

  const isBusy = requestOtp.isPending || verifyOtp.isPending || signedIn;
  const codeExpired = step === "otp" && expiry.secondsLeft === 0;
  const codeError = otpForm.formState.errors.code?.message;

  function focusFirstDigit() {
    window.setTimeout(() => {
      document
        .querySelector<HTMLInputElement>("[data-otp-root] input")
        ?.focus();
    }, 0);
  }

  function sendCode(
    targetMobile: string,
    onSent: (isResend: boolean) => void,
  ) {
    requestOtp.mutate(
      { mobile: targetMobile },
      {
        onSuccess: (result) => {
          resend.start(result.resendAfterSeconds);
          expiry.start(result.expiresInSeconds);
          onSent(step === "otp");
        },
        onError: (error) => {
          if (isApiError(error) && error.isRateLimited) {
            const retrySeconds = error.retryAfterSeconds ?? 30;
            resend.start(retrySeconds);
            toast.error(
              `تعداد درخواست‌ها بیش از حد مجاز است (۴۲۹). لطفاً ${toPersianDigits(retrySeconds)} ثانیه بعد دوباره تلاش کنید.`,
            );
            return;
          }
          const { applied, message } = handlePhoneError(error, {
            knownFields: ["mobile"],
          });
          if (applied === 0 || step === "otp") toast.error(message);
        },
      },
    );
  }

  function onPhoneSubmit(values: LoginPhoneFormValues) {
    const normalized = toNormalizedMobile(values.mobile);
    sendCode(normalized, () => {
      setMobile(normalized);
      otpForm.reset({ code: "" });
      setStep("otp");
      toast.success("کد تأیید ارسال شد");
      focusFirstDigit();
    });
  }

  function onResend() {
    if (resend.secondsLeft > 0 || isBusy) return;
    sendCode(mobile, () => {
      otpForm.reset({ code: "" });
      toast.success("کد جدید ارسال شد");
      focusFirstDigit();
    });
  }

  function onOtpSubmit(values: LoginOtpFormValues) {
    if (codeExpired) return;
    verifyOtp.mutate(
      { mobile, code: normalizeDigits(values.code) },
      {
        onSuccess: (session) => {
          setSignedIn(true);
          void mergeGuestShortlist();
          toast.success(
            session.isNewUser
              ? "حساب شما ساخته شد؛ خوش آمدید"
              : "ورود با موفقیت انجام شد",
          );
          // GuestOnly (login layout) redirects to returnUrl / the panel
          signIn(session.user);
        },
        onError: (error) => {
          otpForm.setValue("code", "");
          const { applied, message } = handleOtpError(error, {
            knownFields: ["code"],
            focus: false,
          });
          if (applied === 0) toast.error(message);
          focusFirstDigit();
        },
      },
    );
  }

  function goBackToPhone() {
    setStep("phone");
    resend.reset();
    expiry.reset();
    otpForm.reset({ code: "" });
    phoneForm.setValue("mobile", mobile);
  }

  return (
    <Card className="mx-auto w-full max-w-md shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {step === "phone" ? (
            <Smartphone className="size-5" aria-hidden />
          ) : (
            <ShieldCheck className="size-5" aria-hidden />
          )}
        </div>
        <CardTitle className="text-xl font-bold">
          {step === "phone" ? "ورود با شماره موبایل" : "کد تأیید را وارد کنید"}
        </CardTitle>
        <CardDescription>
          {step === "phone" ? (
            "شماره موبایل خود را وارد کنید تا کد تأیید برایتان ارسال شود. اگر حساب ندارید، همین‌جا ساخته می‌شود."
          ) : (
            <>
              کد ۶ رقمی ارسال‌شده به{" "}
              <span className="font-medium text-foreground" dir="ltr">
                {toPersianDigits(mobile)}
              </span>{" "}
              را وارد کنید.
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {step === "phone" ? (
          <Form {...phoneForm}>
            <form
              onSubmit={(event) => {
                void phoneForm.handleSubmit(onPhoneSubmit, (errors) => {
                  focusFirstError(errors, phoneForm.setFocus);
                })(event);
              }}
              className="grid gap-4"
              noValidate
            >
              <FormPhoneField
                control={phoneForm.control}
                name="mobile"
                description="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                disabled={isBusy}
              />
              <Button type="submit" size="lg" disabled={isBusy}>
                {requestOtp.isPending ? (
                  <>
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                    در حال ارسال…
                  </>
                ) : (
                  "دریافت کد تأیید"
                )}
              </Button>
              <MockOtpHint />
            </form>
          </Form>
        ) : (
          <form
            onSubmit={(event) => {
              void otpForm.handleSubmit(onOtpSubmit)(event);
            }}
            className="grid gap-5"
            noValidate
          >
            <div className="grid gap-3" data-otp-root>
              <p id={hintId} className="text-sm text-muted-foreground">
                هر خانه یک رقم؛ می‌توانید کد را یکجا جای‌گذاری کنید.
              </p>
              <Controller
                control={otpForm.control}
                name="code"
                render={({ field }) => (
                  <OtpInput
                    value={normalizeDigits(field.value)}
                    onChange={(code) => {
                      otpForm.clearErrors("code");
                      field.onChange(code);
                    }}
                    onComplete={() => {
                      void otpForm.handleSubmit(onOtpSubmit)();
                    }}
                    disabled={isBusy}
                    invalid={Boolean(codeError)}
                    describedBy={codeError ? `${hintId} ${errorId}` : hintId}
                  />
                )}
              />
              {codeError ? (
                <p
                  id={errorId}
                  role="alert"
                  className="text-center text-sm text-destructive"
                >
                  {codeError}
                </p>
              ) : null}
              <p
                className="text-center text-sm text-muted-foreground"
                aria-live="polite"
              >
                {codeExpired ? (
                  <span className="text-destructive">
                    کد منقضی شد؛ کد جدید دریافت کنید.
                  </span>
                ) : (
                  <>
                    اعتبار کد:{" "}
                    <span className="font-medium text-foreground tabular-nums">
                      {formatClock(expiry.secondsLeft)}
                    </span>
                  </>
                )}
              </p>
            </div>

            <Button type="submit" size="lg" disabled={isBusy || codeExpired}>
              {verifyOtp.isPending || signedIn ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  {signedIn ? "در حال انتقال…" : "در حال بررسی…"}
                </>
              ) : (
                "تأیید و ورود"
              )}
            </Button>

            <div className="flex flex-col items-center gap-2 text-sm">
              {resend.secondsLeft > 0 ? (
                <p className="text-muted-foreground">
                  ارسال مجدد تا{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {toPersianDigits(resend.secondsLeft)}
                  </span>{" "}
                  ثانیه
                </p>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={onResend}
                >
                  {requestOtp.isPending ? "در حال ارسال…" : "ارسال مجدد کد"}
                </Button>
              )}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-muted-foreground"
                disabled={isBusy}
                onClick={goBackToPhone}
              >
                <ArrowRight data-icon="inline-start" />
                تغییر شماره موبایل
              </Button>
            </div>
            <MockOtpHint />
          </form>
        )}
      </CardContent>
    </Card>
  );
}
