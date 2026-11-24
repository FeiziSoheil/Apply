/**
 * Persist in-progress student document draft pages across refresh (IndexedDB).
 * Stores bytes only — never original filenames.
 */

const DB_NAME = "apply-student-doc-drafts";
const STORE = "drafts";
const DB_VERSION = 1;

export type StoredDraftPage = {
  id: string;
  mimeType: string;
  width: number;
  height: number;
  bytes: ArrayBuffer;
  rotation: 0 | 90 | 180 | 270;
};

export type StoredDraft = {
  documentId: string;
  updatedAt: number;
  pages: StoredDraftPage[];
  softWarnings: string[];
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "documentId" });
      }
    };
  });
}

export async function saveUploadDraft(draft: StoredDraft): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("save draft"));
    tx.objectStore(STORE).put(draft);
  });
  db.close();
}

export async function loadUploadDraft(
  documentId: string,
): Promise<StoredDraft | null> {
  const db = await openDb();
  const draft = await new Promise<StoredDraft | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(documentId);
    request.onsuccess = () =>
      resolve((request.result as StoredDraft | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("load draft"));
  });
  db.close();
  return draft;
}

export async function clearUploadDraft(documentId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("clear draft"));
    tx.objectStore(STORE).delete(documentId);
  });
  db.close();
}
