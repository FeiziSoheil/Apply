# فرانت‌اند سامانه مهاجرت تحصیلی (Apply Frontend)

بسته نرم‌افزاری فرانت‌اند سامانه جامع اعزام دانشجو و مهاجرت تحصیلی، پیاده‌سازی‌شده با **Next.js 16 (App Router)**، **TypeScript (Strict Mode)**، **Tailwind CSS** و **shadcn/ui**.

این پروژه بر پایه معماری **Contract-First** توسعه یافته و در فاز فعلی بدون وابستگی به بک‌اند خارجی، تمام فرایندها و ۳۰۸ اندپوینت API را از طریق **MSW (Mock Service Worker)** به همراه پایگاه داده رابطه‌ای در حافظه و اعتبارسنجی Zod شبیه‌سازی می‌کند.

---

## شروع سریع (Quick Start)

```bash
# نصب وابستگی‌ها
npm install

# اجرای سرور توسعه (پورت پیش‌فرض ۳۰۰۰)
npm run dev
```

### آدرس‌های دسترسی محلی:
- **سایت عمومی و کاوشگرها:** `http://localhost:3000`
- **پورتال اختصاصی دانشجو:** `http://localhost:3000/panel` (ورود از `/login`)
- **پنل مدیریت و CRM:** `http://localhost:3000/admin` (ورود از `/staff/login`)

---

## حساب‌های کاربری آزمایشی (Demo Credentials)

| نقش | مسیر ورود | شناسه کاربری | رمز عبور / کد OTP |
| :--- | :--- | :--- | :--- |
| **دانشجو (Student)** | `/login` | موبایل: `09120000000` | کد تأیید: `123456` |
| **مدیر کل (Admin)** | `/staff/login` | ایمیل: `admin@apply.example` | گذرواژه: `Admin@12345` |
| **مشاور ارشد (Consultant)** | `/staff/login` | ایمیل: `consultant1@apply.example` | گذرواژه: `Consultant@12345` |

> **نکته:** ابزار **Dev Panel** شناور در پایین صفحات به شما امکان سوئیچ آنی بین نقش‌ها، ریست دیتابیس آزمایشی و شبیه‌سازی سناریوهای شبکه (قطعی سرور، تاخیر مصنوعی، تعارض همزمانی ۵۰۰ و ۴۰۹) را می‌دهد.

---

## ساختار دایرکتوری و دامنه‌ها

```
Frontend/
├── docs/                   # مستندات جامع فنی و دامنه (معماری، مدل‌ها، CRM، API)
│   ├── README.md           # راهنمای ناوبری مستندات
│   ├── openapi.yaml        # سند جامع OpenAPI 3.1 (بیش از ۳۰۰ اندپوینت)
│   ├── api-conventions.md  # قراردادهای REST، خطاها، صفحه‌بندی و فیلترها
│   ├── crm-domain.md       # قواعد دامنه CRM، سرنخ‌ها، کانبان و فعالیت‌ها
│   ├── student-panel-domain.md # معماری پورتال دانشجو، مراحل پرونده و مدارک
│   ├── content-model.md    # مدل محتوای هیبرید (داده ساختاریافته + RichContent)
│   ├── content-editor.md   # ویرایشگر محتوای پیشرفته Tiptap و نودهای سفارشی
│   ├── crud-kit.md         # کیت توسعه سریع صفحات مدیریت محتوا (CRUD Kit)
│   ├── mocking.md          # معماری MSW، دیتابیس در حافظه، Seed Data و سناریوها
│   ├── settings-binding.md # پیکربندی سیستم، خطوط لوله و زمان‌بندی مشاورین
│   └── deployment-notes.md # راهنمای بیلد، گارد امنیتی و راه‌اندازی با بک‌اند واقعی
├── scripts/                # اسکریپت‌های سیستمی و خودکارسازی
│   ├── generate-openapi.ts # تولید خودکار openapi.yaml از قراردادهای Zod
│   ├── mock-smoke.ts       # تست یکپارچگی داده‌های ماک و گارد RBAC
│   └── capture-screenshots.mjs # اسکریپت دریافت خودکار اسکرین‌شات از تمام پنل‌ها
├── src/
│   ├── app/                # مسیرهای App Router بر اساس دامنه‌ها
│   │   ├── (site)/         # وب‌سایت عمومی (صفحه اصلی، کاوشگرها، مقالات، ابزارها)
│   │   ├── (panel)/        # پورتال دانشجویی (Mobile-First)
│   │   ├── (admin)/        # پنل مدیریت و CRM
│   │   └── (auth)/         # صفحات احراز هویت دانشجو و کارکنان
│   ├── contracts/          # قراردادهای اصلی داده با Zod (Single Source of Truth)
│   ├── features/           # ماژول‌های مستقل هر دامنه
│   ├── components/         # کامپوننت‌های مشترک UI بر پایه shadcn/ui
│   ├── lib/                # کلاینت‌های شبکه، RBAC و ابزارهای کاربردی
│   └── mocks/              # پیاده‌سازی سرور و ورکر MSW، دیتابیس و Seed Data
└── e2e/                    # تست‌های جامع سرتاسری با Playwright
```

