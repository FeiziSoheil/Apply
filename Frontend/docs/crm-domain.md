# دامنه CRM

منبع حقیقت قرارداد: `src/contracts/{crm,leads,students}.ts` و مسیرهای `src/contracts/routes/{crm,leads,students}.ts`.

## پایپ‌لاین سرنخ

مراحل پیش‌فرض seed (ترتیب):

```text
جدید (new)
  → تماس اول (open)
  → مشاوره انجام شد (open)
  → ارزیابی و پیشنهاد (open)
  → قرارداد (open)
  → تبدیل‌شده (won)
  ↘ ریزش (lost)   ← از هر مرحلهٔ غیرپایانی با lostReasonId
```

- هر مرحله: `id`، `key` (snake_case یکتا)، `title`، `order`، `color` (token)، `kind` ∈ `new|open|won|lost`، `wipLimit?`.
- حداقل یک مرحله از هر `kind` باید بماند؛ حذف/تغییر ناقض → `409 CONFLICT`.
- `Lead.stageId` مرجع مرحله است؛ API همیشه `stageKind` مشتق را هم برمی‌گرداند.

## قوانین کسب‌وکار

| قانون | رفتار |
| --- | --- |
| تخصیص خودکار | اولین `AssignmentRule` منطبق (کشور / منبع / utm campaign / always) با استراتژی fixed / round_robin / least_loaded |
| بدون مسئول | اگر قانونی منطبق نباشد → `CrmDefaults.defaultAssigneeId`؛ در نبود آن `assignedTo = null` |
| پیش‌فرض CRM | `initialStageId`، `businessHours`، `noActivityDays` در `/crm-settings/defaults` |
| هزینه کمپین | `CampaignCost` ماهانه به ریال (اختیاری برای گزارش) |
| تغییر تنظیمات CRM | هر تب با `version`/`If-Match`؛ audit از `emitDomainEvent` روی `crm_settings` |
| ریزش | ورود به `kind=lost` بدون `lostReasonId` → `400` |
| هم‌زمانی | `PATCH`/`PUT` با `If-Match: {version}`؛ عدم تطابق → `409` + `reason=version_mismatch` |
| ادغام | `POST /leads/{id}/merge` فعالیت/کار/رزرو/تگ را منتقل و مبدأ را `archived` می‌کند |
| تبدیل | `POST /leads/{id}/convert` پرونده می‌سازد و لید به `kind=won` می‌رود |
| ورود فایل | کلاینت CSV/XLSX را می‌خواند؛ `POST /leads/import` با سطرهای نگاشت‌شده (`dryRun` / commit). تگ «ورودی‌شده از فایل»، `source=import`، فیلد `importId`. سقف ۵٬۰۰۰ سطر. بازگردانی: `POST /leads/imports/{importId}/revert` فقط admin — لیدهای بدون فعالیت غیرسیستمی حذف می‌شوند |
| خروجی | `GET /leads/export` با فیلترهای فهرست + `columns` + `format=csv\|xlsx`؛ سقف ۵۰٬۰۰۰؛ CSV با BOM و محافظت CSV Injection؛ مشاور فقط لیدهای خودش |
| مشاور | فقط رکوردهای `assignedTo` / `consultantId` / `assigneeId` خودش؛ نمی‌تواند پرونده را به مشاور دیگر منتقل کند |

همهٔ create/update/delete/assign/stage_change/merge/import/export یک `AuditLog` می‌نویسند؛ تغییرات مرتبط با لید/پرونده یک `Activity` هم دارند. اعلان‌ها (تخصیص، سرنخ جدید، سررسید کار، …) همزمان ساخته می‌شوند.

## رویداد ← Activity ← Notification ← Audit

منبع حقیقت mock: `src/mocks/domain-events.ts` (`emitDomainEvent`). handlerهای CRM نباید منطق جداگانهٔ Activity/Notification/Audit را تکرار کنند.

