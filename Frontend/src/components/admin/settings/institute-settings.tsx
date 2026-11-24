"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { UnsavedChangesBar } from "@/components/admin/settings/unsaved-changes-bar";
import { FileIdImageUploader } from "@/components/admin/upload/file-id-image-uploader";
import {
  FormInputField,
  FormTextareaField,
} from "@/components/forms";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { InstituteSettings } from "@/contracts/settings";
import {
  useUpdateInstituteContact,
  useUpdateInstituteInfo,
  useUpdateInstituteLicenses,
  useUpdateInstituteSeo,
  useUpdateInstituteSmsTemplates,
  useUpdateInstituteSocial,
} from "@/features/settings/mutations";
import { useInstituteSettings } from "@/features/settings/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  instituteContactFormSchema,
  instituteInfoFormSchema,
  instituteLicensesFormSchema,
  instituteSeoFormSchema,
  instituteSocialFormSchema,
  smsTemplatesFormSchema,
  type InstituteContactFormValues,
  type InstituteInfoFormValues,
  type InstituteLicensesFormValues,
  type InstituteSeoFormValues,
  type InstituteSocialFormValues,
  type SmsTemplatesFormValues,
} from "@/lib/validations/settings";

const SMS_PREVIEW_SAMPLE: Record<string, string> = {
  name: "علی رضایی",
  date: "۱۴۰۴/۰۷/۲۸ ساعت ۱۰:۰۰",
  institute: "اِپلای",
  password: "Tmp@example1",
};

function previewSms(body: string): string {
  return body.replace(/\{(\w+)\}/g, (_, key: string) =>
    SMS_PREVIEW_SAMPLE[key] ?? `{${key}}`,
  );
}

function SettingsLoading() {
  return (
    <PageContainer>
      <Skeleton className="mb-6 h-16 w-full" />
      <Skeleton className="h-96 w-full" />
    </PageContainer>
  );
}

export function InstituteSettingsPanel() {
  const query = useInstituteSettings();

  if (query.isPending && !query.data) return <SettingsLoading />;
  if (query.error && !query.data) {
    return (
      <PageContainer>
        <PageHeader title="تنظیمات موسسه" description="خطا در بارگذاری." />
        <p className="text-sm text-destructive">
          {getApiErrorMessage(query.error)}
        </p>
        <Button
          type="button"
          className="mt-4"
          onClick={() => void query.refetch()}
        >
          تلاش دوباره
        </Button>
      </PageContainer>
    );
  }

  if (!query.data) return <SettingsLoading />;

  return <InstituteSettingsTabs settings={query.data} />;
}

