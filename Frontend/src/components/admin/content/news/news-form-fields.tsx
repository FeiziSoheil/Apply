"use client";

import { useCallback, useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { ContentEditor } from "@/components/admin/content/content-editor";
import { ContentQualityPanel } from "@/components/admin/content/content-quality-panel";
import {
  FormDateTimeField,
  FormImageField,
} from "@/components/admin/fields/form-controls";
import { PublishStatusControl } from "@/components/admin/fields/publish-status-control";
import { SeoFieldsSection } from "@/components/admin/fields/seo-fields-section";
import { SlugField } from "@/components/admin/fields/slug-field";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/forms";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import type { PublicationStatus, RichContent } from "@/contracts/content";
import { newsApi } from "@/features/content/api";
import { analyzeContentQuality } from "@/lib/admin/content-quality";
import {
  NEWS_EVENT_TYPE_OPTIONS,
  type NewsFormValues,
} from "@/lib/validations/news";
import type { FormRichDoc } from "@/lib/validations/content-section";

export const NEWS_FORM_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "eventType",
  "eventDate",
  "registrationUrl",
  "coverImage",
  "coverImageAlt",
  "status",
  "scheduledAt",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.ogImageId",
  "seo.noindex",
] as const;

type NewsFormFieldsProps = {
  form: UseFormReturn<NewsFormValues>;
  excludeId?: string;
  lastEditedAt?: string | null;
  lastEditedBy?: string | null;
  isPending?: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onSchedule: () => void;
};

export function NewsFormFields({
  form,
  excludeId,
  lastEditedAt,
  lastEditedBy,
  isPending,
  onSaveDraft,
  onPublish,
  onSchedule,
}: NewsFormFieldsProps) {
  const { control, setValue } = form;
  const content = useWatch({ control, name: "content" });
  const excerpt = useWatch({ control, name: "excerpt" });
  const coverImageAlt = useWatch({ control, name: "coverImageAlt" });
  const metaTitle = useWatch({ control, name: "seo.metaTitle" });
  const metaDescription = useWatch({ control, name: "seo.metaDescription" });
  const status = useWatch({ control, name: "status" });
  const scheduledAt = useWatch({ control, name: "scheduledAt" });

  const checkSlug = useCallback(
    (args: { slug: string; excludeId?: string; signal?: AbortSignal }) =>
      newsApi.checkSlugAvailable(args.slug, {
        excludeId: args.excludeId,
        signal: args.signal,
      }),
    [],
  );

  const richDoc = useMemo(
    () => (content ?? { type: "doc" }) as RichContent,
    [content],
  );
  const qualityIssues = useMemo(
    () =>
      analyzeContentQuality({
        content: richDoc,
        excerpt,
        coverImageAlt,
        metaTitle,
        metaDescription,
        requireCta: false,
      }),
    [richDoc, excerpt, coverImageAlt, metaTitle, metaDescription],
  );

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <FieldGroup className="min-w-0 gap-6" id="content">
        <FieldSet>
          <FieldLegend>محتوا</FieldLegend>
          <FormInputField control={control} name="title" label="عنوان" />
          <SlugField<NewsFormValues>
            name="slug"
            titleName="title"
            excludeId={excludeId}
            checkAvailability={checkSlug}
          />
          <FormTextareaField
            control={control}
            name="excerpt"
            label="خلاصه"
            rows={3}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelectField
              control={control}
              name="eventType"
              label="نوع خبر"
              options={[...NEWS_EVENT_TYPE_OPTIONS]}
            />
            <FormDateTimeField
              control={control}
              name="eventDate"
              label="تاریخ رویداد"
              mode="date"
              clearable
            />
          </div>
          <FormInputField
            control={control}
            name="registrationUrl"
            label="لینک ثبت‌نام (اختیاری)"
            dir="ltr"
            placeholder="https://…"
          />
        </FieldSet>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <FormField
            control={control}
            name="content"
            render={({ field }) => (
              <FormItem className="min-w-0">
                <FormLabel>متن خبر</FormLabel>
                <FormControl>
                  <ContentEditor
                    value={field.value as RichContent}
                    onChange={(doc) => field.onChange(doc as FormRichDoc)}
                    aria-invalid={Boolean(form.formState.errors.content)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <ContentQualityPanel
            issues={qualityIssues}
            className="lg:sticky lg:top-24 lg:self-start"
          />
        </div>
      </FieldGroup>

      <aside
        id="sidebar"
        className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-24 xl:self-start"
      >
        <PublishStatusControl
          status={status}
          scheduledAt={scheduledAt || null}
          onScheduledAtChange={(value) => {
            setValue("scheduledAt", value ?? "", { shouldDirty: true });
          }}
          onStatusChange={(next: PublicationStatus) => {
            setValue("status", next, { shouldDirty: true });
          }}
          lastEditedAt={lastEditedAt}
          lastEditedBy={lastEditedBy}
          isPending={isPending}
          onSaveDraft={onSaveDraft}
          onPublish={onPublish}
          onSchedule={onSchedule}
        />

        <FieldSet>
          <FieldLegend>تصویر شاخص</FieldLegend>
          <FormImageField
            control={control}
            name="coverImage"
            label="تصویر شاخص (اختیاری)"
          />
          <FormInputField
            control={control}
            name="coverImageAlt"
            label="متن جایگزین تصویر"
          />
        </FieldSet>

        <SeoFieldsSection control={control} previewPath="/news" />
      </aside>
    </div>
  );
}