| رویداد | Activity | Notification | Audit |
| --- | --- | --- | --- |
| ایجاد سرنخ عمومی / ارزیابی | — | `lead_new` (اگر `assignedTo`) | `create` روی `lead` |
| تخصیص / تغییر مسئول سرنخ | `assignment` | `lead_assigned` | `assign` روی `lead` |
| ایجاد دستی سرنخ توسط کارمند | — | `lead_assigned` یا `lead_new` | `create` روی `lead` |
| تغییر مرحله سرنخ | `stage_change` | — | `stage_change` روی `lead` |
| ویرایش فیلد سرنخ | `field_change` | — | `update` روی `lead` |
| ثبت تماس / یادداشت / پیام | `call` / `note` / `sms` / `email` / `whatsapp` | — | `create` روی `activity` (در صورت emit) |
| ادغام سرنخ | — | — | `merge` روی `lead` |
| تبدیل سرنخ → پرونده | `stage_change` (won) | — | `create` روی `case` + `update`/`stage_change` روی `lead` |
| ورود/خروجی فایل سرنخ | — | `lead_assigned` (سطرهای تخصیص‌شده) | `import` / `export` / `delete` (revert) |
| ایجاد / تکمیل کار مرتبط | `task_created` / `task_done` | `task_assigned` (تخصیص به دیگری) | `create` / `update` روی `task` |
| یادآور سررسید کار | — | `task_due` (با ترجیحات) | — |
| پیشبرد مرحله پرونده | `stage_change` | — | `stage_change` روی `case` |
| بارگذاری مدرک | `document_event` | `document_uploaded` | `create` روی `document` |
| تأیید / رد مدرک | `document_event` (+ `email` هنگام رد) | `document_approved` / `document_rejected` | `update` روی `document` |
| دعوت / تغییر نقش کاربر | — | — | `create` / `permission_change` / `update` روی `user` |
| تغییر تنظیمات موسسه | — | — | `update` روی `settings` |
| تغییر تنظیمات CRM | — | — | `update` روی `crm_settings` |
| خروجی CSV حسابرسی | — | — | `export` روی `audit_log` |

فیلدهای حساس در `diff` هرگز ذخیره نمی‌شوند: `AUDIT_SENSITIVE_FIELDS` در `src/contracts/crm.ts` و blacklist اجرایی در `src/mocks/domain-events.ts`.

ترجیحات اعلان: `GET/PUT /me/notification-preferences` (کانال in-app و SMS؛ SMS فقط persist). اعلان‌ها: `GET /me/notifications*`، `POST …/bulk-read`. حسابرسی فقط‌خواندنی: `GET /audit-logs`، `GET /audit-logs/export` (`audit:read`).

## ماتریس دسترسی (مجوز)

| مجوز | admin | consultant | student |
| --- | --- | --- | --- |
| `lead:read\|write` | همه | فقط اختصاص‌یافته | — |
| `lead:assign\|delete\|import\|merge` | ✓ | — | — |
| `lead:export` | همه | فقط لیدهای خودش | — |
| `case:read\|write\|review` | همه | فقط اختصاص‌یافته | — |
| `task:read\|write` | همه | فقط assignee خودش | — |
| `report:read` | همه | فقط خودش | — |
| `crm-settings:manage` | ✓ | — | — |
| `audit:read` | ✓ | — | — |

`student:*` برای پورتال دانشجو حفظ شده است.

## ماتریس نقش × صفحه × عمل

نمادها: ✓ مجاز · ◐ فقط رکوردهای خود · — مخفی / ۴۰۳. مرز امنیتی همیشه handler است؛ `<Can>` فقط UX.