function InstituteSettingsTabs({ settings }: { settings: InstituteSettings }) {
  return (
    <PageContainer>
      <PageHeader
        title="تنظیمات موسسه"
        description="اطلاعات عمومی، تماس، شبکه‌ها، مجوزها، SEO و قالب پیامک — هر بخش جدا ذخیره می‌شود."
      />

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList
          className="flex h-auto w-full flex-wrap justify-start gap-1"
          aria-label="بخش‌های تنظیمات موسسه"
        >
          <TabsTrigger value="info">اطلاعات موسسه</TabsTrigger>
          <TabsTrigger value="contact">تماس</TabsTrigger>
          <TabsTrigger value="social">شبکه‌ها</TabsTrigger>
          <TabsTrigger value="licenses">مجوزها</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="sms">پیامک</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <InfoTab settings={settings} />
        </TabsContent>
        <TabsContent value="contact">
          <ContactTab settings={settings} />
        </TabsContent>
        <TabsContent value="social">
          <SocialTab settings={settings} />
        </TabsContent>
        <TabsContent value="licenses">
          <LicensesTab settings={settings} />
        </TabsContent>
        <TabsContent value="seo">
          <SeoTab settings={settings} />
        </TabsContent>
        <TabsContent value="sms">
          <SmsTab settings={settings} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function InfoTab({ settings }: { settings: InstituteSettings }) {
  const mutation = useUpdateInstituteInfo();
  const form = useForm<InstituteInfoFormValues>({
    resolver: zodResolver(instituteInfoFormSchema),
    defaultValues: settings.info,
  });
  const stats = useFieldArray({ control: form.control, name: "homepageStats" });

  useEffect(() => {
    form.reset(settings.info);
  }, [settings.info, form]);

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((values) => {
          mutation.mutate(values, {
            onSuccess: () => {
              toast.success("اطلاعات موسسه ذخیره شد");
              form.reset(values);
            },
            onError: (error) => toast.error(getApiErrorMessage(error)),
          });
        })}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInputField control={form.control} name="name" label="نام موسسه" />
          <FormInputField
            control={form.control}
            name="nameEn"
            label="نام انگلیسی"
            dir="ltr"
          />
        </div>
        <FormInputField control={form.control} name="tagline" label="شعار" />
        <FormTextareaField
          control={form.control}
          name="description"
          label="توضیحات"
        />
        <FormInputField
          control={form.control}
          name="foundingYear"
          label="سال تأسیس (میلادی)"
          type="number"
        />
        <FormField
          control={form.control}
          name="logoFileId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>لوگو</FormLabel>
              <FormControl>
                <FileIdImageUploader
                  value={field.value}
                  onChange={field.onChange}
                  previewAlt="لوگو"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">آمار صفحه اصلی</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                stats.append({ label: "", value: 0, suffix: "" })
              }
              disabled={stats.fields.length >= 8}
            >
              <Plus data-icon="inline-start" aria-hidden />
              افزودن
            </Button>
          </div>
          {stats.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_8rem_6rem_auto]"
            >
              <FormInputField
                control={form.control}
                name={`homepageStats.${index}.label`}
                label="برچسب"
              />
              <FormInputField
                control={form.control}
                name={`homepageStats.${index}.value`}
                label="مقدار"
                type="number"
              />
              <FormInputField
                control={form.control}
                name={`homepageStats.${index}.suffix`}
                label="پسوند"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-7"
                disabled={stats.fields.length <= 1}
                onClick={() => stats.remove(index)}
                aria-label="حذف آمار"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <UnsavedChangesBar
          visible={form.formState.isDirty}
          isSaving={mutation.isPending}
          onSave={() => void form.handleSubmit((v) => {
            mutation.mutate(v, {
              onSuccess: () => {
                toast.success("اطلاعات موسسه ذخیره شد");
                form.reset(v);
              },
              onError: (error) => toast.error(getApiErrorMessage(error)),
            });
          })()}
          onDiscard={() => form.reset(settings.info)}
        />
      </form>
    </Form>
  );
}

function ContactTab({ settings }: { settings: InstituteSettings }) {
  const mutation = useUpdateInstituteContact();
  const form = useForm<InstituteContactFormValues>({
    resolver: zodResolver(instituteContactFormSchema),
    defaultValues: settings.contact,
  });
  const phones = useFieldArray({ control: form.control, name: "phones" });

  useEffect(() => {
    form.reset(settings.contact);
  }, [settings.contact, form]);

  const save = (values: InstituteContactFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("اطلاعات تماس ذخیره شد");
        form.reset(values);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(save)}
        noValidate
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">شماره‌های تماس</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                phones.append({ label: "", number: "", href: "tel:" })
              }
              disabled={phones.fields.length >= 6}
            >
              <Plus data-icon="inline-start" aria-hidden />
              افزودن
            </Button>
          </div>
          {phones.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <FormInputField
                control={form.control}
                name={`phones.${index}.label`}
                label="عنوان"
              />
              <FormInputField
                control={form.control}
                name={`phones.${index}.number`}
                label="شماره"
                dir="ltr"
              />
              <FormInputField
                control={form.control}
                name={`phones.${index}.href`}
                label="لینک"
                dir="ltr"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-7"
                disabled={phones.fields.length <= 1}
                onClick={() => phones.remove(index)}
                aria-label="حذف شماره"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <FormInputField
          control={form.control}
          name="email"
          label="ایمیل"
          type="email"
          dir="ltr"
        />
        <FormTextareaField
          control={form.control}
          name="address"
          label="آدرس"
        />
        <FormInputField
          control={form.control}
          name="workingHours"
          label="ساعات کاری"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInputField
            control={form.control}
            name="coordinates.lat"
            label="عرض جغرافیایی"
            type="number"
            step="any"
            dir="ltr"
          />
          <FormInputField
            control={form.control}
            name="coordinates.lng"
            label="طول جغرافیایی"
            type="number"
            step="any"
            dir="ltr"
          />
        </div>

        <UnsavedChangesBar
          visible={form.formState.isDirty}
          isSaving={mutation.isPending}
          onSave={() => void form.handleSubmit(save)()}
          onDiscard={() => form.reset(settings.contact)}
        />
      </form>
    </Form>
  );
}

