import * as React from "react";
import {
  FiSettings,
  FiSave,
  FiZap,
  FiTarget,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { SmartButton } from "../../ui/DesignSystem";

interface WorkflowConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  workflowId?: string;
  workflowName?: string;
  workflowType?: string;
}

interface WorkflowConfig {
  name: string;
  description: string;
  triggerConditions: string[];
  actions: string[];
  schedule: string;
  notifications: boolean;
  autoOptimize: boolean;
}

export default function WorkflowConfigurationModal({
  isOpen,
  onClose,
  onSuccess,
  workflowName = "Workflow",
}: WorkflowConfigurationModalProps) {
  const { t } = useTranslation();
  const [config, setConfig] = React.useState<WorkflowConfig>({
    name: workflowName,
    description: "",
    triggerConditions: [],
    actions: [],
    schedule: "daily",
    notifications: true,
    autoOptimize: true,
  });
  const [loading, setLoading] = React.useState(false);

  const handleInputChange = <K extends keyof WorkflowConfig>(field: K, value: WorkflowConfig[K]) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(t("trainers.workflowConfigUpdated"));
    setLoading(false);
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <ColorfulModalUI
      open={isOpen}
      onClose={handleClose}
      title={t("trainers.configureWorkflow")}
      subtitle={t("trainers.customizeSettingsFor", { name: workflowName })}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiSettings className="text-blue-500" />
            {t("trainers.basicConfiguration")}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("trainers.workflowName")}
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t("trainers.enterWorkflowName")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("common.description")}
              </label>
              <textarea
                value={config.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={t("trainers.describeWorkflow")}
              />
            </div>
          </div>
        </div>

        {/* Trigger Conditions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiZap className="text-green-500" />
            {t("trainers.triggerConditions")}
          </h3>
          <div className="space-y-3">
            {[
              t("trainers.triggerTrainerAvailability"),
              t("trainers.triggerClassCapacity"),
              t("trainers.triggerMemberRequests"),
              t("trainers.triggerPerformanceDrop"),
              t("trainers.triggerNewTrainer"),
            ].map((condition, index) => (
              <label key={index} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.triggerConditions.includes(condition)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange("triggerConditions", [
                        ...config.triggerConditions,
                        condition,
                      ]);
                    } else {
                      handleInputChange(
                        "triggerConditions",
                        config.triggerConditions.filter((c) => c !== condition),
                      );
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{condition}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTarget className="text-purple-500" />
            {t("trainers.actionsLabel")}
          </h3>
          <div className="space-y-3">
            {[
              t("trainers.actionNotifyTrainer"),
              t("trainers.actionAssignBackup"),
              t("trainers.actionAdjustSchedule"),
              t("trainers.actionNotifyMember"),
              t("trainers.actionGenerateReport"),
              t("trainers.actionOptimizeWorkload"),
            ].map((action, index) => (
              <label key={index} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.actions.includes(action)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange("actions", [...config.actions, action]);
                    } else {
                      handleInputChange(
                        "actions",
                        config.actions.filter((a) => a !== action),
                      );
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{action}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiClock className="text-orange-500" />
            {t("trainers.scheduleLabel")}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("trainers.executionFrequency")}
              </label>
              <select
                value={config.schedule}
                onChange={(e) => handleInputChange("schedule", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="immediate">{t("trainers.immediate")}</option>
                <option value="hourly">{t("trainers.hourly")}</option>
                <option value="daily">{t("trainers.daily")}</option>
                <option value="weekly">{t("trainers.weekly")}</option>
                <option value="monthly">{t("trainers.monthly")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-emerald-500" />
            {t("trainers.advancedSettings")}
          </h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.notifications}
                onChange={(e) =>
                  handleInputChange("notifications", e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t("trainers.sendWorkflowNotifications")}
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.autoOptimize}
                onChange={(e) =>
                  handleInputChange("autoOptimize", e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t("trainers.autoOptimizeDesc")}
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <SmartButton
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {t("common.cancel")}
          </SmartButton>
          <SmartButton
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            icon={<FiSave className="w-4 h-4" />}
          >
            {t("trainers.saveConfiguration")}
          </SmartButton>
        </div>
      </div>
    </ColorfulModalUI>
  );
}
