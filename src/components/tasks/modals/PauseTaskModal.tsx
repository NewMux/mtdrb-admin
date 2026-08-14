import * as React from "react";
import { motion } from "framer-motion";
import {
  FiPause,
  FiClock,
  FiZap,
  FiAlertCircle,
} from "react-icons/fi";
import { SmartTaskModal } from "./SmartTaskModal";
import { useSmartTaskModal } from "./useSmartTaskModal";

interface PauseTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}

export const PauseTaskModal: React.FC<PauseTaskModalProps> = ({
  open,
  onClose,
  taskId,
  isPro = false,
}) => {
  const { loading, task, changeTaskStatus, alerts, clearAlerts } =
    useSmartTaskModal({ taskId, isPro });

  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  const [enableReminder, setEnableReminder] = React.useState(false);
  const [reminderDays, setReminderDays] = React.useState(2);

  const pauseReasons = [
    {
      value: "blocked",
      label: "Blocked",
      description: "Waiting for information or resources",
      icon: "🚫",
      color: "text-red-600 bg-red-50",
    },
    {
      value: "waiting_response",
      label: "Waiting on Response",
      description: "Waiting for someone else to respond",
      icon: "⏳",
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      value: "not_priority",
      label: "Not Priority",
      description: "Lower priority than other tasks",
      icon: "📉",
      color: "text-gray-600 bg-gray-50",
    },
    {
      value: "personal",
      label: "Personal Matter",
      description: "Personal emergency or conflict",
      icon: "👤",
      color: "text-blue-600 bg-blue-50",
    },
    {
      value: "technical",
      label: "Technical Issue",
      description: "Technical problem or system issue",
      icon: "🔧",
      color: "text-purple-600 bg-purple-50",
    },
    {
      value: "other",
      label: "Other",
      description: "Other reason not listed above",
      icon: "❓",
      color: "text-gray-600 bg-gray-50",
    },
  ];

  const handlePauseTask = async () => {
    if (!task) return;

    const pauseNote = note ? `${reason}: ${note}` : reason;
    const result = await changeTaskStatus(task.id, "paused", pauseNote);
    if (result.success) {
      onClose();
    }
  };

  if (!task) {
    return null;
  }

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title="Pause Task"
      subtitle={`Pausing: ${task.title}`}
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
              Clear alerts
            </button>
          </div>
        )}

        {/* Task Info */}
        <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Task Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400">Title:</span>
              <span className="font-medium">{task.title}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="font-medium capitalize">
                {task.type.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400">
                Priority:
              </span>
              <span className="font-medium capitalize">{task.priority}</span>
            </div>
            {task.dueDate && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Due date:
                </span>
                <span className="font-medium">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pause Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Reason for Pausing *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {pauseReasons.map((pauseReason) => (
              <button
                key={pauseReason.value}
                type="button"
                onClick={() => setReason(pauseReason.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  reason === pauseReason.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{pauseReason.icon}</span>
                  <div>
                    <div className="text-sm font-medium">
                      {pauseReason.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {pauseReason.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Details (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Provide more details about why the task is being paused..."
          />
        </div>

        {/* Smart Reminder */}
        <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FiClock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Smart Reminder
              </span>
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={enableReminder}
                onChange={(e) => setEnableReminder(e.target.checked)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Enable auto-resume reminder
              </span>
            </label>
          </div>

          {enableReminder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remind me in:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    days
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You&apos;ll receive a notification to resume this task in{" "}
                {reminderDays} day{reminderDays !== 1 ? "s" : ""}.
              </p>
            </motion.div>
          )}
        </div>

        {/* Impact Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Pause Impact
              </h4>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                <p>• Task progress will be saved</p>
                <p>• Team members will be notified</p>
                <p>• Related tasks may be affected</p>
                <p>• Performance metrics will reflect pause time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiZap className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {enableReminder
                  ? `Auto-resume in ${reminderDays} days`
                  : "No auto-resume set"}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePauseTask}
                disabled={loading || !reason}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FiPause className="w-4 h-4" />
                <span>{loading ? "Pausing..." : "Pause Task"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SmartTaskModal>
  );
};
