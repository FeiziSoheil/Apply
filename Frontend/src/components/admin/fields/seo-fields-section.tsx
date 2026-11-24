"use client";

import {
  useWatch,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { FormInputField, FormTextareaField } from "@/components/forms";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const META_TITLE_SOFT = 60;
const META_TITLE_MAX = 70;
const META_DESC_SOFT = 140;
const META_DESC_MAX = 160;

type SeoFieldsSectionProps<T extends FieldValues> = {
  control: Control<T>;
  /** Dot path prefix, e.g. `"seo"` → `seo.metaTitle` */
  namePrefix?: string;
  /** Fallback site host shown in the Google preview */
  siteHost?: string;
  /** Optional path under the host, e.g. `/countries/germany` */
  previewPath?: string;
  className?: string;
};

function pathOf(prefix: string, key: string): string {
  return prefix ? `${prefix}.${key}` : key;
}

/**
 * SEO block aligned with `seoMetaSchema`: meta title / description (char
 * counters + length warnings), `ogImageId`, `noindex` switch, and a live RTL
 * Google-result preview.
 */
export function SeoFieldsSection<T extends FieldValues>({
  control,
  namePrefix = "seo",
  siteHost = "example.com",
  previewPath,
  className,
}: SeoFieldsSectionProps<T>) {
  const titleName = pathOf(namePrefix, "metaTitle") as FieldPath<T>;
  const descriptionName = pathOf(namePrefix, "metaDescription") as FieldPath<T>;
  const ogImageIdName = pathOf(namePrefix, "ogImageId") as FieldPath<T>;
  const noindexName = pathOf(namePrefix, "noindex") as FieldPath<T>;

  const title = useWatch({ control, name: titleName });
  const description = useWatch({ control, name: descriptionName });
  const noindex = useWatch({ control, name: noindexName });
  const titleText = typeof title === "string" ? title : "";
  const descriptionText = typeof description === "string" ? description : "";
  const isNoindex = Boolean(noindex);

  const breadcrumb = previewPath
    ? `${siteHost} › ${previewPath.replace(/^\//, "").replace(/\//g, " › ")}`
    : siteHost;

  return (
    <FieldSet className={className}>
      <FieldLegend>سئو و شبکه اجتماعی</FieldLegend>

      <div className="space-y-1">
        <FormInputField
          control={control}
          name={titleName}
          label="عنوان متا"
          description={`حداکثر ${toPersianDigits(META_TITLE_MAX)} کاراکتر؛ بهتر است زیر ${toPersianDigits(META_TITLE_SOFT)} بماند.`}
        />
        <CharCounter value={titleText} soft={META_TITLE_SOFT} max={META_TITLE_MAX} />
      </div>

      <div className="space-y-1">
        <FormTextareaField
          control={control}
          name={descriptionName}
          label="توضیحات متا"
          rows={3}
          description={`حداکثر ${toPersianDigits(META_DESC_MAX)} کاراکتر؛ توصیه می‌شود حدود ${toPersianDigits(META_DESC_SOFT)} کاراکتر.`}
        />
        <CharCounter
          value={descriptionText}
          soft={META_DESC_SOFT}
          max={META_DESC_MAX}
        />
      </div>

      <FormInputField
        control={control}
        name={ogImageIdName}
        label="شناسه تصویر Open Graph"
        description="شناسه فایل آپلودشده (uuid)، نه URL خارجی — مطابق `seo.ogImageId`."
        dir="ltr"
      />

      <FormField
        control={control}
        name={noindexName}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-1">
              <FormLabel className="font-normal">عدم ایندکس (noindex)</FormLabel>
              <FormDescription>
                با روشن بودن، موتورهای جستجو صفحه را ایندکس نمی‌کنند.
              </FormDescription>
              <FormMessage />
            </div>
            <FormControl>
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                aria-label="عدم ایندکس در موتورهای جستجو"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          پیش‌نمایش نتیجه جستجو
          {isNoindex ? " (noindex فعال است)" : null}
        </p>
        <div
          className={cn(
            "max-w-xl space-y-1 text-start",
            isNoindex && "opacity-60",
          )}
          dir="rtl"
          lang="fa"
        >
          <p className="truncate text-xs text-muted-foreground">{breadcrumb}</p>
          <p className="line-clamp-2 text-lg font-medium text-info">
            {titleText || "عنوان صفحه در نتایج گوگل"}
          </p>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {descriptionText ||
              "توضیحات متا اینجا نمایش داده می‌شود تا ببینید نتیجه در گوگل چگونه به‌نظر می‌رسد."}
          </p>
        </div>
      </div>
    </FieldSet>
  );
}

function CharCounter({
  value,
  soft,
  max,
}: {
  value: string;
  soft: number;
  max: number;
}) {
  const length = value.length;
  const overSoft = length > soft;
  const overMax = length > max;
  return (
    <p
      className={cn(
        "text-end text-xs tabular-nums",
        overMax
          ? "text-destructive"
          : overSoft
            ? "text-warning-foreground"
            : "text-muted-foreground",
      )}
      aria-live="polite"
    >
      {toPersianDigits(length)} / {toPersianDigits(max)}
      {overSoft && !overMax ? " — کمی طولانی است" : null}
      {overMax ? " — بیش از حد مجاز" : null}
    </p>
  );
}
