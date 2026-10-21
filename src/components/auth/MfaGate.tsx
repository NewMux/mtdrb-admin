import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

type Step =
  | { kind: "starting" }
  | { kind: "enroll"; factorId: string; qr: string; secret: string }
  | { kind: "challenge"; factorId: string }
  | { kind: "fatal"; message: string };

interface MfaGateProps {
  /** Called after a successful verification so the guard can re-check access. */
  onVerified: () => Promise<void> | void;
}

const COOLDOWN_MS = 30_000;

function describeError(err: { message?: string; status?: number; code?: string }): {
  message: string;
  rateLimited: boolean;
} {
  const message = err.message ?? "Something went wrong.";
  const rateLimited =
    err.status === 429 || err.code === "over_request_rate_limit" || /rate limit|too many/i.test(message);
  if (rateLimited) {
    return { message: "Too many attempts. Wait a moment before trying again.", rateLimited };
  }
  if (/invalid totp|invalid code|incorrect/i.test(message)) {
    return {
      message: "That code did not match. Wait for the next code in your app and try again.",
      rateLimited,
    };
  }
  return { message, rateLimited };
}

/**
 * Second-factor screen for the platform-owner console.
 *
 *  - no verified TOTP factor  -> enrol one (QR + manual secret), then verify
 *  - a verified factor exists -> just ask for the current code
 *
 * Stale *unverified* factors from abandoned enrolments are removed first (they
 * accumulate and collide). On success the session is refreshed so the new
 * access token carries aal2, then the guard re-asks the database - the
 * in-memory state is never trusted.
 */
export default function MfaGate({ onVerified }: MfaGateProps) {
  const { signOut, user } = useAuth();
  const [step, setStep] = useState<Step>({ kind: "starting" });
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // mountedRef (not a per-effect "cancelled" flag) so React StrictMode's
  // simulated remount cannot swallow the result of the one-time start below.
  const mountedRef = useRef(true);
  const startedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const start = useCallback(async () => {
    const mfa = supabase.auth?.mfa;
    if (!mfa) {
      setStep({ kind: "fatal", message: "Two-factor authentication is not available in this environment." });
      return;
    }

    try {
      const { data, error: listError } = await mfa.listFactors();
      if (listError || !data) throw listError ?? new Error("Could not load your authenticators.");

      const verified = data.totp[0];
      if (verified) {
        if (mountedRef.current) setStep({ kind: "challenge", factorId: verified.id });
        return;
      }

      for (const factor of data.all) {
        if (factor.status === "unverified") {
          await mfa.unenroll({ factorId: factor.id });
        }
      }

      const { data: enrolled, error: enrollError } = await mfa.enroll({
        factorType: "totp",
        friendlyName: `MTDRB owner ${new Date().toISOString().slice(0, 16)}`,
      });
      if (enrollError || !enrolled) throw enrollError ?? new Error("Could not start enrolment.");

      if (mountedRef.current) {
        setStep({
          kind: "enroll",
          factorId: enrolled.id,
          qr: enrolled.totp.qr_code,
          secret: enrolled.totp.secret,
        });
      }
    } catch (err) {
      // SDK errors are Error subclasses, but accept any object carrying a message.
      const message =
        (err as { message?: string } | null)?.message ?? "Could not set up two-factor authentication.";
      if (mountedRef.current) {
        setStep({
          kind: "fatal",
          message: /disabled|not enabled|not allowed/i.test(message)
            ? "Authenticator-app MFA is switched off for this project. Enable TOTP in Supabase → Authentication → Multi-Factor, then reload."
            : message,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  // Tick only while a cooldown is running.
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const coolingDown = cooldownUntil > now;
  const secondsLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step.kind !== "enroll" && step.kind !== "challenge") return;
    const trimmed = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // A fresh challenge per attempt: challenges expire and are single-use.
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: step.factorId,
        code: trimmed,
      });
      if (verifyError) {
        const described = describeError(verifyError);
        setError(described.message);
        if (described.rateLimited) {
          const until = Date.now() + COOLDOWN_MS;
          setCooldownUntil(until);
          setNow(Date.now());
        }
        setCode("");
        return;
      }

      // Make sure the stored token carries aal2, then let the guard re-check.
      await supabase.auth.refreshSession();
      await onVerified();
    } catch (err) {
      setError(describeError(err as Error).message);
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white text-start">
          Platform console — verify it’s you
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-start">
          {user?.email ? `Signed in as ${user.email}. ` : ""}
          This area needs a second factor.
        </p>

        {step.kind === "starting" && (
          <div className="mt-8 flex justify-center" role="status" aria-label="Loading">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {step.kind === "fatal" && (
          <div className="mt-6" role="alert">
            <p className="text-sm text-red-600 dark:text-red-400">{step.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Reload
            </button>
          </div>
        )}

        {(step.kind === "enroll" || step.kind === "challenge") && (
          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            {step.kind === "enroll" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 text-start">
                  Scan this with an authenticator app (1Password, Google Authenticator, Authy…),
                  then enter the 6-digit code it shows. Enrol a second device or keep the
                  secret below somewhere safe so losing one phone doesn’t lock you out.
                </p>
                <div className="flex justify-center bg-white rounded-lg p-3 border border-gray-200">
                  <img src={step.qr} alt="Authenticator QR code" className="w-44 h-44" />
                </div>
                <div className="text-start">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Can’t scan? Enter this secret:</p>
                  <code
                    className="block mt-1 break-all rounded bg-gray-100 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 select-all"
                    data-testid="mfa-secret"
                  >
                    {step.secret}
                  </code>
                </div>
              </div>
            )}

            {step.kind === "challenge" && (
              <p className="text-sm text-gray-700 dark:text-gray-300 text-start">
                Enter the current 6-digit code from your authenticator app.
              </p>
            )}

            <div className="text-start">
              <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                6-digit code
              </label>
              <input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={submitting || coolingDown}
                autoFocus
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-lg tracking-widest text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 text-start" role="alert">
                {error}
              </p>
            )}
            {coolingDown && (
              <p className="text-sm text-amber-700 dark:text-amber-400 text-start" role="status">
                Try again in {secondsLeft}s.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || coolingDown}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Verifying…" : step.kind === "enroll" ? "Turn on and continue" : "Verify"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-6 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
