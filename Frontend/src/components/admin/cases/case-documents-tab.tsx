"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Upload, Plus } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { StatusBadge, type StatusMap } from "@/components/admin/status-badge";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ChecklistItem, StudentDocument } from "@/contracts/students";
import {
  useCreateDocument,
  useDeleteDocument,
  useRevertDocument,
  useReviewDocument,
  useUploadFile,
} from "@/features/students/mutations";
import { useCaseChecklist, useCaseDocuments } from "@/features/students/queries";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { CASE_STAGE_LABELS } from "./case-labels";
import { FileViewer } from "./file-viewer";

const DOC_STATUS_MAP: StatusMap<
  "not_uploaded" | "pending" | "uploaded" | "approved" | "rejected"
> = {
  not_uploaded: { label: "بارگذاری‌نشده", tone: "neutral" },
  pending: { label: "در انتظار بررسی", tone: "warning" },
  uploaded: { label: "بارگذاری‌شده", tone: "info" },
  approved: { label: "تأییدشده", tone: "success" },
  rejected: { label: "ردشده", tone: "danger" },
};

type CaseDocumentsTabProps = {
  caseId: string;
  onSuggestAdvance?: () => void;
};

export function CaseDocumentsTab({
  caseId,
  onSuggestAdvance,
}: CaseDocumentsTabProps) {
  const { user } = useSession();
  const checklistQuery = useCaseChecklist(caseId);
  const documentsQuery = useCaseDocuments(caseId, {
    page: 1,
    pageSize: 100,
    sort: "createdAt",
    order: "desc",
  });
  const uploadFile = useUploadFile();
  const createDocument = useCreateDocument();
  const reviewDocument = useReviewDocument();
  const revertDocument = useRevertDocument();
  const deleteDocument = useDeleteDocument();

  const docsById = useMemo(() => {
    const map = new Map<string, StudentDocument>();
    for (const doc of documentsQuery.data?.items ?? []) {
      map.set(doc.id, doc);
    }
    return map;
  }, [documentsQuery.data?.items]);

  const customDocs = useMemo(
    () =>
      (documentsQuery.data?.items ?? []).filter(
        (doc) => doc.custom || !doc.checklistItemId,
      ),
    [documentsQuery.data?.items],
  );

  const [viewerDoc, setViewerDoc] = useState<StudentDocument | null>(null);
  const [rejectTarget, setRejectTarget] = useState<StudentDocument | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [uploadItem, setUploadItem] = useState<ChecklistItem | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");

  const items = checklistQuery.data?.items ?? [];
  const requiredDone =
    items.filter((item) => item.required).every((item) => {
      if (!item.documentType) return item.done;
      if (!item.documentId) return false;
      return docsById.get(item.documentId)?.status === "approved";
    }) && items.some((item) => item.required);

  function handleUpload(file: File, item?: ChecklistItem | null, custom?: boolean) {
    uploadFile.mutate(file, {
      onSuccess: (asset) => {
        createDocument.mutate(
          {
            caseId,
            body: {
              type: item?.documentType ?? "other",
              title: custom
                ? customTitle.trim() || file.name
                : item?.title,
              fileId: asset.id,
              checklistItemId: item?.id,
              custom: custom || !item,
            },
          },
          {
            onSuccess: () => {
              toast.success("مدرک بارگذاری شد");
              setUploadItem(null);
              setCustomOpen(false);
              setCustomTitle("");
              if (requiredDone) onSuggestAdvance?.();
            },
            onError: (error) => toast.error(getApiErrorMessage(error)),
          },
        );
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }

  function approve(doc: StudentDocument) {
    reviewDocument.mutate(
      {
        id: doc.id,
        caseId,
        version: doc.version,
        body: { status: "approved" },
      },
      {
        onSuccess: () => {
          toast.success("مدرک تأیید شد");
          void checklistQuery.refetch().then((result) => {
            const next = result.data?.items ?? [];
            const allRequiredOk = next
              .filter((item) => item.required && item.documentType)
              .every((item) => {
                const linked = item.documentId
                  ? docsById.get(item.documentId)
                  : undefined;
                return (
                  item.documentId === doc.id || linked?.status === "approved"
                );
              });
            if (allRequiredOk) onSuggestAdvance?.();
          });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  if (checklistQuery.isPending || documentsQuery.isPending) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        در حال بارگذاری مدارک…
      </p>
    );
  }

  if (checklistQuery.isError || documentsQuery.isError) {
    return (
      <p className="text-destructive py-8 text-center text-sm">
        {getApiErrorMessage(checklistQuery.error ?? documentsQuery.error)}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">چک‌لیست مدارک</h2>
          <p className="text-muted-foreground text-xs">
            انجام‌شده {toPersianDigits(checklistQuery.data?.doneCount ?? 0)} از{" "}
            {toPersianDigits(checklistQuery.data?.totalCount ?? 0)}
          </p>
        </div>
        <Can permission="document:upload">
          <Button type="button" size="sm" onClick={() => setCustomOpen(true)}>
            <Plus data-icon="inline-start" aria-hidden />
            مدرک سفارشی
          </Button>
        </Can>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const doc = item.documentId ? docsById.get(item.documentId) : undefined;
          const status = doc?.status ?? "not_uploaded";
          return (
            <li
              key={item.id}
              className="bg-card flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  <StatusBadge status={status} map={DOC_STATUS_MAP} />
                  {item.required ? (
                    <span className="text-destructive text-xs">الزامی</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">اختیاری</span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  مرحله {CASE_STAGE_LABELS[item.stage]}
                  {item.dueDate
                    ? ` · ددلاین ${formatJalaliDate(`${item.dueDate}T12:00:00.000Z`, "d MMM")}`
                    : ""}
                </p>
                {doc?.rejectionReason ? (
                  <p className="text-destructive text-xs">
                    دلیل رد: {doc.rejectionReason}
                  </p>
                ) : null}
                {doc && (doc.versions?.length ?? 0) > 0 ? (
                  <p className="text-muted-foreground text-xs">
                    نسخه‌های قبلی: {toPersianDigits(doc.versions.length)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                {doc?.fileUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setViewerDoc(doc)}
                  >
                    <Eye data-icon="inline-start" aria-hidden />
                    مشاهده
                  </Button>
                ) : null}
                <Can permission="document:upload">
                  {status !== "approved" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setUploadItem(item)}
                    >
                      <Upload data-icon="inline-start" aria-hidden />
                      {doc ? "جایگزینی" : "بارگذاری"}
                    </Button>
                  ) : null}
                </Can>
                <Can permission="case:review">
                  {(status === "uploaded" || status === "pending") && doc ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => approve(doc)}
                        disabled={reviewDocument.isPending}
                      >
                        تأیید
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectTarget(doc);
                          setRejectReason("");
                        }}
                      >
                        رد
                      </Button>
                    </>
                  ) : null}
                </Can>
                {user?.role === "admin" && doc?.status === "approved" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const reason = window.prompt("دلیل بازگردانی تأیید:");
                      if (!reason || reason.trim().length < 3) return;
                      revertDocument.mutate(
                        {
                          id: doc.id,
                          caseId,
                          version: doc.version,
                          body: { reason: reason.trim() },
                        },
                        {
                          onSuccess: () => toast.success("تأیید لغو شد"),
                          onError: (error) =>
                            toast.error(getApiErrorMessage(error)),
                        },
                      );
                    }}
                  >
                    لغو تأیید
                  </Button>
                ) : null}
                {user?.role === "admin" && doc && doc.status !== "approved" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      deleteDocument.mutate(
                        { id: doc.id, caseId },
                        {
                          onSuccess: () => toast.success("حذف شد"),
                          onError: (error) => {
                            if (isApiError(error) && error.isConflict) {
                              toast.error(error.message);
                              return;
                            }
                            toast.error(getApiErrorMessage(error));
                          },
                        },
                      );
                    }}
                  >
                    حذف
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {customDocs.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">مدارک سفارشی</h3>
          <ul className="space-y-2">
            {customDocs.map((doc) => (
              <li
                key={doc.id}
                className="bg-card flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{doc.title}</p>
                  <StatusBadge status={doc.status} map={DOC_STATUS_MAP} />
                </div>
                {doc.fileUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setViewerDoc(doc)}
                  >
                    مشاهده
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <FileViewer
        open={viewerDoc !== null}
        onOpenChange={(open) => {
          if (!open) setViewerDoc(null);
        }}
        title={viewerDoc?.title ?? ""}
        fileUrl={viewerDoc?.fileUrl}
        fileName={viewerDoc?.fileName}
        mimeType={viewerDoc?.mimeType}
      />

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رد مدرک</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">دلیل رد</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              minLength={3}
              maxLength={500}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectTarget(null)}>
              انصراف
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={rejectReason.trim().length < 3 || reviewDocument.isPending}
              onClick={() => {
                if (!rejectTarget) return;
                reviewDocument.mutate(
                  {
                    id: rejectTarget.id,
                    caseId,
                    version: rejectTarget.version,
                    body: {
                      status: "rejected",
                      rejectionReason: rejectReason.trim(),
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success("مدرک رد شد و به دانشجو اطلاع داده شد");
                      setRejectTarget(null);
                    },
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  },
                );
              }}
            >
              تأیید رد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadItem !== null}
        onOpenChange={(open) => {
          if (!open) setUploadItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              بارگذاری {uploadItem?.title ?? "مدرک"}
            </DialogTitle>
          </DialogHeader>
          <Input
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            aria-label="انتخاب فایل"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleUpload(file, uploadItem);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مدرک سفارشی</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="custom-title">عنوان</Label>
              <Input
                id="custom-title"
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                maxLength={120}
              />
            </div>
            <Input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              aria-label="فایل مدرک سفارشی"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleUpload(file, null, true);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
