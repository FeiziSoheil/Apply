import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import type { Consultant, ConsultantCreate } from "@/contracts/content";

function requiredText(label: string, max: number) {
  return z
    .string({ required_error: `${label} را وارد کنید` })
    .trim()
    .min(1, `${label} را وارد کنید`)
    .max(max, `${label} نباید بیشتر از ${max} کاراکتر باشد`);
}

export const consultantFormSchema = z.object({
  name: z
    .string({ required_error: "نام را وارد کنید" })
    .trim()
    .min(3, "نام باید حداقل ۳ حرف باشد")
    .max(80, "نام نباید بیشتر از ۸۰ کاراکتر باشد"),
  role: requiredText("سمت", 120),
  photo: requiredText("عکس", 500),
  bio: requiredText("بیوگرافی", 2000),
  countries: z
    .array(z.string().trim().min(1, "کشور معتبر نیست"))
    .min(1, "حداقل یک کشور مسئولیتی انتخاب کنید")
    .max(20, "حداکثر ۲۰ کشور مجاز است"),
  languages: z
    .array(z.string().trim().min(1, "زبان معتبر نیست"))
    .min(1, "حداقل یک زبان وارد کنید")
    .max(10, "حداکثر ۱۰ زبان مجاز است"),
  showOnTeamPage: z.boolean(),
  active: z.boolean(),
});

export type ConsultantFormValues = z.infer<typeof consultantFormSchema>;

export const CONSULTANT_FORM_DEFAULTS: DefaultValues<ConsultantFormValues> = {
  name: "",
  role: "",
  photo: "",
  bio: "",
  countries: [],
  languages: [],
  showOnTeamPage: true,
  active: true,
};

export function consultantToFormValues(
  consultant: Consultant,
): ConsultantFormValues {
  return {
    name: consultant.name,
    role: consultant.role,
    photo: consultant.photo,
    bio: consultant.bio,
    countries: consultant.countries,
    languages: consultant.languages,
    showOnTeamPage: consultant.showOnTeamPage,
    active: consultant.active,
  };
}

export function toConsultantPayload(
  values: ConsultantFormValues,
): ConsultantCreate {
  return {
    name: values.name.trim(),
    role: values.role.trim(),
    photo: values.photo.trim(),
    bio: values.bio.trim(),
    countries: values.countries.map((item) => item.trim()),
    languages: values.languages.map((item) => item.trim()),
    showOnTeamPage: values.showOnTeamPage,
    active: values.active,
    order: 0,
  };
}
