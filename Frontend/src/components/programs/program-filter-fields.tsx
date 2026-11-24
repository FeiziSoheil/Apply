"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DEGREE_LEVELS, DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import { formatNumber } from "@/lib/format";
import { formatTuition } from "@/lib/format-tuition";
import { LANGUAGE_REQUIREMENT_TYPE_LABELS } from "@/lib/language-requirements";
import { TUITION_RANGE } from "@/lib/tuition-range";
import type { DegreeLevel, LanguageRequirementType } from "@/types";

const ALL_VALUE = "__all__";

export type ProgramFilterOptions = {
  countries: { slug: string; nameFa: string }[];
  fields: string[];
  intakes: string[];
  languageTypes: LanguageRequirementType[];
};

export type ProgramFilterValues = {
  country: string | null;
  degreeLevel: DegreeLevel | null;
  field: string | null;
  languageType: LanguageRequirementType | null;
  intake: string | null;
  hasScholarship: boolean | null;
  minTuition: number;
  maxTuition: number;
};

type ProgramFilterFieldsProps = {
  options: ProgramFilterOptions;
  values: ProgramFilterValues;
  onChange: (patch: Partial<ProgramFilterValues>) => void;
  disabled?: boolean;
};

export function ProgramFilterFields({
  options,
  values,
  onChange,
  disabled = false,
}: ProgramFilterFieldsProps) {
  const countryId = useId();
  const degreeId = useId();
  const fieldId = useId();
  const languageId = useId();
  const intakeId = useId();
  const scholarshipId = useId();
  const tuitionId = useId();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor={countryId}>کشور</Label>
        <Select
          dir="rtl"
          disabled={disabled}
          value={values.country ?? ALL_VALUE}
          onValueChange={(value) =>
            onChange({
              country: !value || value === ALL_VALUE ? null : value,
            })
          }
        >
          <SelectTrigger id={countryId} className="w-full">
            <SelectValue placeholder="همه کشورها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>همه کشورها</SelectItem>
            {options.countries.map((country) => (
              <SelectItem key={country.slug} value={country.slug}>
                {country.nameFa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={degreeId}>مقطع تحصیلی</Label>
        <Select
          dir="rtl"
          disabled={disabled}
          value={values.degreeLevel ?? ALL_VALUE}
          onValueChange={(value) =>
            onChange({
              degreeLevel:
                !value || value === ALL_VALUE
                  ? null
                  : (value as DegreeLevel),
            })
          }
        >
          <SelectTrigger id={degreeId} className="w-full">
            <SelectValue placeholder="همه مقاطع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>همه مقاطع</SelectItem>
            {DEGREE_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {DEGREE_LEVEL_LABELS[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId}>رشته</Label>
        <Select
          dir="rtl"
          disabled={disabled}
          value={values.field ?? ALL_VALUE}
          onValueChange={(value) =>
            onChange({
              field: !value || value === ALL_VALUE ? null : value,
            })
          }
        >
          <SelectTrigger id={fieldId} className="w-full">
            <SelectValue placeholder="همه رشته‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>همه رشته‌ها</SelectItem>
            {options.fields.map((field) => (
              <SelectItem key={field} value={field}>
                {field}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={languageId}>مدرک زبان</Label>
        <Select
          dir="rtl"
          disabled={disabled}
          value={values.languageType ?? ALL_VALUE}
          onValueChange={(value) =>
            onChange({
              languageType:
                !value || value === ALL_VALUE
                  ? null
                  : (value as LanguageRequirementType),
            })
          }
        >
          <SelectTrigger id={languageId} className="w-full">
            <SelectValue placeholder="همه انواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>همه انواع</SelectItem>
            {options.languageTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {LANGUAGE_REQUIREMENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={intakeId}>زمان پذیرش</Label>
        <Select
          dir="rtl"
          disabled={disabled}
          value={values.intake ?? ALL_VALUE}
          onValueChange={(value) =>
            onChange({
              intake: !value || value === ALL_VALUE ? null : value,
            })
          }
        >
          <SelectTrigger id={intakeId} className="w-full">
            <SelectValue placeholder="همه ورودی‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>همه ورودی‌ها</SelectItem>
            {options.intakes.map((intake) => (
              <SelectItem key={intake} value={intake}>
                {intake}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={tuitionId}>بازه شهریه سالانه (معادل یورو)</Label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {formatTuition(values.minTuition, "EUR")} —{" "}
            {values.maxTuition >= TUITION_RANGE.max
              ? `${formatNumber(TUITION_RANGE.max)}+ یورو`
              : formatTuition(values.maxTuition, "EUR")}
          </span>
        </div>
        <Slider
          id={tuitionId}
          disabled={disabled}
          min={TUITION_RANGE.min}
          max={TUITION_RANGE.max}
          step={TUITION_RANGE.step}
          value={[values.minTuition, values.maxTuition]}
          onValueChange={(next) => {
            const [min, max] = next;
            if (min === undefined || max === undefined) return;
            onChange({ minTuition: min, maxTuition: max });
          }}
          aria-label="بازه شهریه سالانه به معادل یورو"
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
        <Label htmlFor={scholarshipId} className="cursor-pointer">
          فقط برنامه‌های دارای بورسیه
        </Label>
        <Switch
          id={scholarshipId}
          disabled={disabled}
          checked={values.hasScholarship === true}
          onCheckedChange={(checked) =>
            onChange({ hasScholarship: checked ? true : null })
          }
        />
      </div>
    </div>
  );
}
