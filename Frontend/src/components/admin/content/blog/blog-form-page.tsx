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
  useCreateBlogPost,
  useUpdateBlogPost,
} from "@/features/content/mutations";
import { useBlogPost } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  BLOG_FORM_DEFAULTS,
  blogFormSchema,
  blogPostToFormValues,
  toBlogPostPayload,
  type BlogFormValues,
} from "@/lib/validations/blog";
import {
  BLOG_FORM_FIELDS,
  BlogFormFields,
} from "./blog-form-fields";

const LIST_HREF = "/admin/content/blog";

type BlogFormPageProps =
  | { mode: "create" }
  | { mode: "edit"; postId: string };

function FormStateTracker({
  form,
  onDirtyChange,
  onStatusChange,
}: {
  form: UseFormReturn<BlogFormValues>;
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

export function BlogFormPage(props: BlogFormPageProps) {
  const router = useRouter();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const formRef = useRef<UseFormReturn<BlogFormValues> | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [formStatus, setFormStatus] = useState<PublicationStatus>("draft");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(
    props.mode === "edit" ? props.postId : null,
  );

  const postId = props.mode === "edit" ? props.postId : (createdId ?? "");
  const postQuery = useBlogPost(postId, {
    enabled: Boolean(postId),
  });

  const defaultValues = useMemo(() => {
    if (postQuery.data) return blogPostToFormValues(postQuery.data);
    return BLOG_FORM_DEFAULTS;
  }, [postQuery.data]);

  const lastEditedAt = postQuery.data?.updatedAt ?? null;
  const lastEditedBy = postQuery.data?.updatedBy ?? null;

  const persist = useCallback(
    async (values: BlogFormValues, status: PublicationStatus) => {
      const body = toBlogPostPayload({ ...values, status });
      if (postId) {
        await updatePost.mutateAsync({ id: postId, body });
        return postId;
      }
      const created = await createPost.mutateAsync(body);
      setCreatedId(created.id);
      router.replace(`/admin/content/blog/${created.id}/edit`);
      return created.id;
    },
    [createPost, postId, router, updatePost],
  );

  const { lastSavedLabel, isAutosaving } = useDraftAutosave({
    /** Only autosave drafts — never silently change published/scheduled status */
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
    form: UseFormReturn<BlogFormValues>,
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
    <EntityFormPage<BlogFormValues>
      title={postId ? "ویرایش مقاله" : "نوشتن مقاله"}
      description={
        postId
          ? postQuery.data
            ? `ویرایش «${postQuery.data.title}»`
            : "در حال بارگذاری…"
          : "مقالهٔ جدید را بنویسید و منتشر کنید."
      }
      schema={blogFormSchema}
      defaultValues={defaultValues}
      knownFields={BLOG_FORM_FIELDS}
      onCancel={goBack}
      isLoading={Boolean(postId) && postQuery.isPending}
      error={
        Boolean(postId) && postQuery.error
          ? new Error(getApiErrorMessage(postQuery.error))
          : null
      }
      onRetry={() => void postQuery.refetch()}
      onSubmit={async (values) => {
        await persist(values, values.status);
        toast.success(
          values.status === "published"
            ? "مقاله منتشر شد."
            : values.status === "scheduled"
              ? "مقاله زمان‌بندی شد."
              : "پیش‌نویس ذخیره شد.",
        );
      }}
      footer={({ form }) => {
        formRef.current = form;
        const content = form.watch("content") as RichContent;
        const slug = form.watch("slug");
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
              previewPath={slug ? `/blog/${slug}` : undefined}
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
            <BlogFormFields
              form={form}
              excludeId={postId || undefined}
              lastEditedAt={lastEditedAt}
              lastEditedBy={lastEditedBy}
              isPending={createPost.isPending || updatePost.isPending}
              onSaveDraft={() => {
                void runSave(form, "draft", "پیش‌نویس ذخیره شد.");
              }}
              onPublish={() => {
                void runSave(form, "published", "مقاله منتشر شد.");
              }}
              onSchedule={() => {
                void runSave(form, "scheduled", "مقاله زمان‌بندی شد.");
              }}
            />
          </>
        );
      }}
    </EntityFormPage>
  );
}
