"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, HelpCircle } from "lucide-react";
import { FileUploader } from "@/components/admin/upload/file-uploader";
import { PageContainer } from "@/components/panel/page-container";
import { Button } from "@/components/ui/button";
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
import type { FileAsset } from "@/contracts/common";
import { TICKET_CATEGORIES } from "@/contracts/tickets";
import { faqQueries } from "@/features/content/queries";
import { useCreateMyTicket } from "@/features/student-panel/mutations";
import { useMyCase } from "@/features/student-panel/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  clearTicketDraft,
  loadTicketDraft,
  saveTicketDraft,
} from "@/lib/student-tickets/ticket-draft-store";
import {
  studentTicketCreateFormSchema,
  type StudentTicketCreateFormValues,
} from "@/lib/validations/student-ticket";
import { useQuery } from "@tanstack/react-query";
import { CaseLinkGate } from "../case-link-gate";
import { STUDENT_TICKET_CATEGORY_FA } from "./ticket-status-fa";

function NewTicketForm() {
  const router = useRouter();
  const createTicket = useCreateMyTicket();
  const caseQuery = useMyCase();
  const [files, setFiles] = useState<FileAsset[]>([]);

  const form = useForm<StudentTicketCreateFormValues>({
    resolver: zodResolver(studentTicketCreateFormSchema),
    defaultValues: {
      category: "other",
      subject: "",
      body: "",
      relatedCaseId: null,
    },
  });

  useEffect(() => {
    const draft = loadTicketDraft();
    if (!draft) return;
    form.reset({
      category: (TICKET_CATEGORIES as readonly string[]).includes(draft.category)
        ? (draft.category as StudentTicketCreateFormValues["category"])
        : "other",
      subject: draft.subject,
      body: draft.body,
      relatedCaseId: draft.relatedCaseId,
    });
  }, [form]);

  const subject = useWatch({ control: form.control, name: "subject" }) ?? "";
  const category = useWatch({ control: form.control, name: "category" });
  const body = useWatch({ control: form.control, name: "body" }) ?? "";
  const relatedCaseId = useWatch({
    control: form.control,
    name: "relatedCaseId",
  });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      saveTicketDraft({
        category: category ?? "other",
        subject,
        body,
        relatedCaseId: relatedCaseId ?? null,
        updatedAt: Date.now(),
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [category, subject, body, relatedCaseId]);

  const faqSuggest = useQuery({
    ...faqQueries.listOptions({
      page: 1,
      pageSize: 5,
      q: subject.trim().length >= 3 ? subject.trim() : undefined,
      sort: "order",
      order: "asc",
    }),
    enabled: subject.trim().length >= 3,
  });

  const caseId = caseQuery.data?.id ?? null;
  const faqItems = useMemo(
    () => faqSuggest.data?.items ?? [],
    [faqSuggest.data?.items],
  );

  function onSubmit(values: StudentTicketCreateFormValues) {
    createTicket.mutate(
      {
        category: values.category,
        subject: values.subject,
        body: values.body,
        priority: "normal",
        relatedCaseId: values.relatedCaseId ?? caseId ?? undefined,
        attachmentIds: files.map((file) => file.id),
      },
      {
        onSuccess: (ticket) => {
          clearTicketDraft();
          toast.success("پیام شما ثبت شد");
          router.push(`/panel/messages/${ticket.id}`);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  return (
    <PageContainer className="gap-5 pb-8">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ms-2 min-h-10">
          <Link href="/panel/messages">
            <ArrowRight data-icon="inline-start" aria-hidden />
            بازگشت
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-bold">پیام جدید</h1>
        <p className="text-sm text-muted-foreground">
          موضوع و متن را بنویسید؛ پیش‌نویس خودکار ذخیره می‌شود.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>دسته‌بندی</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="min-h-11">
                      <SelectValue placeholder="انتخاب دسته" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TICKET_CATEGORIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {STUDENT_TICKET_CATEGORY_FA[item]}
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
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>موضوع</FormLabel>
                <FormControl>
                  <Input
                    className="min-h-11"
                    placeholder="مثلاً سؤال درباره مدرک زبان"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {faqItems.length > 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/40 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <HelpCircle className="size-3.5" aria-hidden />
                شاید این سؤال‌های پرتکرار کمک کند
              </p>
              <ul className="space-y-3">
                {faqItems.map((faq) => (
                  <li key={faq.id} className="space-y-1">
                    <p className="text-sm font-medium">{faq.question}</p>
                    <p className="line-clamp-3 text-xs text-muted-foreground">
                      {faq.answer}
                    </p>
                  </li>
                ))}
              </ul>
              <Button asChild variant="link" className="mt-1 h-auto px-0 text-xs">
                <Link href="/faq">مشاهده همه سؤالات</Link>
              </Button>
            </div>
          ) : null}

          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>متن پیام</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-32"
                    placeholder="توضیح کوتاه بنویسید…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {caseId ? (
            <FormField
              control={form.control}
              name="relatedCaseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>پیوند به پرونده (اختیاری)</FormLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="min-h-11">
                        <SelectValue placeholder="بدون پیوند" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">بدون پیوند</SelectItem>
                      <SelectItem value={caseId}>پرونده فعلی</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">پیوست (اختیاری)</p>
            <FileUploader
              value={files}
              onChange={setFiles}
              maxFiles={5}
              id="ticket-attachments"
            />
          </div>

          <Button
            type="submit"
            className="min-h-12"
            disabled={createTicket.isPending}
          >
            {createTicket.isPending ? "در حال ارسال…" : "ارسال پیام"}
          </Button>
        </form>
      </Form>
    </PageContainer>
  );
}

export function StudentNewTicketView() {
  return (
    <CaseLinkGate requireCase={false}>
      <NewTicketForm />
    </CaseLinkGate>
  );
}
