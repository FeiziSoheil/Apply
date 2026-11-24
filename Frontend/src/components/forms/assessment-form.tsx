"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormInputField } from "@/components/forms/form-input-field";
import { FormSelectField } from "@/components/forms/form-select-field";
import { FormPhoneField } from "@/components/forms/form-phone-field";
import { FormRadioField } from "@/components/forms/form-radio-field";
import { FormSliderField } from "@/components/forms/form-slider-field";
import { FormCheckboxField } from "@/components/forms/form-checkbox-field";
import { FormMultiCheckboxField } from "@/components/forms/form-multi-checkbox-field";
import { focusFirstError } from "@/components/forms/focus-first-error";
import { DEGREE_LEVELS, DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import { formatMoney, getCurrencyLabel } from "@/lib/currency";
import { toPersianDigits } from "@/lib/format";
import {
  ASSESSMENT_STEP_FIELDS,
  ASSESSMENT_STEP_SCHEMAS,
  CONTACT_PREFERENCE_LABELS,
  CONTACT_PREFERENCES,
  LANGUAGE_STATUS_LABELS,
  LANGUAGE_STATUSES,
  START_TIME_LABELS,
  START_TIMES,
  assessmentFormSchema,
  type AssessmentFormValues,
} from "@/lib/validations/assessment";
import type { AssessmentRecommendation } from "@/contracts/leads";
import { useCreateAssessmentLead } from "@/features/leads/mutations";
import { toAssessmentRequest } from "@/features/leads/mappers";
import { QueryProvider } from "@/lib/api/query-provider";
import { toNormalizedMobile, toOptionalEmail } from "@/lib/validations/common";
import { FIELD_ERRORS_MESSAGE, useApiForm } from "@/lib/api/use-api-form";

const DRAFT_KEY = "assessment-form-draft";
const RESULT_KEY = "assessment-form-result";

export type AssessmentCountryOption = {
  slug: string;
  nameFa: string;
  flagEmoji?: string;
};

type AssessmentFormProps = {
  countries: AssessmentCountryOption[];
  initialValues?: Partial<AssessmentFormValues>;
};

const STEP_TITLES = [
  "سوابق تحصیلی",
  "وضعیت زبان",
  "ترجیحات مقصد",
  "اطلاعات تماس",
] as const;

const defaultValues: AssessmentFormValues = {
  currentDegree: "bachelor",
  targetDegree: "master",
  fieldOfStudy: "",
  gpa: 16,
  languageStatus: "none",
  languageScore: undefined,
  languageOther: "",
  targetCountries: [],
  annualBudget: 15000,
  currency: "EUR",
  startTime: "nearest",
  needsScholarship: false,
  name: "",
  mobile: "",
  email: "",
  contactPreference: "phone",
  agreeToTerms: false,
};

function loadDraft(): Partial<AssessmentFormValues> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AssessmentFormValues>;
  } catch {
    return null;
  }
}

export type StoredAssessmentResult = {
  answers: AssessmentFormValues;
  /** `programId` + match score from the API; resolved to programs on the results page */
  recommendations: AssessmentRecommendation[];
};

export function storeAssessmentResult(result: StoredAssessmentResult): void {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
  sessionStorage.removeItem(DRAFT_KEY);
}

export function loadAssessmentResult(): StoredAssessmentResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAssessmentResult;
  } catch {
    return null;
  }
}

/** Public client island: brings its own `QueryProvider` (shared browser client) */
export function AssessmentForm(props: AssessmentFormProps) {
  return (
    <QueryProvider>
      <AssessmentFormContent {...props} />
    </QueryProvider>
  );
}

const ASSESSMENT_FORM_FIELDS = Object.values(ASSESSMENT_STEP_FIELDS).flat();

