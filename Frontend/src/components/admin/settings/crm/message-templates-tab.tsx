/* eslint-disable react-hooks/set-state-in-effect -- hydrate editable drafts from TanStack Query */
"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UnsavedChangesBar } from "@/components/admin/settings/unsaved-changes-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MESSAGE_CHANNELS,
  TEMPLATE_VARIABLES,
  type MessageChannel,
} from "@/contracts/crm";
import {
  countSmsSegments,
  findUnknownTemplateVariables,
  type MessageTemplateDraft,
} from "@/contracts/crm-settings";
import {
  useReplaceMessageTemplatesSettings,
  useResetMessageTemplatesSettings,
} from "@/features/crm-settings/mutations";
import { useMessageTemplatesSettings } from "@/features/crm-settings/queries";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { CrmSettingsTabSkeleton } from "./crm-settings-tab-skeleton";
import { ResetDefaultsButton } from "./reset-defaults-button";

type LocalTpl = MessageTemplateDraft & { localId: string };

const CHANNEL_LABELS: Record<MessageChannel, string> = {
  ticket: "تیکت",
  sms: "پیامک",
  whatsapp: "واتساپ",
  email: "ایمیل",
};

const SAMPLE_VARS: Record<(typeof TEMPLATE_VARIABLES)[number], string> = {
  name: "علی رضایی",
  consultant: "سارا محمدی",
  date: "۱۴۰۴/۰۷/۲۸",
  time: "۱۰:۳۰",
  country: "آلمان",
  ticket_code: "TK-10024",
  subject: "سؤال درباره مدارک",
};

function previewBody(body: string): string {
  return body.replace(/\{(\w+)\}/g, (match, key: string) => {
    if ((TEMPLATE_VARIABLES as readonly string[]).includes(key)) {
      return SAMPLE_VARS[key as (typeof TEMPLATE_VARIABLES)[number]] ?? match;
    }
    return match;
  });
}