| صفحه (مسیر) | عمل | admin | consultant |
| --- | --- | --- | --- |
| داشبورد `/admin` | مشاهده KPI / قیف | ✓ همه | ◐ خودش |
| لیدها `/admin/leads` | فهرست / جستجو / کانبان | ✓ | ◐ |
| لیدها | فیلتر «مسئول» | ✓ | — (مخفی در UI) |
| لیدها | ایجاد / ویرایش / تغییر مرحله | ✓ | ◐ |
| لیدها | تخصیص / حذف / ادغام / ورود | ✓ | — |
| لیدها | خروجی | ✓ | ◐ |
| جزئیات لید | تماس / یادداشت / کار / تبدیل | ✓ | ◐ |
| پرونده‌ها `/admin/cases` | فهرست / فیلتر مسئول | ✓ / ✓ | ◐ / — |
| پرونده | پیشبرد مرحله / ویرایش | ✓ | ◐ (بدون انتقال به مشاور دیگر) |
| پرونده | تأیید/رد مدرک | ✓ | ◐ |
| پرونده | revert مدرک تأییدشده | ✓ | — |
| کارها `/admin/tasks` | CRUD / تکمیل / تعویق | ✓ | ◐ |
| گزارش‌ها `/admin/reports` | قیف / منابع / تیکت‌ها / مشاوران | ✓ | ◐ (جدول مشاوران فقط admin) |
| تیکت‌ها `/admin/tickets` | صندوق + thread (یادداشت داخلی، قالب) | ✓ | ◐ (فقط تیکت‌های پرونده/ارجاع خود) |
| اعلان‌ها `/admin/notifications` | فهرست / خواندن | ✓ | ◐ |
| تنظیمات CRM `/admin/settings/crm` | مدیریت پایپ‌لاین و قوانین | ✓ | — |
| حسابرسی `/admin/settings/audit` | مشاهده / CSV | ✓ | — |

## جدول دامنه ← endpoint ← permission

| دامنه | Endpoint | Permission |
| --- | --- | --- |
| سرنخ | `GET/POST /leads`، `GET/PATCH /leads/{id}`، activities | `lead:read` / `lead:write` |
| سرنخ | `PATCH /leads/{id}/stage` | `lead:write` |
| سرنخ | `PUT /leads/{id}/assignee` | `lead:assign` |
| سرنخ | `POST /leads/{id}/merge` | `lead:merge` |
| سرنخ | `POST /leads/{id}/convert` | `lead:write` |
| سرنخ | `POST /leads/import`، `POST /leads/imports/{importId}/revert` | `lead:import` (revert فقط admin) |
| سرنخ | `GET /leads/export` | `lead:export` |
| سرنخ عمومی | `POST /leads/quick-contact`، `POST /leads/assessment` | عمومی (بدون auth) |
| پایپ‌لاین/تگ | `GET /pipeline/stages`، `GET /tags`، `GET /lost-reasons` | `lead:read` (خواندن) |
| تنظیمات CRM | `GET/PUT /crm-settings/*` + `POST …/reset` | `crm-settings:manage` |
| تنظیمات CRM | `POST /tags/merge`، `POST /assignment-rules/simulate`، `POST /case-templates/copy` | `crm-settings:manage` |
| کار | `CRUD /tasks`، counts، complete، bulk-complete، snooze | `task:read` / `task:write` |
| کار | `POST /tasks/process-reminders` | mock / staff |
| پرونده | `GET/PATCH /cases`، `POST …/advance-stage`، activities | `case:read` / `case:write` |
| مدرک | `POST /documents/{id}/review` | `case:review` |
| مدرک | `POST /documents/{id}/revert` | `case:write` (فقط admin) |
| گزارش | `GET /reports/funnel\|consultants\|sources\|timeseries\|tickets` | `report:read` |
| تیکت | `GET/POST /tickets`، messages، close/reopen، `PATCH` | `ticket:read` / `write` / `manage` |
| حسابرسی | `GET /audit-logs`، `GET /audit-logs/export` | `audit:read` |
| اعلان | `GET /me/notifications*`، bulk-read، preferences | `lead:read` (کارمند) |
| داشبورد | `GET /admin/stats` | `lead:read` |

## تعریف متریک‌ها

### داشبورد (`GET /admin/stats`)

