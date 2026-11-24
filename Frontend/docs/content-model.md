# مدل محتوا (هیبرید)

منبع حقیقت schemaها در `src/contracts` است؛ این سند تقسیم **ساختاریافته در برابر آزاد** را برای ویراستاران و توسعه‌دهندگان توضیح می‌دهد.

## اصل کلی

| نوع فیلد | کاربرد | محل ذخیره |
| --- | --- | --- |
| **ساختاریافته** | فیلتر، مرتب‌سازی، مقایسه، کارت، محاسبه | فیلدهای typed روی entity |
| **آزاد (RichContent)** | توضیح متغیر، راهنما، FAQ درون‌متنی، CTA | `sections[].content` یا `content` روی بلاگ/خبر |

- RichContent همیشه JSON سازگار با TipTap است و با zod سخت‌گیرانه اعتبارسنجی می‌شود.
- هیچ HTML خامی ذخیره یا با `dangerouslySetInnerHTML` از محتوا رندر نمی‌شود.
- تصاویر داخل RichContent فقط با `fileId` (آپلود فایل)، نه URL خارجی.

## RichContent

سند: `{ type: "doc", content: Node[] }`

**نودهای مجاز:** paragraph، heading (۲–۴)، bulletList، orderedList، listItem، blockquote، horizontalRule، table (+ row/header/cell)، image، callout، accordion، steps، ctaButton، videoLink، entityReference.

**Markهای مجاز:** bold، italic، underline، highlight، link (فقط `http` / `https` / `mailto` / `tel`).

**محدودیت‌ها:** عمق تودرتویی ≤ ۴، حداکثر ۵۰۰ نود، حداکثر ۲۰۰KB سریال‌شده.

هلپرها: `src/lib/richcontent/` (`validateRichContent`، `richContentToPlainText`، `extractHeadings`، `extractFaqs`، `estimateReadingTime`، `emptyDoc`، `sanitizeRichContent`).

رندر عمومی (بدون `dangerouslySetInnerHTML`): `src/components/shared/richcontent/` — `RichContentRenderer`، `SectionsView`، پیش‌نمایش ادمین `SectionsPreview`.

قالب بخش‌های پیش‌فرض: `src/lib/content-templates.ts`.

## Section

```ts
{
  id: uuid,
  title: string,
  anchor: kebab-case ASCII (یکتا در سند),
  icon?: SectionIcon, // از لیست مجاز lucide
  visible: boolean,
  content: RichContent
}
```

حداکثر ۲۰ بخش در هر موجودیت.

## فیلدهای مشترک ویرایشی

| فیلد | توضیح |
| --- | --- |
| `seo.metaTitle?` | حداکثر ۷۰ |
| `seo.metaDescription?` | حداکثر ۱۶۰ |
| `seo.ogImageId?` | uuid فایل آپلودشده |
| `seo.noindex?` | حذف از ایندکس |
| `status` | `draft` \| `published` \| `scheduled` |
| `publishedAt?` / `scheduledAt?` | ISO UTC |
| `updatedBy?` | نام یا id ویرایشگر |

سایت عمومی فقط `published` را می‌بیند. در mock، `scheduled` با رسیدن `scheduledAt` هنگام خواندن به `published` تبدیل می‌شود.

## کشور (Country)

**ساختاریافته:** slug، nameFa/En، continent، costBand، flag*، heroImage، summary، benefits[]، language، visaDuration، costOfLiving، tuitionRange، currency، costBreakdown[]، requirements[]، popularFields[]، faqs[]، seo، status، …

**آزاد (sections):** مزایا، هزینه‌ها (متن)، شرایط پذیرش (متن)، ویزا، کار حین تحصیل، اقامت بعد از تحصیل — قالب پیش‌فرض در `defaultSectionsFor("country")`.

حذف‌شده از مدل ساختاریافتهٔ قبلی: `visaInfo`، `workRights`، `postStudyStay` (به sections منتقل شدند).

جدول هزینهٔ ساختاریافته (`costBreakdown`) همچنان جدا از section «هزینه‌ها» در UI نمایش داده می‌شود.

## دانشگاه (University)

**ساختاریافته:** slug، نام‌ها، countrySlug، city، ranking، tuitionPerYear، currency، logo، heroImage، **summary** (کارت)، deadlines[]، requirements[]، programsCount، seo، status، …

**آزاد (sections):** معرفی، امکانات، زندگی دانشجویی.

حذف‌شده: `description` (جایگزین: `summary` + section معرفی).

## برنامه تحصیلی (Program)

**ساختاریافته:** slug، نام، university/country slug، degreeLevel، field، duration، tuition، currency، languageRequirement، minGpa، intakes[]، deadline، hasScholarship، …

**آزاد:** `sections?` اختیاری.

## خدمت (Service)

**ساختاریافته:** slug، title، shortDescription، icon، steps[]، requiredDocuments[]، duration، faqs[]، relatedServiceSlugs[]، price?، **order**، seo، status، …

**آزاد (sections):** توضیح، مزایا.

حذف‌شده: `description`، `benefits[]` (به sections).

## مشاور / داستان موفقیت / FAQ

فیلد **`order`** برای مرتب‌سازی دستی + `POST /{resource}/reorder` (پاسخ: `{ updated }`). در پنل ادمین ترتیب فقط با drag & drop و «ذخیره ترتیب» تغییر می‌کند؛ ذخیرهٔ فرم ویرایش `order` را ارسال نمی‌کند.

