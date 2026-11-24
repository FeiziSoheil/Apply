# کیت CRUD پنل مدیریت

مجموعهٔ کامپوننت‌های مشترک برای ساخت صفحات مدیریت (فهرست + ایجاد + ویرایش + حذف) در `src/components/admin/`.
نمونهٔ کامل و الگوی همهٔ دامنه‌ها: **`/admin/content/countries`**
(`src/components/admin/content/countries/` + `src/app/(admin)/admin/content/countries/page.tsx`).

## اجزای کیت

| کامپوننت | مسیر | کار |
| --- | --- | --- |
| `DataTable` | `data-table/data-table.tsx` | جدول سمت‌سرور (TanStack Table + shadcn Table): صفحه‌بندی، مرتب‌سازی، جستجو، انتخاب ردیف، عملیات گروهی، نمایش/پنهان‌کردن ستون، اسکلت، حالت خالی، خطا با «تلاش دوباره»، کارت در موبایل |
| `useTableUrlState` | `data-table/use-table-url-state.ts` | state جدول در URL با nuqs |
| `SelectFilter` / `MultiSelectFilter` / `DateRangeFilter` | `data-table/filters.tsx` | فیلترهای ستون (تک‌انتخابی، چندانتخابی، بازهٔ تاریخ جلالی) |
| `EntityFormDialog` / `EntityFormDrawer` | `entity-form/` | فرم کوتاه ایجاد/ویرایش در دیالوگ یا کشو با RHF + zod + `useApiForm` |
| `EntityFormPage` | `entity-form/entity-form-page.tsx` | فرم تمام‌صفحه برای موجودیت‌های بزرگ: نوار کناری لنگر بخش‌ها، نوار چسبان پایین، حالت بارگذاری/خطا، `useUnsavedChangesGuard` |
| `FieldArrayEditor` | `fields/field-array-editor.tsx` | لیست‌های ساده یا آبجکتی با `useFieldArray`، درگ‌اند‌دراپ (`@dnd-kit`)، تأیید حذف، ردیف‌های جمع‌شو |
| `SortableList` | `fields/sortable-list.tsx` | فهرست قابل‌مرتب‌سازی عمومی (`@dnd-kit` + کیبورد) با `onReorder` — برای لیست‌های ادمین و `SectionsEditor` |
| `SectionsEditor` | `content/sections-editor.tsx` | ویرایش `sections[]` (آکاردئون + DnD + قالب + ContentEditor)؛ راهنما: `docs/content-editor.md` |
| `SlugField` | `fields/slug-field.tsx` | اسلاگ ASCII kebab-case، پیشنهاد از عنوان (نویسه‌گردانی فارسی→لاتین)، ویرایش دستی، بررسی یکتایی با debounce روی `GET /{resource}/slug-available` |
| `SeoFieldsSection` | `fields/seo-fields-section.tsx` | `metaTitle` / `metaDescription` (شمارنده + هشدار طول)، `ogImageId`، سوییچ `noindex`، پیش‌نمایش نتیجهٔ گوگل (RTL) — هم‌تراز با `seoMetaSchema` |
| `PublishStatusControl` | `fields/publish-status-control.tsx` | وضعیت پیش‌نویس / منتشرشده / زمان‌بندی‌شده (پیکر جلالی برای `scheduledAt`)، دکمه‌های «ذخیره پیش‌نویس» و «انتشار»، آخرین ویرایش جلالی + نام ویرایشگر |
| `useUnsavedChangesGuard` | `hooks/use-unsaved-changes-guard.ts` | هشدار ترک صفحه هنگام dirty بودن فرم (`beforeunload` + لینک‌های داخلی + `guardedPush` / `confirmLeave`) |
| `ConfirmDialog` | `confirm-dialog.tsx` | تأیید حذف / تغییر وضعیت |
| `StatusBadge` | `status-badge.tsx` | نقشهٔ وضعیت ← رنگ (توکن‌های `success` / `warning` / `info` / `destructive`) |
| `RichTextEditor` | `editor/rich-text-editor.tsx` | ویرایشگر Tiptap راست‌به‌چپ؛ مقدار = **Markdown** (مطابق `BlogPost.content`) |
| `ImageUploader` / `FileUploader` | `upload/` | درگ‌اند‌دراپ، پیش‌نمایش، نوار پیشرفت واقعی؛ آپلود به `POST /files` |
| `DateTimeJalaliPicker` | `fields/date-time-jalali-picker.tsx` | تاریخ (و ساعت) جلالی؛ مقدار ISO |
| `TagInput` | `fields/tag-input.tsx` | ورودی برچسب‌ها |
| `Form*Field`, `RepeatableField` | `fields/`, `editor/form-rich-text-field.tsx` | اتصال کنترل‌های بالا به react-hook-form (`RepeatableField` برای لیست‌های کوتاه بدون DnD؛ برای CMS از `FieldArrayEditor` استفاده کنید) |
| `RequirePermission` | `require-permission.tsx` | قفل سطح صفحه (۴۰۳ برای کاربر بدون دسترسی) |
| `AdminResourcePage` | `admin-resource-page.tsx` | پوستهٔ مشترک لیست ادمین: `RequirePermission` + `Suspense` + اسکلت جدول |

