import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiMaximize } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/auth-context";
import { useRTL } from "../hooks/useRTL";
import { toLocalDateString } from "../utils/analyticsRange";
import {
  daysUntil,
  detectCredentialType,
  reasonKey,
  scanCredential,
  type CredentialType,
  type ScanResult,
} from "../api/accessControl";

type Direction = "auto" | "check_in" | "check_out";
type ReaderType = "auto" | CredentialType;

const RESULT_MS = 4000;

// The front-desk tablet. A USB/Bluetooth scanner (QR, barcode, card reader - anything
// that types what it reads and presses Enter) fills the box; the screen answers in big
// green or red. Works with any reader that behaves like a keyboard, so it needs no
// driver or vendor integration. Staff stay signed in on the tablet.
export default function Kiosk() {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { tenantId } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const clearTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [branches, setBranches] = React.useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = React.useState("");
  const [direction, setDirection] = React.useState<Direction>("auto");
  const [readerType, setReaderType] = React.useState<ReaderType>("auto");
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!tenantId) return;
    void (async () => {
      const { data } = await supabase.from("branches").select("id, name").eq("tenant_id", tenantId).order("name");
      const list = (data ?? []) as { id: string; name: string }[];
      setBranches(list);
      setBranchId((current) => current || list[0]?.id || "");
    })();
  }, [tenantId]);

  // A scanner types into whatever has focus: keep it on the box.
  const focusInput = React.useCallback(() => inputRef.current?.focus(), []);
  React.useEffect(() => {
    focusInput();
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, [focusInput]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = value.trim();
    if (!code || busy) return;
    setBusy(true);
    setError("");
    try {
      const type = readerType === "auto" ? detectCredentialType(code) : readerType;
      const outcome = await scanCredential({
        type,
        credential: code,
        direction,
        branchId: branchId || null,
        eventId: `kiosk-${crypto.randomUUID()}`,
      });
      setResult(outcome);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setResult(null), RESULT_MS);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error && err.message ? err.message : t("accessControl.failed"));
    } finally {
      setValue("");
      setBusy(false);
      focusInput();
    }
  };

  const days = result?.allowed ? daysUntil(result.memberExpiry, toLocalDateString(new Date())) : null;

  return (
    <div className="min-h-[80vh] space-y-6" dir={isRTL ? "rtl" : "ltr"} onClick={focusInput}>
      <div className="flex items-center justify-between gap-3">
        <Link to="/dashboard/attendance" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:underline dark:text-gray-300">
          <FiArrowLeft className="rtl:rotate-180" /> {t("accessControl.backToAttendance")}
        </Link>
        <button type="button" className="btn btn-secondary" onClick={() => void document.documentElement.requestFullscreen?.()}>
          <FiMaximize /> {t("accessControl.fullscreen")}
        </button>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("accessControl.kioskTitle")}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t("accessControl.kioskHint")}</p>

        <form onSubmit={submit}>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTimeout(focusInput, 50)}
            disabled={busy}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="none"
            placeholder={t("accessControl.scanHere")}
            aria-label={t("accessControl.scanHere")}
            className="w-full rounded-2xl border-2 border-sky-300 bg-white px-6 py-5 text-center text-2xl text-gray-900 outline-none focus:border-sky-500 dark:border-sky-700 dark:bg-gray-800 dark:text-white"
          />
        </form>

        <div className="grid grid-cols-1 gap-3 text-start sm:grid-cols-3">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("accessControl.direction")}
            <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="auto">{t("accessControl.directions.auto")}</option>
              <option value="check_in">{t("accessControl.directions.check_in")}</option>
              <option value="check_out">{t("accessControl.directions.check_out")}</option>
            </select>
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("accessControl.readerType")}
            <select value={readerType} onChange={(e) => setReaderType(e.target.value as ReaderType)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="auto">{t("accessControl.readerAuto")}</option>
              <option value="qr">{t("accessControl.credentialTypes.qr_token_hash")}</option>
              <option value="badge">{t("accessControl.credentialTypes.badge_uid_hash")}</option>
              <option value="vendor_user_id">{t("accessControl.credentialTypes.vendor_user_id")}</option>
            </select>
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("accessControl.branch")}
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              {branches.length === 0 && <option value="">{t("accessControl.anyBranch")}</option>}
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
        </div>

        <div aria-live="assertive" className="min-h-[220px]">
          {error && <p role="alert" className="rounded-2xl bg-red-50 p-6 text-lg text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
          {result && (
            <div
              role="status"
              className={`rounded-3xl p-8 ${result.allowed ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200" : "bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200"}`}
            >
              {result.allowed ? <FiCheckCircle className="mx-auto h-16 w-16" aria-hidden="true" /> : <FiXCircle className="mx-auto h-16 w-16" aria-hidden="true" />}
              {result.memberName && <p className="mt-3 text-3xl font-bold">{result.memberName}</p>}
              <p className="mt-2 text-xl">
                {result.allowed
                  ? result.direction === "check_out" ? t("accessControl.goodbye") : t("accessControl.welcome")
                  : t(reasonKey(result.reason))}
              </p>
              {result.duplicate && <p className="mt-1 text-sm">{t("accessControl.alreadyScanned")}</p>}
              {days !== null && days >= 0 && days <= 7 && (
                <p className="mt-3 text-base font-medium">{t("accessControl.expiresSoon", { count: days })}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
