import {
  MOCK_SCENARIO_HEADER,
  MOCK_SCENARIO_QUERY_PARAM,
  isMockScenarioId,
  type MockScenarioId,
} from "@/lib/api/mock-scenario";
import { apiError, MockApiError } from "./errors";

export { MOCK_SCENARIO_HEADER, MOCK_SCENARIO_QUERY_PARAM };
export type { MockScenarioId };

export type ScenarioDefinition = {
  id: MockScenarioId;
  /** Persian label shown in the dev panel */
  label: string;
  description: string;
};

export const SCENARIOS: readonly ScenarioDefinition[] = [
  { id: "server_error", label: "خطای ۵۰۰", description: "هر درخواست با INTERNAL (۵۰۰) پاسخ داده می‌شود" },
  { id: "forbidden", label: "عدم دسترسی ۴۰۳", description: "هر درخواست با FORBIDDEN (۴۰۳) رد می‌شود" },
  { id: "unauthorized", label: "نشست منقضی ۴۰۱", description: "هر درخواست با UNAUTHORIZED (۴۰۱) رد می‌شود" },
  { id: "slow", label: "پاسخ بسیار کند", description: "هر پاسخ حدود ۸ ثانیه تأخیر دارد" },
  { id: "empty", label: "فهرست خالی", description: "فهرست‌ها بدون آیتم و با total=0 برمی‌گردند" },
  { id: "validation_error", label: "خطای اعتبارسنجی", description: "VALIDATION_ERROR همراه با fields برای فیلدهای ارسالی" },
  {
    id: "version_mismatch",
    label: "تعارض نسخه ۴۰۹",
    description: "هر PATCH/PUT با CONFLICT و reason=version_mismatch پاسخ می‌دهد",
  },
];

/** Scenario of a request: header wins over the `?__scenario=` query param */
export function readScenario(request: Request, url: URL): MockScenarioId | null {
  const raw =
    request.headers.get(MOCK_SCENARIO_HEADER) ??
    url.searchParams.get(MOCK_SCENARIO_QUERY_PARAM);
  if (!raw) return null;
  if (isMockScenarioId(raw)) return raw;
  console.warn(
    `[mock] Unknown scenario "${raw}" ignored. Valid: ${SCENARIOS.map((s) => s.id).join(", ")}`,
  );
  return null;
}

/** Error forced by a scenario, or `null` when the scenario lets the request through */
export function scenarioError(
  scenario: MockScenarioId | null,
  fieldNames: readonly string[],
): MockApiError | null {
  switch (scenario) {
    case "server_error":
      return apiError.internal("خطای شبیه‌سازی‌شده سرور (سناریوی server_error)");
    case "forbidden":
      return apiError.forbidden("دسترسی شبیه‌سازی‌شده رد شد (سناریوی forbidden)");
    case "unauthorized":
      return apiError.unauthorized("نشست شبیه‌سازی‌شده منقضی شد (سناریوی unauthorized)");
    case "validation_error": {
      const names = fieldNames.length > 0 ? fieldNames.slice(0, 3) : ["_root"];
      return apiError.validation(
        Object.fromEntries(
          names.map((name) => [
            name,
            ["این مقدار توسط سناریوی validation_error نامعتبر علامت‌گذاری شد"],
          ]),
        ),
      );
    }
    case "version_mismatch":
      return apiError.versionMismatch(1);
    default:
      return null;
  }
}
