# نکات استقرار (Deployment)

## چرا کوکی `session` باید same-origin باشد

نشست در قرارداد عمومی **فقط** یک کوکی httpOnly با نام `session` است (`docs/api-conventions.md`، `docs/openapi.yaml` → `sessionCookie`). بک‌اند آن را با
`Set-Cookie: session=…; HttpOnly; Secure; SameSite=Lax; Path=/` می‌گذارد و فرانت‌اند فقط `credentials: "include"` می‌فرستد. هیچ توکنی در JS یا storage نگه داشته نمی‌شود.

این طراحی وقتی درست کار می‌کند که مرورگر درخواست‌های API را **هم‌مبدأ (same-origin)** با صفحه ببیند:

- **`SameSite=Lax`**: مرورگر کوکی را فقط در درخواست‌های *same-site* و ناوبری‌های سطح‌بالا می‌فرستد. اگر سایت روی `https://apply.example` و API روی `https://api.example.com` باشد، درخواست‌های `fetch` از صفحه به API *cross-site* هستند و کوکی `Lax` همراه آن‌ها ارسال **نمی‌شود** (و اگر `SameSite=None` بگذاریم، کوکی در معرض CSRF و محدودیت‌های مرورگر برای third-party cookie قرار می‌گیرد).
- **CORS و کوکی**: برای درخواست cross-origin همراه کوکی، بک‌اند باید `Access-Control-Allow-Credentials: true` و یک `Access-Control-Allow-Origin` **مشخص** (نه `*`) برگرداند و preflight (`OPTIONS`) را پاسخ دهد؛ همچنین کلاینت باید `credentials: "include"` بفرستد. این یک سطح پیکربندی اضافه (و اشتباه‌پذیر) است و هر مبدأ مجاز، به کوکی نشست دسترسی غیرمستقیم پیدا می‌کند.
- **Domain/Secure/Path**: کوکی بدون `Domain` به همان host که آن را ساخته گره می‌خورد. وقتی همه‌چیز از یک origin سرو شود، نیازی به تنظیم `Domain` یا باز کردن آن برای زیردامنه‌ها نیست.
- **`src/proxy.ts`** برای محافظت `/panel/*` و `/admin/*` وجود کوکی `session` را روی همان origin صفحه می‌خواند؛ این فقط در حالت same-origin ممکن است.

## چگونه بدون CORS کار می‌کند: rewrite در Next.js

به‌جای اینکه مرورگر مستقیم به بک‌اند برود، آدرس API را **relative** نگه می‌داریم (`NEXT_PUBLIC_API_URL=/api/v1`، پیش‌فرض) و Next.js آن را به بک‌اند پروکسی می‌کند. در `next.config.ts`:

```ts
// فقط وقتی API_PROXY_TARGET تنظیم شده باشد
rewrites: [{ source: "/api/v1/:path*", destination: `${API_PROXY_TARGET}/api/v1/:path*` }]
```

جریان یک درخواست:

1. مرورگر `fetch("/api/v1/me", { credentials: "include" })` را به `https://apply.example/api/v1/me` می‌فرستد (same-origin، کوکی `session` خودکار همراه است).
2. سرور Next.js (rewrite) درخواست را — همراه هدرهای آن از جمله `Cookie` — به `${API_PROXY_TARGET}/api/v1/me` می‌فرستد.
3. پاسخ بک‌اند، از جمله `Set-Cookie: session=…`، از همان مسیر برمی‌گردد و چون پاسخ از origin صفحه آمده، مرورگر کوکی را برای `apply.example` ذخیره می‌کند.

نتیجه: مرورگر هیچ‌وقت درخواست cross-origin نمی‌بیند، پس **preflight، `Access-Control-*` و `SameSite=None` لازم نیست** و بک‌اند نیازی به فهرست origin مجاز ندارد.

### تنظیم

| متغیر | مقدار | توضیح |
| --- | --- | --- |
| `API_PROXY_TARGET` | مثلاً `https://api.example.com` | آدرس **اصلی** بک‌اند، بدون `/` انتهایی و بدون `/api/v1`. متغیر سمت سرور است (بدون پیشوند `NEXT_PUBLIC_`). اگر خالی باشد هیچ rewrite ای ثبت نمی‌شود. |
| `NEXT_PUBLIC_API_URL` | `/api/v1` (پیش‌فرض) | باید relative بماند تا درخواست‌ها از مسیر rewrite عبور کنند. |

نکات:

- `API_PROXY_TARGET` هنگام **build** خوانده می‌شود (مسیرهای rewrite در manifest ساخته می‌شوند)؛ بعد از تغییر دوباره `next build` بگیرید. در `next dev` با ری‌استارت اعمال می‌شود.
- بک‌اند باید مسیرها را زیر `/api/v1` ارائه دهد (همان مسیرِ قرارداد)، چون rewrite پیشوند را حفظ می‌کند.
- بک‌اند پشت پروکسی باید `Secure` را روی کوکی نگه دارد و سایت را با HTTPS سرو کند؛ برای تشخیص https از `X-Forwarded-Proto` استفاده کنید.
- اگر پشت یک reverse proxy (nginx، Traefik، …) هستید، می‌توانید همین کار را به‌جای Next.js در همان لایه انجام دهید (`location /api/v1/ { proxy_pass … }`)؛ مهم این است که مرورگر فقط یک origin ببیند.
- با `NEXT_PUBLIC_API_MOCKING=enabled` (mock/نسخه نمایشی) درخواست‌ها پیش از رسیدن به شبکه توسط MSW مرورگر پاسخ داده می‌شوند و rewrite استفاده نمی‌شود (`docs/mocking.md`).

### اگر ناچار به دامنه جدا هستید

اگر API باید روی origin دیگری باشد، هر سه مورد باید با هم رعایت شوند: `NEXT_PUBLIC_API_URL` مطلق، CORS با `Allow-Credentials` و origin مشخص در بک‌اند، و تنظیم کوکی مناسب (`SameSite=None; Secure` یا یک parent domain مشترک). این مسیر پشتیبانی‌نشده و پرریسک‌تر است؛ rewrite بالا ترجیح دارد.
