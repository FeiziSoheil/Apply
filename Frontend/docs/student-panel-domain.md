# دامنه پنل دانشجو

منبع حقیقت قرارداد: `src/contracts/student-panel.ts`، گسترش‌های `tickets.ts` / `payments.ts` / `auth.ts` / `crm.ts`، و مسیرهای `src/contracts/routes/student-panel.ts`.

---

## اصول کلیدی معماری و امنیت

| اصل | رفتار پیاده‌سازی‌شده |
| --- | --- |
| **موبایل‌فرست (Mobile-First)** | تجربه کاربری با شل اختصاصی، ناوبری شناور پایین، کنترل یک‌دستی و عملکرد روان بدون نیاز به دانش فنی |
| **ایزولاسیون کامل (Strict Isolation)** | دسترسی به منبع هر کاربر دیگر (پرونده، مدرک، تیکت، پرداخت، فایل، شورت‌لیست) ← **۴۰۴ Not Found** (نه ۴۰۳ برای جلوگیری از حمله بررسی وجود منبع / Enumeration Attack) |
| **نماهای اختصاصی پاک (Clean *View)** | پاسخ‌های دانشجو صرفاً از اسکیمای `*View` صادر می‌شوند؛ فیلدهای داخلی پرسنل (یادداشت‌ها، سرنخ‌ها، ارزش مالی، تاریخچه‌های حساس، هویت کارمندان) با تست‌های اسنپ‌شات تضمین شده‌اند |
| **محاسبات مالی دقیق** | در لایه API و قراردادها مبالغ به **ریال** ذخیره می‌شوند؛ در سطح UI تابع `formatMoney` از `@/lib/format` مبالغ را همیشه به **تومان** نمایش می‌دهد |
| **لینک‌های امضاشده کوتاه‌مدت** | فایل‌های حساس دانشجو از طریق لینک‌های امضاشده با انقضای ۱۵ دقیقه‌ای و قفل‌شده روی شناسه همان کاربر سرو می‌شوند |
| **محدودیت نرخ (Rate Limiting)** | حفاظت در برابر سوءاستفاده از ارسال OTP و آپلود فایل با کد **429** و هدر **Retry-After** و بازخورد مناسب در UI |
| **محافظت در برابر XSS** | متون پیام‌ها، تیکت‌ها و مکاتبات هرگز به صورت HTML خام رندر نمی‌شوند و از رندر امن متنی استفاده می‌کنند |
| **PWA سبک و ایزوله** | وب‌مانیفست استاندارد فارسی، Service Worker کش‌کننده استاتیک و هندلر آفلاین (`/offline`)، بدون کش‌کردن مدارک یا پاسخ‌های API و بدون تداخل با MSW |

---

## جدول ماتریس «دامنه ← Endpoint ← Permission»

