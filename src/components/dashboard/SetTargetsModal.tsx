import React, { useState, useEffect } from "react";
import { FiSave } from "react-icons/fi";
import { UnifiedModal } from "../ui/UnifiedModal";
import { SmartButton } from "../ui/DesignSystem";
import { AppleInput } from "../AppleStyleModal";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import { useGymConfig } from "../../contexts/gym-config-context";

interface DashboardTargets {
  revenue?: number;
  activeMembers?: number;
  classAttendance?: number;
  memberSatisfaction?: number;
}

interface SetTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  currentTargets?: DashboardTargets;
  currency?: string;
}

/**
 * Modal component for setting dashboard KPI targets
 */
export const SetTargetsModal: React.FC<SetTargetsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentTargets,
  currency: currencyProp,
}) => {
  const { config: gymConfig } = useGymConfig();
  const currency = currencyProp ?? gymConfig.currency;

  const { tenantId } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState<DashboardTargets>({
    revenue: currentTargets?.revenue,
    activeMembers: currentTargets?.activeMembers,
    classAttendance: currentTargets?.classAttendance || 85,
    memberSatisfaction: currentTargets?.memberSatisfaction || 4.8,
  });

  useEffect(() => {
    if (isOpen && currentTargets) {
      setTargets({
        revenue: currentTargets.revenue,
        activeMembers: currentTargets.activeMembers,
        classAttendance: currentTargets.classAttendance || 85,
        memberSatisfaction: currentTargets.memberSatisfaction || 4.8,
      });
    }
  }, [isOpen, currentTargets]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (name === "revenue") {
      setTargets((prev) => ({ ...prev, revenue: !isNaN(numValue) && numValue >= 0 ? numValue : undefined }));
    } else if (name === "activeMembers") {
      setTargets((prev) => ({ ...prev, activeMembers: !isNaN(numValue) && numValue >= 0 ? numValue : undefined }));
    } else if (name === "classAttendance") {
      setTargets((prev) => ({ ...prev, classAttendance: !isNaN(numValue) && numValue >= 0 ? numValue : undefined }));
    } else if (name === "memberSatisfaction") {
      setTargets((prev) => ({ ...prev, memberSatisfaction: !isNaN(numValue) && numValue >= 0 ? numValue : undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantId) {
      showError(t("dashboard.targets.saveError"), t("dashboard.targets.tenantRequired"));
      return;
    }

    setLoading(true);
    try {
      // Fetch current settings
      const { data: currentSettings } = await supabase
        .from("gym_settings")
        .select("metadata, currency")
        .eq("tenant_id", tenantId)
        .single();

      // Handle case where settings don't exist yet
      const metadata = (currentSettings?.metadata as Record<string, unknown>) || {};
      const updatedMetadata = {
        ...metadata,
        dashboardTargets: targets,
      };

      // Use upsert to create or update settings
      const { error } = await supabase
        .from("gym_settings")
        .upsert({
          tenant_id: tenantId,
          metadata: updatedMetadata,
          currency: currentSettings?.currency || currency || gymConfig.currency,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "tenant_id"
        });

      if (error) {
        console.error("Error saving targets:", error);
        throw error;
      }

      showSuccess(t("dashboard.targets.saved"), t("dashboard.targets.savedDesc"));
      onSave?.();
      onClose();
    } catch (error) {
      console.error("Error saving targets:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showError(t("dashboard.targets.saveError"), errorMessage || t("dashboard.targets.saveErrorDesc"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const currencySymbol = currency || "";

  const footer = (
    <>
      <SmartButton variant="secondary" onClick={handleClose} disabled={loading}>
        {t("common.cancel")}
      </SmartButton>
      <SmartButton
        variant="primary"
        onClick={handleSubmit}
        loading={loading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <FiSave className="w-4 h-4 mr-2" />
        {t("common.save")}
      </SmartButton>
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("dashboard.targets.setTargets")}
      subtitle={t("dashboard.targets.subtitle")}
      footer={footer}
      maxWidth="2xl"
      slideFrom="right"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Targets Configuration Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("dashboard.targets.configureTargets")}
            </h3>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("dashboard.targets.configureDesc")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("dashboard.totalRevenue")}
              </label>
              <div className="relative">
                <input
                  name="revenue"
                  type="number"
                  value={targets.revenue?.toString() || ""}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 pr-16 text-base font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md transition-all duration-300 ease-in-out placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  aria-label={t("dashboard.totalRevenue")}
                />
                <span className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-sm`}>
                  {currencySymbol}
                </span>
              </div>
            </div>
            <AppleInput
              label={t("dashboard.activeMembers")}
              name="activeMembers"
              type="number"
              value={targets.activeMembers?.toString() || ""}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              step="1"
              aria-label={t("dashboard.activeMembers")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("dashboard.classAttendance")}
              </label>
              <div className="relative">
                <input
                  name="classAttendance"
                  type="number"
                  value={targets.classAttendance?.toString() || ""}
                  onChange={handleInputChange}
                  placeholder="85"
                  min="0"
                  max="100"
                  step="1"
                  className="w-full px-4 py-3 pr-12 text-base font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md transition-all duration-300 ease-in-out placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  aria-label={t("dashboard.classAttendance")}
                />
                <span className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-sm`}>
                  %
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("dashboard.memberSatisfaction")}
              </label>
              <div className="relative">
                <input
                  name="memberSatisfaction"
                  type="number"
                  value={targets.memberSatisfaction?.toString() || ""}
                  onChange={handleInputChange}
                  placeholder="4.8"
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-4 py-3 pr-12 text-base font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md transition-all duration-300 ease-in-out placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  aria-label={t("dashboard.memberSatisfaction")}
                />
                <span className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-sm`}>
                  /5
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Info Note */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>{t("dashboard.targets.note")}:</strong> {t("dashboard.targets.noteDesc")}
          </p>
        </div>
      </form>
    </UnifiedModal>
  );
};
