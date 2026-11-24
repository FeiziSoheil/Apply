# قراردادهای API

این سند قواعد مشترک همه endpointهای API موسسه را توضیح می‌دهد. **منبع حقیقت** قرارداد، schemaهای Zod در `src/contracts` است و فایل `docs/openapi.yaml` از روی آن‌ها تولید می‌شود. این فایل را دستی ویرایش نکنید.

```bash
npm run contract:generate   # بازتولید docs/openapi.yaml
```

## ساختار فایل‌ها

| مسیر | توضیح |
| --- | --- |
| `src/contracts/zod.ts` | یک‌باره `extendZodWithOpenApi(z)` را اجرا می‌کند؛ همه فایل‌ها `z` را از اینجا import می‌کنند |
| `src/contracts/common.ts` | envelope، صفحه‌بندی، خطا، پارامترهای فهرست، primitiveها (id، تاریخ، ریال، موبایل) |
| `src/contracts/{auth,users,settings,content,crm,leads,availability,bookings,students,tickets,payments,stats}.ts` | schemaهای دامنه و نوع‌های `z.infer` |
| `src/contracts/richcontent.ts` | RichContent، Section، mark/node whitelist (از `content.ts` re-export می‌شود) |
| `src/contracts/routes/*.ts` | ثبت endpointها (مسیر، متد، request/response، نقش‌های مجاز) |
| `src/contracts/registry.ts` | `registry`، `endpointPolicies` و `buildOpenApiDocument()` |
| `src/contracts/type-alignment.ts` | بررسی زمان کامپایل که entityهای قرارداد با `src/types` سازگار می‌مانند |
| `scripts/generate-openapi.ts` | تولید `docs/openapi.yaml` |

## نسخه‌بندی

- همه مسیرها زیر پیشوند **`/api/v1`** قرار دارند (در OpenAPI به‌صورت `servers[0].url`؛ مسیرها در سند بدون پیشوند آمده‌اند).
- تغییرهای ناسازگار (حذف/تغییر نام فیلد، تغییر معنا) فقط با نسخه جدید (`/api/v2`) انجام می‌شود. افزودن فیلد اختیاری یا endpoint جدید ناسازگار نیست.
- کلاینت باید فیلدهای ناشناخته پاسخ را نادیده بگیرد.

## نام‌گذاری

- مسیرها: حروف کوچک، **kebab-case**، اسم جمع: `/countries`، `/success-stories`، `/blog-posts`.
- شناسه در مسیر: `/{id}`؛ برای منابع محتوایی همچنین `/{resource}/slug/{slug}`.
- زیرمنابع: `/leads/{id}/activities`، `/cases/{id}/documents`.
- کنش‌هایی که CRUD نیستند به‌صورت `POST /{resource}/{id}/{verb}`: `/bookings/{id}/cancel`، `/documents/{id}/review`، `/tickets/{id}/close`.
- مسیرهای کاربر جاری زیر `/me`: `/me`، `/me/bookings`، `/me/cases`.
- فیلدهای JSON و query: **camelCase**. مقادیر enum: **snake_case** (`consultation_scheduled`) یا kebab-case برای `continent` (`north-america`).
- `operationId` یکتا و camelCase: `listCountries`، `createLeadActivity`.

## متدها و کدهای وضعیت

| متد | کاربرد | موفقیت |
| --- | --- | --- |
| `GET` | خواندن | `200` |
| `POST` | ایجاد / کنش | `201` (ایجاد)، `200` (کنش)، `204` (بدون بدنه) |
| `PUT` | تنظیم / جایگزینی یک زیرمنبع یا وضعیت مشخص (`assignLead`، `updateCaseStage`، `replaceInvoiceInstallments`) | `200` |
| `PATCH` | ویرایش جزئی: منابع محتوایی (`/countries/{id}`، `/universities/{id}`، `/programs/{id}`، `/services/{id}`، `/consultants/{id}`، `/success-stories/{id}`، `/blog-posts/{id}`، `/news/{id}`، `/faqs/{id}`)، وضعیت، پروفایل، … | `200` |
| `DELETE` | حذف | `204` |

