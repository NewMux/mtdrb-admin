import React from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import GymConfigForm from "./GymConfigForm";
import { useGymConfig } from "../../contexts/gym-config-context";
import { configToInput, type ConfigErrors, type GymConfigInput } from "../../config/gymConfig";

// Settings > Business & tax: the same fields as the setup wizard's first step.
export default function BusinessSettingsTab() {
  const { t } = useTranslation();
  const { config, loading, save } = useGymConfig();
  const saved = React.useMemo(() => configToInput(config), [config]);
  const [draft, setDraft] = React.useState<GymConfigInput>(saved);
  const [errors, setErrors] = React.useState<ConfigErrors>({});
  const [saving, setSaving] = React.useState(false);

  // Follow the stored config whenever it changes (initial load, after a save).
  React.useEffect(() => {
    setDraft(saved);
    setErrors({});
  }, [saved]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const handleSave = async () => {
    setSaving(true);
    const result = await save(draft);
    setSaving(false);
    if (result.ok) {
      setErrors({});
      toast.success(t("gymConfig.saved"));
    } else if ("errors" in result) {
      setErrors(result.errors);
    } else {
      toast.error(t("gymConfig.saveFailed"));
    }
  };

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700 rounded-3xl shadow-sm p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="text-start">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("gymConfig.title")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("gymConfig.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {dirty && (
            <button
              type="button"
              className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
              onClick={() => {
                setDraft(saved);
                setErrors({});
              }}
              disabled={saving}
            >
              {t("settings.reset")}
            </button>
          )}
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50"
            onClick={handleSave}
            disabled={saving || loading || !dirty}
          >
            {saving ? t("gymConfig.saving") : t("gymConfig.save")}
          </button>
        </div>
      </div>
      <GymConfigForm value={draft} onChange={setDraft} errors={errors} disabled={saving || loading} />
    </div>
  );
}