function SocialTab({ settings }: { settings: InstituteSettings }) {
  const mutation = useUpdateInstituteSocial();
  const form = useForm<InstituteSocialFormValues>({
    resolver: zodResolver(instituteSocialFormSchema),
    defaultValues: settings.social,
  });

  useEffect(() => {
    form.reset(settings.social);
  }, [settings.social, form]);

  const save = (values: InstituteSocialFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("شبکه‌های اجتماعی ذخیره شد");
        form.reset(values);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(save)}
        noValidate
      >
        <FormInputField
          control={form.control}
          name="instagram"
          label="اینستاگرام"
          dir="ltr"
          placeholder="https://instagram.com/…"
        />
        <FormInputField
          control={form.control}
          name="telegram"
          label="تلگرام"
          dir="ltr"
          placeholder="https://t.me/…"
        />
        <FormInputField
          control={form.control}
          name="whatsapp"
          label="واتساپ"
          dir="ltr"
          placeholder="https://wa.me/…"
        />
        <FormInputField
          control={form.control}
          name="linkedin"
          label="لینکدین"
          dir="ltr"
        />
        <FormInputField
          control={form.control}
          name="website"
          label="وب‌سایت"
          dir="ltr"
        />
        <UnsavedChangesBar
          visible={form.formState.isDirty}
          isSaving={mutation.isPending}
          onSave={() => void form.handleSubmit(save)()}
          onDiscard={() => form.reset(settings.social)}
        />
      </form>
    </Form>
  );
}

function LicensesTab({ settings }: { settings: InstituteSettings }) {
  const mutation = useUpdateInstituteLicenses();
  const form = useForm<InstituteLicensesFormValues>({
    resolver: zodResolver(instituteLicensesFormSchema),
    defaultValues: { items: settings.licenses },
  });
  const items = useFieldArray({ control: form.control, name: "items" });

  useEffect(() => {
    form.reset({ items: settings.licenses });
  }, [settings.licenses, form]);

  const save = (values: InstituteLicensesFormValues) => {
    mutation.mutate(values, {
      onSuccess: (licenses) => {
        toast.success("مجوزها ذخیره شد");
        form.reset({ items: licenses });
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(save)}
        noValidate
      >
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              items.append({
                title: "",
                imageFileId: "",
                href: "#",
                order: items.fields.length,
              })
            }
            disabled={items.fields.length >= 12}
          >
            <Plus data-icon="inline-start" aria-hidden />
            افزودن مجوز
          </Button>
        </div>
        {items.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            هنوز مجوزی ثبت نشده است.
          </p>
        ) : null}
        {items.fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <FormInputField
                control={form.control}
                name={`items.${index}.title`}
                label="عنوان"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-7"
                onClick={() => items.remove(index)}
                aria-label="حذف مجوز"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`items.${index}.imageFileId`}
              render={({ field: imageField }) => (
                <FormItem>
                  <FormLabel>تصویر</FormLabel>
                  <FormControl>
                    <FileIdImageUploader
                      value={imageField.value || null}
                      onChange={(fileId) =>
                        imageField.onChange(fileId ?? "")
                      }
                      previewAlt="مجوز"
                      clearable={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormInputField
              control={form.control}
              name={`items.${index}.href`}
              label="لینک"
              dir="ltr"
            />
          </div>
        ))}
        <UnsavedChangesBar
          visible={form.formState.isDirty}
          isSaving={mutation.isPending}
          onSave={() => void form.handleSubmit(save)()}
          onDiscard={() => form.reset({ items: settings.licenses })}
        />
      </form>
    </Form>
  );
}

