"use client";

import { Paperclip } from "lucide-react";
import type { TicketAttachment, TicketMessage } from "@/contracts/tickets";
import type { TicketMessageView } from "@/contracts/tickets";
import { formatJalaliDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type AnyMessage = TicketMessage | TicketMessageView;

type TicketMessageBubbleProps = {
  message: AnyMessage;
  /** Align as current user's messages */
  mine?: boolean;
  showInternal?: boolean;
};

function AttachmentList({
  attachments,
}: {
  attachments: readonly TicketAttachment[];
}) {
  if (attachments.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {attachments.map((file) => (
        <li key={file.fileId}>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 truncate text-xs underline-offset-2 hover:underline"
          >
            <Paperclip className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{file.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function TicketMessageBubble({
  message,
  mine = false,
  showInternal = false,
}: TicketMessageBubbleProps) {
  const internal =
    "internal" in message ? Boolean(message.internal) : false;
  const isSystem = message.authorType === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center px-2 py-1">
        <p className="max-w-[90%] rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
          {message.body}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("flex w-full", mine ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-xs",
          internal && showInternal
            ? "border border-dashed border-amber-500/50 bg-amber-500/10 text-foreground"
            : mine
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
        )}
      >
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] opacity-80">
          <span className="font-medium">{message.authorName}</span>
          {internal && showInternal ? (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px]">
              داخلی
            </span>
          ) : null}
          <time dateTime={message.createdAt}>
            {formatJalaliDate(message.createdAt, "HH:mm")}
          </time>
          {message.readAt ? (
            <span aria-label="خوانده‌شده">✓</span>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {message.body}
        </p>
        <AttachmentList attachments={message.attachments} />
      </div>
    </div>
  );
}

export function groupMessagesByJalaliDay<T extends { createdAt: string }>(
  messages: readonly T[],
): { dayKey: string; label: string; items: T[] }[] {
  const groups = new Map<string, { label: string; items: T[] }>();
  for (const message of messages) {
    const label = formatJalaliDate(message.createdAt, "EEEE d MMMM yyyy");
    const dayKey = formatJalaliDate(message.createdAt, "yyyy-MM-dd");
    const existing = groups.get(dayKey);
    if (existing) {
      existing.items.push(message);
    } else {
      groups.set(dayKey, { label, items: [message] });
    }
  }
  return [...groups.entries()].map(([dayKey, value]) => ({
    dayKey,
    label: value.label,
    items: value.items,
  }));
}
