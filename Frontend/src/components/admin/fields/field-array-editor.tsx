"use client";

import {
  useState,
  type ReactNode,
} from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import {
  useFieldArray,
  type ArrayPath,
  type Control,
  type FieldArray,
  type FieldValues,
} from "react-hook-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FieldArrayEditorProps<T extends FieldValues, N extends ArrayPath<T>> = {
  control: Control<T>;
  name: N;
  label: string;
  description?: string;
  addLabel: string;
  emptyItem: FieldArray<T, N>;
  removeLabel?: (index: number) => string;
  /** Title shown in the collapsible header / drag row */
  getRowTitle?: (index: number) => string;
  /** When true, each row is an accordion panel */
  collapsible?: boolean;
  max?: number;
  className?: string;
  children: (index: number) => ReactNode;
};

type SortableRowProps = {
  id: string;
  index: number;
  title: string;
  collapsible: boolean;
  removeLabel: string;
  onRequestRemove: () => void;
  children: ReactNode;
};

function SortableRow({
  id,
  index,
  title,
  collapsible,
  removeLabel,
  onRequestRemove,
  children,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <button
      type="button"
      className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
      aria-label={`جابه‌جایی ردیف ${index + 1}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );

  const removeButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onRequestRemove}
      aria-label={removeLabel}
      className="text-destructive hover:text-destructive"
    >
      <Trash2 aria-hidden />
    </Button>
  );

  if (collapsible) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(isDragging && "z-10 opacity-80 shadow-md")}
      >
        <AccordionItem
          value={id}
          className="rounded-lg border bg-muted/20 px-1"
        >
          <div className="flex items-center gap-1 pe-1">
            {dragHandle}
            <AccordionTrigger className="flex-1 border-none py-3 hover:no-underline">
              <span className="truncate text-start text-sm font-medium">
                {title}
              </span>
            </AccordionTrigger>
            {removeButton}
          </div>
          <AccordionContent className="px-3 pb-3">
            <div className="grid gap-3 sm:grid-cols-2">{children}</div>
          </AccordionContent>
        </AccordionItem>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 rounded-lg border bg-muted/20 p-3",
        isDragging && "z-10 opacity-80 shadow-md",
      )}
    >
      {dragHandle}
      <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">{children}</div>
      {removeButton}
    </div>
  );
}

/**
 * Reusable list field editor (`useFieldArray`) with drag-and-drop reorder,
 * delete confirmation, and optional collapsible rows. Use for string lists
 * (one input per row) or object lists (FAQ, cost rows, steps, deadlines).
 */
export function FieldArrayEditor<T extends FieldValues, N extends ArrayPath<T>>({
  control,
  name,
  label,
  description,
  addLabel,
  emptyItem,
  removeLabel = (index) => `حذف مورد ${index + 1}`,
  getRowTitle = (index) => `مورد ${index + 1}`,
  collapsible = false,
  max,
  className,
  children,
}: FieldArrayEditorProps<T, N>) {
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const [openIds, setOpenIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    move(oldIndex, newIndex);
  }

  function confirmRemove() {
    if (pendingRemove === null) return;
    remove(pendingRemove);
    setPendingRemove(null);
  }

  const ids = fields.map((field) => field.id);
  const atMax = max !== undefined && fields.length >= max;

  const list = (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col gap-2">
        {fields.map((field, index) => (
          <SortableRow
            key={field.id}
            id={field.id}
            index={index}
            title={getRowTitle(index)}
            collapsible={collapsible}
            removeLabel={removeLabel(index)}
            onRequestRemove={() => setPendingRemove(index)}
          >
            {children(index)}
          </SortableRow>
        ))}
      </div>
    </SortableContext>
  );

  return (
    <fieldset className={cn("flex flex-col gap-3", className)}>
      <legend className="text-sm font-medium">{label}</legend>
      {description ? (
        <p className="text-[0.8rem] text-muted-foreground">{description}</p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        {collapsible ? (
          <Accordion
            type="multiple"
            value={openIds}
            onValueChange={setOpenIds}
            className="gap-2"
          >
            {list}
          </Accordion>
        ) : (
          list
        )}
      </DndContext>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">هنوز موردی اضافه نشده است.</p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={atMax}
        onClick={() => {
          append(emptyItem);
        }}
      >
        <Plus data-icon="inline-start" aria-hidden />
        {addLabel}
      </Button>

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
        tone="destructive"
        title="حذف مورد"
        description={
          pendingRemove !== null
            ? `«${getRowTitle(pendingRemove)}» حذف می‌شود. این کار از روی فرم قابل بازگشت نیست مگر قبل از ذخیره انصراف دهید.`
            : undefined
        }
        confirmLabel="حذف"
        onConfirm={confirmRemove}
      />
    </fieldset>
  );
}
