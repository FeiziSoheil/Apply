"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { RowData, Table } from "@tanstack/react-table";
import { FilterX, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { DataTableViewOptions } from "./data-table-view-options";
import type { TableController } from "./use-table-url-state";

const SEARCH_DEBOUNCE_MS = 400;

type SearchInputProps = {
  value: string;
  onSearch: (value: string) => void;
  placeholder: string;
};

/** Search box: instant typing, URL/API update after a short pause */
export function SearchInput({ value, onSearch, placeholder }: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);

  // The URL changed from elsewhere (clear filters, back button): follow it
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onSearch(draft), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, value, onSearch]);

  return (
    <InputGroup className="w-full sm:max-w-xs">
      <InputGroupAddon>
        <Search aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={100}
      />
      {draft ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="پاک کردن جستجو"
            onClick={() => {
              setDraft("");
              onSearch("");
            }}
          >
            <X aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

type DataTableToolbarProps<TData extends RowData> = {
  table: Table<TData>;
  controller: Pick<
    TableController,
    "params" | "setSearch" | "hasActiveFilters" | "clearFilters"
  >;
  searchPlaceholder: string;
  /** Filter controls (`SelectFilter`, `MultiSelectFilter`, `DateRangeFilter`) */
  filters?: ReactNode;
  /** A background refetch is running (previous data stays visible) */
  isFetching: boolean;
};

/** Search + filters + "clear" + column visibility, above the table */
export function DataTableToolbar<TData extends RowData>({
  table,
  controller,
  searchPlaceholder,
  filters,
  isFetching,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <SearchInput
          value={controller.params.q}
          onSearch={controller.setSearch}
          placeholder={searchPlaceholder}
        />
        {filters}
        {controller.hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={controller.clearFilters}
          >
            <FilterX data-icon="inline-start" aria-hidden />
            حذف فیلترها
          </Button>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-2">
        {isFetching ? (
          <Spinner
            aria-label="در حال به‌روزرسانی"
            className="text-muted-foreground"
          />
        ) : null}
        <div className="hidden md:block">
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </div>
  );
}