> ویرایش منابع محتوایی فقط با `PATCH` انجام می‌شود (`operationId`ها مثل `updateCountry` تغییری نکرده‌اند). بدنه همان schema به‌نام `*Update` است که همه فیلدها را اختیاری می‌کند.

## قالب پاسخ موفق

همه پاسخ‌های موفق (به‌جز `204`) داخل envelope هستند:

```json
{
  "data": { "id": "3f2b8c4e-6a1d-4e0b-9c57-8d2f1a7b9e10", "slug": "germany" },
  "meta": { "requestId": "req_01J..." }
}
```

- `data`: خود منبع، یا آرایه‌ای از منابع در فهرست‌ها.
- `meta`: اختیاری. شامل `requestId` و در فهرست‌ها `pagination`.

## قالب خطا

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "داده‌های ورودی نامعتبر است",
    "fields": {
      "mobile": ["شماره موبایل معتبر وارد کنید"],
      "targetCountries": ["حداقل یک کشور مقصد را انتخاب کنید"]
    }
  }
}
```

- `message` فارسی و قابل نمایش مستقیم به کاربر است؛ منطق کلاینت باید روی `code` بنا شود.
- `fields` فقط در `VALIDATION_ERROR` (و گاهی `CONFLICT`) می‌آید. کلید = مسیر فیلد با نقطه (`address.city`، `items.0.title`).

| `code` | HTTP | معنا |
| --- | --- | --- |
| `VALIDATION_ERROR` | **400** | ورودی نامعتبر (body، query یا path). کد وضعیت همیشه **۴۰۰** است، نه ۴۲۲ |
| `UNAUTHORIZED` | 401 | نشست (کوکی `session`) وجود ندارد/نامعتبر/منقضی است، یا اعتبارنامه اشتباه |
| `FORBIDDEN` | 403 | نقش یا مالکیت اجازه نمی‌دهد |
| `NOT_FOUND` | 404 | منبع وجود ندارد (یا کاربر اجازه دانستن وجودش را ندارد) |
| `CONFLICT` | 409 | تعارض با وضعیت فعلی (اسلات پر، slug تکراری، انتقال وضعیت غیرمجاز، عدم تطابق نسخه) |

### تعارض نسخه (`version_mismatch`)

موجودیت‌های قابل‌ویرایش هم‌زمان (`Lead`، `StudentCase`، `Document`، …) فیلد صحیح `version` دارند (شروع از ۱). همه `PATCH`/`PUT` این منابع باید هدر **`If-Match`** با مقدار نسخه فعلی بفرستند.

```http
PATCH /leads/{id}
If-Match: 3
```

اگر نسخه هم‌خوان نباشد:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "این رکورد توسط کاربر دیگری تغییر کرده است؛ صفحه را تازه کنید",
    "reason": "version_mismatch",
    "currentVersion": 4
  }
}
```

کلاینت روی `error.reason === "version_mismatch"` شاخه می‌زند و UI را با `currentVersion` تازه می‌کند. فیلدهای `reason` و `currentVersion` اختیاری‌اند و فقط در این نوع تعارض پر می‌شوند.
| `RATE_LIMITED` | 429 | محدودیت نرخ؛ هدر `Retry-After` (ثانیه) ارسال می‌شود |
| `INTERNAL` | 500 | خطای پیش‌بینی‌نشده سرور (بدون افشای جزئیات) |

## احراز هویت و نقش‌ها

