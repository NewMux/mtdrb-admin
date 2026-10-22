import { useCallback, useMemo, useState } from "react";
import { getCaptchaSiteKey } from "../config/captcha";

export interface CaptchaState {
  /** Turnstile site key, or null when the forms run without a captcha. */
  siteKey: string | null;
  /** True while a captcha is required but not solved yet. */
  pending: boolean;
  /** The solved token to pass as options.captchaToken, or undefined. */
  token: string | undefined;
  /** Incremented to make the widget draw a fresh challenge. */
  resetKey: number;
  setToken: (token: string | null) => void;
  /** Tokens are single use: call after every attempt, success or not. */
  reset: () => void;
}

export function useCaptcha(): CaptchaState {
  const siteKey = useMemo(
    () => getCaptchaSiteKey(import.meta.env as Record<string, string | undefined>),
    [],
  );
  const [token, setTokenState] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const setToken = useCallback((value: string | null) => setTokenState(value), []);
  const reset = useCallback(() => {
    setTokenState(null);
    setResetKey((n) => n + 1);
  }, []);

  return {
    siteKey,
    pending: siteKey !== null && token === null,
    token: token ?? undefined,
    resetKey,
    setToken,
    reset,
  };
}
