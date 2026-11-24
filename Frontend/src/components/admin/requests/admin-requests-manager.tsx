"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle,
  Loader2,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/panel/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatJalaliDate } from "@/lib/format";
import { useAdminPrivacyRequests } from "@/features/student-panel/queries";
import { useProcessAdminPrivacyRequest } from "@/features/student-panel/mutations";
import type { PrivacyRequest } from "@/contracts/privacy";

export function AdminRequestsManager() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed" | "rejected"
  >("all");
  const [processingReq, setProcessingReq] = useState<PrivacyRequest | null>(
    null,
  );
  const [adminNote, setAdminNote] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject">("approve");

  const query = useAdminPrivacyRequests(
    statusFilter === "all" ? undefined : { status: statusFilter },
  );
  const processMutation = useProcessAdminPrivacyRequest();

  const requests = query.data?.items ?? [];

  const handleProcessSubmit = async () => {
    if (!processingReq) return;
    try {
      await processMutation.mutateAsync({
        id: processingReq.id,
        body: {
          decision,
          adminNote: adminNote.trim() || undefined,
        },
      });
      toast.success(
        decision === "approve"
          ? "درخواست با موفقیت تأیید و تکمیل شد"
          : "درخواست با موفقیت رد شد",
      );
      setProcessingReq(null);
      setAdminNote("");
      void query.refetch();
    } catch {
      toast.error("خطا در پردازش درخواست");
    }
  };

  return (
    <PageContainer className="gap-6 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            درخواست‌های حریم خصوصی و حذف حساب
          </h1>
          <p className="text-sm text-muted-foreground">
            مدیریت و پردازش دستی درخواست‌های حذف حساب یا خروجی داده دانشجویان
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 rounded-lg border bg-card p-1 text-xs">
          <Button
            variant={statusFilter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="h-8 text-xs"
          >
            همه
          </Button>
          <Button
            variant={statusFilter === "pending" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className="h-8 text-xs gap-1"
          >
            در انتظار
          </Button>
          <Button
            variant={statusFilter === "completed" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("completed")}
            className="h-8 text-xs"
          >
            تکمیل‌شده
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("rejected")}
            className="h-8 text-xs"
          >
            ردشده
          </Button>
        </div>
      </header>

      {query.isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border bg-card">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <CheckCircle className="size-10 text-muted-foreground" />
          <h3 className="font-semibold text-lg text-foreground">
            درخواستی یافت نشد
          </h3>
          <p className="text-sm text-muted-foreground">
            هیچ درخواستی در وضعیت فیلتر انتخاب‌شده ثبت نشده است.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>تاریخ ثبت</TableHead>
                <TableHead>دانشجو</TableHead>
                <TableHead>نوع درخواست</TableHead>
                <TableHead>توضیحات دانشجو</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>بررسی‌کننده</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-xs">
                    {formatJalaliDate(req.createdAt, "yyyy/MM/dd HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {req.userName}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono" dir="ltr">
                      {req.userMobile}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        req.type === "account_deletion"
                          ? "destructive"
                          : "outline"
                      }
                      className="gap-1 text-xs"
                    >
                      {req.type === "account_deletion" ? (
                        <Trash2 className="size-3" />
                      ) : (
                        <Shield className="size-3" />
                      )}
                      {req.type === "account_deletion"
                        ? "حذف حساب"
                        : "خروجی داده"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs text-xs text-muted-foreground line-clamp-2">
                    {req.reason || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        req.status === "completed"
                          ? "default"
                          : req.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {req.status === "completed"
                        ? "تکمیل‌شده"
                        : req.status === "rejected"
                          ? "ردشده"
                          : "در انتظار بررسی"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {req.processedBy ? (
                      <div>
                        <span className="font-medium">{req.processedBy}</span>
                        {req.adminNote && (
                          <p className="text-[11px] text-muted-foreground">
                            {req.adminNote}
                          </p>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {req.status === "pending" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setProcessingReq(req);
                          setDecision("approve");
                          setAdminNote("");
                        }}
                      >
                        بررسی و تعیین تکلیف
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {formatJalaliDate(req.processedAt!)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Process Dialog */}
      <Dialog
        open={Boolean(processingReq)}
        onOpenChange={(open) => !open && setProcessingReq(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg">
              <Shield className="size-5 text-primary" />
              بررسی درخواست حریم خصوصی
            </DialogTitle>
            <DialogDescription>
              کاربر: {processingReq?.userName} ({processingReq?.userMobile}) · نوع:{" "}
              {processingReq?.type === "account_deletion"
                ? "حذف حساب کاربری"
                : "خروجی اطلاعات"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {processingReq?.reason && (
              <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
                <span className="font-semibold text-foreground">
                  علت ذکرشده توسط متقاضی:
                </span>
                <p className="text-muted-foreground">{processingReq.reason}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                تصمیم مدیریت:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={decision === "approve" ? "default" : "outline"}
                  onClick={() => setDecision("approve")}
                  className="gap-2"
                >
                  <Check className="size-4" />
                  تأیید و اجرا
                </Button>
                <Button
                  type="button"
                  variant={decision === "reject" ? "destructive" : "outline"}
                  onClick={() => setDecision("reject")}
                  className="gap-2"
                >
                  <X className="size-4" />
                  رد درخواست
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-note"
                className="text-xs font-semibold text-foreground"
              >
                یادداشت یا دلیل (در Audit Log ثبت می‌شود):
              </label>
              <Textarea
                id="admin-note"
                placeholder="توضیحات و دلایل تصمیم..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              onClick={handleProcessSubmit}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending && (
                <Loader2 className="size-4 animate-spin ml-2" />
              )}
              ثبت و نهایی‌سازی تصمیم
            </Button>
            <Button
              variant="outline"
              onClick={() => setProcessingReq(null)}
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