| دامنه | متد | مسیر (Endpoint) | دسترسی / نقش‌ها | مجوز لازم (Permission) | رفتار در عدم مالکیت / خطای دسترسی |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **auth** | POST | `/api/v1/auth/otp/request` | همه کاربران (Public) | — | ۴۲۹ در صورت درخواست مکرر (Rate Limit) |
| **auth** | POST | `/api/v1/auth/otp/verify` | همه کاربران (Public) | — | ۴۰۱ در کد اشتباه یا منقضی |
| **student** | GET | `/api/v1/me/profile` | `student` | `student:read` | ۴۰۱ در صورت عدم لاگین |
| **student** | PATCH | `/api/v1/me/profile` | `student` | `student:write` | ۴۰۱ در صورت عدم لاگین / ۴۰۹ در تعارض |
| **student** | POST | `/api/v1/me/profile/mobile/request` | `student` | `student:write` | ۴۲۹ در صورت ارسال مکرر |
| **student** | POST | `/api/v1/me/profile/mobile/verify` | `student` | `student:write` | ۴۰۰ در کد نامعتبر / ۴۰۹ در صورت تکراری بودن شماره |
| **case** | GET | `/api/v1/me/case-link` | `student` | `student:read` | وضعیت `linked` / `select` / `none` |
| **case** | POST | `/api/v1/me/case-link/select` | `student` | `student:write` | **۴۰۴** اگر پرونده متعلق به این شماره نباشد |
| **case** | GET | `/api/v1/me/case` | `student` | `student:read` | **۴۰۴** اگر پرونده‌ای متصل نباشد یا متعلق به دیگری باشد |
| **case** | GET | `/api/v1/me/tasks` | `student` | `student:read` | کارهای استخراج‌شده از وضعیت پرونده دانشجو |
| **document** | GET | `/api/v1/me/documents` | `student` | `student:read` | فهرست مدارک پرونده جاری دانشجو |
| **document** | GET | `/api/v1/me/documents/{id}` | `student` | `student:read` | **۴۰۴** اگر مدرک متعلق به پرونده دانشجو نباشد |
| **document** | POST | `/api/v1/me/documents/upload` | `student` | `document:upload` | **۴۰۴** در مدرک یا فایل نامعتبر/متعلق به دیگری؛ ۴۲۹ در آپلود مکرر |
| **file** | POST | `/api/v1/files` | همه کاربران لاگین | — | ۴۲۹ در آپلود بیش از حد مجاز در پنجره زمانی |
| **file** | GET | `/mock-files/{id}/{name}` | مالک فایل / دارای امضا | — | **۴۰۴** در عدم تطابق مالک/امضا؛ **۴۱۰** در صورت انقضای لینک |
| **ticket** | GET | `/api/v1/me/tickets` | `student` | `ticket:read` | فقط تیکت‌های ایجادشده توسط همین دانشجو |
| **ticket** | POST | `/api/v1/me/tickets` | `student` | `ticket:write` | ایجاد تیکت و ارجاع خودکار به مشاور پرونده |
| **ticket** | GET | `/api/v1/me/tickets/{id}` | `student` | `ticket:read` | **۴۰۴** اگر تیکت متعلق به دانشجو نباشد (پیام داخلی حذف می‌شود) |
| **ticket** | POST | `/api/v1/me/tickets/{id}/messages` | `student` | `ticket:write` | **۴۰۴** اگر تیکت متعلق به دانشجو نباشد؛ ۴۰۹ اگر تیکت بسته باشد |
| **ticket** | POST | `/api/v1/me/tickets/{id}/close` | `student` | `ticket:write` | **۴۰۴** در صورت عدم تعلق به دانشجو |
| **ticket** | POST | `/api/v1/me/tickets/{id}/reopen` | `student` | `ticket:write` | **۴۰۴** در صورت عدم تعلق؛ ۴۰۹ در گذشت بیش از ۷ روز |
| **ticket** | POST | `/api/v1/me/tickets/{id}/rating` | `student` | `ticket:write` | **۴۰۴** در صورت عدم تعلق؛ ۴۰۹ اگر تیکت بسته نباشد |
| **ticket** | GET | `/api/v1/tickets` | `admin`, `consultant` | `ticket:read` | مشاور فقط پرونده‌های خود؛ ادمین همه |
| **ticket** | POST | `/api/v1/tickets/{id}/messages` | `admin`, `consultant` | `ticket:manage` | ارسال پاسخ پرسنل با امکان علامت‌گذاری `internal` |
| **payment** | GET | `/api/v1/me/payments/summary` | `student` | `payment:read` | خلاصه آماری پرداخت‌ها فقط برای پرونده دانشجو |
| **payment** | GET | `/api/v1/me/installments` | `student` | `payment:read` | فهرست اقساط پرونده دانشجو |
| **payment** | POST | `/api/v1/me/installments/{id}/pay` | `student` | `payment:write` | **۴۰۴** اگر قسط متعلق به دانشجو نباشد؛ ایجاد شناسه پرداخت |
| **payment** | GET | `/api/v1/me/payments/{id}` | `student` | `payment:read` | **۴۰۴** در تلاش پرداخت متعلق به دیگری (منبع حقیقت پرداخت) |
| **payment** | GET | `/api/v1/me/invoices` | `student` | `payment:read` | فاکتورهای صادرشده برای پرونده دانشجو |
| **payment** | GET | `/api/v1/me/invoices/{id}` | `student` | `payment:read` | **۴۰۴** اگر فاکتور متعلق به دانشجو نباشد |
| **payment** | GET | `/api/v1/me/payment-account` | `student` | `payment:read` | اطلاعات حساب بانکی موسسه جهت کارت‌به‌کارت |
| **payment** | POST | `/api/v1/cases/{id}/payment-plan` | `admin` | `payment:manage` | تعریف اقساط و برنامه پرداخت برای پرونده |
| **payment** | PATCH | `/api/v1/installments/{id}` | `admin` | `payment:manage` | ویرایش تاریخ یا مبلغ قسط |
| **payment** | POST | `/api/v1/installments/{id}/cancel` | `admin` | `payment:manage` | لغو قسط پرداخت‌نشده با ثبت دلیل |
| **payment** | POST | `/api/v1/payments/{id}/verify` | `admin` | `payment:manage` | تأیید یا رد فیش واریزی کارت‌به‌کارت |
| **payment** | GET | `/api/v1/finance/summary` | `admin`, `consultant` | `payment:read` | خلاصه مالی کل (مشاور محدود به پرونده‌های خود) |
| **payment** | GET | `/api/v1/finance/transactions` | `admin`, `consultant` | `payment:read` | فهرست تراکنش‌ها و واریزی‌ها |
| **payment** | GET | `/api/v1/finance/report` | `admin`, `consultant` | `payment:read` | گزارش درآمدهای وصول‌شده و پیش‌بینی‌ها |
| **shortlist** | GET | `/api/v1/me/shortlist` | `student` | `student:read` | فهرست رشته‌ها و دانشگاه‌های نشان‌شده دانشجو |
| **shortlist** | PUT | `/api/v1/me/shortlist` | `student` | `student:write` | افزودن مورد به لیست علاقه‌مندی‌ها |
| **shortlist** | DELETE | `/api/v1/me/shortlist` | `student` | `student:write` | حذف مورد از لیست علاقه‌مندی‌ها |
| **shortlist** | GET | `/api/v1/me/shortlist/compare` | `student` | `student:read` | مقایسه ساختاریافته موارد شورت‌لیست |
| **shortlist** | POST | `/api/v1/me/shortlist/merge` | `student` | `student:write` | ادغام علاقه‌مندی‌های لوکال مهمان پس از ورود |
| **shortlist** | POST | `/api/v1/me/shortlist/consult` | `student` | `student:write` | تبدیل لیست کوتاه به تیکت/درخواست مشاوره |
| **announcement**| GET | `/api/v1/me/announcements` | `student` | `student:read` | فقط اعلان‌های منتشرشده و هدف‌گذاری‌شده دانشجو |
| **announcement**| CRUD | `/api/v1/announcements` | `admin` (`content:*`) | `content:read/write/delete` | مدیریت کامل اعلان‌های سیستم |

