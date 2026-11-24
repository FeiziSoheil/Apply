"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { EntityFormPage } from "@/components/admin/entity-form/entity-form-page";
import {
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from "@/features/announcements/mutations";
import { useAnnouncement } from "@/features/announcements/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  ANNOUNCEMENT_FORM_DEFAULTS,
  announcementFormSchema,
  announcementToFormValues,
  toAnnouncementPayload,
  type AnnouncementFormValues,
} from "@/lib/validations/announcement";
import {
  ANNOUNCEMENT_FORM_FIELDS,
  AnnouncementFormFields,
} from "./announcement-form-fields";

const LIST_HREF = "/admin/content/announcements";

type AnnouncementFormPageProps =
  | { mode: "create" }
  | { mode: "edit"; announcementId: string };

export function AnnouncementFormPage(props: AnnouncementFormPageProps) {
  const router = useRouter();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();

  const detailQuery = useAnnouncement(
    props.mode === "edit" ? props.announcementId : "",
    { enabled: props.mode === "edit" },
  );

  const defaultValues = useMemo(() => {
    if (props.mode === "edit" && detailQuery.data) {
      return announcementToFormValues(detailQuery.data);
    }
    return ANNOUNCEMENT_FORM_DEFAULTS;
  }, [props.mode, detailQuery.data]);

  const goBack = () => router.push(LIST_HREF);

  return (
    <EntityFormPage<AnnouncementFormValues>
      title={props.mode === "edit" ? "ویرایش اعلان" : "افزودن اعلان"}
      description={
        props.mode === "edit"
          ? detailQuery.data
            ? "ویرایش اعلان پنل دانشجو."
            : "در حال بارگذاری…"
          : "اعلان جدید برای همه دانشجویان یا بر اساس کشور مقصد."
      }
      schema={announcementFormSchema}
      defaultValues={defaultValues}
      knownFields={ANNOUNCEMENT_FORM_FIELDS}
      successMessage={
        props.mode === "edit" ? "اعلان ویرایش شد." : "اعلان ایجاد شد."
      }
      onSuccess={goBack}
      onCancel={goBack}
      isLoading={props.mode === "edit" && detailQuery.isPending}
      error={
        props.mode === "edit" && detailQuery.error
          ? new Error(getApiErrorMessage(detailQuery.error))
          : null
      }
      onRetry={() => void detailQuery.refetch()}
      onSubmit={async (values) => {
        const body = toAnnouncementPayload(values);
        if (props.mode === "edit") {
          await updateAnnouncement.mutateAsync({
            id: props.announcementId,
            body,
          });
        } else {
          await createAnnouncement.mutateAsync(body);
        }
      }}
    >
      {(form) => <AnnouncementFormFields form={form} />}
    </EntityFormPage>
  );
}
