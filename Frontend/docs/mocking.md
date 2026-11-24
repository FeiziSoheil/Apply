# API آزمایشی (MSW)

تا وقتی بک‌اند واقعی وجود ندارد، فرم‌ها و پنل‌ها با یک API آزمایشی کار می‌کنند که با [MSW](https://mswjs.io) ساخته شده است. این API:

- دقیقاً با قرارداد (`src/contracts/` و `docs/openapi.yaml`) یکی است: هر `operationId` یک handler دارد.
- ورودی هر درخواست و خروجی هر پاسخ را با schemaهای Zod قرارداد اعتبارسنجی می‌کند.
- داده‌ها را در حافظه نگه می‌دارد، پس ایجاد/ویرایش/حذف قابل تست است.
- فقط وقتی فعال است که `NEXT_PUBLIC_API_MOCKING=enabled` باشد. در حالت دیگر هیچ کد mock در باندل production نیست.
- در production فقط با پرچم صریح `NEXT_PUBLIC_DEMO_BUILD=enabled` (نسخه نمایشی) مجاز است؛ بخش «ایمنی production».

## فعال‌سازی

در `.env.local`:

```bash
NEXT_PUBLIC_API_MOCKING=enabled
NEXT_PUBLIC_API_URL=/api/v1   # پیش‌فرض
```

سپس `npm run dev` را (دوباره) اجرا کنید. متغیرهای `NEXT_PUBLIC_*` در زمان build/start خوانده می‌شوند، پس بعد از تغییر باید سرور را ری‌استارت کنید.

| متغیر | مقدار | اثر |
| --- | --- | --- |
| `NEXT_PUBLIC_API_MOCKING` | `enabled` | روشن شدن worker در مرورگر و `msw/node` در سرور Next. هر مقدار دیگر یعنی خاموش. |
| `NEXT_PUBLIC_API_MOCK_PERSIST` | `enabled` / `disabled` | نگه‌داشتن داده‌ها در `localStorage`. در **development پیش‌فرض روشن** است (مگر `disabled` بدهید)؛ در بقیه حالت‌ها پیش‌فرض خاموش و فقط با `enabled` روشن می‌شود. |
| `NEXT_PUBLIC_DEMO_BUILD` | `enabled` | اجازه می‌دهد `next build` (production) **با mock روشن** ساخته شود و نوار «نسخه نمایشی – داده‌ها آزمایشی هستند» را نشان می‌دهد. بدون آن، production + mock همچنان رد می‌شود. |
| `NEXT_PUBLIC_API_MOCK_AUTH` | `relaxed` | درخواست بدون نشست به‌عنوان ادمین دمو شناخته می‌شود. پیش‌فرض `strict` است. **فقط development** (بخش «ایمنی production»). |
| `NEXT_PUBLIC_API_MOCK_DELAY` | `off` | حذف تأخیر ۲۰۰ تا ۶۰۰ میلی‌ثانیه‌ای شبیه‌سازی‌شده. |

### حساب‌های دمو

| نقش | ورود |
| --- | --- |
| ادمین | `admin@apply.example` / `Admin@12345` (`POST /auth/login`) |
| مشاور | `consultant1@apply.example` / `Consultant@12345` |
| دانشجو | موبایل `09120000000` و کد OTP همیشه `123456` (در هدر پاسخ `x-mock-otp` هم هست). هر موبایل معتبر دیگری هم با همین کد حساب دانشجوی جدید می‌سازد. |

### نشست در حالت mock و واقعی

قرارداد عمومی فقط کوکی httpOnly با نام `session` را می‌شناسد (`docs/openapi.yaml` → `sessionCookie`). برای اینکه mock همان قرارداد را شبیه‌سازی کند، کلاینت نشست را از طریق یک **adapter** قابل‌تعویض می‌برد (`src/lib/api/session-adapter.ts`):

| | حالت واقعی (پیش‌فرض) | حالت mock (`NEXT_PUBLIC_API_MOCKING=enabled`) |
| --- | --- | --- |
| انتقال نشست | کوکی httpOnly `session` با `credentials: "include"` | توکن Bearer در حافظه + (فقط در development یا نسخه نمایشی) آینه در **`sessionStorage`** (هرگز `localStorage`) |
| هدر `Authorization` | **هرگز ارسال نمی‌شود** (حتی اگر caller بدهد حذف می‌شود) | `Authorization: Bearer …` |
| بدنه پاسخ ورود | فقط `user`، `expiresIn`، `isNewUser` | همان؛ توکن‌ها در هدرهای `x-mock-access-token` / `x-mock-refresh-token` / `x-mock-user-role` می‌آیند و adapter آن‌ها را برمی‌دارد |
| کوکی برای proxy | `session` (httpOnly، بک‌اند) | `mock_session` (غیر httpOnly) را کلاینت بعد از ورود موفق (OTP یا staff login) با `document.cookie` می‌نویسد؛ حاوی نقش (`{"role":"admin"}`) |

- مرورگر `Set-Cookie` پاسخ‌های MSW را اعمال نمی‌کند؛ به همین دلیل `mock_session` لازم است تا `src/proxy.ts` در هر دو حالت یکسان مسیرها را محافظت کند (حالت mock: `mock_session` و بررسی نقش؛ حالت واقعی: وجود کوکی `session`).
- با خروج (`POST /auth/logout`) یا هر پاسخ `401` (از جمله سناریوی `unauthorized`) توکن حافظه، نسخه `sessionStorage` و کوکی `mock_session` پاک می‌شوند.

#### رفرش صفحه

- **فقط وقتی** `NEXT_PUBLIC_API_MOCKING=enabled` **و** `NODE_ENV=development` (یا یک build نمایشی، بخش «ایمنی production») باشد، توکن‌های Bearer (access + refresh) علاوه بر حافظه در `sessionStorage` (کلید `apply:mock-tokens`) نوشته می‌شوند و با بارگذاری صفحه به adapter نشست برگردانده می‌شوند؛ پس **رفرش کاربر را خارج نمی‌کند**. با بستن تب / مرورگر، `sessionStorage` پاک می‌شود و دوباره باید وارد شد.
- worker مرورگر داخل خود صفحه اجرا می‌شود و نگاشت توکن ← کاربر (`apply:mock-auth`) هم در `sessionStorage` آینه می‌شود تا توکن بازیابی‌شده بعد از رفرش پذیرفته شود (وگرنه `401` می‌گرفت). OTPها و محدودیت نرخ فقط در حافظه می‌مانند و با رفرش ریست می‌شوند.
- کاربرانی که در حین mock ساخته شده‌اند (مثلاً دانشجوی جدید با OTP) فقط وقتی بعد از رفرش پیدا می‌شوند که ماندگاری db هم روشن باشد (در development پیش‌فرض روشن است، بخش «ماندگاری داده‌ها»)؛ در غیر این صورت `GET /me` با `401` پاسخ می‌دهد و نشست به‌شکل عادی پاک می‌شود.
- اگر `sessionStorage` در دسترس نباشد یا پر شود، خطا بلعیده می‌شود، یک `console.warn` ثبت می‌شود و توکن‌ها فقط در حافظه می‌مانند.
- **حالت واقعی (غیر mock): هیچ توکنی در JS یا storage نگهداری نمی‌شود**؛ نشست فقط کوکی httpOnly `session` است و رفتار قبلی دست‌نخورده است.
- `POST /auth/refresh` توکن refresh درون‌حافظه‌ای را با هدر `x-mock-refresh-token` می‌فرستد و آن را می‌چرخاند.
- محدودیت‌های OTP در mock اجرا می‌شوند: اعتبار ۲ دقیقه، حداکثر ۳ تلاش ناموفق (بعد از سومی کد باطل می‌شود)، ۵ درخواست در ساعت. verify بدون درخواست قبلی کد، `400` است.

### رابط ورود و محافظت مسیرها

| مسیر | کار |
| --- | --- |
| `/login` | ورود دانشجو: موبایل → OTP شش‌رقمی (جای‌گذاری خودکار، تایمر ارسال مجدد و اعتبار ۲ دقیقه‌ای) |
| `/staff/login` | ورود ادمین/مشاور با ایمیل و رمز عبور (+ «فراموشی رمز عبور»، فقط UI) |
| `/panel` | پنل دانشجو (فقط `student`) |
| `/admin` | پنل مدیریت (`admin` و `consultant`) |

- بعد از ورود: ادمین و مشاور → `/admin`، دانشجو → `/panel`؛ `returnUrl` فقط وقتی استفاده می‌شود که امن (نسبی) و برای نقش کاربر مجاز باشد.
- `AuthProvider` (`src/components/auth/auth-provider.tsx`) در layoutهای `(auth)`، `(panel)` و `(admin)` با `GET /me` (TanStack Query) وضعیت `loading | authenticated | unauthenticated` را می‌دهد؛ `useSession()` همان را در اختیار می‌گذارد (`user`, `role`, `signIn`, `signOut`).
- نشست پایان‌یافته (هر پاسخ ۴۰۱ یا `GET /me` با ۴۰۱ بعد از ورود موفق) پنجره «نشست شما منقضی شد» را باز می‌کند؛ دکمه آن به صفحه ورود مناسب با `returnUrl` می‌برد.
- در حالت mock (development یا نسخه نمایشی) رفرش صفحه نشست را نگه می‌دارد (بخش «رفرش صفحه»). اگر توکن بازیابی‌شده دیگر معتبر نباشد (مثلاً db ماندگار نیست و کاربر ساخته‌شده از بین رفته)، `GET /me` با `401` پاسخ می‌دهد و نشست و کوکی `mock_session` پاک می‌شوند.

### ایمنی production

mock فقط برای توسعه است و این ترکیب‌ها با خطای واضح **build و start** را متوقف می‌کنند (`next.config.ts` + `src/instrumentation.ts` + ورودی‌های mock؛ منطق در `src/lib/mock-safety.ts`):

- `NODE_ENV=production` همراه با `NEXT_PUBLIC_API_MOCKING=enabled` — **مگر** اینکه `NEXT_PUBLIC_DEMO_BUILD=enabled` هم داده شده باشد (بخش بعد)
- `NODE_ENV=production` همراه با `NEXT_PUBLIC_API_MOCK_AUTH=relaxed` (یا `MOCK_AUTH=relaxed`) — **همیشه ممنوع است، حتی در build نمایشی**

علاوه بر این `isAuthRelaxed()` در production همیشه `false` است. بدون `NEXT_PUBLIC_DEMO_BUILD`، adapter حالت mock هرگز در production فعال نمی‌شود. برای تست mock پیش از انتشار از `npm run dev` استفاده کنید.

#### Build نمایشی (`NEXT_PUBLIC_DEMO_BUILD=enabled`)

برای یک پیش‌نمایش عمومی (مثلاً نمایش به کارفرما) که عمداً با داده آزمایشی در production اجرا می‌شود:

```bash
NEXT_PUBLIC_API_MOCKING=enabled NEXT_PUBLIC_DEMO_BUILD=enabled npm run build
```

- `next build` / `next start` با mock روشن مجاز می‌شوند؛ خطای بالا فقط وقتی داده می‌شود که پرچم نمایشی **نباشد**.
- یک نوار ثابت «نسخه نمایشی – داده‌ها آزمایشی هستند» پایین همه صفحات (همه پنل‌ها و فرم‌ها) نمایش داده می‌شود (`src/components/shared/demo-banner.tsx`).
- `NEXT_PUBLIC_API_MOCK_AUTH=relaxed` / `MOCK_AUTH=relaxed` همچنان ممنوع است و build را رد می‌کند.
- توکن‌های mock مثل development در `sessionStorage` می‌مانند (نه `localStorage`)؛ راهنمای ورود دمو و OTP هم نمایش داده می‌شود.
- ماندگاری `localStorage` db در production پیش‌فرض خاموش است (فقط با `NEXT_PUBLIC_API_MOCK_PERSIST=enabled` روشن می‌شود).
- بدون پرچم نمایشی، production + mock مثل قبل با خطا رد می‌شود.

### فایل Service Worker

`public/mockServiceWorker.js` با `npx msw init public/ --save` ساخته شده و commit می‌شود. بعد از ارتقای نسخه msw دوباره همین دستور را اجرا کنید.

## ساختار `src/mocks/`

| مسیر | نقش |
| --- | --- |
| `handlers/*.ts` | پیاده‌سازی هر دامنه: `auth`, `content`, `leads`, `bookings`, `students`, `tickets`, `payments`, `files` |
| `contract.ts` | از `endpointSpecs` قرارداد handler می‌سازد؛ params/query/body را parse و پاسخ را validate می‌کند |
| `db.ts`, `store.ts` | پایگاه‌داده درون‌حافظه‌ای (`@mswjs/data`) و لایه Repository تایپ‌شده |
| `seed/` | داده اولیه: `src/data` + faker فارسی؛ ۱۵۰ سرنخ، ۴۰ دانشجو، رزرو، تیکت، مدرک، فاکتور. idها UUID هستند |
| `scenarios.ts` | سناریوهای خطا |
| `utils.ts` | صفحه‌بندی، فیلتر، مرتب‌سازی، جست‌وجو (با نرمال‌سازی ارقام و حروف فارسی)، تأخیر |
| `browser.ts` / `server.ts` | راه‌اندازی worker / سرور Node |
| `mock-provider.tsx`, `dev-panel.tsx`, `ui/scenario-panel.tsx` | اتصال به React و پنل شناور |

اگر `operationId` ای در قرارداد باشد و handler نداشته باشد (یا برعکس)، هنگام راه‌اندازی خطای واضح می‌دهد.

## اعتبارسنجی با قرارداد

- ورودی نامعتبر → `400 VALIDATION_ERROR` با `fields` (همان پیام‌های فارسی schema).
- اگر داده mock با قرارداد نخواند (فیلد اضافه، نوع اشتباه، UUID نامعتبر…) پاسخ **۵۰۰** با هدر `x-mock-contract-violation: true` و پیامی که مسیر دقیق مشکل را می‌گوید برگردانده می‌شود و در کنسول سرور/مرورگر هم لاگ می‌شود. هیچ JSON نامعتبری ارسال نمی‌شود.
- داده seed هنگام ساخته شدن db هم با schemaها چک می‌شود و در صورت مشکل با `MockSeedError` متوقف می‌شود.

## پنل سناریوها

وقتی mocking روشن است، یک دکمه شناور **Mock API** (پایین، سمت شروع صفحه) نمایش داده می‌شود. سناریوی انتخابی در `sessionStorage` می‌ماند و `src/lib/api/client.ts` آن را با هدر `x-mock-scenario` روی همه درخواست‌ها می‌فرستد. با انتخاب سناریو، queryهای فعال دوباره اجرا می‌شوند.

| سناریو | رفتار |
| --- | --- |
| `server_error` | همه درخواست‌ها `500 INTERNAL` |
| `forbidden` | `403 FORBIDDEN` |
| `unauthorized` | `401 UNAUTHORIZED` (کلاینت کاربر را به صفحه ورود می‌برد) |
| `slow` | هر پاسخ حدود ۸ ثانیه تأخیر دارد |
| `empty` | فهرست‌ها خالی و `total=0` |
| `validation_error` | `400 VALIDATION_ERROR` با `fields` برای فیلدهای ارسالی |

بدون پنل هم می‌شود سناریو را اجباری کرد:

```bash
curl -H "x-mock-scenario: server_error" /api/v1/leads
# یا در URL صفحه / درخواست
/assessment?__scenario=empty
/api/v1/leads?__scenario=forbidden
```

هدر بر query اولویت دارد. دکمه «بازنشانی داده‌ها» در پنل (یا `window.__applyMock.resetDb()` در کنسول) db را دوباره از seed می‌سازد.

## ماندگاری داده‌ها

- در **development** (`NODE_ENV=development`) ماندگاری **به‌صورت پیش‌فرض روشن** است؛ فقط با `NEXT_PUBLIC_API_MOCK_PERSIST=disabled` خاموش می‌شود. در بقیه حالت‌ها (از جمله build نمایشی) پیش‌فرض خاموش است: همه چیز فقط در حافظه می‌ماند و با رفرش به seed برمی‌گردد، مگر `NEXT_PUBLIC_API_MOCK_PERSIST=enabled` باشد.
- وقتی روشن باشد بعد از هر تغییر (debounce‌شده) snapshot در `localStorage` ذخیره و در بارگذاری بعدی بازیابی می‌شود. نسخه schema در snapshot هست؛ اگر عوض شود snapshot قدیمی کنار گذاشته می‌شود.
- نوشتن در `localStorage` داخل `try/catch` است: اگر سهمیه پر شود (`QuotaExceededError`) یا storage مسدود باشد، db فقط در حافظه می‌ماند و یک `console.warn` ثبت می‌شود (برنامه ادامه می‌دهد).
- توکن‌های نشست هرگز در `localStorage` نمی‌روند؛ بخش «رفرش صفحه».
- ماندگاری فقط در مرورگر است؛ نمونه سمت Node همیشه از seed شروع می‌کند.
- فایل‌های آپلودشده (blob) در حافظه می‌مانند و ماندگار نمی‌شوند (آدرس `…/mock-files/:id/:name` بعد از رفرش دیگر معتبر نیست).

## مشکل MSW با Server Components / ISR / SSG و راه‌حل

**مشکل.** صفحات عمومی سایت (برنامه‌ها، دانشگاه‌ها، وبلاگ…) Server Component هستند و در زمان build (SSG/ISR/Partial Prerender) یا روی سرور رندر می‌شوند، نه در مرورگر. اگر محتوا را با `fetch('/api/v1/...')` بخوانیم:

1. روی سرور آدرس نسبی معتبر نیست؛ به URL مطلق نیاز است.
2. در `next build` هیچ سرور MSW ای وجود ندارد؛ `instrumentation.ts` فقط هنگام اجرای سرور (`dev`/`start`) `register()` می‌شود، و صفحه‌های static باید بدون هیچ سرویسی build شوند.
3. نمونه MSW سمت Node و worker مرورگر دو پایگاه‌داده جدا دارند. چیزی که فرم در مرورگر ایجاد می‌کند در رندر سرور دیده نمی‌شود، و cache ISR هم محتوای کهنه را نگه می‌دارد.
4. وابسته کردن build به mock یعنی SEO، sitemap و صفحات static به یک ابزار توسعه وابسته می‌شوند.

**راه‌حل انتخاب‌شده.** تقسیم مسئولیت:

- **محتوای عمومی سایت** همچنان از `src/services/*` (و `src/data`) خوانده می‌شود، بدون MSW. build و SEO مستقل و قطعی می‌مانند. وقتی API واقعی آماده شد، فقط پیاده‌سازی `services/*` عوض می‌شود.
- **فقط فرم‌ها و پنل‌ها** (کلاینت، TanStack Query) از طریق MSW به `/api/v1` می‌روند. `MockProvider` داخل `QueryProvider` است و فرزندان را بعد از آماده شدن worker رندر می‌کند، پس فرم‌های عمومی (ارزیابی، رزرو، تماس، خبرنامه) هم worker را دارند و اولین درخواست هم به mock می‌رسد.
- `instrumentation.ts` هم برای کدهای سمت سرور که با URL مطلق (`NEXT_PUBLIC_API_URL=http://…/api/v1`) به API می‌روند، سرور MSW را راه می‌اندازد. این مسیر فعلاً در سایت استفاده نمی‌شود و فقط ابزاری آماده برای آینده است. به خاطر نکته ۳ داده آن جدا از داده مرورگر است.

نتیجه: `npm run build` بدون هیچ متغیری درست build می‌شود و باندل production هیچ کد mock یا faker ندارد. (`next build` با `NEXT_PUBLIC_API_MOCKING=enabled` عمداً رد می‌شود — بخش «ایمنی production».)

## تست دودی (smoke)

```bash
npm run mock:smoke
```

بدون مرورگر و سرور Next، handlerها را با `msw/node` بالا می‌آورد و این‌ها را چک می‌کند: ثبت سرنخ عمومی (تماس سریع و ارزیابی) و دیده شدن آن‌ها در `GET /leads` با ورود ادمین، رد شدن honeypot، تغییر وضعیت سرنخ، افزایش آمار `GET /admin/stats` پس از ثبت سرنخ، جاروی همه GETها برای اعتبار قرارداد (ادمین و دانشجو) و همه سناریوها. همچنین adapter نشست (Bearer در حافظه، ماندگاری و بازیابی توکن در `sessionStorage` در حالت development، نوشتن/پاک‌کردن `mock_session`، نبودن `Authorization` در حالت کوکی)، تصمیم‌های محافظت مسیر در هر دو حالت و محدودیت‌های OTP (۳ تلاش، انقضای ۲ دقیقه) را بررسی می‌کند. توکن ورود از هدرهای `x-mock-access-token` خوانده می‌شود، نه بدنه.

## افزودن endpoint جدید

1. endpoint را در `src/contracts/routes/*` تعریف کنید.
2. handler را با `defineRoute` در فایل دامنه مربوط (`src/mocks/handlers/*`) بنویسید و با `operationId` در `implementations` ثبت کنید.
3. `npm run mock:smoke` را اجرا کنید. اگر پاسخ با schema نخواند، خطای `x-mock-contract-violation` می‌گیرید.
