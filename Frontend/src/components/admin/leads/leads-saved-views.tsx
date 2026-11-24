"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Can } from "@/components/rbac/can";
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
import { Switch } from "@/components/ui/switch";
import type { SavedView } from "@/contracts/crm";
import {
  useCreateSavedView,
  useDeleteSavedView,
  useUpdateSavedView,
} from "@/features/crm/mutations";
import { useSavedViews } from "@/features/crm/queries";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SYSTEM_LEAD_VIEWS, type LeadFilters } from "./leads-table-params";

type LeadsSavedViewsProps = {
  currentUserId: string;
  activeViewId: string | null;
  filters: LeadFilters;
  sort: string | null;
  order?: string;
  onApplySystem: (id: string) => void;
  onApplySaved: (view: SavedView) => void;
  onClearView: () => void;
};

export function LeadsSavedViews({
  currentUserId,
  activeViewId,
  filters,
  sort,
  onApplySystem,
  onApplySaved,
  onClearView,
}: LeadsSavedViewsProps) {
  const viewsQuery = useSavedViews({
    page: 1,
    pageSize: 50,
    resource: "leads",
    order: "desc",
    sort: "createdAt",
  });
  const createView = useCreateSavedView();
  const updateView = useUpdateSavedView();
  const deleteView = useDeleteSavedView();

  const userViews = useMemo(
    () => viewsQuery.data?.items ?? [],
    [viewsQuery.data?.items],
  );

  const [saveOpen, setSaveOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [shared, setShared] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SavedView | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="tablist"
        aria-label="نماهای ذخیره‌شده"
      >
        {SYSTEM_LEAD_VIEWS.map((view) => {
          const active =
            activeViewId === view.id ||
            (view.id === "all" && !activeViewId);
          return (
            <Button
              key={view.id}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              role="tab"
              aria-selected={active}
              onClick={() => {
                if (view.id === "all") onClearView();
                else onApplySystem(view.id);
              }}
            >
              {view.title}
            </Button>
          );
        })}
        {userViews.map((view) => {
          const active = activeViewId === view.id;
          return (
            <div key={view.id} className="flex items-center gap-0.5">
              <Button
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                role="tab"
                aria-selected={active}
                onClick={() => onApplySaved(view)}
              >
                {view.title}
                {view.shared ? (
                  <span className="ms-1 text-[0.65rem] opacity-70">اشتراکی</span>
                ) : null}
              </Button>
              {view.ownerId === currentUserId ? (
                <>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="size-7"
                    aria-label={`تغییر نام ${view.title}`}
                    onClick={() => {
                      setRenameTarget(view);
                      setRenameTitle(view.title);
                    }}
                  >
                    <Pencil aria-hidden className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="size-7 text-destructive"
                    aria-label={`حذف ${view.title}`}
                    onClick={() => {
                      deleteView.mutate(view.id, {
                        onSuccess: () => {
                          toast.success("نما حذف شد");
                          if (activeViewId === view.id) onClearView();
                        },
                        onError: (error) =>
                          toast.error(getApiErrorMessage(error)),
                      });
                    }}
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                  </Button>
                </>
              ) : null}
            </div>
          );
        })}
        <Can permission="lead:read">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setTitle("");
              setShared(false);
              setSaveOpen(true);
            }}
          >
            <BookmarkPlus data-icon="inline-start" aria-hidden />
            ذخیره نما
          </Button>
        </Can>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ذخیره نمای فعلی</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="view-title">عنوان</Label>
              <Input
                id="view-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
              />
            </div>
            <Can permission="crm-settings:manage">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={shared} onCheckedChange={setShared} />
                نمای اشتراکی
              </label>
            </Can>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={!title.trim() || createView.isPending}
              onClick={() => {
                createView.mutate(
                  {
                    resource: "leads",
                    title: title.trim(),
                    filters: {
                      stageIds: filters.stageIds,
                      source: filters.source,
                      assignedTo: filters.assignedTo,
                      unassigned: filters.unassigned,
                      country: filters.country,
                      tagId: filters.tagId,
                      priority: filters.priority,
                      utmCampaign: filters.utmCampaign,
                      createdFrom: filters.createdFrom,
                      createdTo: filters.createdTo,
                      inactiveDays: filters.inactiveDays,
                      overdueFollowUp: filters.overdueFollowUp,
                    },
                    sort: sort ?? "createdAt",
                    shared,
                  },
                  {
                    onSuccess: (view) => {
                      toast.success("نما ذخیره شد");
                      setSaveOpen(false);
                      onApplySaved(view);
                    },
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  },
                );
              }}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر نام نما</DialogTitle>
          </DialogHeader>
          <Input
            value={renameTitle}
            onChange={(event) => setRenameTitle(event.target.value)}
            maxLength={80}
            aria-label="عنوان جدید"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
              انصراف
            </Button>
            <Button
              type="button"
              disabled={!renameTitle.trim() || updateView.isPending}
              className={cn(!renameTitle.trim() && "opacity-50")}
              onClick={() => {
                if (!renameTarget) return;
                updateView.mutate(
                  {
                    id: renameTarget.id,
                    body: { title: renameTitle.trim() },
                  },
                  {
                    onSuccess: () => {
                      toast.success("نام نما به‌روز شد");
                      setRenameTarget(null);
                    },
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  },
                );
              }}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
