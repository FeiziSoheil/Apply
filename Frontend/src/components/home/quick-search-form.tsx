"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DEGREE_LEVELS, DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import {
  programSearchSchema,
  type ProgramSearchValues,
} from "@/lib/validations/program-search";
import { Search } from "lucide-react";

type CountryOption = {
  slug: string;
  nameFa: string;
};

type QuickSearchFormProps = {
  countries: CountryOption[];
  fields: string[];
};

export function QuickSearchForm({ countries, fields }: QuickSearchFormProps) {
  const router = useRouter();
  const form = useForm<ProgramSearchValues>({
    resolver: zodResolver(programSearchSchema),
    defaultValues: {
      country: undefined,
      degreeLevel: undefined,
      field: undefined,
    },
  });

  function onSubmit(values: ProgramSearchValues) {
    const params = new URLSearchParams();
    if (values.country) params.set("country", values.country);
    if (values.degreeLevel) params.set("degreeLevel", values.degreeLevel);
    if (values.field) params.set("field", values.field);
    const qs = params.toString();
    router.push(qs ? `/programs?${qs}` : "/programs");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>کشور</FormLabel>
              <Select
                dir="rtl"
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full" aria-label="کشور">
                    <SelectValue placeholder="همه کشورها" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.slug} value={country.slug}>
                      {country.nameFa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="degreeLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>مقطع</FormLabel>
              <Select
                dir="rtl"
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full" aria-label="مقطع تحصیلی">
                    <SelectValue placeholder="همه مقاطع" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DEGREE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {DEGREE_LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="field"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رشته</FormLabel>
              <Select
                dir="rtl"
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full" aria-label="رشته">
                    <SelectValue placeholder="همه رشته‌ها" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fields.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-end">
          <Button type="submit" size="lg" className="w-full">
            <Search className="size-4" aria-hidden />
            جستجوی برنامه
          </Button>
        </div>
      </form>
    </Form>
  );
}
