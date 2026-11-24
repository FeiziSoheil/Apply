"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DateTimeJalaliPicker } from "@/components/admin/fields/date-time-jalali-picker";
import type { MessageTemplate } from "@/contracts/crm";
import type { CallOutcome, Lead } from "@/contracts/leads";
import { CALL_OUTCOMES } from "@/contracts/leads";
import { crmApi } from "@/features/crm/api";
import { useCreateLeadActivity } from "@/features/leads/mutations";
import { getApiErrorMessage } from "@/lib/api";
import { CALL_OUTCOME_LABELS } from "./activity-labels";

type LeadActivityComposeProps = {
  lead: Lead;
  templates: readonly MessageTemplate[];
  consultantName: string;
  countryName: (slug: string) => string;
  onDirtyChange?: (dirty: boolean) => void;
};

export function LeadActivityCompose({
  lead,
  templates,
  consultantName,
  countryName,
  onDirtyChange,
}: LeadActivityComposeProps) {
  const create = useCreateLeadActivity();
  const [tab, setTab] = useState("note");
  const [note, setNote] = useState("");
  const [callDirection, setCallDirection] = useState<"inbound" | "outbound">(
    "outbound",
  );
  const [callOutcome, setCallOutcome] = useState<CallOutcome>("answered");
  const [callDuration, setCallDuration] = useState("");
  const [callBody, setCallBody] = useState("");
  const [messageChannel, setMessageChannel] = useState<"sms" | "whatsapp">(
    "whatsapp",
  );
  const [templateId, setTemplateId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [meetingAt, setMeetingAt] = useState<string | null>(null);
  const [meetingBody, setMeetingBody] = useState("");

  const dirty =
    Boolean(note.trim()) ||
    Boolean(callBody.trim()) ||
    Boolean(messageBody.trim()) ||
    Boolean(meetingBody.trim()) ||
    Boolean(meetingAt);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  async function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    try {
      const country =
        lead.targetCountries[0] ?? lead.interestCountry ?? "";
      const rendered = await crmApi.renderTemplate({
        templateId: template.id,
        variables: {
          name: lead.name,
          consultant: consultantName,
          country: country ? countryName(country) : "",
          date: "",
          time: "",
        },
      });
      setMessageBody(rendered.body);
      if (template.channel === "sms" || template.channel === "whatsapp") {
        setMessageChannel(template.channel);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  function resetCompose() {
    setNote("");
    setCallBody("");
    setCallDuration("");
    setMessageBody("");
    setTemplateId("");
    setMeetingAt(null);
    setMeetingBody("");
  }

  return (
    <div className="bg-card rounded-xl border p-3">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-3 h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="note">یادداشت</TabsTrigger>
          <TabsTrigger value="call">تماس</TabsTrigger>
          <TabsTrigger value="message">پیام</TabsTrigger>
          <TabsTrigger value="meeting">جلسه</TabsTrigger>
        </TabsList>

        <TabsContent value="note" className="space-y-3">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="یادداشت خود را بنویسید…"
            rows={3}
            maxLength={2000}
            aria-label="متن یادداشت"
          />
          <Button
            type="button"
            disabled={!note.trim() || create.isPending}
            onClick={() => {
              create.mutate(
                { id: lead.id, body: { type: "note", body: note.trim() } },
                {
                  onSuccess: () => {
                    toast.success("یادداشت ثبت شد");
                    resetCompose();
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }}
          >
            ثبت یادداشت
          </Button>
        </TabsContent>

        <TabsContent value="call" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>جهت</Label>
              <Select
                value={callDirection}
                onValueChange={(value) =>
                  setCallDirection(value as "inbound" | "outbound")
                }
              >
                <SelectTrigger aria-label="جهت تماس">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">خروجی</SelectItem>
                  <SelectItem value="inbound">ورودی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>نتیجه</Label>
              <Select
                value={callOutcome}
                onValueChange={(value) =>
                  setCallOutcome(value as CallOutcome)
                }
              >
                <SelectTrigger aria-label="نتیجه تماس">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALL_OUTCOMES.map((outcome) => (
                    <SelectItem key={outcome} value={outcome}>
                      {CALL_OUTCOME_LABELS[outcome]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="call-duration">مدت (ثانیه)</Label>
              <input
                id="call-duration"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                inputMode="numeric"
                dir="ltr"
                value={callDuration}
                onChange={(event) => setCallDuration(event.target.value)}
              />
            </div>
          </div>
          <Textarea
            value={callBody}
            onChange={(event) => setCallBody(event.target.value)}
            placeholder="خلاصه تماس (اختیاری)"
            rows={2}
            maxLength={2000}
          />
          <Button
            type="button"
            disabled={create.isPending}
            onClick={() => {
              const duration = Number(callDuration);
              create.mutate(
                {
                  id: lead.id,
                  body: {
                    type: "call",
                    direction: callDirection,
                    outcome: callOutcome,
                    durationSeconds:
                      Number.isFinite(duration) && duration >= 0
                        ? duration
                        : undefined,
                    body: callBody.trim() || undefined,
                  },
                },
                {
                  onSuccess: () => {
                    toast.success("تماس ثبت شد");
                    resetCompose();
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }}
          >
            ثبت تماس
          </Button>
        </TabsContent>

        <TabsContent value="message" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>کانال</Label>
              <Select
                value={messageChannel}
                onValueChange={(value) =>
                  setMessageChannel(value as "sms" | "whatsapp")
                }
              >
                <SelectTrigger aria-label="کانال پیام">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">واتساپ</SelectItem>
                  <SelectItem value="sms">پیامک</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>قالب</Label>
              <Select
                value={templateId || undefined}
                onValueChange={(value) => void applyTemplate(value)}
              >
                <SelectTrigger aria-label="قالب پیام">
                  <SelectValue placeholder="بدون قالب…" />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter(
                      (item) =>
                        item.active &&
                        (item.channel === "sms" || item.channel === "whatsapp"),
                    )
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            placeholder="متن پیام…"
            rows={3}
            maxLength={2000}
            aria-label="متن پیام"
          />
          <Button
            type="button"
            disabled={!messageBody.trim() || create.isPending}
            onClick={() => {
              const body = messageBody.trim();
              create.mutate(
                {
                  id: lead.id,
                  body:
                    messageChannel === "sms"
                      ? { type: "sms", body }
                      : { type: "whatsapp", body },
                },
                {
                  onSuccess: () => {
                    toast.success("پیام ثبت شد");
                    resetCompose();
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }}
          >
            ثبت پیام
          </Button>
        </TabsContent>

        <TabsContent value="meeting" className="space-y-3">
          <div className="space-y-1.5">
            <Label>زمان جلسه</Label>
            <DateTimeJalaliPicker
              value={meetingAt}
              onChange={setMeetingAt}
              mode="datetime"
            />
          </div>
          <Textarea
            value={meetingBody}
            onChange={(event) => setMeetingBody(event.target.value)}
            placeholder="توضیح جلسه (اختیاری)"
            rows={2}
            maxLength={2000}
          />
          <Button
            type="button"
            disabled={create.isPending}
            onClick={() => {
              create.mutate(
                {
                  id: lead.id,
                  body: {
                    type: "meeting",
                    startsAt: meetingAt ?? undefined,
                    body: meetingBody.trim() || undefined,
                  },
                },
                {
                  onSuccess: () => {
                    toast.success("جلسه ثبت شد");
                    resetCompose();
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }}
          >
            ثبت جلسه
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