- **سازوکار احراز هویت قرارداد:** کوکی **httpOnly** با نام **`session`** (در OpenAPI: `securitySchemes.sessionCookie`، `type: apiKey`، `in: cookie`). بک‌اند هنگام `POST /auth/otp/verify` و `POST /auth/login` آن را با `Set-Cookie` (`HttpOnly; Secure; SameSite=Lax; Path=/`) می‌گذارد و در `POST /auth/logout` با `Max-Age=0` پاک می‌کند. کلاینت فقط `credentials: "include"` می‌فرستد؛ هیچ توکنی در body پاسخ نمی‌آید و در JS نگه داشته نمی‌شود. تمدید با `POST /auth/refresh` (بدون body).
- **`Authorization: Bearer` بخشی از قرارداد عمومی نیست** و بک‌اند واقعی آن را نمی‌پذیرد؛ کلاینت در حالت واقعی هرگز آن را نمی‌فرستد. Bearer فقط یک جزئیات داخلی API آزمایشی (MSW) است — `docs/mocking.md`.
- محدودیت‌های OTP: کد **۲ دقیقه** اعتبار دارد، هر کد حداکثر **۳ تلاش** ناموفق (پس از آن باطل می‌شود و باید کد جدید گرفت)، حداکثر ۵ درخواست کد در ساعت برای هر شماره. خطاها `VALIDATION_ERROR` (۴۰۰) با فیلد `code` یا `RATE_LIMITED` (۴۲۹) هستند. ثابت‌ها در `src/contracts/session.ts` است.
- محافظت مسیرها (`src/proxy.ts`، جایگزین `middleware.ts` در Next.js 16): مسیرهای `/panel` (دانشجو) و `/admin` (ادمین و مشاور) بدون کوکی `session` به `/login?returnUrl=…` (برای `/admin`: `/staff/login?returnUrl=…`) می‌روند. نقش در سمت فرانت‌اند قابل‌خواندن نیست (کوکی httpOnly است)، پس نقش دقیق را `RequireRole` در layoutهای کلاینت از روی `GET /me` اعمال می‌کند (دانشجو در `/admin` و کارمند در `/panel` صفحه ۴۰۳ می‌بیند، نه ریدایرکت) و بک‌اند با ۴۰۳. صفحات ورود در proxy ریدایرکت نمی‌شوند؛ کاربرِ واردشده در کلاینت (`GuestOnly`) بعد از تأیید `GET /me` به `returnUrl` یا خانه نقش خودش (`/panel` برای دانشجو، `/admin` برای ادمین و مشاور) هدایت می‌شود.
- نقش‌ها: `admin`، `consultant`، `student`. دانشجویان با OTP موبایل و کارمندان با ایمیل/رمز وارد می‌شوند.
- هر operation در OpenAPI شامل `security` و افزونه‌های `x-auth` و `x-roles` است. همین اطلاعات در کد با `endpointPolicies` (از `registry.ts`) هم در دسترس است تا middleware بک‌اند مستقیم از آن تولید/بررسی شود.
- نقش مجاز **لازم** است ولی کافی نیست: دانشجو فقط داده‌های خودش و consultant فقط سرنخ‌ها/پرونده‌های اختصاص‌یافته به خودش را می‌بیند (در توضیح هر endpoint آمده است).

## صفحه‌بندی

پارامترهای query همه فهرست‌ها:

| پارامتر | نوع | پیش‌فرض | توضیح |
| --- | --- | --- | --- |
| `page` | عدد صحیح ≥ ۱ | `1` | شماره صفحه (از ۱) |
| `pageSize` | عدد صحیح ۱ تا ۱۰۰ | `20` | تعداد در هر صفحه |

پاسخ:

```json
{
  "data": [ { "...": "..." } ],
  "meta": {
    "pagination": { "page": 1, "pageSize": 20, "total": 134, "totalPages": 7 }
  }
}
```

صفحه‌ای فراتر از `totalPages` خطا نیست؛ `data` خالی برمی‌گردد.

## فیلتر، جست‌وجو و مرتب‌سازی