| متریک | تعریف |
| --- | --- |
| سرنخ‌های بازه | تعداد لید با `createdAt` در `rangeDays` (۷/۳۰/۹۰) و غیر‌archived؛ مشاور فقط `assignedTo=me` |
| `changePercent` | نسبت به بازهٔ هم‌طول قبلی: `(current - previous) / previous` |
| روند روزانه | شمارش روزانهٔ ایجاد سرنخ در بازه |
| منابع UTM | گروه‌بندی بر اساس `utm.source` / منبع لید |
| قیف وضعیت | شمارش بر اساس `stageKind` / مرحله |
| نیازمند اقدام | سرنخ غیرپایانی با آخرین فعالیت قدیمی‌تر از `noActivityDays` (پیش‌فرض ۲) |
| برنامه امروز | رزروها و کارهای due امروز (تقویم تهران) |

### گزارش‌ها (`GET /reports/*`)

| متریک | تعریف |
| --- | --- |
| `conversionRate` (قیف) | `count(stageKind=won) / count(leads in range)` در بازه `from`–`to` |
| شمارش مرحله قیف | لیدهای بازه که هم‌اکنون در آن `stageId` هستند |
| `valueRials` | جمع `Lead.value` لیدهای همان مرحله |
| مشاور: `leadsAssigned` / `leadsWon` / `leadsLost` | لیدهای بازه با `assignedTo=consultant` و `stageKind` متناظر |
| مشاور: `openTasks` | کارهای `status=open` با `assigneeId=consultant` (همهٔ زمان‌ها) |
| منبع: `count` / `won` / `lost` / `conversionRate` | گروه‌بندی `Lead.source` در بازه |
| سری زمانی `leads_created` | شمارش ایجاد لید در سطل `day\|week\|month` |
| سری زمانی `leads_won` / `leads_lost` | شمارش لیدهایی که در سطل به won/lost رسیده‌اند (بر اساس `updatedAt` مرحله پایانی در mock) |
| سری زمانی `tasks_done` | تکمیل کار در سطل |
| سری زمانی `bookings_created` | ایجاد رزرو در سطل |
| تیکت: `avgFirstResponseMs` | میانگین فاصلهٔ `createdAt` تا `firstResponseAt` در بازه |
| تیکت: `avgRating` / `ratedCount` | میانگین امتیاز ۱–۵ تیکت‌های امتیازداده‌شده در بازه |

هزینه کمپین (`CampaignCost`) اختیاری است و در محاسبهٔ نرخ تبدیل پایه وارد نمی‌شود؛ برای CAC در نسخه‌های بعدی.

قالب پیام کانال `ticket` برای پاسخ‌های آماده در صندوق تیکت (`/admin/tickets`)؛ متغیرها شامل `{ticket_code}` و `{subject}`.

## پرونده دانشجو (Student Case)

- پنل دانشجو از اسکیمای جدا (`StudentCaseView` و …) استفاده می‌کند؛ فیلدهای داخلی کارکنان به `/me/*` برنمی‌گردند — `docs/student-panel-domain.md`.
- پس از OTP، موبایل به پرونده/لید منطبق وصل می‌شود (`StudentCase.studentId` / `studentUserId`).
- فهرست `/cases` فیلترهای `country`، `stage`، `consultantId`، `docsPendingReview`، `deadlineWithinDays`، `noActivity` و فیلدهای مشتق (`progressPercent`، شمارش مدارک، `nearestDeadline`، `lastActivityAt`، `assigneeName`) را برمی‌گرداند.
- ورود به هر مرحله وظایف پیش‌فرض قالب (`dueOffsetDays`) را می‌سازد.
- پیشبرد مرحله بدون مدارک تأییدشده → `409`؛ فقط admin با `overrideIncomplete` + `overrideReason`.
- بررسی مدرک → Activity + AuditLog + Notification برای دانشجو؛ رد همچنین پیام (activity از نوع email) می‌سازد.
- مدرک تأییدشده قفل است مگر `POST /documents/{id}/revert` توسط admin.
- تایم‌لاین: `GET/POST /cases/{id}/activities` با همان مدل Activity (`entityType=case`).
- نماهای ذخیره‌شده: `resource=cases` (همان الگوی لیدها).
- مشاور نمی‌تواند `consultantId` پرونده را به فرد دیگری تغییر دهد (`403`).

