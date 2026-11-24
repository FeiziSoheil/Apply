"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DateTimeJalaliPicker } from "@/components/admin/fields/date-time-jalali-picker";
import { FormComboboxField } from "@/components/admin/fields/form-combobox-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Task, TaskRelatedType } from "@/contracts/crm";
import { useCreateTask, useUpdateTask } from "@/features/crm/mutations";
import { useLeads } from "@/features/leads/queries";
import { useCases } from "@/features/students/queries";
import { useStaffUsers } from "@/features/users/queries";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import {
  REMINDER_OFFSETS,
  resolveRemindAt,
  TASK_FORM_DEFAULTS,
  taskFormSchema,
  type TaskFormValues,
} from "@/lib/validations/task";
import {
  REMINDER_OFFSET_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_RELATED_TYPE_LABELS,
} from "./task-labels";

type TaskFormDefaults = {
  title?: string;
  dueAt?: string;
  assigneeId?: string;
  relatedType?: TaskRelatedType;
  relatedId?: string;
  priority?: TaskFormValues["priority"];
};

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaults?: TaskFormDefaults;
};

function toFormValues(
  task: Task | null | undefined,
  defaults?: TaskFormDefaults,
): TaskFormValues {
  if (task) {
    return {
      title: task.title,
      description: task.description ?? "",
      dueAt: task.dueAt,
      reminderOffset: task.remindAt ? "custom" : "none",
      remindAtCustom: task.remindAt ?? "",
      priority: task.priority,
      assigneeId: task.assigneeId,
      relatedType: task.relatedType,
      relatedId: task.relatedId ?? "",
    };
  }
  return {
    ...TASK_FORM_DEFAULTS,
    title: defaults?.title ?? "",
    dueAt:
      defaults?.dueAt ??
      new Date(Date.now() + 86_400_000).toISOString(),
    assigneeId: defaults?.assigneeId ?? "",
    relatedType: defaults?.relatedType ?? "none",
    relatedId: defaults?.relatedId ?? "",
    priority: defaults?.priority ?? "normal",
  };
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaults,
}: TaskFormDialogProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEdit = Boolean(task);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: toFormValues(task, defaults),
  });

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(task, defaults));
    }
  }, [open, task, defaults, form]);

  const relatedType = form.watch("relatedType");
  const reminderOffset = form.watch("reminderOffset");

  const consultantsQuery = useStaffUsers({
    page: 1,
    pageSize: 100,
    role: "consultant",
    status: "active",
  });
  const leadsQuery = useLeads(
    { page: 1, pageSize: 50, sort: "updatedAt", order: "desc" },
    { enabled: relatedType === "lead" },
  );
  const casesQuery = useCases(
    { page: 1, pageSize: 50, sort: "updatedAt", order: "desc" },
    { enabled: relatedType === "case" },
  );

  const assigneeOptions = useMemo(
    () =>
      (consultantsQuery.data?.items ?? []).map((user) => ({
        value: user.id,
        label: user.name,
      })),
    [consultantsQuery.data?.items],
  );

  const relatedOptions = useMemo(() => {
    if (relatedType === "lead") {
      return (leadsQuery.data?.items ?? []).map((lead) => ({
        value: lead.id,
        label: lead.name,
        description: lead.mobile,
      }));
    }
    if (relatedType === "case") {
      return (casesQuery.data?.items ?? []).map((entry) => ({
        value: entry.id,
        label: entry.studentName || entry.code,
        description: entry.code,
      }));
    }
    return [];
  }, [
    relatedType,
    leadsQuery.data?.items,
    casesQuery.data?.items,
  ]);

  function onSubmit(values: TaskFormValues) {
    const remindAt = resolveRemindAt(
      values.dueAt,
      values.reminderOffset,
      values.remindAtCustom,
    );
    const payload = {
      title: values.title,
      description: values.description || undefined,
      dueAt: values.dueAt,
      remindAt,
      priority: values.priority,
      assigneeId: values.assigneeId,
      relatedType: values.relatedType,
      relatedId:
        values.relatedType === "none"
          ? undefined
          : values.relatedId || undefined,
    };

    if (isEdit && task) {
      updateTask.mutate(
        {
          id: task.id,
          version: task.version,
          body: {
            ...payload,
            description: values.description || null,
            remindAt: remindAt ?? null,
            relatedId:
              values.relatedType === "none" ? null : values.relatedId || null,
          },
          leadId:
            values.relatedType === "lead" ? values.relatedId : undefined,
          caseId:
            values.relatedType === "case" ? values.relatedId : undefined,
        },
        {
          onSuccess: () => {
            toast.success("کار به‌روز شد");
            onOpenChange(false);
          },
          onError: (error) => {
            if (error instanceof ApiError && error.isVersionMismatch) {
              toast.error("نسخه تغییر کرده؛ صفحه را تازه کنید");
              return;
            }
            toast.error(getApiErrorMessage(error));
          },
        },
      );
      return;
    }

    createTask.mutate(payload, {
      onSuccess: () => {
        toast.success("کار ساخته شد");
        onOpenChange(false);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }

  const pending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ویرایش کار" : "کار جدید"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus placeholder="مثلاً تماس پیگیری" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توضیحات</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="اختیاری" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سررسید</FormLabel>
                  <FormControl>
                    <DateTimeJalaliPicker
                      value={field.value}
                      onChange={(value) => field.onChange(value ?? "")}
                      mode="datetime"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="reminderOffset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>یادآور</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="یادآور" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REMINDER_OFFSETS.map((offset) => (
                          <SelectItem key={offset} value={offset}>
                            {REMINDER_OFFSET_LABELS[offset]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اولویت</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اولویت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          Object.keys(TASK_PRIORITY_LABELS) as Array<
                            keyof typeof TASK_PRIORITY_LABELS
                          >
                        ).map((key) => (
                          <SelectItem key={key} value={key}>
                            {TASK_PRIORITY_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {reminderOffset === "custom" ? (
              <FormField
                control={form.control}
                name="remindAtCustom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>زمان یادآور</FormLabel>
                    <FormControl>
                      <DateTimeJalaliPicker
                        value={field.value || null}
                        onChange={(value) => field.onChange(value ?? "")}
                        mode="datetime"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormComboboxField
              control={form.control}
              name="assigneeId"
              label="مسئول"
              options={assigneeOptions}
              isLoading={consultantsQuery.isLoading}
              placeholder="انتخاب مشاور"
            />

            <FormField
              control={form.control}
              name="relatedType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مرتبط با</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("relatedId", "");
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="نوع" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(
                        Object.keys(TASK_RELATED_TYPE_LABELS) as Array<
                          keyof typeof TASK_RELATED_TYPE_LABELS
                        >
                      )
                        .filter((key) => key !== "booking")
                        .map((key) => (
                          <SelectItem key={key} value={key}>
                            {TASK_RELATED_TYPE_LABELS[key]}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {relatedType === "lead" || relatedType === "case" ? (
              <FormComboboxField
                control={form.control}
                name="relatedId"
                label={
                  relatedType === "lead" ? "لید مرتبط" : "پرونده مرتبط"
                }
                options={relatedOptions}
                isLoading={
                  relatedType === "lead"
                    ? leadsQuery.isLoading
                    : casesQuery.isLoading
                }
                placeholder="جستجو و انتخاب"
              />
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={pending}>
                {isEdit ? "ذخیره" : "ایجاد"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
