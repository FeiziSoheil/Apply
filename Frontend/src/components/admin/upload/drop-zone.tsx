"use client";

import { useRef, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type DropZoneProps = {
  accept: readonly string[];
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  /** Main line, e.g. «تصویر را اینجا رها کنید یا کلیک کنید» */
  title: string;
  /** Hint line: allowed types and size */
  hint?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

/**
 * Drag-and-drop target backed by a real `<input type="file">`, so keyboard and
 * screen-reader users get the native file picker (focus ring on the zone).
 */
export function DropZone({
  accept,
  multiple = false,
  disabled,
  onFiles,
  title,
  hint,
  id,
  className,
  ...aria
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    onFiles(multiple ? files : files.slice(0, 1));
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  }

  return (
    <label
      data-slot="drop-zone"
      data-dragging={dragging || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-4 py-6 text-center transition-colors hover:bg-muted/60 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 has-[input[aria-invalid=true]]:border-destructive data-[dragging]:border-primary data-[dragging]:bg-primary/5",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <UploadCloud className="size-8 text-muted-foreground" aria-hidden />
      <span className="text-sm font-medium">{title}</span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="sr-only"
        accept={accept.join(",")}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = ""; // allow picking the same file again
        }}
        {...aria}
      />
    </label>
  );
}
