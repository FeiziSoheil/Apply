"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, FileText, Loader2, Paperclip, Star, X } from "lucide-react";
import {
  DOCUMENT_MIME_TYPES,
  formatFileSize,
  useFileUpload,
} from "@/components/admin/upload/use-file-upload";
import { Progress } from "@/components/ui/progress";
import {
  groupMessagesByJalaliDay,
  TicketMessageBubble,
} from "@/components/tickets/ticket-message-bubble";
import { PageContainer } from "@/components/panel/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { FileAsset } from "@/contracts/common";
import { STUDENT_TICKET_REOPEN_DAYS } from "@/contracts/tickets";
import {
  useCloseMyTicket,
  useCreateMyTicketMessage,
  useRateMyTicket,
  useReopenMyTicket,
} from "@/features/student-panel/mutations";
import { useMyTicket } from "@/features/student-panel/queries";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import {
  studentTicketRatingFormSchema,
  studentTicketReplySchema,
  type StudentTicketRatingFormValues,
  type StudentTicketReplyValues,
} from "@/lib/validations/student-ticket";
import { CaseLinkGate } from "../case-link-gate";
import {
  StudentPanelError,
  StudentPanelSkeleton,
} from "../panel-query-state";
import { STUDENT_TICKET_STATUS_FA } from "./ticket-status-fa";

type ThreadProps = { ticketId: string };

function canReopenWithinWindow(closedAt: string | null): boolean {
  if (!closedAt) return false;
  const deadline =
    new Date(closedAt).getTime() + STUDENT_TICKET_REOPEN_DAYS * 86_400_000;
  return Date.now() <= deadline;
}