---

## تفکیک نماها (View vs Entity)

هیچ Entity خامی از لایه پایگاه داده یا CRM مستقیماً به دانشجو بازگردانده نمی‌شود. تبدیل از طریق توابع Transformer در `src/mocks/domain/student-panel.ts` و اسکیموهای قرارداد `src/contracts/student-panel.ts` انجام می‌گیرد:

1. **StudentCaseView در برابر StudentCase**:
   - حذف کامل فیلدهای `leadId`، `consultantNotes`، `internalHistory`، `leadScore`، `contractValue`.
   - فقط مراحل عمومی، مشاور پرونده (نام و نام خانوادگی)، و خلاصه‌ای از پیشرفت ارائه می‌شود.
2. **DocumentView در برابر Document**:
   - فیلد `rejectionReason` فقط زمانی وجود دارد که وضعیت مدرک `rejected` باشد.
   - نام فیزیکی فایل روی سرور پوشانده شده و تنها لینک امضاشده موقت ارائه می‌شود.
3. **TicketView و TicketMessageView در برابر Ticket**:
   - پیام‌هایی که پرسنل به عنوان `internal: true` ارسال می‌کنند کاملاً از خروجی دانشجو فیلتر می‌شوند.
   - تغییر وضعیت‌ها و ارجاعات داخلی در اسناد تیکت پنهان می‌مانند.
