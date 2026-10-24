import React from "react";
import { useTranslation } from "react-i18next";
import type { CaptchaState } from "../../hooks/useCaptcha";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      language?: string;
      theme?: "auto" | "light" | "dark";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error("Turnstile did not initialise"));
      };
      script.onerror = () => reject(new Error("Turnstile failed to load"));
      document.head.appendChild(script);
    }).catch((err) => {
      scriptPromise = null; // allow a retry on the next mount
      throw err;
    });
  }
  return scriptPromise;
}

// Cloudflare Turnstile challenge. Renders nothing when no site key is
// configured. The parent form disables its submit button while
// captcha.pending and calls captcha.reset() after every attempt.
export default function Captcha({ captcha }: { captcha: CaptchaState }) {
  const { t, i18n } = useTranslation();
  const { siteKey, setToken, resetKey } = captcha;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = React.useState(false);

  // resetKey is a dependency on purpose: a new key tears the widget down and
  // draws a fresh challenge, which is how a spent token is replaced.
  React.useEffect(() => {
    if (!siteKey) return;
    const container = containerRef.current;
    if (!container) return;
    let widgetId: string | null = null;
    let cancelled = false;
    setToken(null);
    setLoadFailed(false);

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return;
        widgetId = turnstile.render(container, {
          sitekey: siteKey,
          language: i18n.language === "ar" ? "ar" : "en",
          theme: "auto",
          callback: (token) => setToken(token),
          "expired-callback": () => setToken(null),
          "error-callback": () => setToken(null),
        });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
      setToken(null);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, resetKey, i18n.language, setToken]);

  if (!siteKey) return null;

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex justify-center min-h-[65px]" />
      {loadFailed && (
        <p role="alert" className="text-sm text-red-600 text-center">
          {t("auth.captchaLoadFailed")}
        </p>
      )}
    </div>
  );
}
