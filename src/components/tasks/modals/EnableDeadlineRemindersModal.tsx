import * as React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiBell,
  FiZap,
  FiAlertTriangle,
} from "react-icons/fi";
import { SmartTaskModal } from "./SmartTaskModal";
import { useSmartTaskModal } from "./useSmartTaskModal";

interface EnableDeadlineRemindersModalProps {
  open: boolean;
  onClose: () => void;
  isPro?: boolean;
}

export const EnableDeadlineRemindersModal: React.FC<
  EnableDeadlineRemindersModalProps
> = ({ open, onClose, isPro = false }) => {
  const { t } = useTranslation();
  const { loading, alerts, clearAlerts } = useSmartTaskModal({ isPro });

  const [reminderSettings, setReminderSettings] = React.useState({
    enabled: true,
    daysBefore: 1,
    message: t("tasks.templateDefaultMessage"),
    deliveryMethods: {
      app: true,
      email: true,
      whatsapp: false,
    },
    smartDetection: true,
    followUpEnabled: true,
  });

  const [showPreview, setShowPreview] = React.useState(false);
  const [showMissingDeadlines, setShowMissingDeadlines] = React.useState(false);

  const deliveryMethods = [
    {
      key: "app",
      label: t("tasks.deliveryInApp"),
      description: t("tasks.deliveryInAppDesc"),
      icon: "📱",
    },
    {
      key: "email",
      label: t("common.email"),
      description: t("tasks.deliveryEmailDesc"),
      icon: "📧",
    },
    {
      key: "whatsapp",
      label: t("tasks.deliveryWhatsApp"),
      description: t("tasks.deliveryWhatsAppDesc"),
      icon: "💬",
      isPro: true,
    },
  ];

  interface MessageTemplate {
    id: string;
    label: string;
    message: string;
  }

  const messageTemplates: MessageTemplate[] = [
    {
      id: "default",
      label: t("tasks.templateDefault"),
      message: t("tasks.templateDefaultMessage"),
    },
    {
      id: "urgent",
      label: t("tasks.urgent"),
      message: t("tasks.templateUrgentMessage"),
    },
    {
      id: "friendly",
      label: t("tasks.templateFriendly"),
      message: t("tasks.templateFriendlyMessage"),
    },
    {
      id: "custom",
      label: t("tasks.templateCustom"),
      message: reminderSettings.message,
    },
  ];

  const missingDeadlines = [
    {
      id: "1",
      title: "Setup new member onboarding",
      assignee: "Mike Chen",
      originalDeadline: "2024-01-10",
      daysOverdue: 5,
    },
    {
      id: "2",
      title: "Monthly equipment maintenance",
      assignee: "David Rodriguez",
      originalDeadline: "2024-01-12",
      daysOverdue: 3,
    },
    {
      id: "3",
      title: "Member complaint resolution",
      assignee: "Emma Wilson",
      originalDeadline: "2024-01-15",
      daysOverdue: 0,
    },
  ];

  const handleDeliveryMethodToggle = (method: string) => {
    setReminderSettings((prev) => ({
      ...prev,
      deliveryMethods: {
        ...prev.deliveryMethods,
        [method]:
          !prev.deliveryMethods[method as keyof typeof prev.deliveryMethods],
      },
    }));
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    if (template.id === "custom") return;
    setReminderSettings((prev) => ({
      ...prev,
      message: template.message,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onClose();
  };

  const getPreviewMessage = () => {
    return reminderSettings.message
      .replace("{task_name}", "Setup new member onboarding")
      .replace("{days}", reminderSettings.daysBefore.toString());
  };

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title={t("tasks.enableDeadlineReminders")}
      subtitle={t("tasks.enableDeadlineRemindersSubtitle")}
    >
      <div className="space-y-6">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  alert.type === "error"
                    ? "bg-red-50 text-red-700"
                    : alert.type === "warning"
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-blue-50 text-blue-700"
                }`}
              >
                {alert.message}
              </div>
            ))}
            <button
              onClick={clearAlerts}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {t("tasks.clearAlerts")}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enable/Disable */}
          <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderSettings.enabled}
                onChange={(e) =>
                  setReminderSettings((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <FiBell className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("tasks.enableDeadlineRemindersToggle")}
                </span>
              </div>
            </label>
            {reminderSettings.enabled && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                {t("tasks.sendRemindersBeforeDeadlines")}
              </p>
            )}
          </div>

          {/* Reminder Timing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("tasks.sendReminder")}
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t("tasks.daysBeforeDeadline")}
              </span>
              <input
                type="number"
                min="1"
                max="7"
                value={reminderSettings.daysBefore}
                onChange={(e) =>
                  setReminderSettings((prev) => ({
                    ...prev,
                    daysBefore: parseInt(e.target.value),
                  }))
                }
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Message Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t("tasks.messageTemplate")}
            </label>
            <div className="space-y-2">
              {messageTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    reminderSettings.message === template.message
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <div className="text-sm font-medium">{template.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.message}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("tasks.customMessage")}
            </label>
            <textarea
              value={reminderSettings.message}
              onChange={(e) =>
                setReminderSettings((prev) => ({
                  ...prev,
                  message: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder={t("tasks.customMessagePlaceholder")}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t("tasks.placeholdersHint")}
            </p>
          </div>

          {/* Delivery Methods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t("tasks.deliveryMethods")}
            </label>
            <div className="space-y-2">
              {deliveryMethods.map((method) => (
                <label
                  key={method.key}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    reminderSettings.deliveryMethods[
                      method.key as keyof typeof reminderSettings.deliveryMethods
                    ]
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      reminderSettings.deliveryMethods[
                        method.key as keyof typeof reminderSettings.deliveryMethods
                      ]
                    }
                    onChange={() => handleDeliveryMethodToggle(method.key)}
                    disabled={method.isPro && !isPro}
                    className="text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{method.icon}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {method.label}
                        </span>
                        {method.isPro && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            {t("tasks.proBadge")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {method.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Smart Detection */}
          <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("tasks.smartDetection")}
              </h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reminderSettings.smartDetection}
                  onChange={(e) =>
                    setReminderSettings((prev) => ({
                      ...prev,
                      smartDetection: e.target.checked,
                    }))
                  }
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("tasks.enableSmartDetection")}
                </span>
              </label>
            </div>

            {reminderSettings.smartDetection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <p>• {t("tasks.smartDetectionBullet1")}</p>
                <p>• {t("tasks.smartDetectionBullet2")}</p>
                <p>• {t("tasks.smartDetectionBullet3")}</p>
              </motion.div>
            )}
          </div>

          {/* Missing Deadlines Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start space-x-3">
              <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {t("tasks.missingDeadlinesDetected")}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {t("tasks.missingDeadlinesDesc", { count: missingDeadlines.length })}
                </p>
                <button
                  type="button"
                  onClick={() => setShowMissingDeadlines(!showMissingDeadlines)}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 mt-2"
                >
                  {showMissingDeadlines ? t("tasks.hide") : t("common.view")} {t("common.details").toLowerCase()}
                </button>
              </div>
            </div>

            {showMissingDeadlines && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 space-y-2"
              >
                {missingDeadlines.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded p-2 dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{task.title}</span>
                      <span className="text-red-600">
                        {task.daysOverdue} {t("tasks.daysOverdueSuffix")}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {task.assignee} • Due: {task.originalDeadline}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Preview */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {t("tasks.messagePreview")}
              </h3>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {showPreview ? t("tasks.hide") : t("tasks.show")} {t("tasks.preview").toLowerCase()}
              </button>
            </div>

            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <div className="bg-white rounded p-3 dark:bg-gray-800">
                  <div className="text-sm font-medium mb-2">
                    {t("tasks.sampleReminder")}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {getPreviewMessage()}
                  </div>
                </div>

                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {t("tasks.messageSentPrefix")} {reminderSettings.daysBefore}{" "}
                  {reminderSettings.daysBefore !== 1 ? t("tasks.days") : t("tasks.day")}{" "}
                  {t("tasks.messageSentSuffix")}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiZap className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("tasks.deliveryMethodsCount", {
                    count: Object.values(reminderSettings.deliveryMethods).filter(
                      Boolean,
                    ).length,
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading || !reminderSettings.enabled}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FiBell className="w-4 h-4" />
                  <span>{loading ? t("tasks.enabling") : t("tasks.enableReminders")}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </SmartTaskModal>
  );
};