## ابزارهای فرم مشترک — چه زمانی کدام؟

| ابزار | کی استفاده شود | کی استفاده نشود |
| --- | --- | --- |
| `FieldArrayEditor` | آرایه‌های فرم با `useFieldArray` (شرایط، رشته‌ها، FAQ، ددلاین، مراحل): افزودن، حذف با تأیید، DnD، ردیف جمع‌شو | لیست‌های کوتاه بدون نیاز به DnD → `RepeatableField`؛ فهرست خارج از فرم → `SortableList` |
| `SortableList` | مرتب‌سازی فهرست‌های ادمین با state محلی یا mutation جدا (`onReorder`)؛ داخل `SectionsEditor` برای ترتیب بخش‌ها | فیلدهای سادهٔ داخل RHF → `FieldArrayEditor` |
| `SectionsEditor` | آرایهٔ `sections` روی Country / University / Service / Program | موجودیت بدون بخش RichContent |
| `SlugField` | موجودیت با `slug` و endpoint `slug-available`؛ پیشنهاد از عنوان فارسی | فیلد متنی ساده بدون یکتایی |
| `SeoFieldsSection` | بلوک سئوی هیبرید (`seo.metaTitle`, `metaDescription`, `ogImageId`, `noindex`) | صفحات بدون SEO در قرارداد |
| `PublishStatusControl` | نوار اقدام انتشار؛ با `onStatusChange` + `scheduledAt` برای زمان‌بندی؛ بدون آن‌ها فقط badge + دو دکمه (سازگار با فرم‌های فعلی) | موجودیت بدون `status` انتشار |
| `useUnsavedChangesGuard` | هر فرم طولانی / تمام‌صفحه (یا به‌صورت توکار در `EntityFormPage`) | دیالوگ‌های کوتاه که با بستن خودشان تأیید می‌گیرند |
| `EntityFormPage` | ایجاد/ویرایش تمام‌عرض با چند بخش لنگر‌دار و نوار چسبان | فرم کوتاه → `EntityFormDialog` / `EntityFormDrawer` |

ویرایشگر RichContent و بخش‌ها: **`docs/content-editor.md`**.

### API خلاصه

- **`FieldArrayEditor`**: `control`, `name`, `label`, `addLabel`, `emptyItem`, `children(index)`, اختیاری `collapsible`, `getRowTitle`, `max`.
- **`SortableList`**: `items`, `getId`, `onReorder(next)`, `renderItem(item, { dragHandle, dragHandleProps, index })`.
- **`SectionsEditor`**: `control`, `name` (معمولاً `"sections"`), `kind`, اختیاری `previewPath`؛ جزئیات در `docs/content-editor.md`.
- **`SlugField`**: داخل `FormProvider`؛ `name`, `titleName`, `checkAvailability({ slug, excludeId, signal })`, `debounceMs`.
- **`SeoFieldsSection`**: `control`, `namePrefix` (پیش‌فرض `"seo"`), `siteHost`, `previewPath`.
- **`PublishStatusControl`**: `status`, `onSaveDraft`, `onPublish`؛ اختیاری `onStatusChange`, `scheduledAt`, `onScheduledAtChange`, `onSchedule`, `lastEditedAt`, `lastEditedBy`.
- **`useUnsavedChangesGuard({ isDirty })`**: برمی‌گرداند `{ confirmLeave, guardedPush, guardedReplace }`.
- **`EntityFormPage`**: `schema`, `defaultValues`, `sections`, `onSubmit`, `children(form)`, اختیاری `footer`, `isLoading`, `error`, `onRetry`.

## الگوی CMS (کشورها)

صفحهٔ کشورها الگوی نهایی دامنه‌های محتوایی بزرگ است:

