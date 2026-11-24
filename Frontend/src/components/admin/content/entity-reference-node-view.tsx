"use client";

import { useMemo, useState } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Link2, Search, Trash2 } from "lucide-react";
import {
  ENTITY_REFERENCE_TYPES,
  type EntityReferenceType,
} from "@/contracts/richcontent";
import {
  blogPostsApi,
  countriesApi,
  programsApi,
  servicesApi,
  universitiesApi,
} from "@/features/content/api";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ENTITY_REF_PLACEHOLDER_ID } from "./extensions/entity-reference";

const TYPE_LABELS: Record<EntityReferenceType, string> = {
  country: "کشور",
  university: "دانشگاه",
  program: "رشته",
  service: "خدمت",
  "blog-post": "مقاله بلاگ",
};

type SearchHit = {
  id: string;
  label: string;
  subtitle?: string;
};

async function searchEntities(
  entityType: EntityReferenceType,
  q: string,
  signal: AbortSignal,
): Promise<SearchHit[]> {
  const filters = { q: q || undefined, page: 1, pageSize: 8 };
  switch (entityType) {
    case "country": {
      const page = await countriesApi.list(filters, { signal });
      return page.items.map((item) => ({
        id: item.id,
        label: item.nameFa,
        subtitle: item.nameEn,
      }));
    }
    case "university": {
      const page = await universitiesApi.list(filters, { signal });
      return page.items.map((item) => ({
        id: item.id,
        label: item.nameFa,
        subtitle: item.nameEn,
      }));
    }
    case "program": {
      const page = await programsApi.list(filters, { signal });
      return page.items.map((item) => ({
        id: item.id,
        label: item.nameFa,
        subtitle: item.degreeLevel,
      }));
    }
    case "service": {
      const page = await servicesApi.list(filters, { signal });
      return page.items.map((item) => ({
        id: item.id,
        label: item.title,
      }));
    }
    case "blog-post": {
      const page = await blogPostsApi.list(filters, { signal });
      return page.items.map((item) => ({
        id: item.id,
        label: item.title,
        subtitle: item.category,
      }));
    }
    default:
      return [];
  }
}

