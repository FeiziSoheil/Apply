"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable } from "@/components/admin/data-table/data-table";
import { RowActionsMenu } from "@/components/admin/data-table/row-actions-menu";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { BlogCategory } from "@/contracts/content";
import { BLOG_CATEGORY_SORT_FIELDS } from "@/contracts/content";
import {
  useCreateBlogCategory,
  useDeleteBlogCategory,
  useUpdateBlogCategory,
} from "@/features/content/mutations";
import { useBlogCategories } from "@/features/content/queries";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import { slugify } from "@/lib/slug";
import {
  blogCategoryFormSchema,
  blogCategoryToFormValues,
  toBlogCategoryPayload,
  type BlogCategoryFormValues,
} from "@/lib/validations/blog-category";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableUrlParams } from "../../data-table/use-table-url-state";

function toCategoryListQuery(params: TableUrlParams) {
  const sort =
    params.sort &&
    (BLOG_CATEGORY_SORT_FIELDS as readonly string[]).includes(params.sort)
      ? (params.sort as (typeof BLOG_CATEGORY_SORT_FIELDS)[number])
      : undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: sort ? params.order : undefined,
  };
}

/**
 * `/admin/content/blog/categories` — table with inline create/edit and 409 on delete-in-use.
 */
export function BlogCategoriesManager() {
  const table = useTableUrlState({});
  const { params } = table;
  const query = useBlogCategories(toCategoryListQuery(params));
  const createCategory = useCreateBlogCategory();
  const updateCategory = useUpdateBlogCategory();
  const deleteCategory = useDeleteBlogCategory();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<BlogCategory | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const editForm = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategoryFormSchema),
    defaultValues: { title: "", slug: "" },
    mode: "onTouched",
  });

  const createForm = useForm<BlogCategoryFormValues>({
    resolver: zodResolver(blogCategoryFormSchema),
    defaultValues: { title: "", slug: "" },
    mode: "onTouched",
  });

  function startEdit(category: BlogCategory) {
    setCreating(false);
    setEditingId(category.id);
    editForm.reset(blogCategoryToFormValues(category));
  }

  function cancelEdit() {
    setEditingId(null);
    editForm.reset({ title: "", slug: "" });
  }

  async function saveEdit() {
    if (!editingId) return;
    const valid = await editForm.trigger();
    if (!valid) return;
    try {
      await updateCategory.mutateAsync({
        id: editingId,
        body: toBlogCategoryPayload(editForm.getValues()),
      });
      toast.success("دسته به‌روز شد.");
      cancelEdit();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function saveCreate() {
    const valid = await createForm.trigger();
    if (!valid) return;
    try {
      await createCategory.mutateAsync(
        toBlogCategoryPayload(createForm.getValues()),
      );
      toast.success("دسته ایجاد شد.");
      setCreating(false);
      createForm.reset({ title: "", slug: "" });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    deleteCategory.mutate(target.id, {
      onSuccess: () => {
        toast.success(`دسته «${target.title}» حذف شد.`);
        setDeleting(null);
      },
      onError: (error) => {
        setDeleting(null);
        if (isApiError(error) && error.isConflict) {
          setConflictMessage(error.message);
          return;
        }
        toast.error(getApiErrorMessage(error));
      },
    });
  }

  const columns = useMemo<ColumnDef<BlogCategory, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "عنوان",
        enableSorting: true,
        enableHiding: false,
        meta: { mobile: "title" },
        cell: ({ row }) => {
          const category = row.original;
          if (editingId === category.id) {
            return (
              <Input
                {...editForm.register("title")}
                aria-label="عنوان دسته"
                onChange={(event) => {
                  editForm.setValue("title", event.target.value, {
                    shouldDirty: true,
                  });
                  if (!editForm.formState.dirtyFields.slug) {
                    editForm.setValue("slug", slugify(event.target.value), {
                      shouldDirty: true,
                    });
                  }
                }}
              />
            );
          }
          return <span className="font-medium">{category.title}</span>;
        },
      },
      {
        accessorKey: "slug",
        header: "اسلاگ",
        enableSorting: true,
        cell: ({ row }) => {
          const category = row.original;
          if (editingId === category.id) {
            return (
              <Input
                {...editForm.register("slug")}
                dir="ltr"
                aria-label="اسلاگ دسته"
                className="font-mono text-xs"
              />
            );
          }
          return (
            <span className="font-mono text-xs" dir="ltr">
              {category.slug}
            </span>
          );
        },
      },
      {
        id: "createdAt",
        header: "ایجاد",
        enableSorting: true,
        accessorKey: "createdAt",
        cell: ({ row }) => formatJalaliDate(row.original.createdAt),
      },
    ],
    [editForm, editingId],
  );

  const data = query.data;

  return (
    <PageContainer>
      <PageHeader
        title="دسته‌های وبلاگ"
        description="ایجاد، ویرایش درون‌خطی و حذف دسته‌ها."
        actions={
          <Can permission="content:write">
            <Button
              type="button"
              onClick={() => {
                cancelEdit();
                setCreating(true);
                createForm.reset({ title: "", slug: "" });
              }}
            >
              <Plus data-icon="inline-start" aria-hidden />
              افزودن دسته
            </Button>
          </Can>
        }
      />

      {creating ? (
        <Form {...createForm}>
          <form
            className="mb-4 grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void saveCreate();
            }}
          >
            <Input
              {...createForm.register("title")}
              placeholder="عنوان دسته"
              aria-label="عنوان دسته جدید"
              onChange={(event) => {
                createForm.setValue("title", event.target.value, {
                  shouldDirty: true,
                });
                createForm.setValue("slug", slugify(event.target.value), {
                  shouldDirty: true,
                });
              }}
            />
            <Input
              {...createForm.register("slug")}
              placeholder="slug"
              dir="ltr"
              aria-label="اسلاگ دسته جدید"
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={createCategory.isPending}
              >
                ذخیره
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCreating(false)}
              >
                انصراف
              </Button>
            </div>
          </form>
        </Form>
      ) : null}

      <DataTable
        caption="فهرست دسته‌های وبلاگ"
        columns={columns}
        data={data?.items}
        pagination={data?.pagination}
        getRowId={(category) => category.id}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی عنوان یا اسلاگ…"
        rowActions={(category) =>
          editingId === category.id ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="ذخیره"
                title="ذخیره"
                disabled={updateCategory.isPending}
                onClick={() => void saveEdit()}
              >
                <Check aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="انصراف"
                title="انصراف"
                onClick={cancelEdit}
              >
                <X aria-hidden />
              </Button>
            </>
          ) : (
            <Can permission={["content:write", "content:delete"]} mode="any">
              <RowActionsMenu label={`عملیات ${category.title}`}>
                <Can permission="content:write">
                  <DropdownMenuItem onSelect={() => startEdit(category)}>
                    <Pencil aria-hidden />
                    ویرایش
                  </DropdownMenuItem>
                </Can>
                <Can permission="content:delete">
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleting(category)}
                  >
                    <Trash2 aria-hidden />
                    حذف
                  </DropdownMenuItem>
                </Can>
              </RowActionsMenu>
            </Can>
          )
        }
        emptyState={{
          title: "هنوز دسته‌ای ثبت نشده است",
          description: `در حال حاضر ${formatNumber(0)} دسته وجود دارد.`,
          action: (
            <Can permission="content:write">
              <Button type="button" onClick={() => setCreating(true)}>
                <Plus data-icon="inline-start" aria-hidden />
                افزودن دسته
              </Button>
            </Can>
          ),
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        tone="destructive"
        title="حذف دسته"
        description={
          deleting
            ? `دسته «${deleting.title}» حذف می‌شود. اگر مقاله‌ای به آن وابسته باشد، حذف انجام نمی‌شود.`
            : undefined
        }
        confirmLabel="حذف دسته"
        isPending={deleteCategory.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={conflictMessage !== null}
        onOpenChange={(open) => {
          if (!open) setConflictMessage(null);
        }}
        tone="default"
        title="حذف امکان‌پذیر نیست"
        description={
          conflictMessage ??
          "این دسته دارای مقاله است و قابل حذف نیست. ابتدا مقاله‌ها را جابه‌جا یا حذف کنید."
        }
        confirmLabel="متوجه شدم"
        cancelLabel="بستن"
        onConfirm={() => setConflictMessage(null)}
      />
    </PageContainer>
  );
}
