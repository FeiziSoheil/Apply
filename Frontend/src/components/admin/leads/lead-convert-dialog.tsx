"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import type { CaseTemplate } from "@/contracts/crm";
import type { Lead } from "@/contracts/leads";
import { useConvertLeadToCase } from "@/features/leads/mutations";
import { getApiErrorMessage } from "@/lib/api";
import { DEGREE_LEVEL_LABELS, DEGREE_LEVELS } from "@/lib/degree-levels";
import type { DegreeLevel } from "@/types";

type ConsultantOption = { value: string; label: string };
type CountryOption = { value: string; label: string };

type LeadConvertDialogProps = {
  open: boolean;
  lead: Lead;
  countries: readonly CountryOption[];
  consultants: readonly ConsultantOption[];
  caseTemplates: readonly CaseTemplate[];
  onOpenChange: (open: boolean) => void;
};

export function LeadConvertDialog({
  open,
  lead,
  countries,
  consultants,
  caseTemplates,
  onOpenChange,
}: LeadConvertDialogProps) {
  const router = useRouter();
  const convert = useConvertLeadToCase();
  const defaultCountry =
    lead.targetCountries[0] ?? lead.interestCountry ?? countries[0]?.value ?? "";
  const [country, setCountry] = useState(defaultCountry);
  const [degree, setDegree] = useState<DegreeLevel>(
    lead.assessment?.targetDegree ?? lead.interestDegree ?? "master",
  );
  const [consultantId, setConsultantId] = useState(
    lead.assignedTo ?? consultants[0]?.value ?? "",
  );

  const suggestedTemplate = useMemo(() => {
    const exact = caseTemplates.find(
      (item) => item.countrySlug === country,
    );
    if (exact) return exact;
    return caseTemplates.find((item) => item.countrySlug === null) ?? null;
  }, [caseTemplates, country]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تبدیل به پرونده</DialogTitle>
          <DialogDescription>
            از لید «{lead.name}» پرونده دانشجو ساخته می‌شود و مرحله به
            تبدیل‌شده می‌رود.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>کشور مقصد</Label>
            <Select value={country || undefined} onValueChange={setCountry}>
              <SelectTrigger aria-label="کشور مقصد">
                <SelectValue placeholder="انتخاب کشور…" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>مقطع</Label>
            <Select
              value={degree}
              onValueChange={(value) => setDegree(value as DegreeLevel)}
            >
              <SelectTrigger aria-label="مقطع">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEGREE_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {DEGREE_LEVEL_LABELS[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>مسئول پرونده</Label>
            <Select
              value={consultantId || undefined}
              onValueChange={setConsultantId}
            >
              <SelectTrigger aria-label="مسئول پرونده">
                <SelectValue placeholder="انتخاب مشاور…" />
              </SelectTrigger>
              <SelectContent>
                {consultants.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {suggestedTemplate ? (
            <p className="bg-muted/40 rounded-md border px-3 py-2 text-sm">
              قالب پیشنهادی: <strong>{suggestedTemplate.title}</strong>
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              قالب پرونده‌ای برای این کشور یافت نشد.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            type="button"
            disabled={!country || convert.isPending}
            onClick={() => {
              convert.mutate(
                {
                  id: lead.id,
                  body: {
                    targetCountry: country,
                    targetDegree: degree,
                    programIds: [],
                    consultantId: consultantId || undefined,
                  },
                },
                {
                  onSuccess: (studentCase) => {
                    toast.success("پرونده ساخته شد");
                    onOpenChange(false);
                    router.push(`/admin/cases?caseId=${studentCase.id}`);
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }}
          >
            ساخت پرونده
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
