/**
 * Active mock-API scenario (dev tooling).
 *
 * Tiny on purpose: this file ships in every bundle, but everything in it is
 * gated by `NEXT_PUBLIC_API_MOCKING === "enabled"`, so with mocking off the
 * header helper is a constant `{}` and the storage code is never reached.
 * The mock backend itself (`src/mocks`) is only ever imported dynamically.
 */

export const MOCK_SCENARIO_HEADER = "x-mock-scenario";
export const MOCK_SCENARIO_QUERY_PARAM = "__scenario";
export const MOCK_SCENARIO_STORAGE_KEY = "apply:mock-scenario";

export const MOCK_SCENARIO_IDS = [
  "server_error",
  "forbidden",
  "unauthorized",
  "slow",
  "empty",
  "validation_error",
  "version_mismatch",
] as const;

export type MockScenarioId = (typeof MOCK_SCENARIO_IDS)[number];

export function isMockScenarioId(value: unknown): value is MockScenarioId {
  return (
    typeof value === "string" &&
    (MOCK_SCENARIO_IDS as readonly string[]).includes(value)
  );
}

function isMockingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
}

let current: MockScenarioId | null | undefined;
const listeners = new Set<() => void>();

function readInitial(): MockScenarioId | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(
      MOCK_SCENARIO_QUERY_PARAM,
    );
    if (isMockScenarioId(fromUrl)) return fromUrl;
    const stored = window.sessionStorage.getItem(MOCK_SCENARIO_STORAGE_KEY);
    return isMockScenarioId(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Currently selected scenario (`null` = normal behaviour) */
export function getMockScenario(): MockScenarioId | null {
  if (!isMockingEnabled()) return null;
  if (current === undefined) current = readInitial();
  return current;
}

export function setMockScenario(next: MockScenarioId | null): void {
  if (!isMockingEnabled()) return;
  current = next;
  try {
    if (next) window.sessionStorage.setItem(MOCK_SCENARIO_STORAGE_KEY, next);
    else window.sessionStorage.removeItem(MOCK_SCENARIO_STORAGE_KEY);
  } catch {
    // storage unavailable — keep the in-memory value only
  }
  for (const listener of listeners) listener();
}

export function subscribeMockScenario(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Headers the API client adds to every request while a scenario is active */
export function getMockScenarioHeaders(): Record<string, string> {
  const scenario = getMockScenario();
  return scenario ? { [MOCK_SCENARIO_HEADER]: scenario } : {};
}
