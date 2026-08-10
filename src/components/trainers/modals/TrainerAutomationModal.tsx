import React, { useState } from "react";
import {
  FiX,
  FiZap,
  FiSettings,
  FiPause,
  FiShield,
  FiCheck,
} from "react-icons/fi";
import { SmartTrainerModal } from "./SmartTrainerModal";

interface TrainerAutomationModalProps {
  open: boolean;
  onClose: () => void;
  trainer?: any;
}

const TrainerAutomationModal: React.FC<TrainerAutomationModalProps> = ({
  open,
  onClose,
  trainer,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState({
    schedule: true,
    notifications: true,
    reporting: false,
    matching: true,
  });

  const mockAutomations = [
    {
      id: "schedule",
      name: "Smart Schedule Optimization",
      description:
        "Automatically optimize class schedules based on demand and trainer availability",
      status: "active",
      efficiency: 85,
    },
    {
      id: "notifications",
      name: "Automated Notifications",
      description:
        "Send automated reminders and updates to members about classes and sessions",
      status: "active",
      efficiency: 92,
    },
    {
      id: "reporting",
      name: "Performance Reporting",
      description: "Generate automated performance reports and analytics",
      status: "inactive",
      efficiency: 78,
    },
    {
      id: "matching",
      name: "Member-Trainer Matching",
      description: "Smart-powered matching of members with suitable trainers",
      status: "active",
      efficiency: 89,
    },
  ];

  const handleToggleAutomation = async (automationId: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setAutomationEnabled((prev) => ({
      ...prev,
      [automationId]: !prev[automationId as keyof typeof prev],
    }));
    setIsLoading(false);
  };

  const isProUser = true; // Mock Pro user status

  return (
    <SmartTrainerModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <FiZap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Trainer Automation
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage automated workflows and smart-powered features
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Trainer Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Trainer Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium">
                  {trainer?.name || "John Doe"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium">
                  {trainer?.email || "john@fit.com"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Automation Level:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  Advanced
                </span>
              </div>
            </div>
          </div>

          {/* Automation Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                3
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Automations
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                86%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average Efficiency
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                12h
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Time Saved Weekly
              </div>
            </div>
          </div>

          {/* Smart Insights for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    Smart Automation Recommendations
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    Analysis suggests enabling Performance Reporting automation
                    could improve efficiency by 15%. Consider activating member
                    feedback automation for better engagement tracking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Automation List */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Available Automations
            </h3>
            <div className="space-y-3">
              {mockAutomations.map((automation) => (
                <div
                  key={automation.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {automation.name}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            automation.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {automation.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {automation.description}
                      </p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            Efficiency:
                          </span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${automation.efficiency}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">
                            {automation.efficiency}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleAutomation(automation.id)}
                        disabled={isLoading}
                        className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1 ${
                          automationEnabled[
                            automation.id as keyof typeof automationEnabled
                          ]
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {automationEnabled[
                          automation.id as keyof typeof automationEnabled
                        ] ? (
                          <FiCheck className="w-3 h-3" />
                        ) : (
                          <FiPause className="w-3 h-3" />
                        )}
                        <span className="text-xs">
                          {automationEnabled[
                            automation.id as keyof typeof automationEnabled
                          ]
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <FiSettings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automation Benefits */}
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">
              Automation Benefits
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">
                  Reduced manual work
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">
                  Improved accuracy
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">
                  Better member experience
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">
                  Increased efficiency
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Close
          </button>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
              Automation Log
            </button>
            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center space-x-2">
              <FiZap className="w-4 h-4" />
              <span>Run All Automations</span>
            </button>
          </div>
        </div>
      </div>
    </SmartTrainerModal>
  );
};

export default TrainerAutomationModal;