1. **فهرست** — `CountriesManager` در `/admin/content/countries` با `DataTable`، فیلتر قاره / سطح هزینه / وضعیت، جستجو و مرتب‌سازی؛ حذف کشور وابسته → دیالوگ توضیحی روی `409 CONFLICT`.
2. **ایجاد / ویرایش** — مسیرهای تمام‌صفحه `/admin/content/countries/new` و `/admin/content/countries/[id]/edit` با `EntityFormPage` + `CountryFormFields` (شامل `SlugField`، `FieldArrayEditor`، `SectionsEditor`، `SeoFieldsSection`) و نوار `PublishStatusControl` (پیش‌نویس / منتشر / زمان‌بندی).
3. **قرارداد** — `GET /countries/slug-available?slug=&excludeId=`؛ فیلدهای سئو مطابق `seoMetaSchema` (`ogImageId`, `noindex`)؛ وضعیت انتشار `draft` | `published` | `scheduled` با `scheduledAt` اختیاری؛ `updatedBy` نام آخرین ویرایشگر؛ `sections` مطابق `contentSectionsInputSchema`.

## state جدول در URL

`useTableUrlState(filterParsers)` همهٔ state را در query string نگه می‌دارد؛ پس لینک قابل اشتراک است، با refresh از بین نمی‌رود و دکمهٔ Back کار می‌کند:

```
/admin/content/countries?page=2&pageSize=50&q=آلمان&sort=costOfLiving&order=desc&continent=europe&costBand=low
```

- `page` (۱)، `pageSize` (۲۰)، `q` («»)، `sort`، `order` (`asc`) — مقدار پیش‌فرض در URL نمی‌آید.
- فیلترهای هر دامنه با parserهای nuqs تعریف می‌شوند (مثلاً `parseAsStringLiteral`, `parseAsArrayOf(parseAsString)`) و کنار پارامترهای بالا قرار می‌گیرند. فیلتر چندانتخابی: `?tags=a,b`؛ بازهٔ تاریخ: دو پارامتر `createdFrom` / `createdTo` به‌صورت `YYYY-MM-DD`.
- تغییر جستجو/فیلتر/pageSize/مرتب‌سازی همیشه به صفحهٔ ۱ برمی‌گردد؛ تغییر صفحه history جدید می‌سازد، بقیه `replace` هستند.
- جستجو ۴۰۰ms debounce دارد.
- parser map باید **سطح ماژول** (پایدار) باشد. صفحه‌ای که hook را به کار می‌برد باید داخل `<Suspense>` باشد.
- `toXxxListQuery(params, filters)` state را به query قرارداد (`CountryListQuery`) تبدیل می‌کند؛ فقط فیلدهای مرتب‌سازیِ مجاز (`*_SORT_FIELDS`) ارسال می‌شوند.
- دادهٔ فهرست با `useXxx(filters)` از `features/content/queries.ts` می‌آید که `placeholderData: keepPreviousData` دارد: هنگام تغییر صفحه، جدول قبلی با حالت محو نمایش داده می‌شود و پرش ندارد.

## افزودن دامنهٔ جدید (مثلاً دانشگاه‌ها)

۱. **منو و دسترسی** — ورودی در `NAV_CONFIG.admin` (`src/components/panel/nav-config.ts`) از قبل هست (`slug: "content/universities"`, `permissions: ["content:read"]`). اگر دامنهٔ جدید است، آیتم و permission مناسب از `src/lib/rbac/permissions.ts` را اضافه کنید.

۲. **هوک‌های feature** — `src/features/content/` برای هر منبع `useXxx` (فهرست)، `useCreateXxx`، `useUpdateXxx`، `useDeleteXxx` دارد. برای دامنهٔ تازه `createResourceApi` / `createResourceQueries` / `createResourceMutations` را در `api.ts`، `queries.ts` و `mutations.ts` استفاده کنید.

۳. **اسکیمای فرم** — `src/lib/validations/<domain>.ts` (الگو: `country.ts`):
   - اسکیمای zod با پیام‌های فارسی و همان محدودیت‌های `xxxCreateSchema` در `src/contracts/`؛
   - `XXX_FORM_DEFAULTS` برای ایجاد، `xxxToFormValues(entity)` برای ویرایش، `toXxxPayload(values)` برای ساخت بدنهٔ قرارداد؛
   - اسکیما باید ورودی و خروجی هم‌نوع داشته باشد (بدون `default`/`transform` که نوع را عوض کنند) تا با `EntityForm*` و فیلدهای `components/forms` سازگار بماند؛
   - یک تست مثل `country.test.ts` بنویسید که دادهٔ seed را از مسیر فرم عبور دهد و با اسکیمای قرارداد بسنجد.

