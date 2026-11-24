"use client";

import { useMemo, useState } from "react";
import { KeyRound, Pencil, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable } from "@/components/admin/data-table/data-table";
import { SelectFilter } from "@/components/admin/data-table/filters";
import { RowActionsMenu } from "@/components/admin/data-table/row-actions-menu";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { InviteUserDialog } from "@/components/admin/users/invite-user-dialog";
import { createUserColumns } from "@/components/admin/users/user-columns";
import {
  toStaffUserListQuery,
  userFilterParsers,
} from "@/components/admin/users/users-table-params";
import { useSession } from "@/components/auth/auth-provider";
import { FormSelectField } from "@/components/forms";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import type { StaffUser } from "@/contracts/users";
import {
  useResetStaffPassword,
  useUpdateStaffUser,
} from "@/features/users/mutations";
import { useStaffUsers } from "@/features/users/queries";
import { getApiErrorMessage } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/auth/role-labels";
import {
  editRoleFormSchema,
  type EditRoleFormValues,
} from "@/lib/validations/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export function UsersManager() {
  const { user: me } = useSession();
  const table = useTableUrlState(userFilterParsers);
  const { params, filters, setFilters } = table;
  const query = useStaffUsers(toStaffUserListQuery(params, filters));
  const updateUser = useUpdateStaffUser();
  const resetPassword = useResetStaffPassword();

  const columns = useMemo(() => createUserColumns(), []);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<StaffUser | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffUser | null>(
    null,
  );

  const roleForm = useForm<EditRoleFormValues>({
    resolver: zodResolver(editRoleFormSchema),
    values: { role: roleTarget?.role ?? "consultant" },
  });

  const createButton = (
    <Can permission="user:manage">
      <Button type="button" onClick={() => setInviteOpen(true)}>
        <UserPlus data-icon="inline-start" aria-hidden />
        دعوت کاربر
      </Button>
    </Can>
  );

  function isSelf(user: StaffUser): boolean {
    return Boolean(me && me.id === user.id);
  }

  return (
    <PageContainer>
      <PageHeader
        title="کاربران"
        description="مدیریت حساب مدیران و مشاوران؛ دعوت، نقش، وضعیت و بازنشانی رمز."
        actions={createButton}
      />

      <DataTable
        caption="فهرست کاربران کارمند"
        columns={columns}
        data={query.data?.items}
        getRowId={(row) => row.id}
        pagination={query.data?.pagination}
        controller={table}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        searchPlaceholder="جستجوی نام یا ایمیل…"
        emptyState={{
          title: "کاربری یافت نشد",
          description: "با دعوت کاربر جدید شروع کنید.",
          action: createButton,
        }}
        filters={
          <>
            <SelectFilter
              label="نقش"
              value={filters.role}
              options={[
                { value: "admin", label: ROLE_LABELS.admin },
                { value: "consultant", label: ROLE_LABELS.consultant },
              ]}
              onChange={(role) =>
                setFilters({ role: role as StaffUser["role"] | null })
              }
            />
            <SelectFilter
              label="وضعیت"
              value={filters.status}
              options={[
                { value: "active", label: "فعال" },
                { value: "inactive", label: "غیرفعال" },
              ]}
              onChange={(status) =>
                setFilters({ status: status as StaffUser["status"] | null })
              }
            />
          </>
        }
        rowActions={(user) => {
          const self = isSelf(user);
          return (
            <RowActionsMenu label={`عملیات ${user.name}`}>
              <DropdownMenuItem
                disabled={self}
                title={self ? "نمی‌توانید نقش خودتان را تغییر دهید" : undefined}
                onSelect={() => setRoleTarget(user)}
              >
                <Pencil aria-hidden />
                نقش
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  resetPassword.mutate(user.id, {
                    onSuccess: (result) => {
                      toast.success("رمز عبور بازنشانی شد", {
                        description: `رمز موقت: ${result.temporaryPassword}`,
                        duration: 12_000,
                      });
                    },
                    onError: (error) => {
                      toast.error(getApiErrorMessage(error));
                    },
                  });
                }}
              >
                <KeyRound aria-hidden />
                بازنشانی رمز
              </DropdownMenuItem>
              {user.status === "active" ? (
                <DropdownMenuItem
                  disabled={self}
                  title={
                    self ? "نمی‌توانید وضعیت خودتان را تغییر دهید" : undefined
                  }
                  onSelect={() => setDeactivateTarget(user)}
                >
                  <UserX aria-hidden />
                  غیرفعال
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled={self}
                  onSelect={() => {
                    updateUser.mutate(
                      { id: user.id, body: { status: "active" } },
                      {
                        onSuccess: () => toast.success("کاربر فعال شد"),
                        onError: (error) =>
                          toast.error(getApiErrorMessage(error)),
                      },
                    );
                  }}
                >
                  فعال‌سازی
                </DropdownMenuItem>
              )}
            </RowActionsMenu>
          );
        }}
      />

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <Dialog
        open={roleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ویرایش نقش</DialogTitle>
            <DialogDescription>
              {roleTarget
                ? `نقش «${roleTarget.name}» را تغییر دهید.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <Form {...roleForm}>
            <form
              className="space-y-4"
              onSubmit={roleForm.handleSubmit((values) => {
                if (!roleTarget) return;
                updateUser.mutate(
                  { id: roleTarget.id, body: { role: values.role } },
                  {
                    onSuccess: () => {
                      toast.success("نقش به‌روز شد");
                      setRoleTarget(null);
                    },
                    onError: (error) => {
                      toast.error(getApiErrorMessage(error));
                    },
                  },
                );
              })}
              noValidate
            >
              <FormSelectField
                control={roleForm.control}
                name="role"
                label="نقش"
                options={[
                  { value: "admin", label: ROLE_LABELS.admin },
                  { value: "consultant", label: ROLE_LABELS.consultant },
                ]}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRoleTarget(null)}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={updateUser.isPending}>
                  ذخیره
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        title="غیرفعال کردن کاربر"
        description={
          deactivateTarget
            ? `حساب «${deactivateTarget.name}» غیرفعال می‌شود و دیگر نمی‌تواند وارد شود.`
            : undefined
        }
        confirmLabel="غیرفعال کن"
        tone="destructive"
        isPending={updateUser.isPending}
        onConfirm={() => {
          if (!deactivateTarget) return;
          updateUser.mutate(
            { id: deactivateTarget.id, body: { status: "inactive" } },
            {
              onSuccess: () => {
                toast.success("کاربر غیرفعال شد");
                setDeactivateTarget(null);
              },
              onError: (error) => {
                toast.error(getApiErrorMessage(error));
              },
            },
          );
        }}
      />
    </PageContainer>
  );
}