- `q`: جست‌وجوی متنی (حداکثر ۱۰۰ نویسه) روی فیلدهای متنی اصلی همان منبع.
- فیلترهای هر منبع، پارامتر query مستقل با نام همان فیلد هستند و با AND ترکیب می‌شوند: `GET /programs?country=germany&degreeLevel=master&hasScholarship=true`.
- بازه‌ها با پیشوند `min`/`max` (`minTuition`) یا `from`/`to` (`createdFrom`، `createdTo`).
- بولین‌ها در query به‌صورت `true` / `false` ارسال می‌شوند.
- `sort`: نام یکی از فیلدهای مجاز آن منبع (در OpenAPI به‌صورت enum آمده)، و `order`: `asc` (پیش‌فرض) یا `desc`. فقط یک فیلد مرتب‌سازی.
- `GET /programs` علاوه بر `sort`، پارامتر `preset` (`relevant` | `cheapest` | `nearest_deadline`) را برای هم‌خوانی با `ProgramSort` فعلی UI دارد.
- فهرست‌های عمومی محتوا (`countries`، `universities`، `programs`، `services`، `blog-posts`، `news`، `success-stories`) فقط موارد `published` را برمی‌گردانند؛ فیلتر `status` فقط برای کارمندان اعمال می‌شود. وضعیت `scheduled` در mock هنگام خواندن، اگر `scheduledAt` گذشته باشد، به `published` تبدیل می‌شود.
- یکتایی اسلاگ: `GET /{resource}/slug-available?slug=&excludeId=` برای منابع دارای slug (کشور، دانشگاه، برنامه، خدمت، داستان موفقیت، دسته وبلاگ، مقاله، خبر).
- یکپارچگی ارجاعات (mock): حذف کشور دارای دانشگاه/برنامه یا دانشگاه دارای برنامه → `409 CONFLICT` با پیام فارسی؛ تغییر `University.slug` (و در صورت نیاز `countrySlug`) اسلاگ ارجاعی برنامه‌های وابسته را به‌روز می‌کند؛ `University.programsCount` در پاسخ از شمارش واقعی برنامه‌ها محاسبه می‌شود.
- مرتب‌سازی دستی: فیلد صحیح `order` روی `services`، `consultants`، `success-stories`، `faqs` و `POST /{resource}/reorder` با بدنه `{ items: [{ id, order }] }`.
- دسته‌های وبلاگ: CRUD روی `/blog-categories`؛ حذف دسته‌ای که مقاله دارد → `409 CONFLICT` با پیام فارسی.
- `GET /blog-posts` فیلترهای `author`، `publishedFrom` / `publishedTo` (تاریخ میلادی روی `publishedAt`)، `tag`، `category` / `categoryId` را می‌پذیرد.
- `NewsItem` می‌تواند `eventDate` و `registrationUrl` داشته باشد (رویدادها / ثبت‌نام).
- مدل محتوای هیبرید (RichContent / sections / SEO): `docs/content-model.md`.

## کاربران کارمند

- فهرست / دعوت / ویرایش / بازنشانی رمز: `GET /users`، `POST /users/invite`، `PATCH /users/{id}`، `POST /users/{id}/reset-password` — فقط admin با `user:manage`. فقط نقش‌های `admin` و `consultant`.
- دعوت و بازنشانی رمز در پاسخ mock فیلد `temporaryPassword` برمی‌گردانند (نمایش در toast).
- مدیر نمی‌تواند نقش یا وضعیت **خودش** را عوض کند؛ غیرفعال‌کردن یا تنزل آخرین مدیر فعال → `409 CONFLICT` با پیام فارسی.
- پروفایل: `PATCH /me` (نام/ایمیل)، `POST /me/change-password` (قدرت رمز)، `GET /me/sessions` (نشست‌های فعال).
- **پنل دانشجو:** پروفایل غنی `GET/PATCH /me/profile`، اتصال پرونده پس از OTP (`caseLink` در `Session`)، Viewهای جدا (`/me/case`، `/me/documents` + `POST /me/documents/upload`، `/me/tasks`)، تیکت/پرداخت زیر `/me/*`، شورت‌لیست، اعلان‌های موسسه. مبالغ CRM/پرداخت در API ریال‌اند؛ در UI با `formatMoney` از `@/lib/format` به‌صورت تومان نمایش داده می‌شوند. جزئیات: `docs/student-panel-domain.md`.
- دانشجو برای منبع دیگران همیشه **۴۰۴** می‌گیرد (نه ۴۰۳) تا وجود منبع لو نرود.
- آپلود فایل: `POST /files` نام ذخیره‌شده را UUID می‌کند (نام اصلی دانشجو Audit/لاگ نمی‌شود).

## تنظیمات موسسه

- `GET /settings/institute` و `PUT` مستقل برای هر بخش: `/info`، `/contact`، `/social`، `/licenses`، `/seo`، `/sms-templates` — فقط admin / `user:manage`.
- تصاویر لوگو، OG و مجوزها فقط با `fileId` (آپلود `POST /files`).
- قالب پیامک متغیرهایی مثل `{name}` و `{date}` دارد؛ برچسب و فهرست متغیرها سرور‌مدیریت‌شده‌اند.
- سایت عمومی فعلاً از `src/lib/constants.ts` می‌خواند؛ فهرست فایل‌های قابل اتصال: `docs/settings-binding.md`.