## تیکت و پرداخت (اشتراک با پنل)

- وضعیت تیکت: `open` | `waiting_staff` | `waiting_student` | `closed`؛ دسته: `documents` | `payment` | `visa` | `apply` | `technical` | `other`.
- پیام `internal` فقط کارکنان؛ در پاسخ دانشجو حذف می‌شود.
- برنامه پرداخت پرونده (`PaymentPlan`)، تلاش پرداخت (`PaymentAttempt`)، درگاه mock و تأیید کارت‌به‌کارت — جزئیات در `docs/student-panel-domain.md`.

## کارها (Tasks)

- «کارهای شما» در پنل دانشجو (`StudentTaskView`) از مدارک/اقساط/رزرو مشتق می‌شود و با `Task` کارکنان یکی نیست.
- فیلتر `due`: `overdue` | `today` | `week` | `upcoming` | `custom` (+ `dueFrom`/`dueTo`).
- `GET /tasks/counts` شمارش تب‌های UI (امروز / سررسیدگذشته / این هفته / بعدی / تکمیل‌شده).
- هم‌زمانی: فیلد `version`؛ `PATCH /tasks/{id}` و `POST /tasks/{id}/snooze` با `If-Match`.
- ایجاد/تکمیل مرتبط با lead|case → Activity (`task_created` / `task_done`) + AuditLog.
- تنظیم `Lead.nextFollowUpAt` در UI یک کار مرتبط می‌سازد؛ تکمیل همان کار (due نزدیک به follow-up) فیلد پیگیری را پاک می‌کند.
- مشاور فقط `assigneeId` خودش را می‌بیند/ویرایش می‌کند؛ admin می‌تواند فیلتر/تخصیص مجدد کند.

### یادآور و اعلان (mock)

- `POST /tasks/process-reminders` برای کارهای باز که `remindAt` (یا در نبود آن `dueAt`) رسیده و هنوز اعلان `task_due` ندارند، **حداکثر یک** Notification می‌سازد.
- در UI (فقط وقتی `NEXT_PUBLIC_API_MOCKING=enabled`) هر ۳۰ ثانیه این endpoint صدا زده می‌شود (`useTaskReminderScheduler`).
- **بک‌اند واقعی باید job زمان‌بندی‌شده (cron/queue) داشته باشد**؛ این endpoint و polling فقط برای توسعهٔ محلی است و جایگزین scheduler production نیست.

## عملکرد فهرست و کانبان

- جدول لیدها صفحه‌بندی سمت سرور دارد (پیش‌فرض UI معمولاً ≤۱۰۰ ردیف در صفحه).
- کانبان هر ستون را با `useInfiniteQuery` و `pageSize=20` بارگذاری می‌کند؛ رندر کارت‌ها با `VirtualList` پنجره‌بندی می‌شود تا ستون‌های پرجمعیت (~۱۰۰۰ کارت بارگذاری‌شده) روان بمانند.
- تست دود عملکرد: `src/mocks/handlers/crm.perf.test.ts` (۵٬۰۰۰ لید / ستون ۱٬۰۰۰تایی در handler).

## قالب پیام

متغیرهای مجاز: `{name}`، `{consultant}`، `{date}`، `{time}`، `{country}`. تابع `renderTemplate` در `src/contracts/crm.ts` متغیرهای گم‌شده را در `missingVariables` برمی‌گرداند.

## تاریخ و پول

- API: UTC ISO 8601؛ UI: شمسی (`date-fns-jalali`).
- موبایل نرمال‌شده `09xxxxxxxxx`.
- `Lead.value` و مبالغ عملیاتی CRM به **ریال** (عدد صحیح).
