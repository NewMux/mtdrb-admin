import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  FiUser,
  FiSearch,
  FiFilter,
  FiZap,
  FiCheck,
} from "react-icons/fi";
import { SmartTaskModal } from "./SmartTaskModal";
import { useSmartTaskModal } from "./useSmartTaskModal";

interface AssignTaskModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  isPro?: boolean;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  open,
  onClose,
  taskId,
  isPro = false,
}) => {
  const { t } = useTranslation();
  const { loading, task, assignTask, alerts, clearAlerts } = useSmartTaskModal({
    taskId,
    isPro,
  });

  const [selectedAssignee, setSelectedAssignee] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState("");
  const [assignToSelf, setAssignToSelf] = React.useState(false);

  // Mock assignee data
  const mockAssignees = [
    {
      id: "1",
      name: "Mike Chen",
      email: "mike.chen@mtdrb.com",
      role: "trainer",
      department: "fitness",
      currentLoad: 3,
      availability: "high",
      lastActive: "2 hours ago",
      avatar: "MC",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.johnson@mtdrb.com",
      role: "trainer",
      department: "fitness",
      currentLoad: 5,
      availability: "medium",
      lastActive: "1 hour ago",
      avatar: "SJ",
    },
    {
      id: "3",
      name: "David Rodriguez",
      email: "david.rodriguez@mtdrb.com",
      role: "maintenance",
      department: "facilities",
      currentLoad: 2,
      availability: "high",
      lastActive: "30 minutes ago",
      avatar: "DR",
    },
    {
      id: "4",
      name: "Emma Wilson",
      email: "emma.wilson@mtdrb.com",
      role: "admin",
      department: "operations",
      currentLoad: 4,
      availability: "low",
      lastActive: "3 hours ago",
      avatar: "EW",
    },
    {
      id: "5",
      name: "Alex Thompson",
      email: "alex.thompson@mtdrb.com",
      role: "trainer",
      department: "fitness",
      currentLoad: 1,
      availability: "high",
      lastActive: "15 minutes ago",
      avatar: "AT",
    },
  ];

  const roles = [
    { value: "", label: t("tasks.allRoles") },
    { value: "trainer", label: t("tasks.roleTrainer") },
    { value: "maintenance", label: t("tasks.roleMaintenance") },
    { value: "admin", label: t("tasks.typeAdmin") },
    { value: "cleaning", label: t("tasks.roleCleaning") },
  ];

  const handleAssignTask = async () => {
    if (!task) return;

    const assigneeEmail = assignToSelf
      ? "current_user@mtdrb.com"
      : selectedAssignee;
    const result = await assignTask(task.id, assigneeEmail);
    if (result.success) {
      onClose();
    }
  };

  // Filter assignees based on search and role
  const filteredAssignees = mockAssignees.filter((assignee) => {
    const matchesSearch =
      assignee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || assignee.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Smart suggestions based on task type and current load
  const getSmartSuggestions = () => {
    if (!task) return [];

    return mockAssignees
      .filter((a) => a.availability === "high" && a.currentLoad < 4)
      .sort((a, b) => a.currentLoad - b.currentLoad)
      .slice(0, 3);
  };

  const smartSuggestions = getSmartSuggestions();

  if (!task) {
    return null;
  }

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title={t("tasks.assignTask")}
      subtitle={`${t("tasks.assigningPrefix")}: ${task.title}`}
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

        {/* Task Info */}
        <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            {t("tasks.taskInformation")}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400">{t("tasks.titleLabel")}:</span>
              <span className="font-medium">{task.title}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400">{t("tasks.typeLabel")}:</span>
              <span className="font-medium capitalize">
                {task.type.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400">
                {t("tasks.priority")}:
              </span>
              <span className="font-medium capitalize">{task.priority}</span>
            </div>
            {task.dueDate && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {t("tasks.dueDate")}:
                </span>
                <span className="font-medium">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-3">
              <FiZap className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {t("tasks.smartSuggestions")}
              </h3>
            </div>
            <div className="space-y-2">
              {smartSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => setSelectedAssignee(suggestion.email)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedAssignee === suggestion.email
                      ? "border-blue-500 bg-blue-100 dark:bg-blue-900/40"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {suggestion.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {suggestion.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.currentLoad} {t("tasks.tasksSuffix")}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded ${
                          suggestion.availability === "high"
                            ? "bg-green-100 text-green-700"
                            : suggestion.availability === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t(`tasks.${suggestion.availability}`)} {t("tasks.availability")}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Assign to Self Option */}
        <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={assignToSelf}
              onChange={(e) => {
                setAssignToSelf(e.target.checked);
                if (e.target.checked) {
                  setSelectedAssignee("");
                }
              }}
              className="text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2">
              <FiUser className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("tasks.assignToMyself")}
              </span>
            </div>
          </label>
          {assignToSelf && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              {t("tasks.assignToMyselfDesc")}
            </p>
          )}
        </div>

        {/* Search and Filter */}
        {!assignToSelf && (
          <>
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("tasks.searchAssigneesPlaceholder")}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee List */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t("tasks.availableAssignees", { count: filteredAssignees.length })}
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredAssignees.map((assignee) => (
                  <button
                    key={assignee.id}
                    type="button"
                    onClick={() => setSelectedAssignee(assignee.email)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedAssignee === assignee.email
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {assignee.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {assignee.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {assignee.email} • {assignee.role}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {assignee.currentLoad} tasks
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded ${
                            assignee.availability === "high"
                              ? "bg-green-100 text-green-700"
                              : assignee.availability === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {t(`tasks.${assignee.availability}`)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiZap className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {assignToSelf
                  ? t("tasks.selfAssignment")
                  : t("tasks.assigneesAvailable", { count: filteredAssignees.length })}
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
                type="button"
                onClick={handleAssignTask}
                disabled={loading || (!assignToSelf && !selectedAssignee)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>{loading ? t("tasks.assigningTask") : t("tasks.assignTask")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SmartTaskModal>
  );
};
