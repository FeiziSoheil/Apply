"use client";

import { AlertCircle, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/format";
import { formatFileSize, type UploadItem } from "./use-file-upload";

type UploadProgressRowProps = {
  item: UploadItem;
  onDismiss: (id: string) => void;
};

/** One in-flight (or failed) upload: name, progress bar, cancel / dismiss */
export function UploadProgressRow({ item, onDismiss }: UploadProgressRowProps) {
  const failed = item.status === "error";
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-2">
      {item.previewUrl ? (
        // Object URL of the file being uploaded — next/image cannot optimise it
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.previewUrl} alt="" className="size-10 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {failed ? <AlertCircle aria-hidden /> : <FileText aria-hidden />}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium" dir="auto">
          {item.file.name}
        </p>
        {failed ? (
          <p role="alert" className="text-xs text-destructive">
            {item.error}
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <Progress
              value={item.progress}
              aria-label={`پیشرفت آپلود ${item.file.name}`}
              className="h-1.5 flex-1"
            />
            <span className="w-10 text-end text-xs tabular-nums text-muted-foreground">
              {formatNumber(item.progress)}٪
            </span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onDismiss(item.id)}
        aria-label={failed ? "حذف از فهرست" : "لغو آپلود"}
      >
        <X aria-hidden />
      </Button>
    </li>
  );
}