۴. **ستون‌ها** — `components/admin/content/<domain>/<domain>-columns.tsx` (الگو: `country-columns.tsx`):
   - ستون مرتب‌شدنی: `accessorKey` برابر با یکی از `*_SORT_FIELDS` و `enableSorting: true`؛
   - `header` رشته باشد تا دکمهٔ مرتب‌سازی خودکار ساخته شود؛ `meta.label` نام ستون در منوی «ستون‌ها» و کارت موبایل است؛ `meta.mobile: "title"` عنوان کارت و `"hidden"` برای پنهان‌کردن در موبایل؛
   - وضعیت‌ها با `StatusBadge` و یک `StatusMap` (برای محتوای قابل انتشار: `PUBLICATION_STATUS_MAP`).

۵. **پارامترهای URL** — `<domain>-table-params.ts` شامل `xxxFilterParsers` و `toXxxListQuery`.

۶. **فیلدهای فرم** — `<domain>-form-fields.tsx`: فیلدهای `FormInputField`, `FormSelectField`, `FormTextareaField`, `FormNumberField`, `FormTagInputField`, `FormImageField`, `FormDateTimeField`, `FormRichTextField` (برای مقاله)، `FieldArrayEditor` / `RepeatableField`، و در صورت داشتن `sections` کامپوننت `SectionsEditor` (راهنما: `docs/content-editor.md`). لیست نام فیلدها را برای `knownFields` export کنید تا خطای فیلدِ ناشناختهٔ سرور به‌صورت toast نمایش داده شود.

۷. **مدیر صفحه** — `<domain>-manager.tsx` (کلاینت): `useTableUrlState` → `useXxx(toXxxListQuery(...))` → `<DataTable>`؛ برای فرم کوتاه `EntityFormDrawer` / `EntityFormDialog`؛ برای موجودیت بزرگ (الگوی کشورها) ناوبری به `/new` و `/[id]/edit` با `EntityFormPage`؛ حذف با `ConfirmDialog`.

۸. **صفحه** — `src/app/(admin)/admin/content/<domain>/page.tsx` (Server Component): `metadata` + `<AdminResourcePage permission=…>` (یا `RequirePermission` + `Suspense`) + manager. برای فرم تمام‌صفحه، مسیرهای `new/page.tsx` و `[id]/edit/page.tsx` را هم اضافه کنید. یک route ثابت بر catch-all `[...slug]` اولویت دارد، پس جایگزین placeholder می‌شود.

### عملیات (غیر محتوایی)

صفحات `/admin/leads`، `/admin/cases`، `/admin/tickets`، `/admin/finance` و گزارش حسابرسی `/admin/settings/audit` با همان الگوی `DataTable` پیاده شده‌اند (`src/components/admin/{leads,cases,tickets,finance,audit}/`).

۹. **`<Can>`** — هر دکمهٔ حساس:

   | اقدام | permission |
   | --- | --- |
   | افزودن / ویرایش | `content:write` |
   | حذف (تکی و گروهی) | `content:delete` |
   | مشاهدهٔ صفحه | `content:read` (با `RequirePermission`) |

   `<Can>` فقط UX است؛ API همان قوانین را با ۴۰۳ اعمال می‌کند.

## نکات

- **آپلود**: `uploadFileWithProgress` (`src/lib/api/upload.ts`) با `XMLHttpRequest` پیشرفت واقعی را می‌دهد و مثل کلاینت API هدرهای نشست/سناریوی mock را می‌فرستد. حداکثر ۱۰ مگابایت و فقط jpg/png/webp/pdf (مطابق `POST /files`).
- **ویرایشگر**: Tiptap سنگین است؛ در فرم مقالات با `next/dynamic` لود کنید تا در صفحاتی که لازم ندارند bundle نشود.
- **فیلتر چندانتخابی و بازهٔ تاریخ**: کامپوننت‌ها آماده‌اند (`MultiSelectFilter`, `DateRangeFilter`) اما قرارداد `GET /countries` چنین فیلترهایی ندارد؛ در دامنه‌هایی که پارامتر متناظر دارند (مثلاً `createdFrom/createdTo`) استفاده شوند.
- **حذف گروهی**: API حذف دسته‌ای ندارد؛ نمونه، حذف‌ها را موازی می‌فرستد و نتیجه را (موفق/ناموفق) گزارش می‌کند.
- **کنترل نسخه**: `@tanstack/react-table` نسخهٔ ۸ نصب شده است.
