import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import {
  PUBLICATION_STATUSES,
  type PublicationStatus,
} from "@/contracts/content";
import type {
  Announcement,
  AnnouncementCreate,
} from "@/contracts/student-panel";

export const ANNOUNCEMENT_STATUS_OPTIONS = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
] as const satisfies ReadonlyArray<{
  value: PublicationStatus;
  label: string;
}>;

export const announcementFormSchema = z
  .object({
    title: z
      .string({ required_error: "عنوان را وارد کنید" })
      .trim()
      .min(1, "عنوان را وارد کنید")
      .max(160, "عنوان نباید بیشتر از ۱۶۰ کاراکتر باشد"),
    body: z
      .string({ required_error: "متن اعلان را وارد کنید" })
      .trim()
      .min(1, "متن اعلان را وارد کنید")
      .max(4000, "متن نباید بیشتر از ۴۰۰۰ کاراکتر باشد"),
    allStudents: z.boolean(),
    countrySlugs: z.array(z.string()),
    status: z.enum(PUBLICATION_STATUSES),
  })
  .superRefine((values, ctx) => {
    if (!values.allStudents && values.countrySlugs.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["countrySlugs"],
        message: "حداقل یک کشور را انتخاب کنید یا «همه دانشجویان» را فعال کنید",
      });
    }
  });

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export const ANNOUNCEMENT_FORM_DEFAULTS: DefaultValues<AnnouncementFormValues> =
  {
    title: "",
    body: "",
    allStudents: true,
    countrySlugs: [],
    status: "draft",
  };

export function announcementToFormValues(
  item: Announcement,
): AnnouncementFormValues {
  return {
    title: item.title,
    body: item.body,
    allStudents: item.audience.allStudents,
    countrySlugs: item.audience.countrySlugs,
    status: item.status,
  };
}

export function toAnnouncementPayload(
  values: AnnouncementFormValues,
): AnnouncementCreate {
  return {
    title: values.title.trim(),
    body: values.body.trim(),
    audience: {
      allStudents: values.allStudents,
      countrySlugs: values.allStudents ? [] : values.countrySlugs,
    },
    status: values.status,
    ...(values.status === "published"
      ? { publishedAt: new Date().toISOString() }
      : {}),
  };
}
