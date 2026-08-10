import React, { useState } from "react";
import {
  FiX,
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiShield,
} from "react-icons/fi";
import { SmartTrainerModal } from "./SmartTrainerModal";

interface TrainerAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  trainer?: any;
}

const TrainerAnalyticsModal: React.FC<TrainerAnalyticsModalProps> = ({
  open,
  onClose,
  trainer,
}) => {
  const [selectedMetric, setSelectedMetric] = useState("overview");

  const mockAnalytics = {
    totalClasses: 156,
    totalMembers: 89,
    totalRevenue: 12500,
    averageRating: 4.8,
    memberGrowth: 23,
    revenueGrowth: 18,
    classAttendance: 94,
    memberRetention: 91,
  };

  const isProUser = true; // Mock Pro user status

  return (
    <SmartTrainerModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <FiBarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Trainer Analytics
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detailed performance analytics and insights
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
                  Analytics Period:
                </span>
                <span className="font-medium">Last 30 Days</span>
              </div>
            </div>
          </div>

          {/* Metric Navigation */}
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedMetric("overview")}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedMetric === "overview"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedMetric("performance")}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedMetric === "performance"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setSelectedMetric("revenue")}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedMetric === "revenue"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setSelectedMetric("members")}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedMetric === "members"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Members
            </button>
          </div>

          {/* Overview Metrics */}
          {selectedMetric === "overview" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    +{mockAnalytics.memberGrowth}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockAnalytics.totalMembers}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Members
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <FiCalendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    +15%
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockAnalytics.totalClasses}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Classes Taught
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <FiTrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    +{mockAnalytics.revenueGrowth}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${mockAnalytics.totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Revenue
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <FiBarChart2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    +0.2
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockAnalytics.averageRating}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average Rating
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {selectedMetric === "performance" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Performance Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Class Attendance Rate
                    </span>
                    <span className="font-medium">
                      {mockAnalytics.classAttendance}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Member Retention Rate
                    </span>
                    <span className="font-medium">
                      {mockAnalytics.memberRetention}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Average Class Size
                    </span>
                    <span className="font-medium">12.5 members</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Analytics */}
          {selectedMetric === "revenue" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Revenue Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Group Classes
                    </span>
                    <span className="font-medium">$8,400</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Personal Training
                    </span>
                    <span className="font-medium">$3,600</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Special Events
                    </span>
                    <span className="font-medium">$500</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Member Analytics */}
          {selectedMetric === "members" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Member Demographics
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      New Members (30d)
                    </span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Returning Members
                    </span>
                    <span className="font-medium">77</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Average Age
                    </span>
                    <span className="font-medium">34 years</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart Insights for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    Smart Analytics Insights
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    Performance analysis shows 23% improvement in member
                    engagement. Consider expanding class offerings during peak
                    hours (6-8 PM) to capitalize on demand.
                  </p>
                </div>
              </div>
            </div>
          )}
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
              Export Data
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </SmartTrainerModal>
  );
};

export default TrainerAnalyticsModal;
