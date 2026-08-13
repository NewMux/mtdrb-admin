import React, { useState } from "react";
import {
  FiX,
  FiActivity,
  FiFilter,
  FiDownload,
  FiTrendingUp,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { SmartTrainerModal } from "./SmartTrainerModal";

interface TrainerSummary {
  name: string;
  email: string;
}

interface TrainerActivityLogModalProps {
  open: boolean;
  onClose: () => void;
  trainer?: TrainerSummary;
}

const TrainerActivityLogModal: React.FC<TrainerActivityLogModalProps> = ({
  open,
  onClose,
  trainer,
}) => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [selectedActivity, setSelectedActivity] = useState("all");

  const mockActivityLogs = [
    {
      id: 1,
      type: "class_taught",
      description: "Taught Yoga Basics class",
      timestamp: "2024-01-20T10:00:00Z",
      details: "15 members attended, 4.8/5 rating",
    },
    {
      id: 2,
      type: "member_assigned",
      description: "Assigned to Sarah Johnson",
      timestamp: "2024-01-19T14:30:00Z",
      details: "Personal training session scheduled",
    },
    {
      id: 3,
      type: "payment_received",
      description: "Payment received for January",
      timestamp: "2024-01-18T09:15:00Z",
      details: "$1,200.00 for 20 sessions",
    },
    {
      id: 4,
      type: "schedule_updated",
      description: "Updated availability",
      timestamp: "2024-01-17T16:45:00Z",
      details: "Added evening slots on Tuesdays",
    },
  ];

  const isProUser = true; // Mock Pro user status

  return (
    <SmartTrainerModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FiActivity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("trainers.activityLog")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("trainers.activityLogDesc")}
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
              {t("trainers.trainerInformation")}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t("common.name")}:</span>
                <span className="font-medium">
                  {trainer?.name || "John Doe"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t("common.email")}:</span>
                <span className="font-medium">
                  {trainer?.email || "john@fit.com"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {t("common.status")}:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {t("trainers.active")}
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("trainers.timePeriod")}
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="7d">{t("trainers.last7Days")}</option>
                <option value="30d">{t("trainers.last30Days")}</option>
                <option value="90d">{t("trainers.last90Days")}</option>
                <option value="1y">{t("trainers.lastYear")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("trainers.activityType")}
              </label>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">{t("trainers.allActivities")}</option>
                <option value="class_taught">{t("trainers.classesTaught")}</option>
                <option value="member_assigned">{t("trainers.memberAssignments")}</option>
                <option value="payment_received">{t("trainers.payments")}</option>
                <option value="schedule_updated">{t("trainers.scheduleUpdates")}</option>
              </select>
            </div>
          </div>

          {/* Smart Insights for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiTrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    {t("trainers.smartInsights")}
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    {t("trainers.activityInsightDesc")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Activity Logs */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              {t("trainers.recentActivity")}
            </h3>
            <div className="space-y-3">
              {mockActivityLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {log.description}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {log.details}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {log.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {t("common.close")}
          </button>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2">
              <FiFilter className="w-4 h-4" />
              <span>{t("common.filter")}</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2">
              <FiDownload className="w-4 h-4" />
              <span>{t("trainers.export")}</span>
            </button>
          </div>
        </div>
      </div>
    </SmartTrainerModal>
  );
};

export default TrainerActivityLogModal;