---

## دستورات و اسکریپت‌های اجرایی

| دستور | شرح عملکرد |
| :--- | :--- |
| `npm run dev` | اجرای محیط توسعه با کامپایلر سریع Turbopack |
| `npm run lint` | اعتبارسنجی کیفیت و استانداردهای TypeScript و ESLint |
| `npm run test` | اجرای تست‌های واحد (Unit Tests) با Vitest |
| `npm run test:e2e` | اجرای سناریوهای تست کاربر نهایی با Playwright |
| `npm run mock:smoke` | ارزیابی یکپارچگی قراردادهای API، قوانین RBAC و اعتبارسنجی دیتابیس |
| `npm run contract:generate` | بازتولید خودکار سند `docs/openapi.yaml` از قراردادهای Zod |
| `node scripts/capture-screenshots.mjs` | ثبت خودکار اسکرین‌شات از تمام صفحات سایت و پنل‌ها |
| `NEXT_PUBLIC_API_MOCKING=disabled npm run build` | بیلد نسخه Production بدون کدهای شبیه‌ساز (حالت اتصال به بک‌اند) |

> **گارد امنیتی بیلد:** دستور `NEXT_PUBLIC_API_MOCKING=enabled npm run build` به طور خودکار مسدود شده و با ارور متوقف می‌شود تا تصادفاً نسخه تستی با داده‌های ماک در محیط عملیاتی منتشر نگردد؛ مگر آنکه `NEXT_PUBLIC_DEMO_BUILD=enabled` تنظیم شده باشد.

---

## فهرست مستندات مرجع (docs/)

برای مطالعه جزئیات بیشتر به اسناد تخصصی مراجعه نمایید:
1. [راهنمای مستندات (`docs/README.md`)](docs/README.md)
2. [مشخصات فنی OpenAPI (`docs/openapi.yaml`)](docs/openapi.yaml)
3. [استانداردها و قراردادهای API (`docs/api-conventions.md`)](docs/api-conventions.md)
4. [طراحی دامنه پورتال دانشجو (`docs/student-panel-domain.md`)](docs/student-panel-domain.md)
5. [طراحی دامنه CRM و سرنخ‌ها (`docs/crm-domain.md`)](docs/crm-domain.md)
6. [معماری سیستم شبیه‌سازی و داده‌ها (`docs/mocking.md`)](docs/mocking.md)
7. [مدل داده و محتوای غنی (`docs/content-model.md`)](docs/content-model.md)
8. [کیت توسعه پنل‌های مدیریت (`docs/crud-kit.md`)](docs/crud-kit.md)
9. [نکات استقرار و ارتباط با سرور (`docs/deployment-notes.md`)](docs/deployment-notes.md)