## آمار داشبورد (`GET /admin/stats`)

- فقط کارمند (`admin` / `consultant`) با مجوز `lead:read`.
- Query: `rangeDays` = `7` | `30` | `90` (پیش‌فرض `30`).
- پاسخ: کارت‌های KPI با `changePercent` نسبت به دورهٔ هم‌طول قبلی، روند روزانه سرنخ، منابع UTM، قیف وضعیت، لیست «نیازمند اقدام» و برنامه امروز.
- مشاور فقط سرنخ‌های `assignedTo`، رزروهای `consultantId` و پرونده‌های `consultantId` خودش را می‌بیند؛ ادمین همه را.
- «سرنخ بدون پیگیری»: وضعیت غیرپایانی و آخرین فعالیت (یا `createdAt` اگر فعالیتی نباشد) بیش از ۲ روز قبل.
- رزروهای «امروز» و برنامه امروز بر اساس تاریخ تقویمی تهران (`Asia/Tehran`) هستند.
- mock از collections واقعی (`leads` / `bookings` / `cases` / `activities`) تجمیع می‌کند؛ سرنخ عمومی تازه باید در آمار دیده شود.

## رزرو و ساعات کاری (Availability)

- `GET /bookings/slots?date=YYYY-MM-DD` اسلات‌ها را از تنظیمات ساعات کاری می‌سازد (وقت تهران). جمعه و تعطیلات سراسری به‌طور پیش‌فرض بسته‌اند مگر روز ویژه (`specialDays`) خلاف آن را بگوید.
- تنظیمات هر مشاور (`ConsultantAvailability`): برنامه هفتگی (روز × چند بازه `HH:mm`)، `slotDurationMinutes`، `gapMinutes`، `maxDailyBookings`، مرخصی (`leaves`) و روز ویژه.
- تعطیلات سراسری: `GET/PUT/POST/DELETE /availability/holidays` (فقط admin / `user:manage`).
- CRUD ساعات کاری: `/availability` و `/availability/{consultantId}` (فقط admin).
- تداخل زمانی مشاور در ایجاد/جابه‌جایی رزرو → `409 CONFLICT` با پیام فارسی.
- تغییر مشاور (`PATCH /bookings/{id}` با `consultantId`) فقط admin؛ مشاور فقط رزروهای خودش را می‌بیند و وضعیت/یادداشت را عوض می‌کند.
- `POST /bookings/{id}/remind` فقط تاریخچه را ثبت می‌کند (ارسال واقعی پیامک/ایمیل بعداً).
- `GET /bookings/{id}/history` فهرست `BookingChange` (جدیدترین اول).
- ایجاد دستی کارمند: `POST /bookings/staff`.

## تاریخ و زمان

- زمان‌های لحظه‌ای (`createdAt`، `startsAt`، `publishedAt`، …): **ISO 8601 در UTC** با پسوند `Z`، مثل `2026-10-18T20:25:00.000Z`.
- تاریخ تقویمی بدون ساعت (`dueDate`، `deadline`): `YYYY-MM-DD` (میلادی).
- API هرگز تاریخ شمسی نمی‌فرستد/نمی‌پذیرد؛ تبدیل به جلالی و منطقه زمانی `Asia/Tehran` فقط در لایه نمایش (`date-fns-jalali`) انجام می‌شود. استثنا: پارامتر `date` در `GET /bookings/slots` روز را بر پایه وقت تهران تفسیر می‌کند؛ بازه‌های ساعات کاری هم `HH:mm` به وقت تهران‌اند.
- فیلدهای `createdAt` و `updatedAt` را سرور مدیریت می‌کند و در Create/Update پذیرفته نمی‌شوند.

## پول

