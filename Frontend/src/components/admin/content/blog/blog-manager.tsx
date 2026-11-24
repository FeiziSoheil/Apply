"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable } from "@/components/admin/data-table/data-table";
import {
  ComboboxFilter,
  DateRangeFilter,
  SelectFilter,
} from "@/components/admin/data-table/filters";
import { RowActionsMenu } from "@/components/admin/data-table/row-actions-menu";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BlogPost, PublicationStatus } from "@/contracts/content";
import { useDeleteBlogPost } from "@/features/content/mutations";
import { useBlogCategories, useBlogPosts } from "@/features/content/queries";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { blogColumns } from "./blog-columns";
import { blogFilterParsers, toBlogListQuery } from "./blog-table-params";

const STATUS_TABS = [
  { value: "all", label: "همه" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
] as const;

/**
 * `/admin/content/blog` — list, status tabs, filters, delete.
 */
export function BlogManager() {
  const router = useRouter();
  const table = useTableUrlState(blogFilterParsers);
  const { params, filters, setFilters } = table;

  const query = useBlogPosts(toBlogListQuery(params, filters));
  const categoriesQuery = useBlogCategories({
    pageSize: 100,
    sort: "title",
    order: "asc",
  });
  const facetsQuery = useBlogPosts({ pageSize: 100, sort: "title", order: "asc" });
  const deletePost = useDeleteBlogPost();

  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data?.items ?? []).map((category) => ({
        value: category.id,
        label: category.title,
      })),
    [categoriesQuery.data?.items],
  );

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const post of facetsQuery.data?.items ?? []) {
      for (const tag of post.tags) tags.add(tag);
    }
    return [...tags].sort((a, b) => a.localeCompare(b, "fa")).map((tag) => ({
      value: tag,
      label: tag,
    }));
  }, [facetsQuery.data?.items]);

  const authorOptions = useMemo(() => {
    const authors = new Set<string>();
    for (const post of facetsQuery.data?.items ?? []) {
      authors.add(post.author);
    }
    return [...authors]
      .sort((a, b) => a.localeCompare(b, "fa"))
      .map((author) => ({ value: author, label: author }));
  }, [facetsQuery.data?.items]);

  const [deleting, setDeleting] = useState<BlogPost | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [clearSelection, setClearSelection] = useState<(() => void) | null>(
    null,
  );

  const openCreate = useCallback(() => {
    router.push("/admin/content/blog/new");
  }, [router]);

  const openEdit = useCallback(
    (post: BlogPost) => {
      router.push(`/admin/content/blog/${post.id}/edit`);
    },
    [router],
  );

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    deletePost.mutate(target.id, {
      onSuccess: () => {
        toast.success(`مقاله «${target.title}» حذف شد.`);
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

  async function confirmBulkDelete() {
    if (!bulkDeleteIds) return;
    setIsBulkDeleting(true);
    const results = await Promise.allSettled(
      bulkDeleteIds.map((id) => deletePost.mutateAsync(id)),
    );
    setIsBulkDeleting(false);

    const failed = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    const deletedCount = results.length - failed.length;
    if (deletedCount > 0) {
      toast.success(`${formatNumber(deletedCount)} مقاله حذف شد.`);
    }
    if (failed.length > 0) {
      const first = failed[0]?.reason;
      if (isApiError(first) && first.isConflict) {
        setConflictMessage(first.message);
      } else {
        toast.error(
          `${formatNumber(failed.length)} مورد حذف نشد: ${getApiErrorMessage(first)}`,
        );
      }
    }
    clearSelection?.();
    setBulkDeleteIds(null);
  }

  const statusTab = filters.status ?? "all";
  const data = query.data;

  return (
    <PageContainer>
      <PageHeader
        title="وبلاگ"
        description="مدیریت مقالات، دسته‌ها و انتشار."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Can permission="content:read">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/content/blog/categories">
                  <FolderOpen data-icon="inline-start" aria-hidden />
                  دسته‌ها
                </Link>
              </Button>
            </Can>
            <Can permission="content:write">
              <Button type="button" onClick={openCreate}>
                <Plus data-icon="inline-start" aria-hidden />
                نوشتن مقاله
              </Button>
            </Can>
          </div>
        }
      />

      <Tabs
        value={statusTab}
        onValueChange={(value) =>
          setFilters({
            status:
              value === "all" ? null : (value as PublicationStatus),
          })
        }
        className="mb-4"
      >
        <TabsList variant="line">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        caption="فهرست مقالات وبلاگ"
        columns={blogColumns}
        data={data?.items}
        pagination={data?.pagination}
        getRowId={(post) => post.id}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی عنوان، خلاصه، دسته یا برچسب…"
        selectable
        filters={
          <>
            <ComboboxFilter
              label="دسته"
              value={filters.categoryId}
              options={categoryOptions}
              isLoading={categoriesQuery.isPending}
              onChange={(categoryId) => setFilters({ categoryId })}
            />
            <ComboboxFilter
              label="برچسب"
              value={filters.tag}
              options={tagOptions}
              isLoading={facetsQuery.isPending}
              onChange={(tag) => setFilters({ tag })}
            />
            <ComboboxFilter
              label="نویسنده"
              value={filters.author}
              options={authorOptions}
              isLoading={facetsQuery.isPending}
              onChange={(author) => setFilters({ author })}
            />
            <DateRangeFilter
              label="بازه انتشار"
              value={{
                from: filters.publishedFrom,
                to: filters.publishedTo,
              }}
              onChange={({ from, to }) =>
                setFilters({ publishedFrom: from, publishedTo: to })
              }
            />
            <SelectFilter
              label="وضعیت"
              value={filters.status}
              options={STATUS_TABS.filter((tab) => tab.value !== "all")}
              onChange={(status) =>
                setFilters({
                  status: status as PublicationStatus | null,
                })
              }
            />
          </>
        }
        bulkActions={({ selectedIds, clearSelection: clear }) => (
          <Can permission="content:delete">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setClearSelection(() => clear);
                setBulkDeleteIds(selectedIds);
              }}
            >
              <Trash2 data-icon="inline-start" aria-hidden />
              حذف انتخاب‌شده‌ها
            </Button>
          </Can>
        )}
        rowActions={(post) => (
          <Can permission={["content:write", "content:delete"]} mode="any">
            <RowActionsMenu label={`عملیات ${post.title}`}>
              <Can permission="content:write">
                <DropdownMenuItem onSelect={() => openEdit(post)}>
                  <Pencil aria-hidden />
                  ویرایش
                </DropdownMenuItem>
              </Can>
              <Can permission="content:delete">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(post)}
                >
                  <Trash2 aria-hidden />
                  حذف
                </DropdownMenuItem>
              </Can>
            </RowActionsMenu>
          </Can>
        )}
        emptyState={{
          title: "هنوز مقاله‌ای ثبت نشده است",
          description: "اولین مقالهٔ وبلاگ را بنویسید.",
          action: (
            <Can permission="content:write">
              <Button type="button" onClick={openCreate}>
                <Plus data-icon="inline-start" aria-hidden />
                نوشتن مقاله
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
        title="حذف مقاله"
        description={
          deleting
            ? `مقاله «${deleting.title}» برای همیشه حذف می‌شود.`
            : undefined
        }
        confirmLabel="حذف مقاله"
        isPending={deletePost.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={bulkDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteIds(null);
        }}
        tone="destructive"
        title="حذف گروهی مقالات"
        description={
          bulkDeleteIds
            ? `${formatNumber(bulkDeleteIds.length)} مقاله انتخاب‌شده حذف می‌شوند.`
            : undefined
        }
        confirmLabel="حذف همه"
        isPending={isBulkDeleting}
        onConfirm={confirmBulkDelete}
      />

      <ConfirmDialog
        open={conflictMessage !== null}
        onOpenChange={(open) => {
          if (!open) setConflictMessage(null);
        }}
        tone="default"
        title="حذف امکان‌پذیر نیست"
        description={conflictMessage ?? "این مقاله قابل حذف نیست."}
        confirmLabel="متوجه شدم"
        cancelLabel="بستن"
        onConfirm={() => setConflictMessage(null)}
      />
    </PageContainer>
  );
}
