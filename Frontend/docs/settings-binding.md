# اتصال سایت عمومی به API تنظیمات موسسه

ادمین از مسیر `/admin/settings/institute` تنظیمات را از طریق قرارداد
`/settings/institute` می‌خواند و می‌نویسد. **سایت عمومی فعلاً از
`src/lib/constants.ts` (و آمار هاردکد در هیرو) تغذیه می‌شود.**

وقتی بک‌اند واقعی وصل شد، این فایل‌ها باید به `GET /settings/institute`
(یا endpoint عمومی معادل) سوییچ کنند:

| بخش تنظیمات | فیلدهای قرارداد | مصرف‌کننده‌های فعلی |
| --- | --- | --- |
| اطلاعات موسسه | `info.name`, `nameEn`, `tagline`, `description`, `logoFileId`, `foundingYear` | `src/lib/constants.ts` → `INSTITUTE`؛ `src/components/layout/site-logo.tsx`؛ `src/components/panel/panel-sidebar.tsx`؛ `src/app/layout.tsx`؛ `src/app/(site)/page.tsx`؛ `src/app/(auth)/layout.tsx`؛ `src/lib/seo.ts`؛ `src/components/layout/footer.tsx`؛ `src/components/home/hero/boarding-pass-form.tsx`؛ صفحات `privacy` / `terms` |
| آمار صفحه اصلی | `info.homepageStats` | `src/components/home/stats-bar.tsx` (لیست هاردکد) |
| تماس | `contact.*` | `src/lib/constants.ts` → `CONTACT`؛ `src/components/layout/footer.tsx`؛ `src/lib/seo.ts`؛ فرم‌ها و CTAهای تماس |
| شبکه‌ها / واتساپ / تلگرام | `social.*` | `src/lib/constants.ts` → `SOCIAL_LINKS` و `CONTACT.whatsappHref`؛ `src/components/layout/footer.tsx` |
| مجوزها / نشان‌ها | `licenses[]` (`imageFileId`) | `src/lib/constants.ts` → `TRUST_BADGES`؛ `src/components/layout/footer.tsx`؛ `src/components/about/about-licenses.tsx`؛ `src/data/about.ts` (بخش مجوزها) |
| SEO پیش‌فرض | `seo.*` | `src/lib/seo.ts`؛ `src/app/layout.tsx` metadata |
| قالب پیامک | `smsTemplates[]` | فعلاً فقط ادمین؛ ارسال واقعی پیامک بعداً |

## الگوی پیشنهادی اتصال

1. یک loader سروری (`src/services/institute-settings.ts`) که
   `GET /settings/institute` را می‌خواند و با schema قرارداد پارس می‌کند.
2. برای build عمومی بدون auth، یا endpoint عمومی فقط‌خواندنی
   (`GET /public/institute`) اضافه شود، یا پاسخ ادمین در CDN/ISR کش شود.
3. `fileId` لوگو / OG / مجوزها از طریق `resolveFileUrl` به URL عمومی تبدیل شود.
4. پس از سوییچ، ثابت‌های `INSTITUTE` / `CONTACT` / `SOCIAL_LINKS` /
   `TRUST_BADGES` فقط به‌عنوان fallback توسعه باقی بمانند یا حذف شوند.

علامت‌گذاری در کد: `TODO(settings-api)` در `src/lib/constants.ts` و
`src/components/home/stats-bar.tsx`.
