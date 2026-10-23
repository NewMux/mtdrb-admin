import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiCircle, FiX, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../../contexts/auth-context";
import { useSetupProgress } from "../../hooks/useSetupProgress";
import { checklistDismissKey, checklistProgress, nextChecklistItem } from "../../utils/setupChecklist";

function readDismissed(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

// A short "get set up" card for a gym that has not finished the basics. It
// disappears by itself once everything is done, or when dismissed (remembered
// per gym in this browser only).
export default function SetupChecklist({ refreshKey }: { refreshKey?: number }) {
  const { t } = useTranslation();
  const { tenantId } = useAuth();
  const { items } = useSetupProgress(refreshKey);
  const key = tenantId ? checklistDismissKey(tenantId) : "";
  const [dismissed, setDismissed] = React.useState(() => (key ? readDismissed(key) : false));

  React.useEffect(() => {
    setDismissed(key ? readDismissed(key) : false);
  }, [key]);

  if (!items || !tenantId || dismissed) return null;
  const progress = checklistProgress(items);
  if (progress.complete) return null;
  const next = nextChecklistItem(items);

  const dismiss = () => {
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      /* private mode: just hide it for this visit */
    }
    setDismissed(true);
  };

  return (
    <section
      aria-labelledby="setup-checklist-title"
      className="rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/60 dark:bg-sky-950/20 p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="text-start">
          <h2 id="setup-checklist-title" className="text-base font-semibold text-gray-900 dark:text-white">
            {t("setupChecklist.title")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("setupChecklist.progress", { done: progress.done, total: progress.total })}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("setupChecklist.dismiss")}
          className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-600 hover:bg-white/60 dark:hover:bg-white/10"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      <div
        className="mt-3 h-2 rounded-full bg-white dark:bg-gray-800 overflow-hidden"
        role="progressbar"
        aria-label={t("setupChecklist.title")}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.done}
      >
        <div className="h-full bg-sky-600" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
      </div>

      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border ${
                item.id === next?.id
                  ? "border-sky-400 dark:border-sky-600"
                  : "border-transparent"
              }`}
            >
              {item.done ? (
                <FiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <FiCircle className="h-5 w-5 shrink-0 text-gray-300" aria-hidden="true" />
              )}
              <span className="flex-1 text-start">
                <span className={`block font-medium ${item.done ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>
                  {t(`setupChecklist.items.${item.id}.title`)}
                </span>
                {!item.done && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {t(`setupChecklist.items.${item.id}.hint`)}
                  </span>
                )}
              </span>
              {!item.done && <FiArrowRight className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400 rtl:rotate-180" aria-hidden="true" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
