import * as React from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiShuffle,
  FiClock,
  FiZap,
  FiUser,
  FiCheck,
} from "react-icons/fi";
import { SmartTaskModal } from "./SmartTaskModal";
import { useSmartTaskModal } from "./useSmartTaskModal";

interface EnableAutoAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  isPro?: boolean;
}

export const EnableAutoAssignmentModal: React.FC<
  EnableAutoAssignmentModalProps
> = ({ open, onClose, isPro = false }) => {
  const { loading, alerts, clearAlerts } = useSmartTaskModal({ isPro });

  const [assignmentType, setAssignmentType] = React.useState<
    "round_robin" | "availability" | "role_based"
  >("availability");
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);
  const [enableOverride, setEnableOverride] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  const assignmentTypes = [
    {
      value: "round_robin" as const,
      label: "Round Robin",
      description: "Assign tasks in rotation order",
      icon: "🔄",
      isPro: false,
    },
    {
      value: "availability" as const,
      label: "Availability Based",
      description: "Assign to most available team member",
      icon: "📊",
      isPro: false,
    },
    {
      value: "role_based" as const,
      label: "Role Based",
      description: "Assign based on task type and role",
      icon: "👥",
      isPro: true,
    },
  ];

  const roles = [
    { value: "trainer", label: "Trainer", count: 8 },
    { value: "maintenance", label: "Maintenance", count: 3 },
    { value: "admin", label: "Administrative", count: 2 },
    { value: "cleaning", label: "Cleaning", count: 4 },
  ];

  const mockTeamMembers = [
    {
      id: "1",
      name: "Mike Chen",
      role: "trainer",
      currentLoad: 3,
      availability: "high",
      lastAssigned: "2 hours ago",
      avatar: "MC",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      role: "trainer",
      currentLoad: 5,
      availability: "medium",
      lastAssigned: "1 hour ago",
      avatar: "SJ",
    },
    {
      id: "3",
      name: "David Rodriguez",
      role: "maintenance",
      currentLoad: 2,
      availability: "high",
      lastAssigned: "30 minutes ago",
      avatar: "DR",
    },
    {
      id: "4",
      name: "Emma Wilson",
      role: "admin",
      currentLoad: 4,
      availability: "low",
      lastAssigned: "3 hours ago",
      avatar: "EW",
    },
    {
      id: "5",
      name: "Alex Thompson",
      role: "trainer",
      currentLoad: 1,
      availability: "high",
      lastAssigned: "15 minutes ago",
      avatar: "AT",
    },
  ];

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onClose();
  };

  const getPreviewData = () => {
    if (assignmentType === "round_robin") {
      return {
        nextAssignee: "Mike Chen",
        queue: ["Sarah Johnson", "David Rodriguez", "Emma Wilson"],
        description: "Tasks will be assigned in rotation order",
      };
    } else if (assignmentType === "availability") {
      return {
        nextAssignee: "Alex Thompson",
        queue: ["Mike Chen", "David Rodriguez", "Sarah Johnson"],
        description: "Tasks assigned to most available team member",
      };
    } else {
      return {
        nextAssignee: "Role-based assignment",
        queue: [
          "Trainer: Mike Chen",
          "Maintenance: David Rodriguez",
          "Admin: Emma Wilson",
        ],
        description: "Tasks assigned based on type and role",
      };
    }
  };

  const previewData = getPreviewData();

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title="Enable Auto Assignment"
      subtitle="Configure automatic task assignment"
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assignment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Assignment Logic *
            </label>
            <div className="space-y-2">
              {assignmentTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    assignmentType === type.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="assignmentType"
                    value={type.value}
                    checked={assignmentType === type.value}
                    onChange={() => setAssignmentType(type.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{type.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {type.label}
                        </span>
                        {type.isPro && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            Pro
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {type.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Role Selection (for role-based) */}
          {assignmentType === "role_based" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Include Roles
              </label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className="flex items-center space-x-3 p-2 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer dark:border-gray-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.value)}
                      onChange={() => handleRoleToggle(role.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{role.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {role.count} members
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Override Options */}
          <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Override Options
              </h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableOverride}
                  onChange={(e) => setEnableOverride(e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Enable manual override
                </span>
              </label>
            </div>

            {enableOverride && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <p>• Admins can manually assign tasks</p>
                <p>• Override assignments are logged</p>
                <p>• Auto-assignment resumes after manual override</p>
              </motion.div>
            )}
          </div>

          {/* Preview */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Assignment Preview
              </h3>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {showPreview ? "Hide" : "Show"} preview
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
                    Next Assignment
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {previewData.nextAssignee.charAt(0)}
                    </div>
                    <span className="text-sm">{previewData.nextAssignee}</span>
                  </div>
                </div>

                <div className="bg-white rounded p-3 dark:bg-gray-800">
                  <div className="text-sm font-medium mb-2">
                    Assignment Queue
                  </div>
                  <div className="space-y-1">
                    {previewData.queue.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{member}</span>
                        <span className="text-gray-500">#{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {previewData.description}
                </div>
              </motion.div>
            )}
          </div>

          {/* Team Overview */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Team Overview
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {mockTeamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded dark:bg-gray-800"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {member.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{member.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {member.role} • {member.currentLoad} tasks
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        member.availability === "high"
                          ? "bg-green-100 text-green-700"
                          : member.availability === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {member.availability}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {member.lastAssigned}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiZap className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {assignmentType === "role_based" && selectedRoles.length > 0
                    ? `${selectedRoles.length} roles selected`
                    : `${mockTeamMembers.length} team members available`}
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
                    (assignmentType === "role_based" &&
                      selectedRoles.length === 0)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FiCheck className="w-4 h-4" />
                  <span>
                    {loading ? "Enabling..." : "Enable Auto Assignment"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </SmartTaskModal>
  );
};
