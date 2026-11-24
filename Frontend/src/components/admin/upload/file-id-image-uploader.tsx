"use client";

import { ImageOff, Trash2 } from "lucide-react";
import { DropZone } from "@/components/admin/upload/drop-zone";
import { UploadProgressRow } from "@/components/admin/upload/upload-progress-row";
import {
  useFileUpload,
  IMAGE_MIME_TYPES,
  DEFAULT_MAX_UPLOAD_BYTES,
  formatFileSize,
  type UploadFn,
} from "@/components/admin/upload/use-file-upload";
import { Button } from "@/components/ui/button";
import { resolveFileUrl } from "@/lib/files/resolve-file-url";

type FileIdImageUploaderProps = {
  /** Stored `fileId` (`null` / empty = none) */
  value: string | null | undefined;
  onChange: (fileId: string | null) => void;
  upload?: UploadFn;
  maxSizeBytes?: number;
  previewAlt?: string;
  variant?: "default" | "avatar";
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
  /** When true, clearing is allowed (nullable fields like logo) */
  clearable?: boolean;
};

/**
 * Image field that stores a CMS `fileId` (not a URL), per content-model rules.
 */
export function FileIdImageUploader({
  value,
  onChange,
  upload,
  maxSizeBytes = DEFAULT_MAX_UPLOAD_BYTES,
  previewAlt = "پیش‌نمایش تصویر",
  variant = "default",
  disabled,
  id,
  className,
  clearable = true,
  ...aria
}: FileIdImageUploaderProps) {
  const previewUrl = value ? resolveFileUrl(value) : null;
  const { items, start, dismiss, isUploading } = useFileUpload({
    upload,
    accept: IMAGE_MIME_TYPES,
    maxSizeBytes,
    onUploaded: (asset) => onChange(asset.id),
  });

  const isAvatar = variant === "avatar";

  return (
    <div className={className}>
      {previewUrl && !isUploading ? (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-2 sm:flex-row sm:items-center">
          {/* Mock / local file URL — not optimisable */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={previewAlt}
            className={
              isAvatar
                ? "size-24 shrink-0 rounded-full bg-muted object-cover"
                : "aspect-video w-full rounded-md bg-muted object-cover sm:w-40"
            }
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              {value}
            </p>
          </div>
          {clearable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onChange(null)}
            >
              <Trash2 data-icon="inline-start" aria-hidden />
              حذف تصویر
            </Button>
          ) : null}
        </div>
      ) : (
        <DropZone
          id={id}
          accept={IMAGE_MIME_TYPES}
          disabled={disabled || isUploading}
          onFiles={start}
          title="تصویر را اینجا رها کنید یا برای انتخاب کلیک کنید"
          hint={`JPG، PNG یا WebP — حداکثر ${formatFileSize(maxSizeBytes)}`}
          {...aria}
        />
      )}

      {items.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-2" aria-live="polite">
          {items.map((item) => (
            <UploadProgressRow key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </ul>
      ) : null}

      {!value && items.length === 0 ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <ImageOff className="size-3.5" aria-hidden />
          هنوز تصویری انتخاب نشده است.
        </p>
      ) : null}
    </div>
  );
}
