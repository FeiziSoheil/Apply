import {
  DB_SCHEMA_VERSION,
  PERSIST_STORAGE_KEY,
  isPersistenceEnabled,
} from "./config";

/**
 * Optional localStorage persistence of the in-memory db
 * (on by default in development; `NEXT_PUBLIC_API_MOCK_PERSIST=enabled|disabled`).
 * Browser only — the Node server
 * instance always starts from the seed.
 */

type StoredSnapshot<T> = { version: number; savedAt: string; data: T };

function getStorage(): Storage | null {
  if (typeof window === "undefined" || !isPersistenceEnabled()) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readSnapshot<T>(): T | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(PERSIST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSnapshot<T>;
    if (parsed.version !== DB_SCHEMA_VERSION) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeSnapshot<T>(data: T): void {
  const storage = getStorage();
  if (!storage) return;
  const payload: StoredSnapshot<T> = {
    version: DB_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    data,
  };
  try {
    storage.setItem(PERSIST_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("[mock] could not persist the mock db to localStorage", error);
  }
}

export function clearSnapshot(): void {
  getStorage()?.removeItem(PERSIST_STORAGE_KEY);
}
