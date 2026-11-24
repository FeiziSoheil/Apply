/**
 * Persist in-progress ticket compose draft in localStorage (text only).
 */

const STORAGE_KEY = "apply-student-ticket-draft";

export type TicketComposeDraft = {
  category: string;
  subject: string;
  body: string;
  relatedCaseId: string | null;
  updatedAt: number;
};

export function loadTicketDraft(): TicketComposeDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TicketComposeDraft;
    if (!parsed || typeof parsed.subject !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTicketDraft(draft: TicketComposeDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...draft, updatedAt: Date.now() }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearTicketDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