export function MessageTemplatesTab() {
  const query = useMessageTemplatesSettings();
  const replace = useReplaceMessageTemplatesSettings();
  const reset = useResetMessageTemplatesSettings();
  const [items, setItems] = useState<LocalTpl[]>([]);
  const [version, setVersion] = useState(1);
  const [baseline, setBaseline] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sync draft from server payload when query resolves / remounts via parent key when needed.

  
  useEffect(() => {
    if (!query.data) return;
    const local = query.data.items.map((item) => ({
      localId: item.id,
      id: item.id,
      channel: item.channel,
      title: item.title,
      body: item.body,
      active: item.active,
    }));
    setItems(local);
    setVersion(query.data.version);
    setBaseline(JSON.stringify(local));
    setSelectedId(local[0]?.localId ?? null);
  }, [query.data]);

  const dirty = JSON.stringify(items) !== baseline;
  const selected = items.find((item) => item.localId === selectedId) ?? null;
  const unknown = selected ? findUnknownTemplateVariables(selected.body) : [];
  const smsStats = selected
    ? countSmsSegments(previewBody(selected.body))
    : null;

  if (query.isPending && !query.data) return <CrmSettingsTabSkeleton />;
  if (query.error && !query.data) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(query.error)}
      </p>
    );
  }

  function updateSelected(patch: Partial<LocalTpl>) {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((row) =>
        row.localId === selectedId ? { ...row, ...patch } : row,
      ),
    );
  }

  async function handleSave() {
    const invalid = items.flatMap((item) =>
      findUnknownTemplateVariables(item.body).map(
        (v) => `${item.title}: {${v}}`,
      ),
    );
    if (invalid.length > 0) {
      toast.error(`متغیر نامعتبر: ${invalid.join("، ")}`);
      return;
    }
    try {
      const result = await replace.mutateAsync({
        version,
        body: {
          items: items.map((item) => {
          const { localId: _omit, ...rest } = item;
          void _omit;
          return rest;
        }),
        },
      });
      const local = result.items.map((item) => ({
        localId: item.id,
        id: item.id,
        channel: item.channel,
        title: item.title,
        body: item.body,
        active: item.active,
      }));
      setItems(local);
      setVersion(result.version);
      setBaseline(JSON.stringify(local));
      setSelectedId(local[0]?.localId ?? null);
      toast.success("قالب‌های پیام ذخیره شد");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6" data-testid="crm-settings-messages">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">قالب پیام‌ها</h2>
          <p className="text-muted-foreground text-sm">
            متغیرهای مجاز:{" "}
            {TEMPLATE_VARIABLES.map((v) => `{${v}}`).join("، ")}
          </p>
        </div>
        <div className="flex gap-2">
          <ResetDefaultsButton
            isPending={reset.isPending}
            onConfirm={() => {
              void reset
                .mutateAsync(version)
                .then((result) => {
                  const local = result.items.map((item) => ({
                    localId: item.id,
                    id: item.id,
                    channel: item.channel,
                    title: item.title,
                    body: item.body,
                    active: item.active,
                  }));
                  setItems(local);
                  setVersion(result.version);
                  setBaseline(JSON.stringify(local));
                  setSelectedId(local[0]?.localId ?? null);
                  toast.success("به پیش‌فرض بازگشت");
                })
                .catch((error: unknown) =>
                  toast.error(getApiErrorMessage(error)),
                );
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const localId = crypto.randomUUID();
              setItems((prev) => [
                ...prev,
                {
                  localId,
                  channel: "sms",
                  title: "قالب جدید",
                  body: "سلام {name}",
                  active: true,
                },
              ]);
              setSelectedId(localId);
            }}
          >
            <Plus className="size-4" aria-hidden />
            افزودن
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
        <ul className="divide-border max-h-[28rem] divide-y overflow-y-auto rounded-xl border">
          {items.map((item) => (
            <li key={item.localId}>
              <button
                type="button"
                className={`hover:bg-muted/60 flex w-full flex-col gap-0.5 px-3 py-2.5 text-start text-sm ${
                  item.localId === selectedId ? "bg-muted" : ""
                }`}
                onClick={() => setSelectedId(item.localId)}
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-muted-foreground text-xs">
                  {CHANNEL_LABELS[item.channel]}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="space-y-4 rounded-xl border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="msg-title">عنوان</Label>
                <Input
                  id="msg-title"
                  value={selected.title}
                  onChange={(e) => updateSelected({ title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>کانال</Label>
                <Select
                  value={selected.channel}
                  onValueChange={(channel) =>
                    updateSelected({ channel: channel as MessageChannel })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_CHANNELS.map((channel) => (
                      <SelectItem key={channel} value={channel}>
                        {CHANNEL_LABELS[channel]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="msg-active"
                checked={selected.active ?? true}
                onCheckedChange={(active) => updateSelected({ active })}
              />
              <Label htmlFor="msg-active">فعال</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive ms-auto"
                onClick={() => {
                  setItems((prev) =>
                    prev.filter((row) => row.localId !== selected.localId),
                  );
                  setSelectedId(null);
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                حذف
              </Button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="msg-body">متن</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      درج متغیر
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {TEMPLATE_VARIABLES.map((variable) => (
                      <DropdownMenuItem
                        key={variable}
                        onClick={() =>
                          updateSelected({
                            body: `${selected.body}{${variable}}`,
                          })
                        }
                      >
                        {`{${variable}}`}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                id="msg-body"
                rows={6}
                value={selected.body}
                data-testid="message-template-body"
                onChange={(e) => updateSelected({ body: e.target.value })}
              />
              <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                <span>
                  {formatNumber([...selected.body].length)} نویسه
                </span>
                {selected.channel === "sms" && smsStats ? (
                  <span>
                    حدود {formatNumber(smsStats.segments)} بخش پیامک (۷۰ نویسه)
                  </span>
                ) : null}
              </div>
              {unknown.length > 0 ? (
                <p
                  className="text-destructive text-sm"
                  data-testid="message-unknown-vars"
                >
                  متغیر ناشناخته:{" "}
                  {unknown.map((v) => `{${v}}`).join("، ")}
                </p>
              ) : null}
            </div>

            <div className="bg-muted/40 space-y-1 rounded-lg p-3">
              <p className="text-xs font-medium">پیش‌نمایش</p>
              <p className="text-sm whitespace-pre-wrap">
                {previewBody(selected.body)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            قالبی انتخاب نشده است.
          </p>
        )}
      </div>

      <UnsavedChangesBar
        visible={dirty}
        isSaving={replace.isPending}
        onSave={() => void handleSave()}
        onDiscard={() => {
          if (!query.data) return;
          const local = query.data.items.map((item) => ({
            localId: item.id,
            id: item.id,
            channel: item.channel,
            title: item.title,
            body: item.body,
            active: item.active,
          }));
          setItems(local);
          setBaseline(JSON.stringify(local));
          setSelectedId(local[0]?.localId ?? null);
        }}
      />
    </div>
  );
}
