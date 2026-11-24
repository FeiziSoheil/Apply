"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type ArrayPath,
  type Control,
  type FieldArray,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ContentEditor } from "@/components/admin/content/content-editor";
import { SectionsPreview } from "@/components/shared/richcontent/sections-preview";
import {
  SortableList,
  type SortableListItemRenderProps,
} from "@/components/admin/fields/sortable-list";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  MAX_SECTIONS,
  type RichContent,
  type SectionIcon,
} from "@/contracts/richcontent";
import {
  defaultSectionsFor,
  templateMetaFor,
  type ContentTemplateKind,
} from "@/lib/content-templates";
import { formatNumber } from "@/lib/format";
import { isRichContentEmpty } from "@/lib/richcontent";
import {
  SECTION_ICON_OPTIONS,
  SectionIconGlyph,
} from "@/lib/section-icons";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import {
  emptyCustomSection,
  uniqueSectionAnchor,
  type ContentSectionFormValues,
  type FormRichDoc,
} from "@/lib/validations/content-section";

export type SectionsEditorProps<T extends FieldValues> = {
  control: Control<T>;
  /** Field path to `ContentSectionFormValues[]` (usually `"sections"`) */
  name: ArrayPath<T>;
  kind: ContentTemplateKind;
  disabled?: boolean;
  className?: string;
  /**
   * Optional public path (e.g. `/countries/germany`).
   * Shown as a link to the published page; draft body is previewed in-sheet.
   */
  previewPath?: string;
};

type SectionRow = ContentSectionFormValues & { id: string };

function asRichContent(doc: FormRichDoc | undefined): RichContent {
  return (doc ?? { type: "doc", content: [] }) as RichContent;
}

function sectionTitleOf(
  section: ContentSectionFormValues | undefined,
  index: number,
) {
  const title = section?.title?.trim();
  return title || `بخش ${index + 1}`;
}

/** Count sections whose RichContent has no plain text. */
export function countEmptySections(
  sections: readonly ContentSectionFormValues[] | undefined,
): number {
  if (!sections?.length) return 0;
  return sections.filter((section) =>
    isRichContentEmpty(asRichContent(section.content)),
  ).length;
}

/**
 * Accordion + SortableList editor for CMS `sections[]`.
 * Wired to react-hook-form (`useFieldArray` / `Controller`) so dirty tracking
 * works with `useUnsavedChangesGuard` / `EntityFormPage`.
 */