4. **StudentTaskView**:
   - کاملاً مشتق‌شده (Derived) از مدارک نیازمند اقدام، اقساط سررسیدشده و جلسات پیش‌رو است و هیچ ارتباطی با جدول داخلی `Task` های کارکنان در CRM ندارد.

---

## تست‌های خودکار امنیت، ایزولاسیون و انطباق

مجموعه تست‌های Vitest در مسیرهای زیر پیاده‌سازی و اعتبارسنجی شده‌اند:
- `src/mocks/handlers/student-isolation-security.test.ts` (۱۱ تست قبولی):
  - **ایزولاسیون ۴۰۴**: تأیید دریافت پاسخ ۴۰۴ توسط دانشجوی A در هنگام تلاش برای دسترسی به پرونده، مدارک، تیکت‌ها، اقساط، فاکتورها، فایل‌ها و شورت‌لیست دانشجوی B.
  - **تست اسنپ‌شات کلیدها (Snapshot View Keys)**: بررسی کامل تمامی کلیدهای خروجی نماهای دانشجو و تضمین نبود هیچ‌گونه فیلد داخلی پرسنل.
  - **لینک‌های امضاشده (Signed Mock File)**: تأیید رفتار ۴۰۴ در جعل شناسه کاربری، ۴۱۰ در لینک‌های منقضی، و ۲۰۰ فقط در امضای صحیح مالک.
  - **محدودیت نرخ (Rate Limiting)**: شبیه‌سازی درخواست‌های متوالی OTP و آپلود فایل و بررسی دریافت ۴۲۹ به همراه مقدار هدر `Retry-After`.
  - **محافظت XSS**: اطمینان از اینکه متن پیام‌های ارسالی کاربران حاوی تگ‌های اسکریپت یا تگ‌های HTML هرگز به عنوان HTML خام رندر نمی‌شوند.
- `src/mocks/handlers/student-panel.test.ts` (۸ تست قبولی)
- `src/mocks/handlers/finance-payments.test.ts` (۱۰ تست قبولی)

---

## راهنمای Onboarding و تجربه کاربری PWA

1. **تور آشنایی (Onboarding Tour)**:
   - فعال‌سازی خودکار در اولین ورود موفق دانشجو (`onboardingCompleted === false`).
   - تور ۳ مرحله‌ای شامل معرفی داشبورد و پرونده، بخش بارگذاری مدارک، و سیستم ارسال پیام/تیکت.
   - دکمه‌های «مرحله بعد»، «رد کردن تور»، و ذخیره وضعیت در پروفایل کاربر و `localStorage` تا مجدداً باز نشود.
2. **برنامه وب پیش‌رونده (PWA)**:
   - فایل مانیفست `/manifest.webmanifest` با نام فارسی، آیکن‌های استاندارد، تم رنگی هماهنگ و جهت RTL.
   - سرویس ورکر ایزوله (`/sw.js`) برای کش دارایی‌های استاتیک و صفحه آفلاین اختصاصی (`/offline`)؛ اکیداً هیچ داده API یا فایلی کش نمی‌شود.
   - بنر هوشمند «افزودن به صفحه اصلی» (A2HS) در موبایل پس از چند بازدید، با قابلیت بستن و عدم یادآوری مجدد.

