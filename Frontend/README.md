# Apply Frontend

فرانت‌اند موسسه اعزام دانشجو (Next.js App Router، TypeScript strict، Tailwind، shadcn/ui). فعلاً بدون بک‌اند واقعی؛ همهٔ APIها از طریق MSW + قرارداد Zod در `src/contracts` شبیه‌سازی می‌شوند.

## شروع سریع

```bash
npm install
npm run dev
```

سایت عمومی: `http://localhost:3000`  
پنل مدیریت: `http://localhost:3000/admin` (ورود با حساب‌های دمو در Dev panel)

## اسکریپت‌های مهم

| دستور | توضیح |
| --- | --- |
| `npm run lint` | ESLint |
| `NEXT_PUBLIC_API_MOCKING=disabled npm run build` | بیلد production (mock خاموش — الزامی) |
| `npm run mock:smoke` | دود تست قرارداد + RBAC + سناریوها + فیلتر انتشار |
| `npm run test` | Vitest (unit + امنیت RichContent) |
| `npm run contract:generate` | بازتولید `docs/openapi.yaml` از قراردادها |

`NEXT_PUBLIC_API_MOCKING=enabled npm run build` عمداً **شکست** می‌خورد (گارد پروژه برای جلوگیری از بیلد production با mock).

## معماری کوتاه

- **Contract-first:** `src/contracts` → OpenAPI → handlers در `src/mocks/handlers` → UI
- **RBAC:** `src/lib/rbac/permissions.ts` + `<Can>` / `RequirePermission` / `AdminResourcePage`
- **CMS:** الگوی کشورها در `/admin/content/countries`؛ کیت مشترک در `docs/crud-kit.md`
- **محتوا:** مدل هیبرید — `docs/content-model.md`
- **Mock:** `docs/mocking.md`

## دامنه ← صفحات ← endpointها ← permissionها

جدول مبنای بک‌اند در انتهای `docs/content-model.md` آمده است.
