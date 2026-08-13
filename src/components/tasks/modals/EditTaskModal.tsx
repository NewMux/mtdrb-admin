import * as React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FiEdit,
  FiUser,
  FiCalendar,
  FiAlertTriangle,
  FiActivity,
  FiZap,
} from "react-icons/fi";
import { SmartTaskModal } from "./SmartTaskModal";
import {
  useSmartTaskModal,
  type SmartSuggestion,
} from "./useSmartTaskModal";

interface EditTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}

type TaskType =
  | "onboarding"
  | "class_setup"
  | "maintenance"
  | "cleaning"
  | "equipment_check"
  | "member_support"
  | "admin"
  | "custom";
type TaskPriority = "low" | "medium" | "high" | "urgent";

interface TaskFormData {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  dueDate: string;
  assignedTo: string;
  tags: string[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  open,
  onClose,
  taskId,
  isPro = false,
}) => {
  const { t } = useTranslation();
  const { loading, task, smartSuggestions, updateTask, alerts, clearAlerts } =
    useSmartTaskModal({ taskId, isPro });

  const [formData, setFormData] = React.useState<TaskFormData>({
    title: "",
    description: "",
    type: "custom",
    priority: "medium",
    dueDate: "",
    assignedTo: "",
    tags: [] as string[],
  });

  const [showHistory, setShowHistory] = React.useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = React.useState(false);

  // Update form when task loads
  React.useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().slice(0, 16)
          : "",
        assignedTo: task.assignedTo || "",
        tags: task.tags,
      });
    }
  }, [task]);

  const taskTypes: Array<{ value: TaskType; label: string; icon: string }> = [
    { value: "onboarding", label: t("tasks.typeOnboarding"), icon: "👋" },
    { value: "class_setup", label: t("tasks.typeClassSetup"), icon: "🏋️" },
    { value: "maintenance", label: t("tasks.typeMaintenance"), icon: "🔧" },
    { value: "cleaning", label: t("tasks.roleCleaning"), icon: "🧹" },
    { value: "equipment_check", label: t("tasks.typeEquipmentCheck"), icon: "✅" },
    { value: "member_support", label: t("tasks.typeMemberSupport"), icon: "💬" },
    { value: "admin", label: t("tasks.typeAdmin"), icon: "📋" },
    { value: "custom", label: t("tasks.typeCustom"), icon: "📝" },
  ];

  const priorities: Array<{
    value: TaskPriority;
    label: string;
    color: string;
  }> = [
    { value: "low", label: t("tasks.low"), color: "text-green-600 bg-green-50" },
    { value: "medium", label: t("tasks.medium"), color: "text-yellow-600 bg-yellow-50" },
    { value: "high", label: t("tasks.high"), color: "text-orange-600 bg-orange-50" },
    { value: "urgent", label: t("tasks.urgent"), color: "text-red-600 bg-red-50" },
  ];

  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date();
  const isPastDue =
    task?.dueDate &&
    new Date(task.dueDate) < new Date(Date.now() - 24 * 60 * 60 * 1000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    const result = await updateTask(task.id, {
      ...formData,
      dueDate: formData.dueDate
        ? new Date(formData.dueDate).toISOString()
        : undefined,
    });
    if (result.success) {
      onClose();
    }
  };

  const handleTypeChange = (type: TaskType) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    setFormData((prev) => ({ ...prev, priority }));
  };

  if (!task) {
    return null;
  }

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title={t("tasks.updateTask")}
      subtitle={`${t("tasks.editingPrefix")}: ${task.title}`}
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

        {/* Overdue Warning */}
        {isOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start space-x-3">
              <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {isPastDue ? t("tasks.taskPastDue") : t("tasks.taskIsOverdue")}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {isPastDue
                    ? t("tasks.taskPastDueEditDesc")
                    : t("tasks.taskOverdueDesc")}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
                    {t("tasks.reassign")}
                  </button>
                  <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
                    {t("tasks.escalate")}
                  </button>
                  <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400">
                    {t("tasks.updateDeadline")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("tasks.taskName")} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder={t("tasks.taskNamePlaceholder")}
              required
            />
          </div>

          {/* Task Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("tasks.taskType")} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {taskTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.type === type.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("common.description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder={t("tasks.taskDetailsPlaceholder")}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("tasks.priority")} *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => handlePriorityChange(priority.value)}
                  className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                    formData.priority === priority.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  } ${priority.color}`}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("tasks.dueDate")}
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("tasks.assignedTo")}
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    assignedTo: e.target.value,
                  }))
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder={t("tasks.emailPlaceholder")}
              />
            </div>
          </div>

          {/* Task History */}
          <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <FiActivity className="w-4 h-4" />
                <span>{t("tasks.taskHistory")}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {showHistory ? t("tasks.hide") : t("tasks.show")} {t("tasks.historyLower")}
              </button>
            </div>

            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("tasks.createdBy")}
                    </span>
                    <span className="font-medium">{task.createdBy}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("tasks.createdAtLabel")}
                    </span>
                    <span className="font-medium">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("tasks.lastUpdated")}
                    </span>
                    <span className="font-medium">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {task.completedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("tasks.completedAtLabel")}
                      </span>
                      <span className="font-medium">
                        {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Smart Suggestions */}
          {smartSuggestions.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("tasks.smartSuggestions")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {showAiSuggestions ? t("tasks.hide") : t("tasks.show")} {t("tasks.suggestionsLower")}
                </button>
              </div>

              {showAiSuggestions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  {smartSuggestions.map((suggestion: SmartSuggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-3 rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {suggestion.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {suggestion.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500">
                              {t("tasks.confidenceLabel", { value: suggestion.confidence })}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                suggestion.impact === "high"
                                  ? "bg-red-100 text-red-700"
                                  : suggestion.impact === "medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {t(`tasks.${suggestion.impact}`)} {t("tasks.impactSuffix")}
                            </span>
                          </div>
                        </div>
                        {suggestion.action && (
                          <button
                            type="button"
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            {suggestion.action}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiZap className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t("tasks.smartUpdatesAvailable")}
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
                  disabled={loading || !formData.title}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FiEdit className="w-4 h-4" />
                  <span>{loading ? t("tasks.updatingTask") : t("tasks.updateTask")}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </SmartTaskModal>
  );
};
