/**
 * Production safety guards of the mock API.
 *
 * The mock API (MSW, Bearer-in-memory sessions, `relaxed` auth) is a
 * development tool. If any of it reaches production, real users would talk to
 * fake data — or, with `relaxed` auth, be treated as the demo admin. So the
 * following combinations are rejected loudly:
 *
 * - `NODE_ENV=production` + `NEXT_PUBLIC_API_MOCKING=enabled`, unless the
 *   explicit demo flag `NEXT_PUBLIC_DEMO_BUILD=enabled` is also set
 * - `NODE_ENV=production` + `NEXT_PUBLIC_API_MOCK_AUTH=relaxed` (or `MOCK_AUTH=relaxed`)
 *   — forbidden even for a demo build
 *
 * A *demo build* (`NEXT_PUBLIC_DEMO_BUILD=enabled`) is the only way to ship the
 * mock API in a production build (e.g. a public preview for stakeholders). It
 * shows a «نسخه نمایشی – داده‌ها آزمایشی هستند» banner, and the mock Bearer
 * tokens may live in sessionStorage exactly as in development.
 *
 * Enforced in `next.config.ts` (`next build` / `next start` / `next dev`
 * refuse to boot), `src/instrumentation.ts` (server start) and the mock
 * entries (`mocks/server.ts`, `mocks/browser.ts`). Dependency-free so it can
 * run in every one of those places.
 */

export type MockSafetyEnv = {
  nodeEnv: string | undefined;
  /** `NEXT_PUBLIC_API_MOCKING` */
  mocking: string | undefined;
  /** `NEXT_PUBLIC_API_MOCK_AUTH` */
  authRelaxed: string | undefined;
  /** `MOCK_AUTH` (unprefixed alias, rejected as well so it can't sneak in) */
  legacyAuthRelaxed: string | undefined;
  /** `NEXT_PUBLIC_DEMO_BUILD` */
  demoBuild: string | undefined;
};

/**
 * Read the relevant variables. Written with static `process.env.X` accesses
 * so Next.js can inline the `NEXT_PUBLIC_*` ones in client bundles.
 */
export function readMockSafetyEnv(): MockSafetyEnv {
  return {
    nodeEnv: process.env.NODE_ENV,
    mocking: process.env.NEXT_PUBLIC_API_MOCKING,
    authRelaxed: process.env.NEXT_PUBLIC_API_MOCK_AUTH,
    legacyAuthRelaxed: process.env.MOCK_AUTH,
    demoBuild: process.env.NEXT_PUBLIC_DEMO_BUILD,
  };
}

/** `NEXT_PUBLIC_DEMO_BUILD=enabled`: the build is a public demo (shows the banner) */
export function isDemoBuild(env: MockSafetyEnv = readMockSafetyEnv()): boolean {
  return env.demoBuild === "enabled";
}

/**
 * Whether the mock transport (MSW + Bearer session adapter) may run: mocking
 * is enabled and we are either not in production or in an explicit demo build.
 */
export function isMockRuntimeAllowed(
  env: MockSafetyEnv = readMockSafetyEnv(),
): boolean {
  if (env.mocking !== "enabled") return false;
  return env.nodeEnv !== "production" || isDemoBuild(env);
}

/**
 * Whether mock Bearer tokens may be mirrored into `sessionStorage` (never
 * `localStorage`): mock API enabled AND (`NODE_ENV=development` OR a
 * production demo build). Real mode never keeps a token in JS or storage.
 */
export function isMockTokenStorageAllowed(
  env: MockSafetyEnv = readMockSafetyEnv(),
): boolean {
  if (env.mocking !== "enabled") return false;
  return env.nodeEnv === "development" || (env.nodeEnv === "production" && isDemoBuild(env));
}

/** Human-readable problems; empty when the configuration is safe */
export function findMockSafetyViolations(env: MockSafetyEnv): string[] {
  if (env.nodeEnv !== "production") return [];
  const problems: string[] = [];
  if (env.mocking === "enabled" && !isDemoBuild(env)) {
    problems.push(
      "NEXT_PUBLIC_API_MOCKING=enabled is not allowed when NODE_ENV=production " +
        "(the mock API is for development only). Unset it or set it to \"disabled\". " +
        "For an intentional public demo build, also set NEXT_PUBLIC_DEMO_BUILD=enabled.",
    );
  }
  if (env.authRelaxed === "relaxed") {
    problems.push(
      "NEXT_PUBLIC_API_MOCK_AUTH=relaxed is development-only and would let " +
        "unauthenticated requests act as the demo admin. Remove it in production " +
        "(this is forbidden even with NEXT_PUBLIC_DEMO_BUILD=enabled).",
    );
  }
  if (env.legacyAuthRelaxed === "relaxed") {
    problems.push(
      "MOCK_AUTH=relaxed is development-only. Remove it in production " +
        "(this is forbidden even with NEXT_PUBLIC_DEMO_BUILD=enabled).",
    );
  }
  return problems;
}

/** Throws a clear error when the mock API is configured for production */
export function assertMockSafety(env: MockSafetyEnv = readMockSafetyEnv()): void {
  const problems = findMockSafetyViolations(env);
  if (problems.length === 0) return;
  throw new Error(
    `[mock-safety] Refusing to start with an unsafe mock configuration:\n` +
      problems.map((problem) => `  - ${problem}`).join("\n") +
      `\nSee docs/mocking.md.`,
  );
}
