import * as React from "react";
import {
  FiBarChart,
  FiUsers,
  FiDollarSign,
  FiCalendar,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./modals/SmartAnalyticsModal";

interface ViewDetailsModalProps {
  open: boolean;
  onClose: () => void;
  section: string;
  data: unknown;
  dateRange: string;
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({
  open,
  onClose,
  section,
  data,
  dateRange,
}) => {
  const getSectionIcon = (section: string) => {
    switch (section) {
      case "revenue":
        return FiDollarSign;
      case "members":
        return FiUsers;
      case "classes":
        return FiCalendar;
      default:
        return FiBarChart;
    }
  };

  const getSectionTitle = (section: string) => {
    switch (section) {
      case "revenue":
        return "Revenue Details";
      case "members":
        return "Member Details";
      case "classes":
        return "Class Details";
      default:
        return "Analytics Details";
    }
  };

  const getSectionDescription = (section: string) => {
    switch (section) {
      case "revenue":
        return "Comprehensive revenue analysis and financial metrics";
      case "members":
        return "Detailed member activity and engagement data";
      case "classes":
        return "Class performance and attendance analytics";
      default:
        return "Detailed analytics breakdown";
    }
  };

  const formatDateRange = (dateRange: string) => {
    const rangeMap: { [key: string]: string } = {
      "7d": "Last 7 days",
      "30d": "Last 30 days",
      "90d": "Last 90 days",
      "1y": "Last year",
    };
    return rangeMap[dateRange] || dateRange;
  };

  const Icon = getSectionIcon(section);

  return (
    <SmartAnalyticsModal
      open={open}
      onClose={onClose}
      title={getSectionTitle(section)}
      subtitle={`${getSectionDescription(section)} for ${formatDateRange(dateRange)}`}
    >
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getSectionTitle(section)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Time period: {formatDateRange(dateRange)}
            </p>
          </div>
        </div>

        {/* Data Breakdown */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">
            Key Metrics
          </h4>

          {section === "revenue" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  45,280 BHD
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Revenue
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">+12.5%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Growth Rate
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">1,247</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Members
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">89</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  New Signups
                </div>
              </div>
            </div>
          )}

          {section === "members" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-600">1,247</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Members
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">+8.2%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Growth Rate
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-red-600">3.2%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Churn Rate
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">18</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  At-Risk Members
                </div>
              </div>
            </div>
          )}

          {section === "classes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Classes This Month
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">85%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average Attendance
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">4.8</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Average Rating
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">12</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Trainers
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Charts Placeholder */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">
            Detailed Analysis
          </h4>

          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <FiBarChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  Interactive charts and detailed breakdowns would be displayed
                  here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Including trend analysis, comparisons, and predictive insights
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              // Simulate export functionality
              const exportData = {
                section,
                dateRange,
                data,
                timestamp: new Date().toISOString(),
              };

              const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${section}-details-${dateRange}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export Details
          </button>

          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
};

export default ViewDetailsModal;
