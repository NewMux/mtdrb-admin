import * as React from "react";
import {
  FiTrash2,
  FiArchive,
  FiAlertTriangle,
  FiLink,
  FiZap,
} from "react-icons/fi";
import { SmartTaskModal } from "./SmartTaskModal";
import { useSmartTaskModal } from "./useSmartTaskModal";

interface DeleteTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}

export const DeleteTaskModal: React.FC<DeleteTaskModalProps> = ({
  open,
  onClose,
  taskId,
  isPro = false,
}) => {
  const { loading, task, deleteTask, alerts, clearAlerts } = useSmartTaskModal({
    taskId,
    isPro,
  });

  const [deleteType, setDeleteType] = React.useState<"delete" | "archive">(
    "delete",
  );
  const [confirmationText, setConfirmationText] = React.useState("");

  const hasAutomation = task?.automation?.enabled;
  const isLinkedToAutomation = hasAutomation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    const result = await deleteTask(task.id, deleteType === "archive");
    if (result.success) {
      onClose();
    }
  };

  const handleDeleteTypeChange = (type: "delete" | "archive") => {
    setDeleteType(type);
    setConfirmationText("");
  };

  if (!task) {
    return null;
  }

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title={deleteType === "archive" ? "Archive Task" : "Delete Task"}
      subtitle={`${deleteType === "archive" ? "Archive" : "Delete"}: ${task.title}`}
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

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                {deleteType === "archive"
                  ? "Archive Task"
                  : "Delete Task Permanently"}
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {deleteType === "archive"
                  ? "This task will be moved to archive and can be restored later."
                  : "This action cannot be undone. The task will be permanently deleted."}
              </p>
            </div>
          </div>
        </div>

        {/* Task Details */}
        <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Task Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Title:</span>
              <span className="font-medium">{task.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="font-medium capitalize">
                {task.type.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Priority:
              </span>
              <span className="font-medium capitalize">{task.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="font-medium capitalize">
                {task.status.replace("_", " ")}
              </span>
            </div>
            {task.assignedTo && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Assigned to:
                </span>
                <span className="font-medium">{task.assignedTo}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex justify-between">
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

        {/* Automation Warning */}
        {isLinkedToAutomation && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
            <div className="flex items-start space-x-3">
              <FiLink className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Linked to Automation
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  This task is part of an automated workflow. Deleting it may
                  affect the automation.
                </p>
                <div className="mt-2">
                  <button className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400">
                    View automation details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Action Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer dark:border-gray-600">
              <input
                type="radio"
                name="deleteType"
                value="archive"
                checked={deleteType === "archive"}
                onChange={() => handleDeleteTypeChange("archive")}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <FiArchive className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Archive Task
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Move to archive (can be restored later)
                  </div>
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer dark:border-gray-600">
              <input
                type="radio"
                name="deleteType"
                value="delete"
                checked={deleteType === "delete"}
                onChange={() => handleDeleteTypeChange("delete")}
                className="text-red-600 focus:ring-red-500"
              />
              <div className="flex items-center space-x-2">
                <FiTrash2 className="w-4 h-4 text-red-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Delete Permanently
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Permanently delete (cannot be undone)
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Confirmation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirmation
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Type{" "}
            <strong>{deleteType === "archive" ? "ARCHIVE" : "DELETE"}</strong>{" "}
            to confirm
          </p>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder={deleteType === "archive" ? "ARCHIVE" : "DELETE"}
          />
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiZap className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isLinkedToAutomation
                  ? "Automation linked"
                  : "No automation linked"}
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
                type="submit"
                disabled={
                  loading ||
                  confirmationText !==
                    (deleteType === "archive" ? "ARCHIVE" : "DELETE")
                }
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  deleteType === "archive"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleSubmit}
              >
                {deleteType === "archive" ? (
                  <>
                    <FiArchive className="w-4 h-4" />
                    <span>{loading ? "Archiving..." : "Archive Task"}</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    <span>{loading ? "Deleting..." : "Delete Task"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SmartTaskModal>
  );
};
