import type { JobFormState } from "@/features/jobs/types";

const DRAFT_KEY = "garageflow:new-job-draft";
const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000; // a day-old draft is more likely stale than useful

interface StoredDraft {
  form: JobFormState;
  step: number;
  savedAt: number;
}

export function saveDraft(form: JobFormState, step: number) {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredDraft = { form, step, savedAt: Date.now() };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Storage can fail (private browsing, quota) — the form still works,
    // it just won't survive a reload. Not worth surfacing to the mechanic
    // mid-job.
  }
}

export function loadDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (Date.now() - parsed.savedAt > MAX_DRAFT_AGE_MS) {
      clearDraft();
      return null;
    }
    // A draft with no reg number typed yet isn't worth resuming.
    if (!parsed.form?.regNumber?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing meaningful to do if storage is unavailable.
  }
}
