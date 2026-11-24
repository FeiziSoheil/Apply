"use client";

import {
  Camera,
  FileImage,
  FolderOpen,
  Loader2,
  RotateCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DocumentView } from "@/contracts/student-panel";
import { useUploadMyDocument } from "@/features/student-panel/mutations";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import { uploadFileWithProgress } from "@/lib/api/upload";
import {
  buildUploadFile,
  prepareFilesForDocument,
  revokePreparedPages,
  uploadWithRetry,
  type PreparedPage,
} from "@/lib/student-documents/prepare-upload";
import {
  clearUploadDraft,
  loadUploadDraft,
  saveUploadDraft,
} from "@/lib/student-documents/upload-draft-store";
import { formatBytesFa } from "@/lib/student-documents/validate-file";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type StudentFileUploaderProps = {
  document: DocumentView;
  reviewEtaMessage: string;
  maxUploadBytes: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: (doc: DocumentView) => void;
};

export function StudentFileUploader({
  document,
  reviewEtaMessage,
  maxUploadBytes,
  open,
  onOpenChange,
  onUploaded,
}: StudentFileUploaderProps) {
  const galleryId = useId();
  const cameraId = useId();
  const fileId = useId();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [pages, setPages] = useState<PreparedPage[]>([]);
  const [softWarnings, setSoftWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "preparing" | "uploading" | "done">(
    "idle",
  );
  const uploadMutation = useUploadMyDocument();

  const resetLocal = useCallback(() => {
    revokePreparedPages(pages);
    setPages([]);
    setSoftWarnings([]);
    setProgress(0);
    setPhase("idle");
    setBusy(false);
  }, [pages]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const draft = await loadUploadDraft(document.id);
      if (cancelled || !draft || draft.pages.length === 0) return;
      const restored: PreparedPage[] = draft.pages.map((page) => {
        const blob = new Blob([page.bytes], { type: page.mimeType });
        return {
          id: page.id,
          previewUrl: URL.createObjectURL(blob),
          blob,
          mimeType: page.mimeType,
          width: page.width,
          height: page.height,
          rotation: page.rotation,
          warnings: [],
        };
      });
      setPages(restored);
      setSoftWarnings(draft.softWarnings);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, document.id]);

  useEffect(() => {
    if (!open || pages.length === 0) return;
    const handle = window.setTimeout(() => {
      void (async () => {
        const storedPages = await Promise.all(
          pages.map(async (page) => ({
            id: page.id,
            mimeType: page.mimeType,
            width: page.width,
            height: page.height,
            rotation: page.rotation,
            bytes: await page.blob.arrayBuffer(),
          })),
        );
        await saveUploadDraft({
          documentId: document.id,
          updatedAt: Date.now(),
          pages: storedPages,
          softWarnings,
        });
      })();
    }, 400);
    return () => window.clearTimeout(handle);
  }, [pages, softWarnings, document.id, open]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      revokePreparedPages(pages);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
  }, []);

  useEffect(() => {
    if (!rateLimitSeconds || rateLimitSeconds <= 0) return;
    const interval = window.setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (!prev || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [rateLimitSeconds]);

  const onPick = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    setPhase("preparing");
    try {
      const result = await prepareFilesForDocument(Array.from(list), {
        maxBytes: maxUploadBytes,
      });
      setPages((current) => {
        revokePreparedPages([]);
        return [...current, ...result.pages];
      });
      if (result.warnings.length > 0) {
        setSoftWarnings((prev) => [
          ...prev,
          ...result.warnings.map((w) => w.message),
        ]);
        for (const warning of result.warnings) {
          toast.message(warning.message);
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "آماده‌سازی فایل ناموفق بود.",
      );
    } finally {
      setBusy(false);
      setPhase("idle");
      if (galleryRef.current) galleryRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePage = (id: string) => {
    setPages((current) => {
      const target = current.find((page) => page.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((page) => page.id !== id);
    });
  };

  const rotatePage = (id: string) => {
    setPages((current) =>
      current.map((page) =>
        page.id === id
          ? {
              ...page,
              rotation: ((page.rotation + 90) % 360) as PreparedPage["rotation"],
            }
          : page,
      ),
    );
  };

  const movePage = (id: string, direction: -1 | 1) => {
    setPages((current) => {
      const index = current.findIndex((page) => page.id === id);
      if (index < 0) return current;
      const next = index + direction;
      if (next < 0 || next >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item!);
      return copy;
    });
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setPhase("idle");
    setProgress(0);
    toast.message("آپلود لغو شد.");
  };

  const submit = async () => {
    if (pages.length === 0) {
      toast.error("ابتدا عکس یا فایل را انتخاب کنید.");
      return;
    }
    setBusy(true);
    setPhase("uploading");
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const file = await buildUploadFile(pages, document.title);
      const asset = await uploadWithRetry(
        (payload, signal) =>
          uploadFileWithProgress(payload, {
            signal,
            onProgress: setProgress,
          }),
        file,
        { signal: controller.signal },
      );

      const updated = await uploadMutation.mutateAsync({
        fileId: asset.id,
        documentId: document.id,
        checklistItemId: document.checklistItemId ?? undefined,
      });

      await clearUploadDraft(document.id);
      revokePreparedPages(pages);
      setPages([]);
      setSoftWarnings([]);
      setPhase("done");
      setProgress(100);
      toast.success("مدرک ارسال شد و در صف بررسی است.");
      onUploaded?.(updated);
      onOpenChange(false);
      resetLocal();
    } catch (error) {
      if (isApiError(error) && error.isAborted) return;
      if (isApiError(error) && error.isRateLimited) {
        const retryAfter = error.retryAfterSeconds ?? 30;
        setRateLimitSeconds(retryAfter);
        toast.error(
          `محدودیت آپلود (۴۲۹): لطفاً ${toPersianDigits(retryAfter)} ثانیه بعد دوباره تلاش کنید.`,
        );
        setPhase("idle");
        return;
      }
      toast.error(getApiErrorMessage(error, "ارسال مدرک انجام نشد."));
      setPhase("idle");
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`upload-title-${document.id}`}
      data-testid="student-document-uploader"
    >
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2
            id={`upload-title-${document.id}`}
            className="truncate font-heading text-lg font-semibold"
          >
            بارگذاری {document.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            حداکثر {formatBytesFa(maxUploadBytes)} · JPG، PNG یا PDF
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="بستن"
          onClick={() => {
            onOpenChange(false);
          }}
        >
          <X aria-hidden />
        </Button>
      </header>

      {rateLimitSeconds ? (
        <div
          role="alert"
          className="mx-4 mt-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400"
          data-testid="upload-rate-limit-alert"
        >
          تعداد درخواست‌های آپلود بیش از حد مجاز است (۴۲۹). لطفاً {toPersianDigits(rateLimitSeconds)} ثانیه صبر کنید.
        </div>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-20 flex-col gap-1"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera aria-hidden />
            <span className="text-xs">دوربین</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-20 flex-col gap-1"
            disabled={busy}
            onClick={() => galleryRef.current?.click()}
          >
            <FileImage aria-hidden />
            <span className="text-xs">گالری</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-20 flex-col gap-1"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <FolderOpen aria-hidden />
            <span className="text-xs">فایل</span>
          </Button>
        </div>

        <input
          ref={cameraRef}
          id={cameraId}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => void onPick(event.target.files)}
        />
        <input
          ref={galleryRef}
          id={galleryId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => void onPick(event.target.files)}
        />
        <input
          ref={fileRef}
          id={fileId}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          multiple
          className="sr-only"
          onChange={(event) => void onPick(event.target.files)}
        />

        {softWarnings.length > 0 ? (
          <ul className="space-y-1 rounded-xl bg-accent/10 px-3 py-2 text-sm text-accent-foreground">
            {Array.from(new Set(softWarnings)).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}

        {pages.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3" aria-label="پیش‌نمایش صفحات">
            {pages.map((page, index) => (
              <li
                key={page.id}
                className="relative overflow-hidden rounded-xl border bg-card"
              >
                {page.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element -- blob preview
                  <img
                    src={page.previewUrl}
                    alt={`صفحه ${index + 1}`}
                    className="aspect-[3/4] w-full object-cover"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-muted text-sm text-muted-foreground">
                    PDF
                  </div>
                )}
                <div className="flex items-center justify-between gap-1 border-t p-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="چرخش"
                    onClick={() => rotatePage(page.id)}
                  >
                    <RotateCw aria-hidden />
                  </Button>
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="جابه‌جایی به قبل"
                      disabled={index === 0}
                      onClick={() => movePage(page.id, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="جابه‌جایی به بعد"
                      disabled={index === pages.length - 1}
                      onClick={() => movePage(page.id, 1)}
                    >
                      ↓
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="حذف صفحه"
                    onClick={() => removePage(page.id)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            از دوربین عکس بگیرید یا چند صفحه را انتخاب کنید؛ در صورت نیاز به یک
            PDF ادغام می‌شوند.
          </p>
        )}

        {phase === "uploading" ? (
          <div className="space-y-2" aria-live="polite">
            <div className="flex items-center justify-between text-sm">
              <span>در حال ارسال…</span>
              <span>{progress}٪</span>
            </div>
            <Progress value={progress} />
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-11"
              onClick={cancelUpload}
            >
              لغو آپلود
            </Button>
          </div>
        ) : null}

        {phase === "done" ? (
          <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
            {reviewEtaMessage}
          </p>
        ) : null}
      </div>

      <footer className="border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          className="min-h-12 w-full"
          disabled={busy || pages.length === 0 || phase === "uploading" || Boolean(rateLimitSeconds && rateLimitSeconds > 0)}
          onClick={() => void submit()}
          data-testid="student-document-submit"
        >
          {busy ? (
            <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />
          ) : (
            <Upload data-icon="inline-start" aria-hidden />
          )}
          {rateLimitSeconds ? `صبر کنید (${toPersianDigits(rateLimitSeconds)} ثانیه)` : "ارسال برای بررسی"}
        </Button>
        <p
          className={cn(
            "mt-2 text-center text-xs text-muted-foreground",
            phase === "uploading" && "sr-only",
          )}
        >
          {reviewEtaMessage}
        </p>
      </footer>
    </div>
  );
}
