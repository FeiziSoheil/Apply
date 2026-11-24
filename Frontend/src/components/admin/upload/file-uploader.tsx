"use client";

import { ExternalLink, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileAsset } from "@/contracts/common";
import { DropZone } from "./drop-zone";
import { UploadProgressRow } from "./upload-progress-row";
import {
  DEFAULT_MAX_UPLOAD_BYTES,
  DOCUMENT_MIME_TYPES,
  formatFileSize,
  useFileUpload,
  type UploadFn,
} from "./use-file-upload";

type FileUploaderProps = {
  value: readonly FileAsset[];
  onChange: (files: FileAsset[]) => void;
  /** Allowed MIME types (default: images + PDF, like `POST /files`) */
  accept?: readonly string[];
  /** Maximum number of files (default: unlimited) */
  maxFiles?: number;
  maxSizeBytes?: number;
  upload?: UploadFn;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

/**
 * Multi-file field with drag & drop, one progress bar per file and a list of
 * the stored files (`FileAsset`: id, url, name, size …).
 */
export function FileUploader({
  value,
  onChange,
  accept = DOCUMENT_MIME_TYPES,
  maxFiles,
  maxSizeBytes = DEFAULT_MAX_UPLOAD_BYTES,
  upload,
  disabled,
  id,
  className,
  ...aria
}: FileUploaderProps) {
  const { items, start, dismiss, isUploading } = useFileUpload({
    upload,
    accept,
    maxSizeBytes,
    onUploaded: (asset) => onChange([...value, asset]),
  });
  const full = maxFiles !== undefined && value.length + items.length >= maxFiles;

  return (
    <div className={className}>
      <DropZone
        id={id}
        multiple
        accept={accept}
        disabled={disabled || full}
        onFiles={(files) =>
          start(maxFiles === undefined ? files : files.slice(0, maxFiles - value.length - items.length))
        }
        title="فایل‌ها را اینجا رها کنید یا برای انتخاب کلیک کنید"
        hint={`حداکثر ${formatFileSize(maxSizeBytes)} برای هر فایل`}
        {...aria}
      />

      {items.length > 0 || value.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-2" aria-live="polite" aria-busy={isUploading}>
          {value.map((file) => (
            <li key={file.id} className="flex items-center gap-3 rounded-lg border bg-card p-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileText aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  dir="auto"
                  className="inline-flex items-center gap-1 truncate text-sm font-medium hover:underline"
                >
                  <span className="truncate">{file.name}</span>
                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                </a>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                onClick={() => onChange(value.filter((item) => item.id !== file.id))}
                aria-label={`حذف ${file.name}`}
              >
                <X aria-hidden />
              </Button>
            </li>
          ))}
          {items.map((item) => (
            <UploadProgressRow key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
