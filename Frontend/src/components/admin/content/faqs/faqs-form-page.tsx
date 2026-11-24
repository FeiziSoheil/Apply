"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { withoutOrder } from "@/components/admin/content/content-list-parts";
import { EntityFormPage } from "@/components/admin/entity-form/entity-form-page";
import { useCreateFaq, useUpdateFaq } from "@/features/content/mutations";
import { useFaq } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  FAQ_FORM_DEFAULTS,
  faqFormSchema,
  faqToFormValues,
  toFaqPayload,
  type FaqFormValues,
} from "@/lib/validations/faq";
import {
  FAQ_FORM_FIELDS,
  FaqFormFields,
} from "./faqs-form-fields";

const LIST_HREF = "/admin/content/faqs";

type FaqFormPageProps = { mode: "create" } | { mode: "edit"; faqId: string };

/** Full-page create / edit FAQ form (`EntityFormPage`) */
export function FaqFormPage(props: FaqFormPageProps) {
  const router = useRouter();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();

  const faqQuery = useFaq(props.mode === "edit" ? props.faqId : "", {
    enabled: props.mode === "edit",
  });

  const defaultValues = useMemo(() => {
    if (props.mode === "edit" && faqQuery.data) {
      return faqToFormValues(faqQuery.data);
    }
    return FAQ_FORM_DEFAULTS;
  }, [props.mode, faqQuery.data]);

  const goBack = () => router.push(LIST_HREF);

  return (
    <EntityFormPage<FaqFormValues>
      title={props.mode === "edit" ? "ویرایش پرسش" : "افزودن پرسش"}
      description={
        props.mode === "edit"
          ? faqQuery.data
            ? "ویرایش پرسش و پاسخ متداول."
            : "در حال بارگذاری…"
          : "پرسش و پاسخ متداول جدید را وارد کنید."
      }
      schema={faqFormSchema}
      defaultValues={defaultValues}
      knownFields={FAQ_FORM_FIELDS}
      successMessage={props.mode === "edit" ? "پرسش ویرایش شد." : "پرسش ایجاد شد."}
      onSuccess={goBack}
      onCancel={goBack}
      isLoading={props.mode === "edit" && faqQuery.isPending}
      error={
        props.mode === "edit" && faqQuery.error
          ? new Error(getApiErrorMessage(faqQuery.error))
          : null
      }
      onRetry={() => void faqQuery.refetch()}
      onSubmit={async (values) => {
        const body = toFaqPayload(values);
        if (props.mode === "edit") {
          await updateFaq.mutateAsync({
            id: props.faqId,
            body: withoutOrder(body),
          });
        } else {
          await createFaq.mutateAsync(body);
        }
      }}
    >
      {(form) => <FaqFormFields form={form} />}
    </EntityFormPage>
  );
}