function SeoTab({ settings }: { settings: InstituteSettings }) {
  const mutation = useUpdateInstituteSeo();
  const form = useForm<InstituteSeoFormValues>({
    resolver: zodResolver(instituteSeoFormSchema),
    defaultValues: settings.seo,
  });

  useEffect(() => {
    form.reset(settings.seo);
  }, [settings.seo, form]);

  const save = (values: InstituteSeoFormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success("SEO پیش‌فرض ذخیره شد");
        form.reset(values);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(save)}
        noValidate
      >
        <FormInputField
          control={form.control}
          name="defaultTitle"
          label="عنوان پیش‌فرض"
        />
        <FormInputField
          control={form.control}
          name="titleTemplate"
          label="قالب عنوان"
          description="از %s برای عنوان صفحه استفاده کنید."
          dir="ltr"
        />
        <FormTextareaField
          control={form.control}
          name="defaultDescription"
          label="توضیح پیش‌فرض"
        />
        <FormField
          control={form.control}
          name="ogImageFileId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تصویر Open Graph</FormLabel>
              <FormControl>
                <FileIdImageUploader
                  value={field.value}
                  onChange={field.onChange}
                  previewAlt="OG"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <UnsavedChangesBar
          visible={form.formState.isDirty}
          isSaving={mutation.isPending}
          onSave={() => void form.handleSubmit(save)()}
          onDiscard={() => form.reset(settings.seo)}
        />
      </form>
    </Form>
  );
}

function SmsTab({ settings }: { settings: InstituteSettings }) {
  const mutation = useUpdateInstituteSmsTemplates();
  const form = useForm<SmsTemplatesFormValues>({
    resolver: zodResolver(smsTemplatesFormSchema),
    defaultValues: { templates: settings.smsTemplates },
  });

  useEffect(() => {
    form.reset({ templates: settings.smsTemplates });
  }, [settings.smsTemplates, form]);

  const templates =
    useWatch({ control: form.control, name: "templates" }) ?? [];

  const save = (values: SmsTemplatesFormValues) => {
    mutation.mutate(
      {
        templates: values.templates.map((item) => ({
          key: item.key,
          body: item.body,
        })),
      },
      {
        onSuccess: (next) => {
          toast.success("قالب‌های پیامک ذخیره شد");
          form.reset({ templates: next });
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(save)}
        noValidate
      >
        {templates.map((template, index) => (
          <div
            key={template.key}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <div>
              <h3 className="text-sm font-medium">{template.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                متغیرها:{" "}
                {template.variables.map((v) => `{${v}}`).join(" · ")}
              </p>
            </div>
            <FormField
              control={form.control}
              name={`templates.${index}.body`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>متن پیامک</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} className="font-mono text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                پیش‌نمایش
              </p>
              <p>{previewSms(template.body)}</p>
            </div>
          </div>
        ))}
        <UnsavedChangesBar
          visible={form.formState.isDirty}
          isSaving={mutation.isPending}
          onSave={() => void form.handleSubmit(save)()}
          onDiscard={() => form.reset({ templates: settings.smsTemplates })}
        />
        {mutation.isPending ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            در حال ذخیره…
          </p>
        ) : null}
      </form>
    </Form>
  );
}
