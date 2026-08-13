import * as React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiSettings,
  FiZap,
} from "react-icons/fi";
import { SmartTaskModal } from "./SmartTaskModal";
import { useSmartTaskModal } from "./useSmartTaskModal";

interface SetupTaskAutomationModalProps {
  open: boolean;
  onClose: () => void;
  isPro?: boolean;
}

type AutomationType = "recurring" | "triggered" | "scheduled";
type AutomationPriority = "low" | "medium" | "high";

interface AutomationFormData {
  name: string;
  description: string;
  type: AutomationType;
  schedule: string;
  trigger: string;
  assignee: string;
  priority: AutomationPriority;
  enabled: boolean;
  isPro: boolean;
}

export const SetupTaskAutomationModal: React.FC<
  SetupTaskAutomationModalProps
> = ({ open, onClose, isPro = false }) => {
  const { t } = useTranslation();
  const { loading, createAutomation, alerts, clearAlerts } = useSmartTaskModal({
    isPro,
  });

  const [automationData, setAutomationData] = React.useState<AutomationFormData>({
    name: "",
    description: "",
    type: "recurring",
    schedule: "",
    trigger: "",
    assignee: "",
    priority: "medium",
    enabled: true,
    isPro,
  });

  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [showPreview, setShowPreview] = React.useState(false);

  const automationTypes: Array<{
    value: AutomationType;
    label: string;
    description: string;
    icon: string;
  }> = [
    {
      value: "recurring",
      label: t("tasks.automationTypeRecurring"),
      description: t("tasks.automationTypeRecurringDesc"),
      icon: "🔄",
    },
    {
      value: "triggered",
      label: t("tasks.automationTypeTriggered"),
      description: t("tasks.automationTypeTriggeredDesc"),
      icon: "⚡",
    },
    {
      value: "scheduled",
      label: t("tasks.automationTypeScheduled"),
      description: t("tasks.automationTypeScheduledDesc"),
      icon: "📅",
    },
  ];

  const priorities: Array<{
    value: AutomationPriority;
    label: string;
    color: string;
  }> = [
    { value: "low", label: t("tasks.low"), color: "text-green-600 bg-green-50" },
    { value: "medium", label: t("tasks.medium"), color: "text-yellow-600 bg-yellow-50" },
    { value: "high", label: t("tasks.high"), color: "text-orange-600 bg-orange-50" },
  ];

  interface AutomationTemplate {
    id: string;
    name: string;
    description: string;
    type: AutomationType;
    schedule?: string;
    trigger?: string;
    assignee: string;
    priority: AutomationPriority;
  }

  const templates: AutomationTemplate[] = [
    {
      id: "daily_cleaning",
      name: t("tasks.templateDailyCleaning"),
      description: t("tasks.templateDailyCleaningDesc"),
      type: "recurring",
      schedule: "daily 6:00 AM",
      assignee: "cleaning@mtdrb.com",
      priority: "medium",
    },
    {
      id: "member_onboarding",
      name: t("tasks.typeOnboarding"),
      description: t("tasks.templateMemberOnboardingDesc"),
      type: "triggered",
      trigger: "new_member_registration",
      assignee: "trainer@mtdrb.com",
      priority: "high",
    },
    {
      id: "monthly_equipment",
      name: t("tasks.templateMonthlyEquipment"),
      description: t("tasks.templateMonthlyEquipmentDesc"),
      type: "scheduled",
      schedule: "monthly 1st 9:00 AM",
      assignee: "maintenance@mtdrb.com",
      priority: "medium",
    },
    {
      id: "weekly_inventory",
      name: t("tasks.templateWeeklyInventory"),
      description: t("tasks.templateWeeklyInventoryDesc"),
      type: "recurring",
      schedule: "weekly monday 8:00 AM",
      assignee: "admin@mtdrb.com",
      priority: "low",
    },
  ];

  const handleTemplateSelect = (template: AutomationTemplate) => {
    setAutomationData({
      name: template.name,
      description: template.description,
      type: template.type,
      schedule: template.schedule || "",
      trigger: template.trigger || "",
      assignee: template.assignee,
      priority: template.priority,
      enabled: true,
      isPro,
    });
    setSelectedTemplate(template.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createAutomation(automationData);
    if (result.success) {
      onClose();
    }
  };

  const getPreviewTasks = () => {
    if (!automationData.name) return [];

    return [
      {
        id: "1",
        title: `${automationData.name} - Task 1`,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        assignee: automationData.assignee,
        priority: automationData.priority,
      },
      {
        id: "2",
        title: `${automationData.name} - Task 2`,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        assignee: automationData.assignee,
        priority: automationData.priority,
      },
      {
        id: "3",
        title: `${automationData.name} - Task 3`,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        assignee: automationData.assignee,
        priority: automationData.priority,
      },
    ];
  };

  const previewTasks = getPreviewTasks();

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title={t("tasks.setupTaskAutomation")}
      subtitle={t("tasks.setupTaskAutomationSubtitle")}
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
          {/* Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t("tasks.quickTemplates")}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedTemplate === template.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {template.description}
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {template.type} • {template.assignee}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            template.priority === "high"
                              ? "bg-red-100 text-red-700"
                              : template.priority === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {template.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Automation Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("tasks.automationName")} *
            </label>
            <input
              type="text"
              value={automationData.name}
              onChange={(e) =>
                setAutomationData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder={t("tasks.automationNamePlaceholder")}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("common.description")}
            </label>
            <textarea
              value={automationData.description}
              onChange={(e) =>
                setAutomationData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder={t("tasks.automationDescriptionPlaceholder")}
            />
          </div>

          {/* Automation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t("tasks.automationType")} *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {automationTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setAutomationData((prev) => ({
                      ...prev,
                      type: type.value,
                    }))
                  }
                  className={`p-3 rounded-lg border text-left transition-all ${
                    automationData.type === type.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{type.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {type.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule/Trigger */}
          {automationData.type === "recurring" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("tasks.schedule")} *
              </label>
              <select
                value={automationData.schedule}
                onChange={(e) =>
                  setAutomationData((prev) => ({
                    ...prev,
                    schedule: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">{t("tasks.selectSchedule")}</option>
                <option value="daily 6:00 AM">{t("tasks.scheduleDaily6am")}</option>
                <option value="daily 8:00 AM">{t("tasks.scheduleDaily8am")}</option>
                <option value="weekly monday 9:00 AM">
                  {t("tasks.scheduleWeeklyMon9am")}
                </option>
                <option value="weekly friday 5:00 PM">
                  {t("tasks.scheduleWeeklyFri5pm")}
                </option>
                <option value="monthly 1st 9:00 AM">
                  {t("tasks.scheduleMonthly1st9am")}
                </option>
                <option value="monthly 15th 2:00 PM">
                  {t("tasks.scheduleMonthly15th2pm")}
                </option>
              </select>
            </div>
          )}

          {automationData.type === "triggered" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("tasks.triggerEvent")} *
              </label>
              <select
                value={automationData.trigger}
                onChange={(e) =>
                  setAutomationData((prev) => ({
                    ...prev,
                    trigger: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">{t("tasks.selectTrigger")}</option>
                <option value="new_member_registration">
                  {t("tasks.triggerNewMember")}
                </option>
                <option value="class_booking">{t("tasks.triggerClassBooking")}</option>
                <option value="equipment_issue">
                  {t("tasks.triggerEquipmentIssue")}
                </option>
                <option value="maintenance_request">{t("tasks.triggerMaintenanceRequest")}</option>
                <option value="member_complaint">{t("tasks.triggerMemberComplaint")}</option>
              </select>
            </div>
          )}

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("tasks.defaultAssignee")}
            </label>
            <input
              type="email"
              value={automationData.assignee}
              onChange={(e) =>
                setAutomationData((prev) => ({
                  ...prev,
                  assignee: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder={t("tasks.emailPlaceholder")}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("tasks.defaultPriority")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() =>
                    setAutomationData((prev) => ({
                      ...prev,
                      priority: priority.value,
                    }))
                  }
                  className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                    automationData.priority === priority.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  } ${priority.color}`}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("tasks.preview")}
              </h3>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {showPreview ? t("tasks.hide") : t("tasks.show")} {t("tasks.preview").toLowerCase()}
              </button>
            </div>

            {showPreview && automationData.name && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t("tasks.upcomingTasksFromAutomation")}
                </div>
                {previewTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2 bg-gray-50 rounded dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{task.title}</span>
                      <span className="text-gray-500">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {task.assignee}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiZap className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {automationData.enabled
                    ? t("tasks.automationActive")
                    : t("tasks.automationDisabled")}
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
                  disabled={loading || !automationData.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FiSettings className="w-4 h-4" />
                  <span>{loading ? t("tasks.creatingAutomation") : t("tasks.createAutomation")}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </SmartTaskModal>
  );
};
