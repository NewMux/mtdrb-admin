import * as React from "react";
import { motion } from "framer-motion";
import {
  FiPlay,
  FiClock,
  FiMessageSquare,
  FiZap,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import { SmartTaskModal } from "./SmartTaskModal";
import { useSmartTaskModal } from "./useSmartTaskModal";

interface StartTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}

export const StartTaskModal: React.FC<StartTaskModalProps> = ({
  open,
  onClose,
  taskId,
  isPro = false,
}) => {
  const { loading, task, changeTaskStatus, alerts, clearAlerts } =
    useSmartTaskModal({ taskId, isPro });

  const [comment, setComment] = React.useState("");
  const [showTimer, setShowTimer] = React.useState(false);
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [timerSeconds, setTimerSeconds] = React.useState(0);
  const [selectedStatus, setSelectedStatus] = React.useState<
    "in_progress" | "paused"
  >("in_progress");

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartTask = async () => {
    if (!task) return;

    const result = await changeTaskStatus(task.id, selectedStatus, comment);
    if (result.success) {
      if (showTimer) {
        setTimerRunning(true);
      } else {
        onClose();
      }
    }
  };

  const handleStopTimer = () => {
    setTimerRunning(false);
    onClose();
  };

  const statusOptions = [
    {
      value: "in_progress" as const,
      label: "In Progress",
      description: "Start working on the task now",
      icon: "▶️",
    },
    {
      value: "paused" as const,
      label: "Paused",
      description: "Task is paused temporarily",
      icon: "⏸️",
    },
  ];

  if (!task) {
    return null;
  }

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title="Start Task"
      subtitle={`Starting: ${task.title}`}
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
            {task.assignedTo && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Assigned to:
                </span>
                <span className="font-medium">{task.assignedTo}</span>
              </div>
            )}
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

        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Status Transition
          </label>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer dark:border-gray-600"
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={() => setSelectedStatus(option.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{option.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Timer Option */}
        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showTimer}
              onChange={(e) => setShowTimer(e.target.checked)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2">
              <FiClock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Start timer to track time
              </span>
            </div>
          </label>
          {showTimer && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Timer will start automatically when you begin the task
            </p>
          )}
        </div>

        {/* Timer Display */}
        {showTimer && timerRunning && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiClock className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Timer Running
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                {formatTime(timerSeconds)}
              </div>
            </div>
          </div>
        )}

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Optional Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Add a comment about starting this task..."
          />
        </div>

        {/* Smart Suggestions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <FiZap className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Smart Suggestions
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <p>• Set a reminder for 2 hours from now</p>
                <p>• Notify team members about task start</p>
                <p>• Auto-pause timer during breaks</p>
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
                {showTimer ? "Timer ready" : "Quick start available"}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {timerRunning ? (
                <button
                  type="button"
                  onClick={handleStopTimer}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <FiClock className="w-4 h-4" />
                  <span>Stop Timer & Close</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartTask}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <FiPlay className="w-4 h-4" />
                    <span>{loading ? "Starting..." : "Start Task"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </SmartTaskModal>
  );
};