---

## گزارش بازبینی فاز (Phase Review Report)

### ۱. تست سناریوی جامع موبایل در Playwright
- فایل تست: `e2e/mobile-student-journey.spec.ts`
- ابعاد ویوپورت: `390x844` (موبایل آیفون)
- سناریوی ۹ مرحله‌ای به‌طور کامل پاس شد (`1 passed in 37.1s`):
  1. ثبت لید در صفحه تماس (`/contact`) توسط متقاضی
  2. ورود مشاور، تبدیل لید به پرونده و ایجاد پلن اقساطی
  3. ورود دانشجو با شماره موبایل و کد یکبار مصرف (OTP)
  4. بارگذاری مدرک هویتی توسط دانشجو در `/panel/documents`
  5. رد مدرک با ثبت دلیل توسط مشاور در بخش مدیریت
  6. مشاهده دلیل رد مدرک توسط دانشجو، بارگذاری مجدد مدرک اصلاح‌شده و تأیید نهایی توسط کارمند
  7. ارسال تیکت و پیام توسط دانشجو، پاسخ مشاور در CRM و دریافت پاسخ در ترد چت دانشجو
  8. پرداخت آنلاین قسط اول در درگاه آزمایشی بانکی و دریافت رسید تأیید
  9. بازبینی نهایی کارمند در بخش پرونده‌های CRM و گزارش مالی پنل مدیریت (`/admin/finance`)

### ۲. ممیزی دسترسی‌پذیری Axe-core
- فایل تست: `e2e/accessibility-axe.spec.ts`
- نتایج: هر ۸ مسیر پنل دانشجو بررسی شدند و **۰ خطای Serious** و **۰ خطای Critical** ثبت شد (`8 passed in 43.9s`):
  - `/panel` (Overview)
  - `/panel/case` (Case)
  - `/panel/documents` (Documents)
  - `/panel/messages` (Messages)
  - `/panel/payments` (Payments)
  - `/panel/appointments` (Appointments)
  - `/panel/shortlist` (Shortlist)
  - `/panel/profile` (Profile)

### ۳. ممیزی عملکرد و دسترسی‌پذیری Lighthouse موبایل
- اسکریپت ممیزی: `scripts/mobile-lighthouse-audit.mjs`
- شبیه‌سازی ویوپورت موبایل ۳۹۰x۸۴۴ روی صفحات اصلی:
  - **صفحه داشبورد (`/panel`)**:
    - Performance Score: **۱۰۰** (حداقل شرط: ۸۰)
    - Accessibility Score: **۱۰۰** (حداقل شرط: ۹۵)
    - وضعیت بارگذاری اولیه `pdf-lib`: **Lazy-Loaded** (بارگذاری اولیه نشد)
  - **صفحه مدارک (`/panel/documents`)**:
    - Performance Score: **۱۰۰** (حداقل شرط: ۸۰)
    - Accessibility Score: **۱۰۰** (حداقل شرط: ۹۵)
    - وضعیت بارگذاری اولیه `pdf-lib`: **Lazy-Loaded** (بارگذاری اولیه نشد)

### ۴. تفکیک حجم باندل‌های JS و بارگذاری تنبل
بر اساس خروجی ساخت نهایی (Webpack / Next.js Build):
- پکیج حجیم `pdf-lib` (حدود ۴۱۲ کیلوبایت) به قطعه مستقل `5969.beab67c55c17791d.js` تفکیک شده و فقط در زمان ادغام تصاویر در PDF بارگذاری می‌شود.
- قطعه `student-file-uploader` (۲۱ کیلوبایت) به شکل پویا در صفحه مدارک بارگذاری می‌گردد.
- ساخت نهایی پروژه (`NEXT_PUBLIC_DEMO_BUILD=enabled npm run build`) با موفقیت ۱۰۰٪ و بدون هیچ خطای TypeScript به اتمام رسید.