- همه مبالغ پرداخت و فاکتور **ریال** و **عدد صحیح** (`integer`) هستند؛ هرگز اعشار یا تومان نیستند. فیلد `currency` در فاکتور همیشه `"IRR"` است.
- مقادیر ارزی محتوای آموزشی **ارز خودشان** را دارند: فیلد `currency` (کد ISO 4217 سه‌حرفی، پیش‌فرض `EUR`) کنار فیلدهای پولی می‌آید:
  - `Country.currency` ← `costOfLiving` و `tuitionRange`
  - `University.currency` ← `tuitionPerYear`
  - `Program.currency` ← `tuition`
  - `AssessmentProfile.currency` ← `annualBudget`
  - UI مبلغ را همیشه با همین ارز نمایش می‌دهد. داده نمونه ارز واقعی هر کشور را دارد (`EUR`، `CAD`، `AUD`، `TRY`، `HUF`، `MYR`).
  - فیلترهای `minTuition` / `maxTuition` و مرتب‌سازی شهریه بین ارزهای مختلف بر پایه **معادل یورو** انجام می‌شود (نرخ‌های تقریبی `FX_RATES`).
- `Service.price` ریال (عدد صحیح) است؛ داده نمونه (`src/data/services.ts`) هم ریال است و فقط UI برای نمایش آن را به تومان (÷۱۰) تبدیل می‌کند.

## شناسه‌ها

- همه `id`ها **UUID** هستند (`string`، فرمت `uuid`). کلاینت آن‌ها را مبهم (opaque) فرض می‌کند.
- منابع محتوایی علاوه بر `id` یک `slug` یکتا (ASCII، kebab-case) دارند و ارجاع بین منابع محتوایی با slug است (`Program.countrySlug`).
- کدهای قابل نمایش به کاربر (`Booking.code`، `Ticket.code`، `Invoice.number`) جدا از `id` هستند.

## آپلود فایل

1. `POST /files` با `multipart/form-data` و فیلد `file` ← `FileAsset` با `id`.
2. `id` در درخواست بعدی استفاده می‌شود (`fileId` در ساخت مدرک، `attachmentIds` در تیکت/پیام).

## ورودی‌ها

- موبایل: همیشه به‌صورت **نرمال‌شده با ارقام انگلیسی** (`09123456789`). تبدیل ارقام فارسی/عربی وظیفه کلاینت است (`normalizeDigits`).
- رشته‌ها trim می‌شوند؛ رشته خالی برای فیلد اختیاری معادل ارسال نکردن آن است.
- فیلد honeypot (`website` در `/leads/quick-contact`) باید خالی باشد؛ در غیر این صورت درخواست بی‌صدا نادیده گرفته می‌شود و پاسخ موفق برمی‌گردد.
- پیام‌های خطای اعتبارسنجی schemaها فارسی هستند و عیناً در `error.fields` برمی‌گردند.

## اتصال به بک‌اند

- می‌توان از همین schemaها برای validation سمت سرور (Node) استفاده کرد، یا `docs/openapi.yaml` را برای تولید مدل/اعتبارسنجی در Go (مثلاً `oapi-codegen`) به‌کار برد.
- برای اتصال فرانت‌اند، لایه `src/services` را با fetch به `/api/v1` جایگزین کنید و پاسخ را با schemaهای `src/contracts` پارس کنید؛ `src/contracts/type-alignment.ts` تضمین می‌کند entityها با نوع‌های فعلی `src/types` سازگار می‌مانند.

## مجوزها (RBAC)

- فهرست مجوزها به‌صورت `domain:action` و نقشه نقش ← مجوزها در `src/lib/rbac/permissions.ts` است (تنها منبع حقیقت؛ `CurrentUser.permissions` در `GET /me` همین را برمی‌گرداند).
- مجوزها درشت‌دانه‌اند؛ اینکه نقش به کدام رکوردها دسترسی دارد (`all` / `assigned` / `own`) با `ROLE_SCOPES` مستند و در handlerها/بک‌اند اعمال می‌شود.
- هر endpoint در `src/contracts/routes` با `requires("domain:action", roles?)` تعریف می‌شود؛ نقش‌های مجاز از نقشه RBAC مشتق می‌شوند و در OpenAPI به‌صورت `x-roles` و `x-permission` می‌آیند. نبود مجوز ← `403 FORBIDDEN` با بدنه استاندارد خطا.
- فرانت‌اند: `useCan(permission)`، `<Can permission="…">` (`src/components/rbac`) و `can(session, permission)` (`src/lib/rbac/can.ts`، قابل استفاده در سرور). منوی پنل‌ها از `src/components/panel/nav-config.ts` ساخته و بر اساس مجوز فیلتر می‌شود. پنهان‌کردن UI صرفاً تجربه کاربری است؛ مرز امنیتی، پاسخ ۴۰۳ API است.
- مجوزهای CRM: `lead:import|export|merge`، `case:read|write|review`، `task:read|write`، `report:read`، `crm-settings:manage`، `audit:read`. جزئیات دامنه و ماتریس دسترسی: `docs/crm-domain.md`.

