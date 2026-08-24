import * as React from "react";
import {
  FiCheck,
  FiUpload,
  FiFileText,
  FiZap,
  FiAlertTriangle,
} from "react-icons/fi";
import { SmartTaskModal } from "./SmartTaskModal";
import { useSmartTaskModal } from "./useSmartTaskModal";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../supabaseClient";

interface CompleteTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}

export const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({
  open,
  onClose,
  taskId,
  isPro = false,
}) => {
  const { loading, task, changeTaskStatus, alerts, clearAlerts } =
    useSmartTaskModal({ taskId, isPro });
  const { tenantId } = useAuth();

  const [comment, setComment] = React.useState("");
  const [outcomeSummary, setOutcomeSummary] = React.useState("");
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [showLateWarning, setShowLateWarning] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // Check if task is late
  const isLate = task?.dueDate && new Date(task.dueDate) < new Date();
  const isPastDue =
    task?.dueDate &&
    new Date(task.dueDate) < new Date(Date.now() - 24 * 60 * 60 * 1000);

  React.useEffect(() => {
    if (isLate) {
      setShowLateWarning(true);
    }
  }, [isLate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCompleteTask = async () => {
    if (!task) return;

    let attachments: string[] = [];
    if (uploadedFiles.length > 0 && tenantId) {
      setUploading(true);
      try {
        const uploads = await Promise.all(
          uploadedFiles.map(async (file) => {
            const safeFileName = file.name
              .replace(/[^a-zA-Z0-9._-]/g, "_")
              .slice(-120);
            const path = `attachments/${tenantId}/${task.id}/${crypto.randomUUID()}_${safeFileName}`;
            const { error } = await supabase.storage
              .from("task-attachments")
              .upload(path, file);
            if (error) throw error;
            return path;
          }),
        );
        attachments = uploads;
      } catch (error) {
        console.error("Error uploading task attachments:", error);
      } finally {
        setUploading(false);
      }
    }

    const result = await changeTaskStatus(task.id, "completed", comment, {
      outcome: outcomeSummary,
      attachments,
    });
    if (result.success) {
      onClose();
    }
  };

  const outcomeOptions = [
    {
      value: "success",
      label: "Successfully Completed",
      color: "text-green-600 bg-green-50",
    },
    {
      value: "partial",
      label: "Partially Completed",
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      value: "blocked",
      label: "Blocked/Unable to Complete",
      color: "text-red-600 bg-red-50",
    },
    {
      value: "deferred",
      label: "Deferred to Later",
      color: "text-blue-600 bg-blue-50",
    },
  ];

  if (!task) {
    return null;
  }

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title="Complete Task"
      subtitle={`Completing: ${task.title}`}
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

        {/* Late Warning */}
        {showLateWarning && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start space-x-3">
              <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {isPastDue ? "Task is Past Due" : "Task is Late"}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {isPastDue
                    ? "This task is more than 24 hours overdue. It will be auto-tagged for review."
                    : "This task is overdue. Consider adding a note about the delay."}
                </p>
                <div className="mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showLateWarning}
                      onChange={(e) => setShowLateWarning(e.target.checked)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      Auto-tag for review
                    </span>
                  </label>
                </div>
              </div>
            </div>
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
                <span className={`font-medium ${isLate ? "text-red-600" : ""}`}>
                  {new Date(task.dueDate).toLocaleDateString()}
                  {isLate && " (Late)"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Outcome Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Completion Outcome
          </label>
          <div className="grid grid-cols-2 gap-2">
            {outcomeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setOutcomeSummary(option.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  outcomeSummary === option.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                }`}
              >
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Completion Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Describe what was accomplished..."
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Attach Files
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center dark:border-gray-600">
            <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Choose files
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              or drag and drop
            </p>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded dark:bg-gray-800"
                >
                  <div className="flex items-center space-x-2">
                    <FiFileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Logic */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <FiZap className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Smart Logic Applied
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                {isLate && (
                  <p>• Task marked as late - auto-tagged for review</p>
                )}
                <p>• Completion time tracked automatically</p>
                <p>• Performance metrics updated</p>
                <p>• Related tasks may be unblocked</p>
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
                {isLate ? "Late completion detected" : "Ready to complete"}
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
                onClick={handleCompleteTask}
                disabled={loading || uploading || !outcomeSummary}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>{uploading ? "Uploading..." : loading ? "Completing..." : "Complete Task"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SmartTaskModal>
  );
};
