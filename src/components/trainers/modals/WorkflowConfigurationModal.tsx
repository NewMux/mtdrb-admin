import * as React from "react";
import { motion } from "framer-motion";
import {
  FiSettings,
  FiSave,
  FiX,
  FiZap,
  FiTarget,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
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
  workflowId,
  workflowName = "Workflow",
  workflowType = "automation",
}: WorkflowConfigurationModalProps) {
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

  const handleInputChange = (field: keyof WorkflowConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Workflow configuration updated successfully!");
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
      title="Configure Workflow"
      subtitle={`Customize settings for ${workflowName}`}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiSettings className="text-blue-500" />
            Basic Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter workflow name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe what this workflow does..."
              />
            </div>
          </div>
        </div>

        {/* Trigger Conditions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiZap className="text-green-500" />
            Trigger Conditions
          </h3>
          <div className="space-y-3">
            {[
              "When trainer availability changes",
              "When class capacity reaches 80%",
              "When member requests exceed capacity",
              "When performance metrics drop below threshold",
              "When new trainer is added to system",
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
            Actions
          </h3>
          <div className="space-y-3">
            {[
              "Send notification to trainer",
              "Automatically assign backup trainer",
              "Adjust class schedule",
              "Send member notification",
              "Generate performance report",
              "Optimize trainer workload",
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
            Schedule
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Execution Frequency
              </label>
              <select
                value={config.schedule}
                onChange={(e) => handleInputChange("schedule", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-emerald-500" />
            Advanced Settings
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
                Send notifications for workflow events
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
                Auto-optimize based on performance data
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
            Cancel
          </SmartButton>
          <SmartButton
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            icon={<FiSave className="w-4 h-4" />}
          >
            Save Configuration
          </SmartButton>
        </div>
      </div>
    </ColorfulModalUI>
  );
}