function AssessmentFormContent({
  countries,
  initialValues,
}: AssessmentFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const { form, handleApiError } = useApiForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
    mode: "onTouched",
  });
  const createLead = useCreateAssessmentLead();
  const isPending = createLead.isPending;

  // Hydrate once from the saved draft / URL params, then persist every change
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      form.reset({
        ...defaultValues,
        ...draft,
        ...initialValues,
      });
    } else if (initialValues) {
      form.reset({ ...defaultValues, ...initialValues });
    }

    const subscription = form.watch((values) => {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } catch {
        // ignore quota errors
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once from draft/URL
  }, [form]);

  const languageStatus = form.watch("languageStatus");
  const progress = (step / 4) * 100;

  const degreeOptions = useMemo(
    () =>
      DEGREE_LEVELS.map((level) => ({
        value: level,
        label: DEGREE_LEVEL_LABELS[level],
      })),
    [],
  );

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        value: country.slug,
        label: country.flagEmoji
          ? `${country.flagEmoji} ${country.nameFa}`
          : country.nameFa,
      })),
    [countries],
  );

  async function validateStep(current: 1 | 2 | 3 | 4): Promise<boolean> {
    const schema = ASSESSMENT_STEP_SCHEMAS[current];
    const fields = ASSESSMENT_STEP_FIELDS[current];
    const values = form.getValues();
    const picked = Object.fromEntries(
      fields.map((key) => [key, values[key]]),
    );
    const result = schema.safeParse(picked);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          form.setError(path as keyof AssessmentFormValues, {
            type: "manual",
            message: issue.message,
          });
        }
      }
      focusFirstError(form.formState.errors, form.setFocus);
      return false;
    }

    for (const field of fields) {
      form.clearErrors(field);
    }
    return true;
  }

  async function goNext() {
    const ok = await validateStep(step);
    if (!ok) return;
    setStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
  }

  function goPrev() {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  }

  function onSubmit(values: AssessmentFormValues) {
    createLead.mutate(toAssessmentRequest(values), {
      onSuccess: (receipt) => {
        storeAssessmentResult({
          answers: {
            ...values,
            mobile: toNormalizedMobile(values.mobile),
            email: toOptionalEmail(values.email) ?? "",
          },
          recommendations: receipt.recommendations,
        });
        toast.success("ارزیابی با موفقیت ثبت شد");
        router.push("/assessment/results");
      },
      onError: (error) => {
        const { applied, appliedFields, message } = handleApiError(error, {
          knownFields: ASSESSMENT_FORM_FIELDS,
          fallbackMessage:
            "ثبت ارزیابی با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
        });
        if (applied > 0) {
          // Take the user back to the earliest step that has a server error
          const steps = ([1, 2, 3, 4] as const).filter((candidate) =>
            ASSESSMENT_STEP_FIELDS[candidate].some((field) =>
              appliedFields.includes(field),
            ),
          );
          if (steps[0]) setStep(steps[0]);
          toast.error(FIELD_ERRORS_MESSAGE);
          return;
        }
        toast.error(message);
      },
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          focusFirstError(errors, form.setFocus);
        })}
        className="mx-auto flex w-full max-w-2xl flex-col gap-6"
        noValidate
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-medium text-foreground">
              گام {toPersianDigits(step)} از {toPersianDigits(4)} —{" "}
              {STEP_TITLES[step - 1]}
            </p>
            <span className="text-muted-foreground">
              {toPersianDigits(Math.round(progress))}٪
            </span>
          </div>
          <Progress value={progress} aria-label="پیشرفت فرم ارزیابی" />
        </div>

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelectField
              control={form.control}
              name="currentDegree"
              label="مقطع فعلی"
              options={degreeOptions}
            />
            <FormSelectField
              control={form.control}
              name="targetDegree"
              label="مقطع هدف"
              options={degreeOptions}
            />
            <FormInputField
              control={form.control}
              name="fieldOfStudy"
              label="رشته تحصیلی"
              autoComplete="organization-title"
              placeholder="مثلاً علوم کامپیوتر"
              className="sm:col-span-2"
            />
            <FormInputField
              control={form.control}
              name="gpa"
              label="معدل (از ۲۰)"
              type="number"
              inputMode="decimal"
              min={0}
              max={20}
              step={0.01}
              dir="ltr"
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4">
            <FormRadioField
              control={form.control}
              name="languageStatus"
              label="وضعیت مدرک زبان"
              options={LANGUAGE_STATUSES.map((status) => ({
                value: status,
                label: LANGUAGE_STATUS_LABELS[status],
              }))}
            />
            {languageStatus === "ielts" ||
            languageStatus === "toefl" ||
            languageStatus === "duolingo" ? (
              <FormInputField
                control={form.control}
                name="languageScore"
                label="نمره"
                type="number"
                inputMode="decimal"
                dir="ltr"
                step={languageStatus === "ielts" ? 0.5 : 1}
                description={
                  languageStatus === "ielts"
                    ? "بازه ۰ تا ۹"
                    : languageStatus === "toefl"
                      ? "بازه ۰ تا ۱۲۰"
                      : "بازه ۱۰ تا ۱۶۰"
                }
              />
            ) : null}
            {languageStatus === "other" ? (
              <FormInputField
                control={form.control}
                name="languageOther"
                label="نام مدرک یا سطح زبان"
                placeholder="مثلاً Goethe B2"
              />
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-5">
            <FormMultiCheckboxField
              control={form.control}
              name="targetCountries"
              label="کشورهای مقصد"
              description="حداکثر ۵ کشور انتخاب کنید"
              options={countryOptions}
              max={5}
            />
            <FormSliderField
              control={form.control}
              name="annualBudget"
              label="بودجه سالانه (شهریه + زندگی)"
              min={0}
              max={50000}
              step={1000}
              description={`تقریبی به ${getCurrencyLabel(form.watch("currency"))}`}
              formatValue={(value) =>
                `${formatMoney(value, form.watch("currency"))} در سال`
              }
            />
            <FormSelectField
              control={form.control}
              name="startTime"
              label="زمان شروع مورد نظر"
              options={START_TIMES.map((value) => ({
                value,
                label: START_TIME_LABELS[value],
              }))}
            />
            <FormField
              control={form.control}
              name="needsScholarship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نیاز به بورسیه</FormLabel>
                  <FormControl>
                    <RadioGroup
                      dir="rtl"
                      value={field.value ? "true" : "false"}
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      className="grid gap-2 sm:grid-cols-2"
                      aria-label="نیاز به بورسیه"
                    >
                      <Label
                        htmlFor="needs-scholarship-yes"
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 font-normal has-[[data-checked]]:border-primary has-[[data-checked]]:bg-muted/40"
                      >
                        <RadioGroupItem
                          value="true"
                          id="needs-scholarship-yes"
                        />
                        بله، به بورسیه نیاز دارم
                      </Label>
                      <Label
                        htmlFor="needs-scholarship-no"
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 font-normal has-[[data-checked]]:border-primary has-[[data-checked]]:bg-muted/40"
                      >
                        <RadioGroupItem
                          value="false"
                          id="needs-scholarship-no"
                        />
                        خیر
                      </Label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-4">
            <FormInputField
              control={form.control}
              name="name"
              label="نام و نام خانوادگی"
              autoComplete="name"
              placeholder="نام کامل"
            />
            <FormPhoneField control={form.control} name="mobile" />
            <FormInputField
              control={form.control}
              name="email"
              label="ایمیل (اختیاری)"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              dir="ltr"
            />
            <FormSelectField
              control={form.control}
              name="contactPreference"
              label="ترجیح تماس"
              options={CONTACT_PREFERENCES.map((value) => ({
                value,
                label: CONTACT_PREFERENCE_LABELS[value],
              }))}
            />
            <FormCheckboxField
              control={form.control}
              name="agreeToTerms"
              label={
                <>
                  با{" "}
                  <Link
                    href="/terms"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    قوانین و شرایط
                  </Link>{" "}
                  موافقم
                </>
              }
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={step === 1 || isPending}
          >
            <ChevronRight data-icon="inline-start" />
            قبلی
          </Button>

          {step < 4 ? (
            <Button type="button" onClick={goNext} disabled={isPending}>
              بعدی
              <ChevronLeft data-icon="inline-end" />
            </Button>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  در حال ارسال…
                </>
              ) : (
                "ثبت و مشاهده نتیجه"
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
