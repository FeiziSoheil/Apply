"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { withoutOrder } from "@/components/admin/content/content-list-parts";
import { EntityFormPage } from "@/components/admin/entity-form/entity-form-page";
import {
  useCreateConsultant,
  useUpdateConsultant,
} from "@/features/content/mutations";
import { useConsultant } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  CONSULTANT_FORM_DEFAULTS,
  consultantFormSchema,
  consultantToFormValues,
  toConsultantPayload,
  type ConsultantFormValues,
} from "@/lib/validations/consultant";
import {
  CONSULTANT_FORM_FIELDS,
  ConsultantFormFields,
} from "./consultants-form-fields";

const LIST_HREF = "/admin/content/consultants";

type ConsultantFormPageProps =
  | { mode: "create" }
  | { mode: "edit"; consultantId: string };

/** Full-page create / edit consultant form (`EntityFormPage`) */
export function ConsultantFormPage(props: ConsultantFormPageProps) {
  const router = useRouter();
  const createConsultant = useCreateConsultant();
  const updateConsultant = useUpdateConsultant();

  const consultantQuery = useConsultant(
    props.mode === "edit" ? props.consultantId : "",
    { enabled: props.mode === "edit" },
  );

  const defaultValues = useMemo(() => {
    if (props.mode === "edit" && consultantQuery.data) {
      return consultantToFormValues(consultantQuery.data);
    }
    return CONSULTANT_FORM_DEFAULTS;
  }, [props.mode, consultantQuery.data]);

  const goBack = () => router.push(LIST_HREF);

  return (
    <EntityFormPage<ConsultantFormValues>
      title={props.mode === "edit" ? "ویرایش مشاور" : "افزودن مشاور"}
      description={
        props.mode === "edit"
          ? consultantQuery.data
            ? `ویرایش اطلاعات ${consultantQuery.data.name}`
            : "در حال بارگذاری…"
          : "اطلاعات مشاور جدید را وارد کنید."
      }
      schema={consultantFormSchema}
      defaultValues={defaultValues}
      knownFields={CONSULTANT_FORM_FIELDS}
      successMessage={
        props.mode === "edit" ? "مشاور ویرایش شد." : "مشاور ایجاد شد."
      }
      onSuccess={goBack}
      onCancel={goBack}
      isLoading={props.mode === "edit" && consultantQuery.isPending}
      error={
        props.mode === "edit" && consultantQuery.error
          ? new Error(getApiErrorMessage(consultantQuery.error))
          : null
      }
      onRetry={() => void consultantQuery.refetch()}
      onSubmit={async (values) => {
        const body = toConsultantPayload(values);
        if (props.mode === "edit") {
          await updateConsultant.mutateAsync({
            id: props.consultantId,
            body: withoutOrder(body),
          });
        } else {
          await createConsultant.mutateAsync(body);
        }
      }}
    >
      {(form) => <ConsultantFormFields form={form} />}
    </EntityFormPage>
  );
}
