import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { FiDownload, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/auth-context";
import { deleteAccount, AccountDeletionError } from "../../api/accountDeletion";
import {
  downloadJson,
  exportFileName,
  exportGymData,
  exportMemberData,
  type ExportClient,
} from "../../utils/gymExport";

const buttonClass =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed";
const inputClass =
  "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent";

// Settings > Data & privacy: take your data with you, answer a member's data
// request, and erase an account (or the whole gym). Deletion is permanent.
export default function DataPrivacyTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, tenantId, userMetadata } = useAuth();
  const isAdmin = userMetadata?.role === "admin";

  const [gymName, setGymName] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState<{ done: number; total: number } | null>(null);
  const [memberEmail, setMemberEmail] = React.useState("");
  const [memberBusy, setMemberBusy] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState("");

  // The name the server compares against is the gym's registered name.
  React.useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("tenants").select("name").eq("id", tenantId).maybeSingle();
      if (!cancelled) setGymName((data as { name?: string } | null)?.name ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const client = supabase as unknown as ExportClient;

  const handleExportGym = async () => {
    if (!tenantId) return;
    setExporting({ done: 0, total: 1 });
    try {
      const doc = await exportGymData(client, tenantId, (done, total) => setExporting({ done, total }));
      downloadJson(exportFileName("gym"), doc);
      const failed = Object.keys(doc.errors).length;
      if (failed > 0) toast.error(t("dataPrivacy.exportPartial", { count: failed }));
      else toast.success(t("dataPrivacy.exportDone"));
    } catch {
      toast.error(t("dataPrivacy.exportFailed"));
    } finally {
      setExporting(null);
    }
  };

  const handleExportMember = async () => {
    if (!tenantId || !memberEmail.trim()) return;
    setMemberBusy(true);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id")
        .eq("tenant_id", tenantId)
        .ilike("email", memberEmail.trim());
      if (error) throw error;
      const matches = (data ?? []) as { id: string }[];
      if (matches.length === 0) {
        toast.error(t("dataPrivacy.memberNotFound"));
        return;
      }
      for (const match of matches) {
        const doc = await exportMemberData(client, tenantId, match.id);
        downloadJson(exportFileName("member"), doc);
      }
      toast.success(t("dataPrivacy.exportDone"));
    } catch {
      toast.error(t("dataPrivacy.exportFailed"));
    } finally {
      setMemberBusy(false);
    }
  };

  const expected = isAdmin ? (gymName ?? "") : (user?.email ?? "");
  const matches = isAdmin ? confirmText.trim() === expected && expected !== "" : confirmText.trim().toLowerCase() === expected.toLowerCase() && expected !== "";

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const result = await deleteAccount(isAdmin ? "gym" : "me", confirmText.trim());
      toast.success(t("dataPrivacy.deleted"));
      if (!result.filesRemoved) toast(t("dataPrivacy.filesNotRemoved"), { duration: 8000 });
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(err instanceof AccountDeletionError ? err.message : t("dataPrivacy.deleteFailed"));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <section className="card dark:bg-gray-800 dark:border-gray-700 rounded-3xl shadow-sm p-6 space-y-4" aria-labelledby="dp-export">
          <div className="text-start">
            <h3 id="dp-export" className="text-base font-semibold text-gray-900 dark:text-white">{t("dataPrivacy.exportTitle")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("dataPrivacy.exportHint")}</p>
          </div>
          <button type="button" className={`${buttonClass} bg-sky-600 text-white hover:bg-sky-700`} onClick={handleExportGym} disabled={exporting !== null || !tenantId}>
            <FiDownload aria-hidden="true" />
            {exporting ? t("dataPrivacy.exporting", { done: exporting.done, total: exporting.total }) : t("dataPrivacy.exportButton")}
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
            <div className="text-start">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t("dataPrivacy.memberTitle")}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("dataPrivacy.memberHint")}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                className={inputClass}
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder={t("dataPrivacy.memberEmail")}
                aria-label={t("dataPrivacy.memberEmail")}
              />
              <button type="button" className={`${buttonClass} bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 shrink-0`} onClick={handleExportMember} disabled={memberBusy || !memberEmail.trim()}>
                <FiDownload aria-hidden="true" />
                {t("dataPrivacy.memberButton")}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 p-6 space-y-4" aria-labelledby="dp-delete">
        <div className="flex items-start gap-3 text-start">
          <FiAlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h3 id="dp-delete" className="text-base font-semibold text-red-700 dark:text-red-400">
              {isAdmin ? t("dataPrivacy.deleteGymTitle") : t("dataPrivacy.deleteMeTitle")}
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {isAdmin ? t("dataPrivacy.deleteGymWarning") : t("dataPrivacy.deleteMeWarning")}
            </p>
            {isAdmin && <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{t("dataPrivacy.deleteGymBilling")}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t("dataPrivacy.retained")}</p>
          </div>
        </div>

        <div className="space-y-2 text-start">
          <label htmlFor="dp-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {isAdmin
              ? t("dataPrivacy.typeGymName", { name: expected })
              : t("dataPrivacy.typeEmail", { email: expected })}
          </label>
          <input
            id="dp-confirm"
            type="text"
            autoComplete="off"
            className={inputClass}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={deleting}
          />
        </div>

        {deleteError && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">{deleteError}</p>
        )}

        <button type="button" className={`${buttonClass} bg-red-600 text-white hover:bg-red-700`} onClick={handleDelete} disabled={!matches || deleting}>
          <FiTrash2 aria-hidden="true" />
          {deleting ? t("dataPrivacy.deleting") : isAdmin ? t("dataPrivacy.deleteGymButton") : t("dataPrivacy.deleteMeButton")}
        </button>
      </section>
    </div>
  );
}
