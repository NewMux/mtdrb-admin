import React, { useState } from "react";
import {
  FiX,
  FiTrendingUp,
  FiUsers,
  FiStar,
  FiDollarSign,
  FiShield,
} from "react-icons/fi";
import { SmartTrainerModal } from "./SmartTrainerModal";

interface TrainerKPICardModalProps {
  open: boolean;
  onClose: () => void;
  trainer?: any;
}

const TrainerKPICardModal: React.FC<TrainerKPICardModalProps> = ({
  open,
  onClose,
  trainer,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const mockKPIs = {
    classesTaught: 45,
    memberSatisfaction: 4.8,
    revenueGenerated: 8500,
    memberRetention: 92,
    attendanceRate: 88,
    personalSessions: 23,
  };

  const isProUser = true; // Mock Pro user status

  return (
    <SmartTrainerModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FiTrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Trainer KPI Dashboard
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Performance metrics and key indicators
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
                  Performance Rating:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  Excellent
                </span>
              </div>
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedPeriod("7d")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === "7d"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setSelectedPeriod("30d")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === "30d"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setSelectedPeriod("90d")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === "90d"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              90 Days
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  +12%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockKPIs.classesTaught}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Classes Taught
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <FiStar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  +0.2
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockKPIs.memberSatisfaction}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Member Satisfaction
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FiDollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  +8%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${mockKPIs.revenueGenerated.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Revenue Generated
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <FiTrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  +5%
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockKPIs.memberRetention}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Member Retention
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {mockKPIs.attendanceRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average Attendance Rate
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {mockKPIs.personalSessions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Personal Training Sessions
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
                    Smart Performance Analysis
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    This trainer is performing in the top 15% of all trainers.
                    Consider promoting to lead trainer role and increasing class
                    capacity.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Trends */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Performance Trends
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Member Satisfaction
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: "96%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">96%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Revenue Growth
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: "88%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">88%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Class Attendance
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: "92%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
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
              Export Report
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Generate Insights
            </button>
          </div>
        </div>
      </div>
    </SmartTrainerModal>
  );
};

export default TrainerKPICardModal;
