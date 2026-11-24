"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import type { Program, University } from "@/contracts/content";
import { useDeleteProgram } from "@/features/content/mutations";
import { usePrograms } from "@/features/content/queries";
import { getApiErrorMessage } from "@/lib/api";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";
import { PROGRAM_SORT_FIELDS } from "@/contracts/content";

/** No extra filters — list is scoped to the university slug */
const panelFilterParsers = {} as const;

const programColumns: ColumnDef<Program, unknown>[] = [
  {
    accessorKey: "nameFa",
    header: "برنامه",
    enableSorting: true,
    enableHiding: false,
    meta: { mobile: "title" },
  },
  {
    id: "degreeLevel",
    header: "مقطع",
    cell: ({ row }) => DEGREE_LEVEL_LABELS[row.original.degreeLevel],
  },
  {
    id: "field",
    header: "رشته",
    cell: ({ row }) => row.original.field,
  },
  {
    accessorKey: "tuition",
    header: "شهریه",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatNumber(row.original.tuition)}{" "}
        <span className="text-xs text-muted-foreground">
          {row.original.currency}
        </span>
      </span>
    ),
  },
  {
    accessorKey: "deadline",
    header: "ددلاین",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatJalaliDate(row.original.deadline)}
      </span>
    ),
  },
];

type UniversityProgramsPanelProps = {
  university: University;
};

/**
 * Edit-tab panel: programs of one university + quick-add link.
 */
export function UniversityProgramsPanel({
  university,
}: UniversityProgramsPanelProps) {
  const router = useRouter();
  const table = useTableUrlState(panelFilterParsers);
  const { params } = table;

  const sort =
    params.sort &&
    (PROGRAM_SORT_FIELDS as readonly string[]).includes(params.sort)
      ? (params.sort as (typeof PROGRAM_SORT_FIELDS)[number])
      : undefined;

  const query = usePrograms({
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: sort ? params.order : undefined,
    university: university.slug,
  });
  const deleteProgram = useDeleteProgram();
  const [deleting, setDeleting] = useState<Program | null>(null);

  const openCreate = useCallback(() => {
    router.push(
      `/admin/content/programs/new?university=${encodeURIComponent(university.slug)}`,
    );
  }, [router, university.slug]);

  const openEdit = useCallback(
    (program: Program) => {
      router.push(`/admin/content/programs/${program.id}/edit`);
    },
    [router],
  );

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    deleteProgram.mutate(target.id, {
      onSuccess: () => {
        toast.success(`برنامه «${target.nameFa}» حذف شد.`);
        setDeleting(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  }

  const data = query.data;

  return (
    <PageContainer>
      <PageHeader
        title="برنامه‌های این دانشگاه"
        description={`برنامه‌های تحصیلی «${university.nameFa}»`}
        actions={
          <Can permission="content:write">
            <Button type="button" onClick={openCreate}>
              <Plus data-icon="inline-start" aria-hidden />
              افزودن برنامه
            </Button>
          </Can>
        }
      />

      <DataTable
        caption={`برنامه‌های ${university.nameFa}`}
        columns={programColumns}
        data={data?.items}
        pagination={data?.pagination}
        getRowId={(program) => program.id}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی نام یا رشته…"
        rowActions={(program) => (
          <Can permission={["content:write", "content:delete"]} mode="any">
            <RowActionsMenu label={`عملیات ${program.nameFa}`}>
              <Can permission="content:write">
                <DropdownMenuItem onSelect={() => openEdit(program)}>
                  <Pencil aria-hidden />
                  ویرایش
                </DropdownMenuItem>
              </Can>
              <Can permission="content:delete">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(program)}
                >
                  <Trash2 aria-hidden />
                  حذف
                </DropdownMenuItem>
              </Can>
            </RowActionsMenu>
          </Can>
        )}
        emptyState={{
          title: "هنوز برنامه‌ای برای این دانشگاه نیست",
          description: "اولین برنامه را اضافه کنید.",
          action: (
            <Can permission="content:write">
              <Button type="button" onClick={openCreate}>
                <Plus data-icon="inline-start" aria-hidden />
                افزودن برنامه
              </Button>
            </Can>
          ),
        }}
      />

      <p className="mt-4 text-sm text-muted-foreground">
        برای مدیریت کامل فیلترها به{" "}
        <Link
          href={`/admin/content/programs?university=${encodeURIComponent(university.slug)}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          فهرست برنامه‌ها
        </Link>{" "}
        بروید.
      </p>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        tone="destructive"
        title="حذف برنامه"
        description={
          deleting
            ? `برنامه «${deleting.nameFa}» برای همیشه حذف می‌شود.`
            : undefined
        }
        confirmLabel="حذف برنامه"
        isPending={deleteProgram.isPending}
        onConfirm={confirmDelete}
      />
    </PageContainer>
  );
}