function RatingForm({ ticketId }: { ticketId: string }) {
  const rate = useRateMyTicket();
  const form = useForm<StudentTicketRatingFormValues>({
    resolver: zodResolver(studentTicketRatingFormSchema),
    defaultValues: { rating: 5, ratingComment: "" },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-3 rounded-2xl border bg-card p-4"
        onSubmit={form.handleSubmit((values) => {
          rate.mutate(
            {
              id: ticketId,
              body: {
                rating: values.rating,
                ratingComment: values.ratingComment || undefined,
              },
            },
            {
              onSuccess: () => toast.success("از نظرتان ممنونیم"),
              onError: (error) => toast.error(getApiErrorMessage(error)),
            },
          );
        })}
      >
        <p className="text-sm font-medium">امتیاز به این گفتگو</p>
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">امتیاز</FormLabel>
              <FormControl>
                <div className="flex gap-1" role="group" aria-label="امتیاز">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      size="icon"
                      variant={field.value >= value ? "default" : "outline"}
                      className="size-10"
                      aria-label={`${value} از ۵`}
                      aria-pressed={field.value === value}
                      onClick={() => field.onChange(value)}
                    >
                      <Star
                        className={
                          field.value >= value ? "fill-current" : undefined
                        }
                        aria-hidden
                      />
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ratingComment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نظر (اختیاری)</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-20"
                  placeholder="اگر نکته‌ای دارید بنویسید…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="min-h-11" disabled={rate.isPending}>
          ثبت امتیاز
        </Button>
      </form>
    </Form>
  );
}

function ThreadContent({ ticketId }: ThreadProps) {
  const detail = useMyTicket(ticketId);
  const sendMessage = useCreateMyTicketMessage();
  const closeTicket = useCloseMyTicket();
  const reopenTicket = useReopenMyTicket();
  const [files, setFiles] = useState<FileAsset[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFiles = 3;

  const { items: uploadingItems, start: startUpload, dismiss: dismissUpload, isUploading } = useFileUpload({
    accept: DOCUMENT_MIME_TYPES,
    onUploaded: (asset) => setFiles((prev) => [...prev, asset]),
  });

  const form = useForm<StudentTicketReplyValues>({
    resolver: zodResolver(studentTicketReplySchema),
    defaultValues: { body: "" },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [detail.data?.messages.length]);

  if (detail.isLoading) return <StudentPanelSkeleton />;
  if (detail.isError) {
    if (isApiError(detail.error) && detail.error.isNotFound) {
      return (
        <PageContainer>
          <p className="text-sm text-muted-foreground">این گفتگو پیدا نشد.</p>
          <Button asChild variant="outline" className="mt-4 min-h-11">
            <Link href="/panel/messages">بازگشت به پیام‌ها</Link>
          </Button>
        </PageContainer>
      );
    }
    return (
      <StudentPanelError
        error={detail.error}
        onRetry={() => void detail.refetch()}
      />
    );
  }

  const ticket = detail.data!.ticket;
  const messages = detail.data!.messages;
  const closed = ticket.status === "closed";
  const groups = groupMessagesByJalaliDay(messages);

  const canAddMoreFiles = files.length + uploadingItems.length < maxFiles;

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col p-2 md:p-4">
      {/* Container Card on desktop, responsive container */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">
        {/* Chat Screen Top Header */}
        <header className="border-b bg-card/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                aria-label="بازگشت به پیام‌ها"
              >
                <Link href="/panel/messages">
                  <ArrowRight className="size-5" aria-hidden />
                </Link>
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate font-heading text-base font-bold sm:text-lg">
                    {ticket.subject}
                  </h1>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {STUDENT_TICKET_STATUS_FA[ticket.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">کد گفتگو: {ticket.code}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {!closed ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-9 text-xs"
                  disabled={closeTicket.isPending}
                  onClick={() => {
                    closeTicket.mutate(ticket.id, {
                      onSuccess: () => toast.success("گفتگو بسته شد"),
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    });
                  }}
                >
                  بستن گفتگو
                </Button>
              ) : canReopenWithinWindow(ticket.closedAt) ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-9 text-xs"
                  disabled={reopenTicket.isPending}
                  onClick={() => {
                    reopenTicket.mutate(ticket.id, {
                      onSuccess: () => toast.success("گفتگو دوباره باز شد"),
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    });
                  }}
                >
                  بازگشایی (تا ۷ روز)
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        {/* Message bubbles area - maximized height */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
          {groups.map((group) => (
            <section key={group.dayKey} className="space-y-3">
              <p className="sticky top-0 z-10 mx-auto w-fit rounded-full bg-background/90 px-3 py-1 text-center text-[11px] text-muted-foreground shadow-xs backdrop-blur">
                {group.label}
              </p>
              {group.items.map((message) => (
                <TicketMessageBubble
                  key={message.id}
                  message={message}
                  mine={message.authorType === "student"}
                />
              ))}
            </section>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input / action bottom bar */}
        <div className="border-t bg-background/95 px-4 py-3 backdrop-blur">
          {closed ? (
            <div className="space-y-3 pb-[env(safe-area-inset-bottom)]">
              {ticket.rating === null ? (
                <RatingForm ticketId={ticket.id} />
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  امتیاز شما: {ticket.rating} از ۵
                </p>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form
                className="space-y-2 pb-[env(safe-area-inset-bottom)]"
                onSubmit={form.handleSubmit((values) => {
                  sendMessage.mutate(
                    {
                      id: ticket.id,
                      body: {
                        body: values.body,
                        attachmentIds: files.map((file) => file.id),
                      },
                    },
                    {
                      onSuccess: () => {
                        form.reset({ body: "" });
                        setFiles([]);
                      },
                      onError: (error) =>
                        toast.error(getApiErrorMessage(error)),
                    },
                  );
                })}
              >
                {/* Attached files preview chips */}
                {(files.length > 0 || uploadingItems.length > 0) && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="inline-flex max-w-xs items-center gap-1.5 rounded-lg border bg-muted/50 px-2.5 py-1 text-xs"
                      >
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="truncate">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({formatFileSize(file.size)})
                        </span>
                        <button
                          type="button"
                          className="ms-1 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                          aria-label={`حذف ${file.name}`}
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    ))}

                    {uploadingItems.map((item) => (
                      <div
                        key={item.id}
                        className="inline-flex max-w-xs items-center gap-1.5 rounded-lg border border-dashed bg-muted/30 px-2.5 py-1 text-xs"
                      >
                        <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" aria-hidden />
                        <span className="truncate">{item.file.name}</span>
                        <div className="w-12">
                          <Progress value={item.progress} className="h-1" />
                        </div>
                        <button
                          type="button"
                          className="ms-1 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() => dismissUpload(item.id)}
                          aria-label={`لغو ${item.file.name}`}
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Hidden native file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="sr-only"
                    accept={DOCUMENT_MIME_TYPES.join(",")}
                    disabled={!canAddMoreFiles || isUploading}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const available = maxFiles - (files.length + uploadingItems.length);
                        startUpload(Array.from(e.target.files).slice(0, available));
                        e.target.value = "";
                      }
                    }}
                  />

                  {/* Attachment button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0 rounded-xl"
                    disabled={!canAddMoreFiles || isUploading}
                    title={
                      canAddMoreFiles
                        ? "افزودن فایل پیوست (PDF یا تصویر تا ۱۰ مگابایت)"
                        : "حداکثر ۳ فایل می‌توانید پیوست کنید"
                    }
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" aria-hidden />
                  </Button>

                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormLabel className="sr-only">پیام</FormLabel>
                          <FormControl>
                            <Textarea
                              className="max-h-32 min-h-10 resize-none py-2 text-sm"
                              placeholder="پیام خود را بنویسید…"
                              rows={1}
                              {...field}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  void form.handleSubmit((values) => {
                                    sendMessage.mutate(
                                      {
                                        id: ticket.id,
                                        body: {
                                          body: values.body,
                                          attachmentIds: files.map((file) => file.id),
                                        },
                                      },
                                      {
                                        onSuccess: () => {
                                          form.reset({ body: "" });
                                          setFiles([]);
                                        },
                                        onError: (error) =>
                                          toast.error(getApiErrorMessage(error)),
                                      },
                                    );
                                  })();
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="min-h-10 shrink-0 px-5"
                    disabled={sendMessage.isPending || isUploading}
                  >
                    ارسال
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}


export function StudentTicketThreadView({ ticketId }: ThreadProps) {
  return (
    <CaseLinkGate requireCase={false}>
      <ThreadContent ticketId={ticketId} />
    </CaseLinkGate>
  );
}