**مشاور (Consultant):**

- `showOnTeamPage` — نمایش در صفحهٔ عمومی تیم.
- `active` — غیرفعال‌سازی نرم؛ مشاور غیرفعال برای رزرو و ارجاع جدید در دسترس نیست.
- `countries[]` اسلاگ کشورهاست. حذف مشاوری که لید، پرونده فعال یا رزرو دارد → `409 CONFLICT`؛ پنل در این حالت دکمهٔ «غیرفعال‌سازی» (`PATCH { active: false, showOnTeamPage: false }`) را پیشنهاد می‌دهد.

**داستان موفقیت (SuccessStory):**

- `isAnonymous` — نام دانشجو در نمایش عمومی ناشناس می‌شود.
- `publicationConsent` — رضایت انتشار؛ برای `published` یا `scheduled` الزامی است (در غیر این صورت `VALIDATION_ERROR` با خطای فیلد `publicationConsent`).
- `slug` اختیاری است (صفحهٔ اختصاصی داستان).

## بلاگ و خبر

- `BlogPost.content` و `NewsItem.content`: **RichContent** (دیگر markdown خام نیست).
- `BlogCategory`: CRUD ساده (id، slug، title)؛ حذف دستهٔ دارای مقاله → `409 CONFLICT` با پیام فارسی.
- بلاگ: `category` (عنوان نمایشی) + اختیاری `categoryId`؛ `coverImageAlt` اختیاری؛ فیلتر فهرست: `category` / `categoryId` / `tag` / `author` / `publishedFrom`–`publishedTo` / `status`.
- خبر: `eventType` (`webinar` | `exhibition` | `visa` | `deadline` | `general`)؛ اختیاری `eventDate` (YYYY-MM-DD)، `registrationUrl`، `coverImageAlt`.

## Endpointهای مرتبط

- `GET /{resource}/slug-available?slug=&excludeId=` برای همهٔ منابع دارای slug
- `POST /services|consultants|success-stories|faqs/reorder` با `{ items: [{ id, order }] }`
- CRUD `/blog-categories`

## دامنه ← صفحات ← endpointها ← permissionها

مبنای پیاده‌سازی بک‌اند / تطبیق RBAC. `student` به `/admin` دسترسی ندارد (فقط `/panel`).

| دامنه | صفحات ادمین | Endpointهای اصلی | Permissionها |
| --- | --- | --- | --- |
| داشبورد | `/admin` | `GET /admin/stats` | staff (admin/consultant؛ student → ۴۰۳) |
| لیدها | `/admin/leads` | `GET/POST /leads`, `PATCH/DELETE /leads/{id}`, `PUT …/status`, `PUT …/assignee` | `lead:read` / `write` / `assign` / `delete` |
| پرونده‌ها | `/admin/cases` | `GET /cases`, `PATCH /cases/{id}/stages/{stage}` | `student:read` / `student:stage` (+ `document:review`) |
| رزروها | `/admin/bookings` | `GET/POST /bookings`, `PATCH …/status`, availability/slots | `booking:read` / `write` / `manage` |
| کشورها | `/admin/content/countries` (+ new/edit) | CRUD `/countries`, `…/slug-available` | `content:read` / `write` / `delete` |
| دانشگاه‌ها | `/admin/content/universities` | CRUD `/universities` | همان content:* |
| برنامه‌ها | `/admin/content/programs` | CRUD `/programs` | همان content:* |
| بلاگ | `/admin/content/blog` (+ categories) | CRUD `/blog-posts`, `/blog-categories` | همان content:* |
| اخبار | `/admin/content/news` | CRUD `/news-items` | همان content:* |
| اعلان‌های پنل | `/admin/content/announcements` | CRUD `/announcements` | `content:read` / `write` / `delete` (ایجاد/ویرایش/حذف فقط admin) |
| خدمات | `/admin/content/services` | CRUD + `POST /services/reorder` | همان content:* |
| مشاوران | `/admin/content/consultants` | CRUD + reorder | همان content:* |
| داستان موفقیت | `/admin/content/success-stories` | CRUD + reorder | همان content:* |
| FAQ | `/admin/content/faqs` | CRUD + reorder | همان content:* |
| تیکت‌ها | `/admin/tickets` | `GET/POST /tickets`, messages, close/reopen | `ticket:read` / `write` / `manage` |
| مالی | `/admin/finance` | `GET/POST /invoices`, cancel, mark-paid installments | `payment:read` / `manage` (consultant: فقط read) |
| کاربران | `/admin/users` | `GET/POST /users`, invite, status | `user:manage` (فقط admin) |
| تنظیمات موسسه | `/admin/settings/institute` | `GET/PATCH /settings/institute/*` | `user:manage` |
| ساعات کاری | `/admin/settings/availability` | availability CRUD / holidays | `user:manage` |
| پروفایل | `/admin/profile` | `GET /me`, password, sessions | هر کاربر واردشده |

**نقش مشاور:** `content:read` فقط (بدون write/delete)، `lead:assign`/`lead:delete` ندارد، `payment:manage`/`user:manage` ندارد؛ دامنهٔ lead/case/booking/ticket با scope `assigned`.
