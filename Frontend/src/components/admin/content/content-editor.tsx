"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import DragHandle from "@tiptap/extension-drag-handle-react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import { GripVertical } from "lucide-react";
import type { ZodError } from "zod";
import type { FileAsset } from "@/contracts/common";
import type { RichContent } from "@/contracts/richcontent";
import {
  emptyDoc,
  richContentToPlainText,
  sanitizeRichContent,
  validateRichContent,
} from "@/lib/richcontent";
import { getApiErrorMessage } from "@/lib/api";
import { uploadFileWithProgress } from "@/lib/api/upload";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  IMAGE_MIME_TYPES,
  validateFile,
  DEFAULT_MAX_UPLOAD_BYTES,
} from "@/components/admin/upload/use-file-upload";
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
import { richContentToTiptap } from "./convert/rich-to-tiptap";
import { tiptapToRichContent } from "./convert/tiptap-to-rich";
import { createContentEditorExtensions } from "./extensions";
import { ContentToolbar } from "./menus/content-toolbar";
import { EditorBubbleMenu } from "./menus/editor-bubble-menu";
import { isAllowedEditorHref } from "./extensions/link";

export type ContentEditorProps = {
  value?: RichContent;
  onChange?: (doc: RichContent) => void;
  /** Called when sanitize+validate fails (Persian messages). */
  onValidationError?: (messages: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  /**
   * Resolve preview URL for an uploaded fileId.
   * Defaults to looking up assets uploaded in this editor session.
   */
  resolveFileUrl?: (fileId: string) => string | undefined;
};

function zodMessages(error: ZodError): string[] {
  const msgs = error.issues.map((issue) => issue.message);
  return msgs.length ? [...new Set(msgs)] : ["محتوا معتبر نیست"];
}

function countWords(doc: RichContent): number {
  const text = richContentToPlainText(doc);
  return text.split(/\s+/).filter(Boolean).length;
}

function findImagesMissingAlt(editor: Editor): number {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "image") {
      const alt = typeof node.attrs.alt === "string" ? node.attrs.alt.trim() : "";
      if (!alt) count += 1;
    }
  });
  return count;
}

function emitDoc(
  editor: Editor,
  onChange: ((doc: RichContent) => void) | undefined,
  onValidationError: ((messages: string[]) => void) | undefined,
  setLocalError: (messages: string[] | null) => void,
  setMissingAlt: (n: number) => void,
) {
  const missing = findImagesMissingAlt(editor);
  setMissingAlt(missing);

  const raw = tiptapToRichContent(editor.getJSON());
  const sanitized = sanitizeRichContent(raw);
  const validated = validateRichContent(sanitized);

  if (!validated.ok) {
    const messages = zodMessages(validated.error);
    setLocalError(messages);
    onValidationError?.(messages);
    return;
  }

  setLocalError(null);
  onChange?.(validated.data);
}

