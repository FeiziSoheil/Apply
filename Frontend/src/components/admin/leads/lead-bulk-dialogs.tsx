"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MessageTemplate, PipelineStage, Tag } from "@/contracts/crm";
import type { LeadPriority } from "@/contracts/leads";
import { crmApi } from "@/features/crm/api";
import {
  useAssignLead,
  useCreateLeadActivity,
  useDeleteLead,
  useUpdateLead,
  useUpdateLeadStage,
} from "@/features/leads/mutations";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { LEAD_PRIORITY_FILTER_OPTIONS } from "./lead-labels";
import { LostReasonDialog } from "./lost-reason-dialog";

type ConsultantOption = { value: string; label: string };

export type LeadBulkDialogsProps = {
  stages: readonly PipelineStage[];
  tags: readonly Tag[];
  templates: readonly MessageTemplate[];
  consultants: readonly ConsultantOption[];
  assignIds: string[] | null;
  stageIds: string[] | null;
  tagIds: string[] | null;
  tagMode: "add" | "remove" | null;
  priorityIds: string[] | null;
  messageIds: string[] | null;
  deleteIds: string[] | null;
  onCloseAssign: () => void;
  onCloseStage: () => void;
  onCloseTags: () => void;
  onClosePriority: () => void;
  onCloseMessage: () => void;
  onCloseDelete: () => void;
  onDone: () => void;
};

