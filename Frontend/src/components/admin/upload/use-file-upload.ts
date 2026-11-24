"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FileAsset } from "@/contracts/common";
import { getApiErrorMessage, isApiError } from "@/lib/api";
import {
  uploadFileWithProgress,
  type UploadOptions,
} from "@/lib/api/upload";
import { formatNumber } from "@/lib/format";

export const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"] as const;

export type UploadFn = (file: File, options?: UploadOptions) => Promise<FileAsset>;

export type UploadItem = {
  id: string;
  file: File;
  /** Object URL of an image being uploaded (revoked automatically) */
  previewUrl: string | null;
  /** 0–100 */
  progress: number;
  status: "uploading" | "error";
  error: string | null;
};

type UseFileUploadOptions = {
  /** Defaults to `POST /files` with progress */
  upload?: UploadFn;
  accept: readonly string[];
  maxSizeBytes?: number;
  onUploaded: (asset: FileAsset) => void;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${formatNumber(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${formatNumber(Math.round(bytes / 1024))} کیلوبایت`;
  return `${formatNumber(Math.round((bytes / (1024 * 1024)) * 10) / 10)} مگابایت`;
}

/** Client-side check run before upload; returns a Persian message or `null` */
export function validateFile(
  file: File,
  accept: readonly string[],
  maxSizeBytes: number,
): string | null {
  if (!accept.includes(file.type)) return "نوع فایل مجاز نیست.";
  if (file.size > maxSizeBytes) {
    return `حجم فایل نباید بیشتر از ${formatFileSize(maxSizeBytes)} باشد.`;
  }
  return null;
}

/**
 * Upload queue behind `FileUploader` / `ImageUploader`: validates, uploads
 * each file with progress, reports the stored `FileAsset` through
 * `onUploaded`, and keeps failed files (with the reason) until dismissed.
 */
export function useFileUpload({
  upload = uploadFileWithProgress,
  accept,
  maxSizeBytes = DEFAULT_MAX_UPLOAD_BYTES,
  onUploaded,
}: UseFileUploadOptions) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const previews = useRef(new Map<string, string>());
  const onUploadedRef = useRef(onUploaded);

  useEffect(() => {
    onUploadedRef.current = onUploaded;
  }, [onUploaded]);

  const release = useCallback((id: string) => {
    controllers.current.delete(id);
    const url = previews.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      previews.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const activeControllers = controllers.current;
    const activePreviews = previews.current;
    return () => {
      for (const controller of activeControllers.values()) controller.abort();
      for (const url of activePreviews.values()) URL.revokeObjectURL(url);
      activeControllers.clear();
      activePreviews.clear();
    };
  }, []);

  const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      controllers.current.get(id)?.abort();
      release(id);
      setItems((current) => current.filter((item) => item.id !== id));
    },
    [release],
  );

  const start = useCallback(
    (files: readonly File[]) => {
      for (const file of files) {
        const id = crypto.randomUUID();
        const invalid = validateFile(file, accept, maxSizeBytes);
        const previewUrl =
          !invalid && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        if (previewUrl) previews.current.set(id, previewUrl);

        setItems((current) => [
          ...current,
          {
            id,
            file,
            previewUrl,
            progress: 0,
            status: invalid ? "error" : "uploading",
            error: invalid,
          },
        ]);
        if (invalid) continue;

        const controller = new AbortController();
        controllers.current.set(id, controller);
        upload(file, {
          signal: controller.signal,
          onProgress: (progress) => patch(id, { progress }),
        })
          .then((asset) => {
            release(id);
            setItems((current) => current.filter((item) => item.id !== id));
            onUploadedRef.current(asset);
          })
          .catch((error: unknown) => {
            if (isApiError(error) && error.isAborted) return;
            controllers.current.delete(id);
            patch(id, { status: "error", error: getApiErrorMessage(error) });
          });
      }
    },
    [accept, maxSizeBytes, patch, release, upload],
  );

  return {
    items,
    start,
    dismiss,
    isUploading: items.some((item) => item.status === "uploading"),
  };
}
