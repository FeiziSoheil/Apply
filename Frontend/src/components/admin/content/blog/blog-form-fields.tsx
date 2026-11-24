"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { ContentEditor } from "@/components/admin/content/content-editor";
import { ContentQualityPanel } from "@/components/admin/content/content-quality-panel";
import {
  FormImageField,
  FormTagInputField,
} from "@/components/admin/fields/form-controls";
import { SeoFieldsSection } from "@/components/admin/fields/seo-fields-section";
import { PublishStatusControl } from "@/components/admin/fields/publish-status-control";
import { SlugField } from "@/components/admin/fields/slug-field";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/forms";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { PublicationStatus, RichContent } from "@/contracts/content";
import { blogPostsApi } from "@/features/content/api";
import { useBlogCategories } from "@/features/content/queries";
import { analyzeContentQuality } from "@/lib/admin/content-quality";
import { estimateReadingTime } from "@/lib/richcontent";
import { toPersianDigits } from "@/lib/format";
import type { BlogFormValues } from "@/lib/validations/blog";
import type { FormRichDoc } from "@/lib/validations/content-section";

export const BLOG_FORM_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "content",
  "categoryId",
  "category",
  "tags",
  "author",
  "coverImage",
  "coverImageAlt",
  "featured",
  "status",
  "scheduledAt",
  "seo.metaTitle",
  "seo.metaDescription",
  "seo.ogImageId",
  "seo.noindex",
] as const;

type BlogFormFieldsProps = {
  form: UseFormReturn<BlogFormValues>;
  excludeId?: string;
  lastEditedAt?: string | null;
  lastEditedBy?: string | null;
  isPending?: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onSchedule: () => void;
};

export function BlogFormFields({
  form,
  excludeId,
  lastEditedAt,
  lastEditedBy,
  isPending,
  onSaveDraft,
  onPublish,
  onSchedule,
}: BlogFormFieldsProps) {
  const { control, setValue } = form;
  const slug = useWatch({ control, name: "slug" });
  const content = useWatch({ control, name: "content" });
  const excerpt = useWatch({ control, name: "excerpt" });
  const coverImageAlt = useWatch({ control, name: "coverImageAlt" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const metaTitle = useWatch({ control, name: "seo.metaTitle" });
  const metaDescription = useWatch({ control, name: "seo.metaDescription" });
  const status = useWatch({ control, name: "status" });
  const scheduledAt = useWatch({ control, name: "scheduledAt" });

  const categoriesQuery = useBlogCategories({
    pageSize: 100,
    sort: "title",
    order: "asc",
  });

  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data?.items ?? []).map((category) => ({
        value: category.id,
        label: category.title,
      })),
    [categoriesQuery.data?.items],
  );

  useEffect(() => {
    const match = categoriesQuery.data?.items.find(
      (item) => item.id === categoryId,
    );
    if (match && form.getValues("category") !== match.title) {
      setValue("category", match.title, { shouldDirty: true });
    }
  }, [categoryId, categoriesQuery.data?.items, form, setValue]);

  const checkSlug = useCallback(
    (args: { slug: string; excludeId?: string; signal?: AbortSignal }) =>
      blogPostsApi.checkSlugAvailable(args.slug, {
        excludeId: args.excludeId,
        signal: args.signal,
      }),
    [],
  );

  const richDoc = useMemo(
    () => (content ?? { type: "doc" }) as RichContent,
    [content],
  );
  const readingMinutes = estimateReadingTime(richDoc);
  const qualityIssues = useMemo(
    () =>
      analyzeContentQuality({
        content: richDoc,
        excerpt,
        coverImageAlt,
        metaTitle,
        metaDescription,
        requireCta: true,
      }),
    [richDoc, excerpt, coverImageAlt, metaTitle, metaDescription],
  );

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <FieldGroup className="min-w-0 gap-6" id="content">
        <FieldSet>
          <FieldLegend>محتوا</FieldLegend>
          <FormInputField control={control} name="title" label="عنوان" />
          <SlugField<BlogFormValues>
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
          <p className="text-xs text-muted-foreground">
            زمان مطالعه تقریبی: {toPersianDigits(readingMinutes)} دقیقه
          </p>
        </FieldSet>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <FormField
            control={control}
            name="content"
            render={({ field }) => (
              <FormItem className="min-w-0">
                <FormLabel>متن مقاله</FormLabel>
                <FormControl>
                  <ContentEditor
                    value={field.value as RichContent}
                    onChange={(doc) =>
                      field.onChange(doc as FormRichDoc)
                    }
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
          <FieldLegend>طبقه‌بندی</FieldLegend>
          <FormSelectField
            control={control}
            name="categoryId"
            label="دسته"
            options={categoryOptions}
          />
          <FormTagInputField
            control={control}
            name="tags"
            label="برچسب‌ها"
            description="برچسب جدید را بنویسید و Enter بزنید."
          />
          <FormInputField control={control} name="author" label="نویسنده" />
          <FormField
            control={control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-3 rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>مقالهٔ ویژه</FormLabel>
                  <FormDescription>
                    در صفحهٔ فهرست وبلاگ برجسته شود.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    aria-label="مقاله ویژه"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </FieldSet>

        <FieldSet>
          <FieldLegend>تصویر شاخص</FieldLegend>
          <FormImageField
            control={control}
            name="coverImage"
            label="تصویر شاخص"
          />
          <FormInputField
            control={control}
            name="coverImageAlt"
            label="متن جایگزین تصویر"
          />
        </FieldSet>

        <SeoFieldsSection
          control={control}
          previewPath={slug ? `/blog/${slug}` : "/blog/…"}
        />
      </aside>
    </div>
  );
}
