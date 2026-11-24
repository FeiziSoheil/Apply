"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import type { PublicationStatus, RichContent } from "@/contracts/content";
import { RichContentPreviewSheet } from "@/components/admin/content/rich-content-preview-sheet";
import { EntityFormPage } from "@/components/admin/entity-form/entity-form-page";
import { useDraftAutosave } from "@/components/admin/hooks/use-draft-autosave";
import { Button } from "@/components/ui/button";
import {
  useCreateNewsItem,
  useUpdateNewsItem,
} from "@/features/content/mutations";
import { useNewsItem } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  NEWS_FORM_DEFAULTS,
  newsFormSchema,
  newsItemToFormValues,
  toNewsItemPayload,
  type NewsFormValues,
} from "@/lib/validations/news";
import {
  NEWS_FORM_FIELDS,
  NewsFormFields,
} from "./news-form-fields";

const LIST_HREF = "/admin/content/news";

type NewsFormPageProps =
  | { mode: "create" }
  | { mode: "edit"; newsId: string };

function FormStateTracker({
  form,
  onDirtyChange,
  onStatusChange,
}: {
  form: UseFormReturn<NewsFormValues>;
  onDirtyChange: (dirty: boolean) => void;
  onStatusChange: (status: PublicationStatus) => void;
}) {
  const dirty = form.formState.isDirty;
  const status = form.watch("status");
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);
  return null;
}

export function NewsFormPage(props: NewsFormPageProps) {
  const router = useRouter();
  const createNews = useCreateNewsItem();
  const updateNews = useUpdateNewsItem();
  const formRef = useRef<UseFormReturn<NewsFormValues> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [formStatus, setFormStatus] = useState<PublicationStatus>("draft");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(
    props.mode === "edit" ? props.newsId : null,
  );

  const newsId = props.mode === "edit" ? props.newsId : (createdId ?? "");
  const newsQuery = useNewsItem(newsId, { enabled: Boolean(newsId) });

  const defaultValues = useMemo(() => {
    if (newsQuery.data) return newsItemToFormValues(newsQuery.data);
    return NEWS_FORM_DEFAULTS;
  }, [newsQuery.data]);

  const lastEditedAt = newsQuery.data?.updatedAt ?? null;
  const lastEditedBy = newsQuery.data?.updatedBy ?? null;

  const persist = useCallback(
    async (values: NewsFormValues, status: PublicationStatus) => {
      const body = toNewsItemPayload({ ...values, status });
      if (newsId) {
        await updateNews.mutateAsync({ id: newsId, body });
        return newsId;
      }
      const created = await createNews.mutateAsync(body);
      setCreatedId(created.id);
      router.replace(`/admin/content/news/${created.id}/edit`);
      return created.id;
    },
    [createNews, newsId, router, updateNews],
  );

  const { lastSavedLabel, isAutosaving } = useDraftAutosave({
    enabled: isDirty && formStatus === "draft",
    save: async () => {
      const form = formRef.current;
      if (!form) return;
      const values = form.getValues();
      if (values.status !== "draft") return;
      try {
        await persist(values, "draft");
        form.reset(form.getValues());
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        throw error;
      }
    },
  });

  const goBack = () => {
    router.push(LIST_HREF);
  };

  async function runSave(
    form: UseFormReturn<NewsFormValues>,
    status: PublicationStatus,
    successMessage: string,
  ) {
    form.setValue("status", status, { shouldDirty: true });
    const values = form.getValues();
    try {
      await persist(values, status);
      form.reset({ ...values, status });
      toast.success(successMessage);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <EntityFormPage<NewsFormValues>
      title={newsId ? "ویرایش خبر" : "افزودن خبر"}
      description={
        newsId
          ? newsQuery.data
            ? `ویرایش «${newsQuery.data.title}»`
            : "در حال بارگذاری…"
          : "خبر یا رویداد جدید را ثبت کنید."
      }
      schema={newsFormSchema}
      defaultValues={defaultValues}
      knownFields={NEWS_FORM_FIELDS}
      onCancel={goBack}
      isLoading={Boolean(newsId) && newsQuery.isPending}
      error={
        Boolean(newsId) && newsQuery.error
          ? new Error(getApiErrorMessage(newsQuery.error))
          : null
      }
      onRetry={() => void newsQuery.refetch()}
      onSubmit={async (values) => {
        await persist(values, values.status);
        toast.success(
          values.status === "published"
            ? "خبر منتشر شد."
            : values.status === "scheduled"
              ? "خبر زمان‌بندی شد."
              : "پیش‌نویس ذخیره شد.",
        );
      }}
      footer={({ form }) => {
        formRef.current = form;
        const content = form.watch("content") as RichContent;
        return (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {isAutosaving
                ? "در حال ذخیرهٔ خودکار…"
                : (lastSavedLabel ?? "ذخیرهٔ خودکار هر ۳۰ ثانیه در صورت تغییر")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye data-icon="inline-start" aria-hidden />
              پیش‌نمایش
            </Button>
            <RichContentPreviewSheet
              open={previewOpen}
              onOpenChange={setPreviewOpen}
              doc={content}
              previewPath="/news"
            />
          </div>
        );
      }}
    >
      {(form) => {
        formRef.current = form;
        return (
          <>
            <FormStateTracker
              form={form}
              onDirtyChange={setIsDirty}
              onStatusChange={setFormStatus}
            />
            <NewsFormFields
              form={form}
              excludeId={newsId || undefined}
              lastEditedAt={lastEditedAt}
              lastEditedBy={lastEditedBy}
              isPending={createNews.isPending || updateNews.isPending}
              onSaveDraft={() => {
                void runSave(form, "draft", "پیش‌نویس ذخیره شد.");
              }}
              onPublish={() => {
                void runSave(form, "published", "خبر منتشر شد.");
              }}
              onSchedule={() => {
                void runSave(form, "scheduled", "خبر زمان‌بندی شد.");
              }}
            />
          </>
        );
      }}
    </EntityFormPage>
  );
}
