"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { z } from "zod";
import { FileUploader } from "@/components/admin/upload/file-uploader";
import {
  groupMessagesByJalaliDay,
  TicketMessageBubble,
} from "@/components/tickets/ticket-message-bubble";
import { useSession } from "@/components/auth/auth-provider";
import { PageContainer } from "@/components/panel/page-container";
import { Can } from "@/components/rbac/can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FileAsset } from "@/contracts/common";
import { renderTemplate } from "@/contracts/crm";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from "@/contracts/tickets";
import { useMessageTemplates } from "@/features/crm/queries";
import {
  useCloseTicket,
  useCreateTicketMessage,
  useReopenTicket,
  useUpdateTicket,
} from "@/features/tickets/mutations";
import {
  useTicket,
  useTicketMessages,
} from "@/features/tickets/queries";
import { useStaffUsers } from "@/features/users/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatJalaliDate } from "@/lib/format";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_MAP,
  TICKET_STATUS_MAP,
} from "./ticket-labels";

const replySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "متن پیام را وارد کنید")
    .max(5000),
  internal: z.boolean(),
});

type ReplyValues = z.infer<typeof replySchema>;

type TicketThreadViewProps = { ticketId: string };

export function TicketThreadView({ ticketId }: TicketThreadViewProps) {
  const { user } = useSession();
  const ticketQuery = useTicket(ticketId, {
    refetchInterval: 10_000,
  });
  const messagesQuery = useTicketMessages(
    ticketId,
    { page: 1, pageSize: 200, sort: "createdAt", order: "asc" },
    { refetchInterval: 10_000 },
  );
  const templatesQuery = useMessageTemplates();
  const staffQuery = useStaffUsers({
    page: 1,
    pageSize: 100,
    status: "active",
  });
  const createMessage = useCreateTicketMessage();
  const updateTicket = useUpdateTicket();
  const closeTicket = useCloseTicket();
  const reopenTicket = useReopenTicket();
  const [files, setFiles] = useState<FileAsset[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const form = useForm<ReplyValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { body: "", internal: false },
  });

  const ticket = ticketQuery.data;
  const messages = messagesQuery.data?.items;
  const groups = useMemo(
    () => groupMessagesByJalaliDay(messages ?? []),
    [messages],
  );

  const canned = useMemo(
    () =>
      (templatesQuery.data ?? []).filter(
        (item) => item.active && item.channel === "ticket",
      ),
    [templatesQuery.data],
  );

  const messageCount = messages?.length ?? 0;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageCount]);

  if (ticketQuery.isPending || messagesQuery.isPending) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
      </PageContainer>
    );
  }

  if (ticketQuery.isError || !ticket) {
    return (
      <PageContainer>
        <p className="text-sm text-destructive">تیکت پیدا نشد یا دسترسی ندارید.</p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/admin/tickets">بازگشت</Link>
        </Button>
      </PageContainer>
    );
  }

  function insertTemplate(templateId: string) {
    const template = canned.find((item) => item.id === templateId);
    if (!template || !ticket) return;
    const rendered = renderTemplate(template.body, {
      name: ticket.createdByName,
      consultant: user?.name ?? "",
      date: formatJalaliDate(new Date().toISOString(), "yyyy/MM/dd"),
      time: formatJalaliDate(new Date().toISOString(), "HH:mm"),
      country: "",
      ticket_code: ticket.code,
      subject: ticket.subject,
    });
    form.setValue("body", rendered.body, { shouldDirty: true });
  }

  function patchTicket(
    body: Partial<{
      status: TicketStatus;
      priority: TicketPriority;
      category: (typeof TICKET_CATEGORIES)[number];
      assignedTo: string | null;
    }>,
  ) {
    updateTicket.mutate(
      { id: ticketId, body },
      {
        onSuccess: () => toast.success("تیکت به‌روز شد"),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  return (
    <PageContainer className="gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ms-2">
          <Link href="/admin/tickets">
            <ArrowRight data-icon="inline-start" aria-hidden />
            صندوق تیکت
          </Link>
        </Button>
        <Badge variant="secondary">{ticket.code}</Badge>
        <Badge variant="outline">
          {TICKET_STATUS_MAP[ticket.status].label}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex min-h-[70vh] flex-col rounded-xl border bg-card">
          <header className="border-b px-4 py-3">
            <h1 className="font-heading text-lg font-semibold">
              {ticket.subject}
            </h1>
            <p className="text-xs text-muted-foreground">
              {ticket.createdByName} ·{" "}
              {TICKET_CATEGORY_LABELS[ticket.category]}
            </p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {groups.map((group) => (
              <div key={group.dayKey} className="space-y-3">
                <p className="text-center text-[11px] text-muted-foreground">
                  {group.label}
                </p>
                {group.items.map((message) => (
                  <TicketMessageBubble
                    key={message.id}
                    message={message}
                    mine={message.authorId === user?.id}
                    showInternal
                  />
                ))}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <Can permission="ticket:write">
            <div className="border-t p-4">
              <Form {...form}>
                <form
                  className="space-y-3"
                  onSubmit={form.handleSubmit((values) => {
                    createMessage.mutate(
                      {
                        id: ticketId,
                        body: {
                          body: values.body,
                          attachmentIds: files.map((file) => file.id),
                          internal: values.internal,
                        },
                      },
                      {
                        onSuccess: () => {
                          form.reset({ body: "", internal: values.internal });
                          setFiles([]);
                          toast.success(
                            values.internal
                              ? "یادداشت داخلی ثبت شد"
                              : "پاسخ ارسال شد",
                          );
                        },
                        onError: (error) =>
                          toast.error(getApiErrorMessage(error)),
                      },
                    );
                  })}
                >
                  {canned.length > 0 ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="canned-reply">پاسخ آماده</Label>
                      <Select onValueChange={insertTemplate}>
                        <SelectTrigger id="canned-reply">
                          <SelectValue placeholder="درج قالب…" />
                        </SelectTrigger>
                        <SelectContent>
                          {canned.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>پاسخ</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-24"
                            placeholder="متن پاسخ…"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="internal"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(Boolean(checked))
                            }
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          یادداشت داخلی (فقط کارکنان)
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FileUploader
                    value={files}
                    onChange={setFiles}
                    maxFiles={5}
                    id="staff-ticket-files"
                  />

                  <Button type="submit" disabled={createMessage.isPending}>
                    ارسال
                  </Button>
                </form>
              </Form>
            </div>
          </Can>
        </section>

        <aside className="space-y-4 rounded-xl border bg-card p-4 text-sm">
          <div>
            <h2 className="mb-2 font-medium">دانشجو</h2>
            <p>{ticket.createdByName}</p>
          </div>

          {ticket.caseId ? (
            <div>
              <h2 className="mb-2 font-medium">پرونده</h2>
              <Button asChild variant="link" className="h-auto px-0">
                <Link href={`/admin/cases/${ticket.caseId}`}>
                  مشاهده پرونده
                </Link>
              </Button>
            </div>
          ) : null}

          <Can permission={["ticket:manage", "ticket:write"]} mode="any">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>وضعیت</Label>
                <Select
                  value={ticket.status}
                  onValueChange={(value) =>
                    patchTicket({ status: value as TicketStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {TICKET_STATUS_MAP[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>اولویت</Label>
                <Select
                  value={ticket.priority}
                  onValueChange={(value) =>
                    patchTicket({ priority: value as TicketPriority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {TICKET_PRIORITY_MAP[priority].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>دسته</Label>
                <Select
                  value={ticket.category}
                  onValueChange={(value) =>
                    patchTicket({
                      category: value as (typeof TICKET_CATEGORIES)[number],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {TICKET_CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>مسئول</Label>
                <Select
                  value={ticket.assignedTo ?? "none"}
                  onValueChange={(value) =>
                    patchTicket({
                      assignedTo: value === "none" ? null : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="بدون مسئول" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مسئول</SelectItem>
                    {(staffQuery.data?.items ?? []).map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {ticket.status === "closed" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={reopenTicket.isPending}
                  onClick={() =>
                    reopenTicket.mutate(ticketId, {
                      onSuccess: () => toast.success("تیکت بازگشایی شد"),
                      onError: (error) =>
                        toast.error(getApiErrorMessage(error)),
                    })
                  }
                >
                  بازگشایی
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={closeTicket.isPending}
                  onClick={() =>
                    closeTicket.mutate(ticketId, {
                      onSuccess: () => toast.success("تیکت بسته شد"),
                      onError: (error) =>
                        toast.error(getApiErrorMessage(error)),
                    })
                  }
                >
                  بستن تیکت
                </Button>
              )}
            </div>
          </Can>

          {ticket.slaDueAt ? (
            <p className="text-xs text-muted-foreground">
              مهلت SLA:{" "}
              {formatJalaliDate(ticket.slaDueAt, "d MMMM yyyy — HH:mm")}
            </p>
          ) : null}
        </aside>
      </div>
    </PageContainer>
  );
}