async function fetchEntityPreview(
  entityType: EntityReferenceType,
  entityId: string,
  signal: AbortSignal,
): Promise<SearchHit | null> {
  if (!entityId || entityId === ENTITY_REF_PLACEHOLDER_ID) return null;
  try {
    switch (entityType) {
      case "country": {
        const item = await countriesApi.get(entityId, { signal });
        return { id: item.id, label: item.nameFa, subtitle: item.nameEn };
      }
      case "university": {
        const item = await universitiesApi.get(entityId, { signal });
        return { id: item.id, label: item.nameFa, subtitle: item.nameEn };
      }
      case "program": {
        const item = await programsApi.get(entityId, { signal });
        return { id: item.id, label: item.nameFa, subtitle: item.degreeLevel };
      }
      case "service": {
        const item = await servicesApi.get(entityId, { signal });
        return { id: item.id, label: item.title };
      }
      case "blog-post": {
        const item = await blogPostsApi.get(entityId, { signal });
        return {
          id: item.id,
          label: item.title,
          subtitle: item.category,
        };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function EntityReferenceNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const entityType = (node.attrs.entityType as EntityReferenceType) ?? "country";
  const entityId =
    typeof node.attrs.entityId === "string"
      ? node.attrs.entityId
      : ENTITY_REF_PLACEHOLDER_ID;

  const [pickerOpen, setPickerOpen] = useState(
    entityId === ENTITY_REF_PLACEHOLDER_ID,
  );
  const [query, setQuery] = useState("");
  const [optimisticPreview, setOptimisticPreview] = useState<SearchHit | null>(
    null,
  );

  const isPlaceholder = entityId === ENTITY_REF_PLACEHOLDER_ID;

  const previewQuery = useQuery({
    queryKey: ["content-editor", "entity-ref-preview", entityType, entityId],
    queryFn: ({ signal }) => fetchEntityPreview(entityType, entityId, signal),
    enabled: !isPlaceholder,
    staleTime: 30_000,
  });

  const searchQuery = useQuery({
    queryKey: [
      "content-editor",
      "entity-ref-search",
      entityType,
      query.trim(),
    ],
    queryFn: ({ signal }) =>
      searchEntities(entityType, query.trim(), signal),
    enabled: pickerOpen,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const preview = optimisticPreview?.id === entityId
    ? optimisticPreview
    : (previewQuery.data ?? null);
  const missing =
    !isPlaceholder &&
    !previewQuery.isLoading &&
    !previewQuery.isFetching &&
    preview == null;
  const loadingPreview =
    !isPlaceholder && (previewQuery.isLoading || previewQuery.isFetching);
  const hits = searchQuery.data ?? [];
  const searching = searchQuery.isFetching;

  const statusText = useMemo(() => {
    if (isPlaceholder) return "موجودیتی انتخاب نشده";
    if (loadingPreview) return "در حال بارگذاری…";
    if (missing) return "موجودیت پیدا نشد";
    return preview?.label ?? "—";
  }, [isPlaceholder, loadingPreview, missing, preview?.label]);

  return (
    <NodeViewWrapper
      className={cn(
        "my-4 rounded-lg border border-border bg-muted/20 p-3",
        selected && "ring-2 ring-ring",
        missing && "border-warning",
      )}
      data-drag-handle
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Link2 aria-hidden className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              ارجاع به {TYPE_LABELS[entityType]}
            </p>
            {missing ? (
              <span
                className="inline-flex items-center gap-1 text-xs text-warning-foreground"
                role="status"
              >
                <AlertTriangle aria-hidden className="size-3.5" />
                موجودیت پیدا نشد
              </span>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ms-auto"
              onClick={deleteNode}
              aria-label="حذف ارجاع موجودیت"
            >
              <Trash2 data-icon="inline-start" aria-hidden />
              حذف
            </Button>
          </div>
          <p className="text-sm text-foreground">{statusText}</p>
          {preview?.subtitle ? (
            <p className="text-xs text-muted-foreground">{preview.subtitle}</p>
          ) : null}
          <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">
            {entityId}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex flex-col gap-1">
              <Label className="sr-only" htmlFor="entity-ref-type">
                نوع موجودیت
              </Label>
              <Select
                value={entityType}
                onValueChange={(value) => {
                  if (
                    (ENTITY_REFERENCE_TYPES as readonly string[]).includes(value)
                  ) {
                    setOptimisticPreview(null);
                    updateAttributes({
                      entityType: value as EntityReferenceType,
                      entityId: ENTITY_REF_PLACEHOLDER_ID,
                    });
                    setPickerOpen(true);
                  }
                }}
              >
                <SelectTrigger
                  id="entity-ref-type"
                  size="sm"
                  className="w-40"
                  aria-label="نوع موجودیت"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_REFERENCE_TYPES.map((key) => (
                    <SelectItem key={key} value={key}>
                      {TYPE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPickerOpen(true)}
            >
              <Search data-icon="inline-start" aria-hidden />
              جستجو و انتخاب
            </Button>
          </div>
          {missing ? (
            <p className="mt-2 text-xs text-muted-foreground">
              ذخیره مجاز است؛ در سایت ممکن است کارت خالی یا هشدار نمایش داده شود.
            </p>
          ) : null}
        </div>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="p-0 sm:max-w-lg">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>
              انتخاب {TYPE_LABELS[entityType]}
            </DialogTitle>
          </DialogHeader>
          <Command shouldFilter={false} className="border-0 shadow-none">
            <CommandInput
              placeholder={`جستجو در ${TYPE_LABELS[entityType]}…`}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                {searching ? "در حال جستجو…" : "موردی یافت نشد"}
              </CommandEmpty>
              <CommandGroup>
                {hits.map((hit) => (
                  <CommandItem
                    key={hit.id}
                    value={hit.id}
                    onSelect={() => {
                      updateAttributes({
                        entityType,
                        entityId: hit.id,
                      });
                      setOptimisticPreview(hit);
                      setPickerOpen(false);
                    }}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{hit.label}</span>
                      {hit.subtitle ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {hit.subtitle}
                        </span>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
}