export function SectionsEditor<T extends FieldValues>({
  control,
  name,
  kind,
  disabled = false,
  className,
  previewPath,
}: SectionsEditorProps<T>) {
  const { fields, append, remove, replace, update } = useFieldArray({
    control,
    name,
  });

  const watched = useWatch({
    control,
    name: name as Path<T>,
  }) as ContentSectionFormValues[] | undefined;

  const sections: ContentSectionFormValues[] = useMemo(() => {
    if (!watched?.length) return [];
    return watched.map((section) => ({
      title: section.title ?? "",
      anchor: section.anchor ?? "",
      icon: section.icon,
      visible: section.visible ?? true,
      content: section.content ?? { type: "doc" as const, content: [] },
    }));
  }, [watched]);

  const [openIds, setOpenIds] = useState<string[]>([]);
  const [anchorManual, setAnchorManual] = useState<Record<string, boolean>>({});
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const emptyCount = countEmptySections(sections);
  const atMax = fields.length >= MAX_SECTIONS;
  const templates = templateMetaFor(kind);
  const usedAnchors = new Set(sections.map((section) => section.anchor));

  const expandAll = useCallback(() => {
    setOpenIds(fields.map((field) => field.id));
  }, [fields]);

  const collapseAll = useCallback(() => {
    setOpenIds([]);
  }, []);

  const patchSection = useCallback(
    (index: number, patch: Partial<ContentSectionFormValues>) => {
      const current = sections[index];
      if (!current) return;
      update(index, { ...current, ...patch } as FieldArray<T, ArrayPath<T>>);
    },
    [sections, update],
  );

  const onTitleChange = useCallback(
    (index: number, fieldId: string, title: string) => {
      const manual = anchorManual[fieldId];
      if (manual) {
        patchSection(index, { title });
        return;
      }
      const anchors = sections.map((section) => section.anchor);
      const nextAnchor = uniqueSectionAnchor(slugify(title), anchors, index);
      patchSection(index, { title, anchor: nextAnchor });
    },
    [anchorManual, patchSection, sections],
  );

  const onAnchorChange = useCallback(
    (index: number, fieldId: string, anchor: string) => {
      setAnchorManual((prev) => ({ ...prev, [fieldId]: true }));
      patchSection(index, { anchor: slugify(anchor) || anchor });
    },
    [patchSection],
  );

  const anchorConflict = useCallback(
    (index: number, anchor: string) => {
      if (!anchor) return false;
      return sections.some(
        (section, i) => i !== index && section.anchor === anchor,
      );
    },
    [sections],
  );

  function addFromTemplate(anchor: string) {
    if (atMax || usedAnchors.has(anchor)) return;
    const template = defaultSectionsFor(kind).find(
      (section) => section.anchor === anchor,
    );
    if (!template) return;
    const nextAnchor = uniqueSectionAnchor(
      template.anchor,
      sections.map((section) => section.anchor),
    );
    append({
      ...template,
      anchor: nextAnchor,
    } as FieldArray<T, ArrayPath<T>>);
  }

  function addBlank() {
    if (atMax) return;
    const anchor = uniqueSectionAnchor(
      "section",
      sections.map((section) => section.anchor),
    );
    append(emptyCustomSection(anchor) as FieldArray<T, ArrayPath<T>>);
  }

  function confirmRemove() {
    if (pendingRemove === null) return;
    const field = fields[pendingRemove];
    if (field) {
      setOpenIds((prev) => prev.filter((id) => id !== field.id));
      setAnchorManual((prev) => {
        const next = { ...prev };
        delete next[field.id];
        return next;
      });
    }
    remove(pendingRemove);
    setPendingRemove(null);
  }

  function onReorder(nextRows: SectionRow[]) {
    replace(
      nextRows.map(({ title, anchor, icon, visible, content }) => ({
        title,
        anchor,
        icon,
        visible,
        content,
      })) as FieldArray<T, ArrayPath<T>>[],
    );
  }

  const sortableItems: SectionRow[] = fields.map((field, index) => ({
    id: field.id,
    title: sections[index]?.title ?? "",
    anchor: sections[index]?.anchor ?? "",
    icon: sections[index]?.icon,
    visible: sections[index]?.visible ?? true,
    content: sections[index]?.content ?? { type: "doc", content: [] },
  }));

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">بخش‌های محتوا</p>
          <p className="text-xs text-muted-foreground">
            حداکثر {formatNumber(MAX_SECTIONS)} بخش · ترتیب با کشیدن دسته
            تغییر می‌کند
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || fields.length === 0}
            onClick={expandAll}
          >
            <ChevronsUpDown data-icon="inline-start" aria-hidden />
            باز کردن همه
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || fields.length === 0}
            onClick={collapseAll}
          >
            <ChevronsDownUp data-icon="inline-start" aria-hidden />
            بستن همه
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || fields.length === 0}
            onClick={() => setPreviewOpen(true)}
          >
            <Eye data-icon="inline-start" aria-hidden />
            پیش‌نمایش
          </Button>
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" disabled={disabled || atMax}>
                <Plus data-icon="inline-start" aria-hidden />
                افزودن بخش
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-56">
              <DropdownMenuLabel>از قالب پیش‌فرض</DropdownMenuLabel>
              {templates.map((template) => {
                const already = usedAnchors.has(template.anchor);
                return (
                  <DropdownMenuItem
                    key={template.anchor}
                    disabled={already || atMax}
                    onSelect={() => addFromTemplate(template.anchor)}
                  >
                    <SectionIconGlyph
                      name={template.icon}
                      className="size-4"
                    />
                    <span className="flex-1">{template.title}</span>
                    {already ? (
                      <span className="text-xs text-muted-foreground">
                        اضافه‌شده
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={atMax} onSelect={addBlank}>
                <Plus className="size-4" aria-hidden />
                بخش خالی سفارشی
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {emptyCount > 0 ? (
        <div
          role="status"
          className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground"
        >
          {formatNumber(emptyCount)} بخش بدون محتوا دارید. قبل از انتشار، متن
          آن‌ها را کامل کنید یا بخش را مخفی/حذف کنید.
        </div>
      ) : null}

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          هنوز بخشی اضافه نشده است. از قالب پیش‌فرض یا بخش خالی شروع کنید.
        </p>
      ) : (
        <Accordion
          type="multiple"
          value={openIds}
          onValueChange={setOpenIds}
          className="gap-2"
        >
          <SortableList
            items={sortableItems}
            getId={(item) => item.id}
            label="بخش‌های محتوا"
            disabled={disabled}
            onReorder={onReorder}
            itemClassName="rounded-lg border bg-muted/20"
            renderItem={(item, props) => (
              <SectionAccordionRow
                item={item}
                index={props.index}
                dragHandle={props.dragHandle}
                disabled={disabled}
                control={control}
                name={name}
                hasAnchorConflict={anchorConflict(props.index, item.anchor)}
                onTitleChange={(title) =>
                  onTitleChange(props.index, item.id, title)
                }
                onAnchorChange={(anchor) =>
                  onAnchorChange(props.index, item.id, anchor)
                }
                onIconChange={(icon) => patchSection(props.index, { icon })}
                onVisibleChange={(visible) =>
                  patchSection(props.index, { visible })
                }
                onRequestRemove={() => setPendingRemove(props.index)}
              />
            )}
          />
        </Accordion>
      )}

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
        tone="destructive"
        title="حذف بخش"
        description={
          pendingRemove !== null
            ? `بخش «${sectionTitleOf(sections[pendingRemove], pendingRemove)}» حذف می‌شود. تا قبل از ذخیره می‌توانید انصراف دهید.`
            : undefined
        }
        confirmLabel="حذف بخش"
        onConfirm={confirmRemove}
      />

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent
          side="end"
          className="flex w-full flex-col sm:max-w-xl"
          aria-describedby={undefined}
        >
          <SheetHeader>
            <SheetTitle>پیش‌نمایش بخش‌ها</SheetTitle>
            <SheetDescription>
              رندر همان ویجت‌های سایت عمومی روی پیش‌نویس فعلی فرم (شامل بخش‌های
              مخفی). این محتوا تا انتشار در سایت عمومی دیده نمی‌شود.
              {previewPath ? (
                <>
                  {" "}
                  صفحهٔ منتشرشده:{" "}
                  <a
                    href={`${previewPath}${previewPath.includes("?") ? "&" : "?"}preview=1`}
                    className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                    dir="ltr"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {previewPath}?preview=1
                  </a>
                </>
              ) : null}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            <SectionsPreview
              sections={sections.map((section) => ({
                ...section,
                content: asRichContent(section.content),
              }))}
              includeHidden
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

type SectionAccordionRowProps<T extends FieldValues> = {
  item: SectionRow;
  index: number;
  dragHandle: SortableListItemRenderProps["dragHandle"];
  disabled: boolean;
  control: Control<T>;
  name: ArrayPath<T>;
  hasAnchorConflict: boolean;
  onTitleChange: (title: string) => void;
  onAnchorChange: (anchor: string) => void;
  onIconChange: (icon: SectionIcon | undefined) => void;
  onVisibleChange: (visible: boolean) => void;
  onRequestRemove: () => void;
};

function SectionAccordionRow<T extends FieldValues>({
  item,
  index,
  dragHandle,
  disabled,
  control,
  name,
  hasAnchorConflict,
  onTitleChange,
  onAnchorChange,
  onIconChange,
  onVisibleChange,
  onRequestRemove,
}: SectionAccordionRowProps<T>) {
  const titlePath = `${name}.${index}.title` as Path<T>;
  const anchorPath = `${name}.${index}.anchor` as Path<T>;
  const contentPath = `${name}.${index}.content` as Path<T>;
  const empty = isRichContentEmpty(asRichContent(item.content));

  return (
    <AccordionItem value={item.id} className="border-none px-1">
      <div className="flex items-center gap-1 pe-1">
        {dragHandle}
        <AccordionTrigger className="flex-1 border-none py-3 hover:no-underline">
          <span className="flex min-w-0 flex-1 items-center gap-2 text-start">
            <SectionIconGlyph
              name={item.icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="truncate text-sm font-medium">
              {sectionTitleOf(item, index)}
            </span>
            {!item.visible ? (
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
                مخفی
              </span>
            ) : null}
            {empty ? (
              <span className="shrink-0 rounded-md bg-warning/15 px-1.5 py-0.5 text-[0.65rem] text-foreground">
                خالی
              </span>
            ) : null}
          </span>
        </AccordionTrigger>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          className="text-destructive hover:text-destructive"
          aria-label={`حذف بخش ${sectionTitleOf(item, index)}`}
          onClick={onRequestRemove}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
      <AccordionContent className="px-3 pb-4">
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${item.id}-title`}>عنوان</Label>
              <Input
                id={`${item.id}-title`}
                value={item.title}
                disabled={disabled}
                onChange={(event) => onTitleChange(event.target.value)}
                aria-invalid={false}
                name={titlePath}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${item.id}-anchor`}>انکر (لنگر)</Label>
              <Input
                id={`${item.id}-anchor`}
                dir="ltr"
                value={item.anchor}
                disabled={disabled}
                onChange={(event) => onAnchorChange(event.target.value)}
                aria-invalid={hasAnchorConflict}
                aria-describedby={
                  hasAnchorConflict ? `${item.id}-anchor-error` : undefined
                }
                name={anchorPath}
                className={cn(hasAnchorConflict && "border-destructive")}
              />
              {hasAnchorConflict ? (
                <p
                  id={`${item.id}-anchor-error`}
                  className="text-xs text-destructive"
                >
                  این انکر تکراری است؛ در همین سند یکتا باشد.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  از عنوان پیشنهاد می‌شود؛ می‌توانید دستی ویرایش کنید.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-2">
              <Label>آیکن</Label>
              <IconPicker
                value={item.icon}
                disabled={disabled}
                onChange={onIconChange}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                id={`${item.id}-visible`}
                checked={item.visible}
                disabled={disabled}
                onCheckedChange={onVisibleChange}
              />
              <Label htmlFor={`${item.id}-visible`}>نمایش در سایت</Label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>محتوا</Label>
            <Controller
              control={control}
              name={contentPath}
              render={({ field }) => (
                <ContentEditor
                  value={asRichContent(field.value as FormRichDoc)}
                  onChange={(doc) => field.onChange(doc as FormRichDoc)}
                  disabled={disabled}
                  aria-label={`محتوای بخش ${sectionTitleOf(item, index)}`}
                />
              )}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function IconPicker({
  value,
  disabled,
  onChange,
}: {
  value: SectionIcon | undefined;
  disabled?: boolean;
  onChange: (icon: SectionIcon | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = SECTION_ICON_OPTIONS.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="min-w-36 justify-start gap-2"
          aria-label="انتخاب آیکن بخش"
        >
          {current ? (
            <>
              <current.Icon className="size-4" aria-hidden />
              <span className="font-mono text-xs" dir="ltr">
                {current.value}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">بدون آیکن</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            className={cn(
              "col-span-4 rounded-md px-2 py-1.5 text-start text-xs hover:bg-muted",
              !value && "bg-muted",
            )}
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
          >
            بدون آیکن
          </button>
          {SECTION_ICON_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              title={option.value}
              aria-label={option.value}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-md hover:bg-muted",
                value === option.value && "bg-muted ring-1 ring-ring",
              )}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <option.Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
