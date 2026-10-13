// The adult confirmation is remembered for 30 days in this browser. If storage is blocked
// (private mode) the question simply comes back on the next visit, which is the safe side.
export const AGE_KEY = "vp_age_confirmed";
const VALID_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isAgeConfirmed(now: number = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(AGE_KEY);
    if (!raw) return false;
    const at = Number(JSON.parse(raw)?.at);
    return Number.isFinite(at) && now - at < VALID_DAYS * DAY_MS && at <= now;
  } catch {
    return false;
  }
}

export function confirmAge(now: number = Date.now()): void {
  try {
    localStorage.setItem(AGE_KEY, JSON.stringify({ at: now }));
  } catch {
    // Storage blocked: the gate shows again next visit.
  }
}
