import { useCallback, useEffect, useState } from "react";

const DEFAULT_MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;
const STORAGE_PREFIX = "mtdrb_auth_attempts:";

interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

const readRecord = (key: string): AttemptRecord => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { count: 0, lockedUntil: null };
    const parsed = JSON.parse(raw) as Partial<AttemptRecord>;
    return {
      count: typeof parsed.count === "number" ? parsed.count : 0,
      lockedUntil: typeof parsed.lockedUntil === "number" ? parsed.lockedUntil : null,
    };
  } catch {
    return { count: 0, lockedUntil: null };
  }
};

const writeRecord = (key: string, record: AttemptRecord) => {
  try {
    localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // localStorage unavailable (private mode, quota) -- nothing to persist,
    // the limiter just resets on next load.
  }
};

/**
 * A soft, per-browser attempt limiter for auth forms. This raises the bar
 * against a script driving the UI repeatedly, but it is NOT a substitute for
 * server-side protection: it's cleared by clearing site data or switching
 * browser/device, and it does nothing against a caller that talks to the
 * Supabase API directly instead of this form. Supabase Auth's own built-in
 * rate limiting (configured in the Supabase dashboard) is the real backstop.
 */
export function useAuthAttemptLimiter(
  formId: string,
  identifier: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
) {
  const key = `${STORAGE_PREFIX}${formId}:${identifier.trim().toLowerCase()}`;
  const [record, setRecord] = useState<AttemptRecord>(() => readRecord(key));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setRecord(readRecord(key));
  }, [key]);

  useEffect(() => {
    if (!record.lockedUntil) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [record.lockedUntil]);

  const isLocked = !!record.lockedUntil && record.lockedUntil > now;
  const remainingSeconds = isLocked
    ? Math.max(0, Math.ceil((record.lockedUntil! - now) / 1000))
    : 0;

  const registerFailure = useCallback(() => {
    setRecord((prev) => {
      const count = prev.count + 1;
      const next: AttemptRecord =
        count >= maxAttempts
          ? { count: 0, lockedUntil: Date.now() + LOCKOUT_MS }
          : { count, lockedUntil: prev.lockedUntil };
      writeRecord(key, next);
      return next;
    });
  }, [key, maxAttempts]);

  const reset = useCallback(() => {
    const next: AttemptRecord = { count: 0, lockedUntil: null };
    writeRecord(key, next);
    setRecord(next);
  }, [key]);

  return { isLocked, remainingSeconds, registerFailure, reset, maxAttempts };
}