export function LeadBulkDialogs({
  stages,
  tags,
  templates,
  consultants,
  assignIds,
  stageIds,
  tagIds,
  tagMode,
  priorityIds,
  messageIds,
  deleteIds,
  onCloseAssign,
  onCloseStage,
  onCloseTags,
  onClosePriority,
  onCloseMessage,
  onCloseDelete,
  onDone,
}: LeadBulkDialogsProps) {
  const assignLead = useAssignLead();
  const updateStage = useUpdateLeadStage();
  const updateLead = useUpdateLead();
  const createActivity = useCreateLeadActivity();
  const deleteLead = useDeleteLead();

  const [assigneeId, setAssigneeId] = useState("");
  const [stageId, setStageId] = useState("");
  const [tagId, setTagId] = useState("");
  const [priority, setPriority] = useState<LeadPriority>("normal");
  const [templateId, setTemplateId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageChannel, setMessageChannel] = useState<"sms" | "whatsapp">(
    "whatsapp",
  );
  const [pending, setPending] = useState(false);
  const [lostPending, setLostPending] = useState<{
    ids: string[];
    stage: PipelineStage;
  } | null>(null);

  const selectedStage = useMemo(
    () => stages.find((stage) => stage.id === stageId) ?? null,
    [stageId, stages],
  );

  async function runBulk(
    ids: string[],
    work: (id: string) => Promise<unknown>,
    successLabel: string,
  ) {
    setPending(true);
    const results = await Promise.allSettled(ids.map((id) => work(id)));
    setPending(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const ok = results.length - failed;
    if (ok > 0) toast.success(`${formatNumber(ok)} ${successLabel}`);
    if (failed > 0) {
      toast.error(`${formatNumber(failed)} مورد انجام نشد`);
    }
    onDone();
  }

  return (
    <>
      <Dialog
        open={assignIds !== null}
        onOpenChange={(open) => {
          if (!open) onCloseAssign();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تخصیص گروهی</DialogTitle>
            <DialogDescription>
              {assignIds
                ? `${formatNumber(assignIds.length)} لید به مشاور انتخاب‌شده تخصیص می‌یابند.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-assignee">مشاور</Label>
            <Select value={assigneeId || undefined} onValueChange={setAssigneeId}>
              <SelectTrigger id="bulk-assignee">
                <SelectValue placeholder="انتخاب مشاور…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">بدون مسئول</SelectItem>
                {consultants.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCloseAssign}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={!assigneeId || pending || assignLead.isPending}
              onClick={() => {
                if (!assignIds) return;
                void runBulk(
                  assignIds,
                  (id) =>
                    assignLead.mutateAsync({
                      id,
                      body: {
                        assigneeId:
                          assigneeId === "__none__" ? null : assigneeId,
                      },
                    }),
                  "لید تخصیص یافت",
                ).then(() => {
                  setAssigneeId("");
                  onCloseAssign();
                });
              }}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={stageIds !== null && lostPending === null}
        onOpenChange={(open) => {
          if (!open) onCloseStage();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر مرحله</DialogTitle>
            <DialogDescription>
              {stageIds
                ? `مرحله ${formatNumber(stageIds.length)} لید را تغییر دهید.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-stage">مرحله</Label>
            <Select value={stageId || undefined} onValueChange={setStageId}>
              <SelectTrigger id="bulk-stage">
                <SelectValue placeholder="انتخاب مرحله…" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCloseStage}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={!selectedStage || pending}
              onClick={() => {
                if (!stageIds || !selectedStage) return;
                if (selectedStage.kind === "lost") {
                  setLostPending({ ids: stageIds, stage: selectedStage });
                  return;
                }
                void runBulk(
                  stageIds,
                  async (id) => {
                    // Fetch-free: send version 0 fails — use update without
                    // forcing version when bulk; stage API requires version.
                    // Callers should pass current versions; for bulk we use
                    // a soft path via mutate with version from list cache later.
                    // Here we use version 1 as fallback only if needed — prefer
                    // refetching each lead would be slow; mock accepts If-Match.
                    const { leadsApi } = await import("@/features/leads/api");
                    const lead = await leadsApi.get(id);
                    return updateStage.mutateAsync({
                      id,
                      version: lead.version,
                      body: { stageId: selectedStage.id },
                    });
                  },
                  "لید منتقل شد",
                ).then(() => {
                  setStageId("");
                  onCloseStage();
                });
              }}
            >
              اعمال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LostReasonDialog
        open={lostPending !== null}
        leadName={
          lostPending
            ? `${formatNumber(lostPending.ids.length)} لید`
            : ""
        }
        onOpenChange={(open) => {
          if (!open) setLostPending(null);
        }}
        onConfirm={(lostReasonId) => {
          if (!lostPending) return;
          const pendingLost = lostPending;
          setLostPending(null);
          void runBulk(
            pendingLost.ids,
            async (id) => {
              const { leadsApi } = await import("@/features/leads/api");
              const lead = await leadsApi.get(id);
              return updateStage.mutateAsync({
                id,
                version: lead.version,
                body: {
                  stageId: pendingLost.stage.id,
                  lostReasonId,
                },
              });
            },
            "لید به ریزش منتقل شد",
          ).then(() => {
            setStageId("");
            onCloseStage();
          });
        }}
      />

      <Dialog
        open={tagIds !== null && tagMode !== null}
        onOpenChange={(open) => {
          if (!open) onCloseTags();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tagMode === "remove" ? "حذف تگ" : "افزودن تگ"}
            </DialogTitle>
            <DialogDescription>
              {tagIds
                ? `روی ${formatNumber(tagIds.length)} لید اعمال می‌شود.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-tag">تگ</Label>
            <Select value={tagId || undefined} onValueChange={setTagId}>
              <SelectTrigger id="bulk-tag">
                <SelectValue placeholder="انتخاب تگ…" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCloseTags}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={!tagId || pending}
              onClick={() => {
                if (!tagIds || !tagMode) return;
                void runBulk(
                  tagIds,
                  async (id) => {
                    const { leadsApi } = await import("@/features/leads/api");
                    const lead = await leadsApi.get(id);
                    const next =
                      tagMode === "add"
                        ? [...new Set([...lead.tagIds, tagId])]
                        : lead.tagIds.filter((entry) => entry !== tagId);
                    return updateLead.mutateAsync({
                      id,
                      version: lead.version,
                      body: { tagIds: next },
                    });
                  },
                  tagMode === "add" ? "تگ افزوده شد" : "تگ حذف شد",
                ).then(() => {
                  setTagId("");
                  onCloseTags();
                });
              }}
            >
              اعمال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={priorityIds !== null}
        onOpenChange={(open) => {
          if (!open) onClosePriority();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تنظیم اولویت</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-priority">اولویت</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as LeadPriority)}
            >
              <SelectTrigger id="bulk-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_PRIORITY_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClosePriority}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!priorityIds) return;
                void runBulk(
                  priorityIds,
                  async (id) => {
                    const { leadsApi } = await import("@/features/leads/api");
                    const lead = await leadsApi.get(id);
                    return updateLead.mutateAsync({
                      id,
                      version: lead.version,
                      body: { priority },
                    });
                  },
                  "اولویت به‌روز شد",
                ).then(onClosePriority);
              }}
            >
              اعمال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={messageIds !== null}
        onOpenChange={(open) => {
          if (!open) onCloseMessage();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ارسال پیام</DialogTitle>
            <DialogDescription>
              فقط رابط کاربری؛ پیام به‌عنوان Activity ثبت می‌شود (ارسال واقعی نیست).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="bulk-channel">کانال</Label>
              <Select
                value={messageChannel}
                onValueChange={(value) =>
                  setMessageChannel(value as "sms" | "whatsapp")
                }
              >
                <SelectTrigger id="bulk-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">واتساپ</SelectItem>
                  <SelectItem value="sms">پیامک</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-template">قالب (اختیاری)</Label>
              <Select
                value={templateId || undefined}
                onValueChange={async (value) => {
                  setTemplateId(value);
                  const template = templates.find((item) => item.id === value);
                  if (!template) return;
                  try {
                    const rendered = await crmApi.renderTemplate({
                      templateId: template.id,
                      variables: { name: "مخاطب" },
                    });
                    setMessageBody(rendered.body);
                    if (template.channel === "sms" || template.channel === "whatsapp") {
                      setMessageChannel(template.channel);
                    }
                  } catch (error) {
                    toast.error(getApiErrorMessage(error));
                  }
                }}
              >
                <SelectTrigger id="bulk-template">
                  <SelectValue placeholder="بدون قالب…" />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter(
                      (item) =>
                        item.channel === "sms" || item.channel === "whatsapp",
                    )
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-message">متن پیام</Label>
              <Textarea
                id="bulk-message"
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                rows={4}
                maxLength={2000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCloseMessage}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={!messageBody.trim() || pending}
              onClick={() => {
                if (!messageIds) return;
                const body = messageBody.trim();
                void runBulk(
                  messageIds,
                  (id) =>
                    createActivity.mutateAsync({
                      id,
                      body:
                        messageChannel === "sms"
                          ? { type: "sms", body }
                          : { type: "whatsapp", body },
                    }),
                  "پیام ثبت شد",
                ).then(() => {
                  setMessageBody("");
                  setTemplateId("");
                  onCloseMessage();
                });
              }}
            >
              ثبت پیام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteIds !== null}
        onOpenChange={(open) => {
          if (!open) onCloseDelete();
        }}
        title="حذف گروهی لیدها"
        description={
          deleteIds
            ? `${formatNumber(deleteIds.length)} لید برای همیشه حذف می‌شوند.`
            : undefined
        }
        confirmLabel="حذف"
        tone="destructive"
        isPending={pending || deleteLead.isPending}
        onConfirm={() => {
          if (!deleteIds) return;
          void runBulk(
            deleteIds,
            (id) => deleteLead.mutateAsync(id),
            "لید حذف شد",
          ).then(onCloseDelete);
        }}
      />
    </>
  );
}
