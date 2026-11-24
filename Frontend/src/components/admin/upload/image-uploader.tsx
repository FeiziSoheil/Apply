"use client";

import { ImageOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "./use-file-upload";
import { DropZone } from "./drop-zone";
import { UploadProgressRow } from "./upload-progress-row";
import {
  IMAGE_MIME_TYPES,
  DEFAULT_MAX_UPLOAD_BYTES,
  useFileUpload,
  type UploadFn,
} from "./use-file-upload";

type ImageUploaderProps = {
  /** URL of the current image (`null` / empty = none) */
  value: string | null | undefined;
  /** Receives the stored file's URL, or `null` after removal */
  onChange: (url: string | null) => void;
  /** Defaults to `POST /files` (MSW in development) */
  upload?: UploadFn;
  maxSizeBytes?: number;
  /** Accessible description of the preview image */
  previewAlt?: string;
  /** `avatar` = circular crop-style preview (consultants) */
  variant?: "default" | "avatar";
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

/**
 * Single-image field: drag & drop (or pick), live progress bar, preview of the
 * stored image, remove. Value is the image URL, so it plugs straight into
 * contract fields like `heroImage`, `coverImage` or `photo`.
 */
export function ImageUploader({
  value,
  onChange,
  upload,
  maxSizeBytes = DEFAULT_MAX_UPLOAD_BYTES,
  previewAlt = "پیش‌نمایش تصویر",
  variant = "default",
  disabled,
  id,
  className,
  ...aria
}: ImageUploaderProps) {
  const { items, start, dismiss, isUploading } = useFileUpload({
    upload,
    accept: IMAGE_MIME_TYPES,
    maxSizeBytes,
    onUploaded: (asset) => onChange(asset.url),
  });

  const isAvatar = variant === "avatar";

  return (
    <div className={className}>
      {value && !isUploading ? (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-2 sm:flex-row sm:items-center">
          {/* User-provided URL (local path or uploaded file) — not optimisable */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
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
