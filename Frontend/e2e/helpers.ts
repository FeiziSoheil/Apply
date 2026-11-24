import { type Page } from "@playwright/test";
import { DEMO_ACCOUNTS } from "../src/mocks/config";
import { MOCK_TOKENS_STORAGE_KEY } from "../src/lib/api/session-adapter";

/** Staff login — avoid getByLabel(/رمز/) which also matches «نمایش رمز عبور». */
export async function staffLogin(
  page: Page,
  account: { email: string; password: string } = DEMO_ACCOUNTS.admin,
) {
  await page.goto("/staff/login");
  await page.getByLabel("ایمیل", { exact: true }).fill(account.email);
  await page.locator('input[name="password"]').fill(account.password);
  await page.getByRole("button", { name: /^ورود$/ }).click();
  await page.waitForURL(/\/admin/);
}

/** Auth headers for `page.evaluate(fetch)` against the mock Bearer transport. */
export async function mockAuthHeaders(
  page: Page,
): Promise<Record<string, string>> {
  return page.evaluate((storageKey) => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return { Accept: "application/json" };
      const parsed = JSON.parse(raw) as { accessToken?: string };
      if (!parsed.accessToken) return { Accept: "application/json" };
      return {
        Accept: "application/json",
        Authorization: `Bearer ${parsed.accessToken}`,
      };
    } catch {
      return { Accept: "application/json" };
    }
  }, MOCK_TOKENS_STORAGE_KEY);
}

/** Snapshot mock Bearer tokens from sessionStorage (same-tab role switch). */
export async function readMockTokens(
  page: Page,
): Promise<{ accessToken: string; refreshToken: string | null; authStore?: string | null } | null> {
  return page.evaluate((storageKey) => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const auth = sessionStorage.getItem("apply:mock-auth");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        accessToken?: string;
        refreshToken?: string | null;
      };
      if (!parsed.accessToken) return null;
      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken ?? null,
        authStore: auth,
      };
    } catch {
      return null;
    }
  }, MOCK_TOKENS_STORAGE_KEY);
}

export async function writeMockTokens(
  page: Page,
  tokens: { accessToken: string; refreshToken: string | null; authStore?: string | null },
  role: "student" | "admin" | "consultant" = "student",
): Promise<void> {
  await page.evaluate(
    ({ storageKey, next, r }) => {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          accessToken: next.accessToken,
          refreshToken: next.refreshToken,
        }),
      );
      if (next.authStore) {
        sessionStorage.setItem("apply:mock-auth", next.authStore);
      }
      document.cookie = `mock_session=${encodeURIComponent(JSON.stringify({ role: r }))}; path=/; max-age=3600; SameSite=Lax`;
    },
    { storageKey: MOCK_TOKENS_STORAGE_KEY, next: tokens, r: role },
  );
  const origin = new URL(page.url() || "http://127.0.0.1:3000").origin;
  await page.context().addCookies([
    {
      name: "mock_session",
      value: encodeURIComponent(JSON.stringify({ role })),
      url: origin,
    },
  ]);
}

/**
 * Staff login via API in the current page (same MSW worker / mock db).
 * Reads `x-mock-access-token` — body has no token by contract.
 */
export async function apiStaffLogin(
  page: Page,
  account: { email: string; password: string } = DEMO_ACCOUNTS.admin,
): Promise<{ accessToken: string; refreshToken: string | null }> {
  const tokens = await page.evaluate(async (creds) => {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(creds),
    });
    const accessToken = res.headers.get("x-mock-access-token");
    const refreshToken = res.headers.get("x-mock-refresh-token");
    if (!res.ok || !accessToken) {
      throw new Error(`staff login failed: ${res.status}`);
    }
    return { accessToken, refreshToken };
  }, account);
  await writeMockTokens(page, tokens, "admin");
  return tokens;
}

type StaffDoc = {
  id: string;
  status: string;
  version: number;
  title: string;
  checklistItemId: string | null;
};

/** Fetch staff Bearer token via API WITHOUT modifying browser sessionStorage/cookies */
export async function getStaffAuthHeaders(
  page: Page,
  account: { email: string; password: string } = DEMO_ACCOUNTS.admin,
): Promise<Record<string, string>> {
  return page.evaluate(async (creds) => {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(creds),
    });
    const accessToken = res.headers.get("x-mock-access-token");
    if (!res.ok || !accessToken) {
      throw new Error(`staff login failed: ${res.status}`);
    }
    return {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  }, account);
}

/** Review a case document as staff via in-page fetch (browser MSW db). */
export async function staffReviewDocument(
  page: Page,
  input: {
    caseId: string;
    /** Prefer matching student view / checklist id */
    checklistItemId?: string | null;
    titleHint?: string;
    status: "approved" | "rejected";
    rejectionReason?: string;
    authHeaders?: Record<string, string>;
  },
): Promise<{ documentId: string; status: number; body: string }> {
  const headers = input.authHeaders ?? (await mockAuthHeaders(page));
  return page.evaluate(
    async ({ caseId, checklistItemId, titleHint, status, rejectionReason, auth }) => {
      const docsRes = await fetch(
        `/api/v1/cases/${caseId}/documents?pageSize=50`,
        { headers: auth },
      );
      const docsJson = (await docsRes.json()) as { data?: StaffDoc[]; error?: unknown; message?: string };
      if (!docsRes.ok || !docsJson.data) {
        throw new Error(
          `staffReviewDocument fetch docs failed (${docsRes.status}): ${JSON.stringify(docsJson)}`,
        );
      }
      const target =
        (checklistItemId
          ? docsJson.data.find((d) => d.checklistItemId === checklistItemId)
          : undefined) ??
        (titleHint
          ? docsJson.data.find(
              (d) =>
                (d.title.includes(titleHint) || titleHint.includes(d.title)) &&
                (d.status === "uploaded" ||
                  d.status === "pending" ||
                  d.status === "rejected"),
            )
          : undefined) ??
        docsJson.data.find(
          (d) => d.status === "uploaded" || d.status === "pending",
        );
      if (!target) {
        throw new Error(
          `staff doc not found; titles=${docsJson.data
            .map((d) => `${d.title}:${d.status}:${d.checklistItemId}`)
            .join("|")}`,
        );
      }
      const reviewRes = await fetch(`/api/v1/documents/${target.id}/review`, {
        method: "POST",
        headers: {
          ...auth,
          "Content-Type": "application/json",
          "If-Match": String(target.version),
        },
        body: JSON.stringify({
          status,
          ...(status === "rejected"
            ? {
                rejectionReason:
                  rejectionReason ??
                  "کیفیت تصویر کافی نیست؛ لطفاً دوباره بارگذاری کنید.",
              }
            : {}),
        }),
      });
      const body = await reviewRes.text();
      if (!reviewRes.ok) {
        throw new Error(`review failed ${reviewRes.status}: ${body}`);
      }
      return {
        documentId: target.id,
        status: reviewRes.status,
        body,
      };
    },
    { ...input, auth: headers },
  );
}

/** Tell the in-page React Query client to invalidate and refetch all active queries */
export async function invalidateBrowserQueries(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const win = window as unknown as {
      __queryClient?: { invalidateQueries: () => Promise<void> };
    };
    await win.__queryClient?.invalidateQueries();
  });
}
