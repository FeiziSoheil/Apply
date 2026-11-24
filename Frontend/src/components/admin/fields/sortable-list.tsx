"use client";

import { type CSSProperties, type ReactNode } from "react";
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
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortableListDragHandleProps = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  setActivatorNodeRef: ReturnType<typeof useSortable>["setActivatorNodeRef"];
};

export type SortableListItemRenderProps = {
  index: number;
  isDragging: boolean;
  dragHandleProps: SortableListDragHandleProps;
  /** Default grip button — use when you don't need a custom handle */
  dragHandle: ReactNode;
};

type SortableListProps<T> = {
  items: readonly T[];
  getId: (item: T) => string;
  onReorder: (next: T[]) => void;
  renderItem: (item: T, props: SortableListItemRenderProps) => ReactNode;
  /** Accessible name of the list */
  label?: string;
  disabled?: boolean;
  className?: string;
  /** Class for each sortable row wrapper */
  itemClassName?: string | ((item: T, index: number) => string);
};

type SortableItemShellProps = {
  id: string;
  index: number;
  disabled?: boolean;
  className?: string;
  children: (props: SortableListItemRenderProps) => ReactNode;
};

function DefaultDragHandle({
  index,
  attributes,
  listeners,
  setActivatorNodeRef,
}: {
  index: number;
} & SortableListDragHandleProps) {
  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing disabled:pointer-events-none disabled:opacity-50"
      aria-label={`جابه‌جایی مورد ${index + 1}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
}

function SortableItemShell({
  id,
  index,
  disabled,
  className,
  children,
}: SortableItemShellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandleProps: SortableListDragHandleProps = {
    attributes,
    listeners,
    setActivatorNodeRef,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "list-none",
        isDragging && "z-10 opacity-80 shadow-md",
        className,
      )}
    >
      {children({
        index,
        isDragging,
        dragHandleProps,
        dragHandle: (
          <DefaultDragHandle index={index} {...dragHandleProps} />
        ),
      })}
    </li>
  );
}

/**
 * Generic sortable list powered by `@dnd-kit` (pointer + keyboard).
 * Use for admin reorder UIs (services, FAQ, consultants, content sections)
 * that are not bound to `useFieldArray` — for form arrays prefer
 * {@link FieldArrayEditor}.
 */
export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  label,
  disabled = false,
  className,
  itemClassName,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = items.map(getId);

  function onDragEnd(event: DragEndEvent) {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove([...items], oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={ids}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <ul
          aria-label={label}
          className={cn("flex flex-col gap-2", className)}
        >
          {items.map((item, index) => {
            const id = getId(item);
            const rowClass =
              typeof itemClassName === "function"
                ? itemClassName(item, index)
                : itemClassName;
            return (
              <SortableItemShell
                key={id}
                id={id}
                index={index}
                disabled={disabled}
                className={rowClass}
              >
                {(props) => renderItem(item, props)}
              </SortableItemShell>
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
