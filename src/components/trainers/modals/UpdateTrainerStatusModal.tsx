import * as React from "react";
import { useTranslation } from "react-i18next";
import { SmartTrainerModal } from "./SmartTrainerModal";
import { useSmartTrainerModal } from "./useSmartTrainerModal";
import { FiLock, FiCalendar } from "react-icons/fi";

interface UpdateTrainerStatusModalProps {
  open: boolean;
  onClose: () => void;
  trainerId: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

export default function UpdateTrainerStatusModal({
  open,
  onClose,
  trainerId,
  onSuccess,
}: UpdateTrainerStatusModalProps) {
  const { t } = useTranslation();
  const { trainer, alerts } =
    useSmartTrainerModal({ trainerId });
  const [status, setStatus] = React.useState("active");
  const [leaveDate, setLeaveDate] = React.useState("");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSuccess?.();
      onClose();
    }, 900);
  }

  React.useEffect(() => {
    if (trainer) setStatus(trainer.status || "active");
  }, [trainer]);

  // Return null if trainerId is null or empty to prevent errors
  if (!trainerId) {
    return null;
  }

  return (
    <SmartTrainerModal
      open={open}
      onClose={onClose}
      footer={
        <>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t("trainers.saving") : t("trainers.updateTrainerStatus")}
          </button>
          <button
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </button>
        </>
      }
    >
      <h2 className="text-xl font-semibold mb-4">{t("trainers.updateTrainerStatus")}</h2>
      {/* Alerts */}
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium ${a.type === "error" ? "bg-red-50 text-red-700" : a.type === "warning" ? "bg-yellow-50 text-yellow-700" : "bg-blue-50 text-blue-700"}`}
        >
          {a.message}
        </div>
      ))}
      {/* Status Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">{t("trainers.status")}</label>
        <select
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">{t("trainers.active")}</option>
          <option value="on_leave">{t("trainers.onLeave")}</option>
          <option value="inactive">{t("common.inactive")}</option>
        </select>
      </div>
      {status === "on_leave" && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
            <FiCalendar /> {t("trainers.leaveUntil")}
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
            value={leaveDate}
            onChange={(e) => setLeaveDate(e.target.value)}
          />
        </div>
      )}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          {t("trainers.noteOptional")}
        </label>
        <textarea
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 min-h-[60px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("trainers.addANote")}
        />
      </div>
      {/* Smart/Pro: Suggest backup trainers if On Leave */}
      {status === "on_leave" && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FiLock className="text-gray-400" title={t("trainers.proFeature")} />
            <span className="font-semibold text-gray-900">
              {t("trainers.smartSuggestBackupTrainers")}
            </span>
          </div>
          <div className="text-gray-500 text-sm">
            {t("trainers.proSuggestBackupDesc")}
          </div>
        </div>
      )}
    </SmartTrainerModal>
  );
}
