"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { LeadListQuery } from "@/contracts/leads";
import { MAX_LEAD_EXPORT_ROWS } from "@/contracts/leads";
import { leadsApi } from "@/features/leads/api";
import { getApiErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  DEFAULT_LEAD_EXPORT_COLUMNS,
  LEAD_EXPORT_COLUMN_KEYS,
  LEAD_EXPORT_COLUMN_LABELS,
  loadStoredExportColumns,
  saveStoredExportColumns,
  type LeadExportColumnKey,
} from "@/lib/leads/export-columns";
import {
  downloadBase64Xlsx,
  downloadTextFile,
} from "@/lib/leads/sheet-io";

type LeadExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: LeadListQuery;
};

export function LeadExportDialog({
  open,
  onOpenChange,
  filters,
}: LeadExportDialogProps) {
  const initialColumns = useMemo(
    () => loadStoredExportColumns() ?? [...DEFAULT_LEAD_EXPORT_COLUMNS],
    [],
  );
  const [columns, setColumns] = useState<LeadExportColumnKey[]>(initialColumns);
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");
  const [exporting, setExporting] = useState(false);

  function toggleColumn(key: LeadExportColumnKey, checked: boolean) {
    setColumns((prev) => {
      if (checked) return prev.includes(key) ? prev : [...prev, key];
      return prev.filter((item) => item !== key);
    });
  }

  async function handleExport() {
    if (columns.length === 0) {
      toast.error("حداقل یک ستون را انتخاب کنید");
      return;
    }
    saveStoredExportColumns(columns);
    setExporting(true);
    try {
      const {
        page: _page,
        pageSize: _pageSize,
        ...filterOnly
      } = filters;
      void _page;
      void _pageSize;
      const result = await leadsApi.exportLeads({
        ...filterOnly,
        columns: columns.join(","),
        format,
      });
      if (result.format === "xlsx") {
        await downloadBase64Xlsx(result.filename, result.content);
      } else {
        downloadTextFile(result.filename, result.content);
      }
      toast.success(
        `خروجی آماده شد (${formatNumber(result.rowCount)} سطر)`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>خروجی لیدها</DialogTitle>
          <DialogDescription>
            فیلترهای فعلی جدول اعمال می‌شود. سقف{" "}
            {formatNumber(MAX_LEAD_EXPORT_ROWS)} سطر.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="export-format">قالب</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as "csv" | "xlsx")}
            >
              <SelectTrigger id="export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (UTF-8 با BOM)</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">ستون‌ها</legend>
            <div className="grid max-h-64 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
              {LEAD_EXPORT_COLUMN_KEYS.map((key) => {
                const id = `export-col-${key}`;
                const checked = columns.includes(key);
                return (
                  <label
                    key={key}
                    htmlFor={id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleColumn(key, value === true)
                      }
                    />
                    {LEAD_EXPORT_COLUMN_LABELS[key]}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            disabled={exporting || columns.length === 0}
            onClick={() => void handleExport()}
          >
            {exporting ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Download data-icon="inline-start" aria-hidden />
            )}
            دانلود
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