export function ContentEditor({
  value,
  onChange,
  onValidationError,
  placeholder = "متن را بنویسید یا / را بزنید…",
  disabled = false,
  className,
  "aria-label": ariaLabel = "ویرایشگر محتوا",
  id: idProp,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  resolveFileUrl: resolveFileUrlProp,
}: ContentEditorProps) {
  const autoId = useId();
  const editorId = idProp ?? autoId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileMap, setFileMap] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState<string[] | null>(null);
  const [missingAlt, setMissingAlt] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [altDialogOpen, setAltDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const [captionDraft, setCaptionDraft] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const linkInputId = useId();
  const altInputId = useId();
  const captionInputId = useId();
  const onChangeRef = useRef(onChange);
  const onValidationErrorRef = useRef(onValidationError);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onValidationErrorRef.current = onValidationError;
  }, [onValidationError]);

  const resolveFileUrl = useCallback(
    (fileId: string) => resolveFileUrlProp?.(fileId) ?? fileMap[fileId],
    [fileMap, resolveFileUrlProp],
  );

  const initialContent = useMemo(
    () => richContentToTiptap(value ?? emptyDoc(), resolveFileUrl),
    // Only seed once — external value sync handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const extensions = useMemo(
    () => createContentEditorExtensions({ placeholder }),
    [placeholder],
  );

  const handleImageFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    const file = list[0];
    if (!file) return;
    const invalid = validateFile(file, IMAGE_MIME_TYPES, DEFAULT_MAX_UPLOAD_BYTES);
    if (invalid) {
      setUploadError(invalid);
      return;
    }
    setPendingFile(file);
    setAltDraft(file.name.replace(/\.[^.]+$/, "").slice(0, 300));
    setCaptionDraft("");
    setAltDialogOpen(true);
  }, []);

  const imageMimeSet = useMemo(() => new Set<string>(IMAGE_MIME_TYPES), []);

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id: editorId,
        dir: "rtl",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": ariaLabel,
        ...(ariaInvalid ? { "aria-invalid": "true" } : {}),
        ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
        class: "rich-content-editor",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.files;
        if (items && items.length > 0) {
          const images = Array.from(items).filter((f) => imageMimeSet.has(f.type));
          if (images.length) {
            event.preventDefault();
            handleImageFiles(images);
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          const images = Array.from(files).filter((f) => imageMimeSet.has(f.type));
          if (images.length) {
            event.preventDefault();
            handleImageFiles(images);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: instance }) => {
      emitDoc(
        instance,
        onChangeRef.current,
        onValidationErrorRef.current,
        setLocalError,
        setMissingAlt,
      );
    },
  });

  const insertUploadedImage = useCallback(
    async (file: File, alt: string, caption?: string) => {
      if (!editor) return;
      setUploading(true);
      setUploadError(null);
      try {
        const asset: FileAsset = await uploadFileWithProgress(file);
        setFileMap((prev) => ({ ...prev, [asset.id]: asset.url }));
        editor
          .chain()
          .focus()
          .setFileImage({
            fileId: asset.id,
            src: asset.url,
            alt,
            caption: caption || null,
          })
          .run();
      } catch (error) {
        setUploadError(getApiErrorMessage(error));
      } finally {
        setUploading(false);
      }
    },
    [editor],
  );

  // Sync external value (form reset / load).
  // Defer setContent: TipTap's ReactRenderer uses flushSync, which React forbids
  // inside lifecycle methods (especially with multiple editors mounting in accordion).
  useEffect(() => {
    if (!editor || !value) return;
    const next = richContentToTiptap(value, resolveFileUrl);
    const current = tiptapToRichContent(editor.getJSON());
    if (JSON.stringify(current) === JSON.stringify(sanitizeRichContent(value))) {
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || editor.isDestroyed) return;
      editor.commands.setContent(next, { emitUpdate: false });
    });
    return () => {
      cancelled = true;
    };
  }, [editor, value, resolveFileUrl]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  // Slash-command image request
  useEffect(() => {
    function onRequest(event: Event) {
      const detail = (event as CustomEvent<{ editorId?: string }>).detail;
      if (detail?.editorId && detail.editorId !== editorId) return;
      fileInputRef.current?.click();
    }
    window.addEventListener("content-editor:request-image", onRequest);
    return () =>
      window.removeEventListener("content-editor:request-image", onRequest);
  }, [editorId]);

  const wordCount = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return 0;
      return countWords(tiptapToRichContent(ctx.editor.getJSON()));
    },
  });

  function openLinkFromBubble() {
    if (!editor) return;
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkError(null);
    setLinkOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    const href = linkUrl.trim();
    if (!href) {
      setLinkError("آدرس پیوند الزامی است");
      return;
    }
    if (!isAllowedEditorHref(href)) {
      setLinkError("فقط http، https، mailto یا tel مجاز است");
      return;
    }
    const external = href.startsWith("http://") || href.startsWith("https://");
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href,
        target: external ? "_blank" : undefined,
        rel: external ? "noopener noreferrer" : undefined,
      })
      .run();
    setLinkOpen(false);
  }

  async function confirmImageMeta() {
    if (!pendingFile) return;
    const alt = altDraft.trim();
    if (!alt) return;
    setAltDialogOpen(false);
    await insertUploadedImage(pendingFile, alt, captionDraft.trim() || undefined);
    setPendingFile(null);
  }

  return (
    <div
      data-slot="content-editor"
      className={cn(
        "relative min-h-64 overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        (ariaInvalid || localError) && "border-destructive ring-3 ring-destructive/20",
        disabled && "opacity-50",
        className,
      )}
    >
      {editor ? (
        <>
          <ContentToolbar
            editor={editor}
            disabled={disabled || uploading}
            onRequestImage={() => fileInputRef.current?.click()}
          />
          <EditorBubbleMenu editor={editor} onLink={openLinkFromBubble} />
          <DragHandle editor={editor} className="content-editor-drag-handle">
            <button
              type="button"
              className="flex size-6 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
              aria-label="جابه‌جایی بلوک"
              tabIndex={-1}
            >
              <GripVertical className="size-4" aria-hidden />
            </button>
          </DragHandle>
        </>
      ) : null}

      <div className="min-h-48">
        <EditorContent editor={editor} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
        <span aria-live="polite">
          {formatNumber(wordCount ?? 0)} واژه
          {uploading ? " · در حال آپلود تصویر…" : null}
        </span>
        {missingAlt > 0 ? (
          <span className="text-warning-foreground" role="status">
            {formatNumber(missingAlt)} تصویر بدون متن جایگزین
          </span>
        ) : null}
      </div>

      {localError?.length ? (
        <div className="border-t border-destructive/30 bg-destructive/5 px-3 py-2" role="alert">
          <p className="text-sm font-medium text-destructive">خطای اعتبارسنجی محتوا</p>
          <ul className="mt-1 list-disc ps-5 text-xs text-destructive">
            {localError.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {uploadError ? (
        <p className="border-t border-destructive/30 px-3 py-2 text-xs text-destructive" role="alert">
          {uploadError}
        </p>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_MIME_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          if (e.target.files?.length) handleImageFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <Dialog open={altDialogOpen} onOpenChange={setAltDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>متن جایگزین تصویر</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={altInputId}>متن جایگزین (الزامی)</Label>
              <Input
                id={altInputId}
                value={altDraft}
                onChange={(e) => setAltDraft(e.target.value)}
                aria-required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={captionInputId}>توضیح (اختیاری)</Label>
              <Input
                id={captionInputId}
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAltDialogOpen(false);
                setPendingFile(null);
              }}
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={() => void confirmImageMeta()}
              disabled={!altDraft.trim() || uploading}
            >
              آپلود و درج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>پیوند</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={linkInputId}>نشانی</Label>
            <Input
              id={linkInputId}
              dir="ltr"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="text-start"
            />
            {linkError ? (
              <p className="text-xs text-destructive" role="alert">
                {linkError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLinkOpen(false)}>
              انصراف
            </Button>
            <Button type="button" onClick={applyLink}>
              اعمال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
