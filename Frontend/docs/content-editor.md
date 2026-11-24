# ویرایشگر محتوا (ContentEditor و SectionsEditor)

راهنمای ویراستاران و توسعه‌دهندگان برای بلوک‌های RichContent و ویرایش بخش‌های صفحه در پنل مدیریت.

نمونهٔ نهایی دامنه: **`/admin/content/countries`**  
(`SectionsEditor` + `EntityFormPage` + قرارداد `countryCreateSchema`).

## RichContent چیست؟

مقدار ذخیره‌شده همیشه JSON سازگار با TipTap است (`{ type: "doc", content: Node[] }`) و با zod در `src/contracts/richcontent.ts` اعتبارسنجی می‌شود.

- هیچ HTML خامی ذخیره یا با `dangerouslySetInnerHTML` رندر نمی‌شود.
- تصاویر فقط با `fileId` (آپلود از `POST /files`)، نه URL خارجی.
- محدودیت‌ها: عمق ≤ ۴، حداکثر ۵۰۰ نود، حداکثر ۲۰۰KB.

رندر عمومی: `RichContentRenderer` / `SectionsView` (`src/components/shared/richcontent/`).  
هلپرها: `src/lib/richcontent/` (`validateRichContent`, `sanitizeRichContent`, `richContentToPlainText`, `isRichContentEmpty`, …).

## بلوک‌های مجاز

| بلوک | کلید نود | توضیح کوتاه |
| --- | --- | --- |
| پاراگراف | `paragraph` | متن ساده |
| عنوان ۲–۴ | `heading` (level 2–4) | سرتیتر |
| فهرست نقطه‌ای / شماره‌دار | `bulletList` / `orderedList` | به‌همراه `listItem` |
| نقل‌قول | `blockquote` | |
| خط جداکننده | `horizontalRule` | |
| جدول | `table` (+ row / header / cell) | |
| تصویر | `image` | `fileId` + `alt` اجباری در UI |
| کادر توجه | `callout` | info / warning / success / danger |
| پرسش و پاسخ | `accordion` | آرایهٔ سوال/جواب RichContent |
| مراحل | `steps` | گام‌به‌گام |
| دکمه فراخوان | `ctaButton` | ارزیابی / رزرو / لینک |
| لینک ویدیو | `videoLink` | فقط لینک https (بدون embed) |
| ارجاع موجودیت | `entityReference` | کشور، دانشگاه، رشته، خدمت، مقاله |

**Markهای مجاز:** `bold`, `italic`, `underline`, `highlight`, `link` (فقط `http` / `https` / `mailto` / `tel`).

منوی اسلش (`/`) و نوار ابزار از همین whitelist تغذیه می‌شوند: `src/components/admin/content/menus/slash-items.ts`.

## افزودن بلوک جدید

۱. **قرارداد** — نود (و در صورت نیاز attrs) را در `src/contracts/richcontent.ts` به union نودها اضافه کنید؛ zod + OpenAPI را به‌روز کنید (`npm run contract:generate`).
۲. **داکیومنت مدل** — `docs/content-model.md` را هم‌تراز کنید.
۳. **افزونه TipTap** — در `src/components/admin/content/extensions/` یک Node/Mark بسازید و در `extensions/index.ts` ثبت کنید.
۴. **تبدیل رفت‌وبرگشت** — `convert/rich-to-tiptap.ts` و `convert/tiptap-to-rich.ts` (+ تست roundtrip در صورت بلوک سفارشی).
۵. **NodeView (اختیاری)** — اگر ویرایش درون‌خطی لازم است، مثل `callout-node-view.tsx`.
۶. **منوی اسلش / تولبار** — آیتم فارسی در `menus/slash-items.ts` و در صورت نیاز دکمه در `menus/content-toolbar.tsx`.
۷. **رندر عمومی** — شاخهٔ متناظر در `shared/richcontent` (`SharedRichNodes`).
۸. **Paste** — در صورت نیاز قوانین sanitize در `extensions/paste-sanitize.ts`.

بدون به‌روز کردن قرارداد و رندر عمومی، بلوک در API یا سایت دیده نمی‌شود.

## SectionsEditor

مسیر: `src/components/admin/content/sections-editor.tsx`

ویرایش آرایهٔ `sections[]` برای Country / University / Service / Program:

- لیست آکاردئونی قابل مرتب‌سازی با `SortableList`
- عنوان، انکر (پیشنهاد از عنوان با `slugify` + ویرایش دستی + یکتایی در سند)
- انتخاب آیکن از `SECTION_ICON_KEYS` (`src/lib/section-icons.tsx`)
- سوییچ نمایش، حذف با تأیید، `ContentEditor` برای `content`
- افزودن «از قالب پیش‌فرض» (`src/lib/content-templates.ts`؛ قالب‌های اضافه‌شده غیرفعال) یا «بخش خالی سفارشی»
- باز/بستن همه، شمارندهٔ بخش خالی، هشدار قبل از انتشار
- پیش‌نمایش: Sheet با `SectionsPreview` (همان رندر عمومی روی پیش‌نویس فرم؛ بخش‌های مخفی هم دیده می‌شوند)

اتصال فرم:

```tsx
<SectionsEditor
  control={form.control}
  name="sections"
  kind="country"
  previewPath={slug ? `/countries/${slug}` : undefined}
/>
```

اسکیمای فرم: `contentSectionsFormSchema` در `src/lib/validations/content-section.ts` (هم‌تراز `contentSectionsInputSchema`).

قالب‌ها: `defaultSectionsFor(kind)` / `templateMetaFor(kind)` — گونه‌ها: `country` | `university` | `service` | `program`.

## افزودن SectionsEditor به دامنهٔ جدید

۱. مطمئن شوید entity در قرارداد فیلد `sections: contentSectionsInputSchema` (یا optional) دارد.
۲. در `src/lib/validations/<domain>.ts` فیلد `sections: contentSectionsFormSchema` را اضافه کنید؛ در defaults از `defaultSectionsFor("<kind>")` استفاده کنید؛ در `toXxxPayload` همان آرایه را بدون `id` بفرستید.
۳. اگر قالب پیش‌فرض ندارید، در `content-templates.ts` یک `ContentTemplateKind` و بخش‌های پیش‌فرض اضافه کنید.
۴. در `<domain>-form-fields.tsx` یک سکشن لنگر‌دار بگذارید و `<SectionsEditor kind="…" />` را صدا بزنید؛ نام فیلد را به `knownFields` اضافه کنید.
۵. در فرم انتشار (مثل `CountryFormPage`) قبل از publish با `countEmptySections` هشدار بدهید.
۶. صفحهٔ عمومی را با `SectionsView` / `RichContentRenderer` رندر کنید.
۷. `docs/content-model.md` و در صورت نیاز `docs/crud-kit.md` را به‌روز کنید.

الگوی کامل فهرست + ایجاد/ویرایش + حذف با ۴۰۹: `src/components/admin/content/countries/`.

## کامپوننت پایه ContentEditor

`src/components/admin/content/content-editor.tsx`

```tsx
<ContentEditor
  value={doc}
  onChange={setDoc}
  onValidationError={(messages) => { /* پیام‌های فارسی */ }}
  disabled={false}
/>
```

برای فیلد داخل RHF از `Controller` استفاده کنید (همان‌طور که `SectionsEditor` برای هر بخش انجام می‌دهد) تا `isDirty` و `useUnsavedChangesGuard` درست کار کنند.