## CRM (سرنخ و پایپ‌لاین)

- `Lead.status` ثابت حذف و با `stageId` (مرجع `PipelineStage`) + فیلد مشتق `stageKind` جایگزین شد. داشبورد و آمار روی `stageKind` کار می‌کنند.
- هنگام ورود به مرحله `kind=lost` فیلد `lostReasonId` الزامی است.
- فعالیت‌ها discriminated union با `entityType`/`entityId` (`lead` | `case`)؛ تغییر مرحله = `stage_change`.
- هر تغییر موجودیت Activity + AuditLog (+ در صورت نیاز Notification) ثبت می‌کند؛ در mock از `emitDomainEvent` (`src/mocks/domain-events.ts`) و جدول رویداد در `docs/crm-domain.md`.
- اعلان‌ها: `GET/POST /me/notifications*`، `GET/PUT /me/notification-preferences`؛ حسابرسی فقط‌خواندنی `GET /audit-logs` و `GET /audit-logs/export` (`audit:read`). فیلدهای `AUDIT_SENSITIVE_FIELDS` در diff حسابرسی ظاهر نمی‌شوند.
- پرونده: `POST /cases/{id}/advance-stage` با `If-Match`؛ نادیده گرفتن چک‌لیست فقط admin (`overrideIncomplete` + `overrideReason`). مدارک: نسخه‌ها در `Document.versions`؛ `POST /documents/{id}/revert` برای باز کردن قفل تأیید.
- کارها: `Task.version` + `If-Match` روی `PATCH /tasks/{id}` و `POST /tasks/{id}/snooze`؛ `GET /tasks/counts`؛ `POST /tasks/bulk-complete`؛ `POST /tasks/process-reminders` فقط برای mock (یادآور production = job زمان‌بندی‌شده).
- تخصیص خودکار هنگام ایجاد لید از قوانین `AssignmentRule`؛ در غیر این صورت `CrmDefaults.defaultAssigneeId` یا `assignedTo` خالی.
- تنظیمات CRM (admin، `crm-settings:manage`): هر تب `GET/PUT /crm-settings/…` با `version` + هدر `If-Match`؛ `POST …/reset` برای بازگشت به seed؛ تغییرها از طریق `emitDomainEvent` حسابرسی می‌شوند. شبیه‌ساز تخصیص: `POST /assignment-rules/simulate`. ادغام تگ: `POST /tags/merge`. کپی قالب پرونده: `POST /case-templates/copy`.
- ورود/خروجی لید: `POST /leads/import` (بدنه JSON سطرهای نگاشت‌شده، نه multipart خام)، `POST /leads/imports/{importId}/revert` (admin)، `GET /leads/export` (`columns`، `format`). موبایل در import با نرمال‌سازی `+98` / ارقام فارسی به `09xxxxxxxxx`. مرجع: `docs/crm-domain.md`.
- گزارش‌های CRM: `GET /reports/funnel`، `/reports/consultants`، `/reports/sources`، `/reports/timeseries`، `/reports/tickets` با `report:read`؛ UI در `/admin/reports` (تب تیکت‌ها). مشاور فقط محدودهٔ خودش را می‌بیند.
- تیکت دانشجو: `/me/tickets*`؛ کارکنان: `/tickets*` و `/admin/tickets`. هدر اختیاری `Idempotency-Key` روی `POST …/messages`. کانال قالب `ticket` در `MessageChannel`.
- مرجع کامل (ماتریس نقش×صفحه، متریک‌ها، رویداد←Activity←Notification←Audit): `docs/crm-domain.md`.
