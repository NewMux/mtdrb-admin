import * as React from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiFilter,
  FiDownload,
  FiClock,
  FiZap,
  FiLock,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal, type AnalyticsFilters } from "./useSmartAnalyticsModal";

interface GenerateReportModalProps {
  open: boolean;
  onClose: () => void;
  memberId?: string;
  classId?: string;
  trainerId?: string;
  dateRange?: { start: string; end: string };
  reportType?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const reportTypes = [
  {
    id: "member",
    label: "Member Report",
    description: "Member activity, engagement, and progress metrics",
  },
  {
    id: "class",
    label: "Class Report",
    description: "Class attendance, capacity, and performance data",
  },
  {
    id: "trainer",
    label: "Trainer Report",
    description: "Trainer performance, sessions, and client feedback",
  },
  {
    id: "billing",
    label: "Billing Report",
    description: "Revenue, payments, and financial transactions",
  },
  {
    id: "vat",
    label: "VAT Report",
    description: "VAT calculations and compliance data",
  },
  {
    id: "financial",
    label: "Financial Report",
    description: "Comprehensive financial analysis and insights",
  },
];

const exportFormats = [
  {
    id: "csv",
    label: "CSV",
    description: "Spreadsheet format, good for data analysis",
  },
  { id: "excel", label: "Excel", description: "Rich formatting and charts" },
  { id: "pdf", label: "PDF", description: "Professional presentation format" },
  { id: "json", label: "JSON", description: "API-friendly data format" },
];

export default function GenerateReportModal({
  open,
  onClose,
  memberId,
  classId,
  trainerId,
  dateRange,
  reportType,
  onSuccess,
  isPro,
}: GenerateReportModalProps) {
  const {
    loading,
    filters,
    setFilters,
    smartInsights,
    reportPreview,
    alerts,
    generateReport,
    scheduleReport,
    clearAlerts,
  } = useSmartAnalyticsModal({
    memberId,
    classId,
    trainerId,
    dateRange,
    reportType,
  });

  const [showSchedule, setShowSchedule] = React.useState(false);
  const [scheduleConfig, setScheduleConfig] = React.useState({
    frequency: "weekly" as NonNullable<AnalyticsFilters["frequency"]>,
    deliveryMethod: "email" as NonNullable<AnalyticsFilters["deliveryMethod"]>,
    recipients: ["admin@mtdrb.com"],
  });

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleGenerate = async () => {
    const result = await generateReport();
    if (result.success) {
      onSuccess?.();
      onClose();
    }
  };

  const handleSchedule = async () => {
    const result = await scheduleReport(scheduleConfig);
    if (result.success) {
      onSuccess?.();
      onClose();
    }
  };

  function Section({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {title}
        </h3>
        <div className="space-y-4">{children}</div>
      </section>
    );
  }

  return (
    <SmartAnalyticsModal
      open={open}
      onClose={onClose}
      title="Generate Report"
      subtitle="Create comprehensive reports with smart insights and export options"
    >
      {/* Alerts */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2 ${
            alert.type === "error"
              ? "bg-red-50 text-red-700"
              : alert.type === "warning"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {alert.type === "warning" && (
            <FiAlertTriangle className="text-yellow-500" />
          )}
          {alert.type === "error" && (
            <FiAlertTriangle className="text-red-500" />
          )}
          {alert.type === "info" && <FiCheckCircle className="text-blue-500" />}
          {alert.message}
        </div>
      ))}

      {/* Smart Insights (Pro) */}
      {smartInsights.length > 0 && (
        <Section title="Smart Insights">
          <div className="space-y-3">
            {smartInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${
                  insight.isPro && !isPro
                    ? "border-gray-200 bg-gray-50"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <FiZap
                    className={`mt-1 ${insight.isPro && !isPro ? "text-gray-400" : "text-yellow-500"}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {insight.title}
                      </h4>
                      {insight.isPro && !isPro && (
                        <FiLock className="text-gray-400" title="Pro feature" />
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          insight.impact === "high"
                            ? "bg-red-100 text-red-700"
                            : insight.impact === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {insight.impact} impact
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        {insight.action} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Report Type Selection */}
      <Section title="Report Type">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((type) => (
            <label
              key={type.id}
              className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name="reportType"
                value={type.id}
                checked={filters.reportType === type.id}
                  onChange={(e) => {
                    const value = e.target.value as AnalyticsFilters["reportType"];
                    setFilters({ ...filters, reportType: value });
                  }}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Date Range */}
      <Section title="Date Range">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <FiCalendar /> Start Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              value={filters.dateRange.start}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <FiCalendar /> End Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              value={filters.dateRange.end}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: e.target.value },
                })
              }
            />
          </div>
        </div>
      </Section>

      {/* Filters */}
      <Section title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <FiFilter /> Branch
            </label>
            <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200">
              <option value="">All Branches</option>
              <option value="downtown">Downtown</option>
              <option value="seef">Seef</option>
              <option value="riffa">Riffa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Export Options */}
      <Section title="Export Options">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <FiDownload /> Format
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              value={filters.exportFormat}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  exportFormat:
                    e.target.value as AnalyticsFilters["exportFormat"],
                })
              }
            >
              {exportFormats.map((format) => (
                <option key={format.id} value={format.id}>
                  {format.label} - {format.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Include Visuals
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.includeVisuals}
                onChange={(e) =>
                  setFilters({ ...filters, includeVisuals: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm text-gray-600">
                Include charts and graphs
              </span>
            </label>
          </div>
        </div>
      </Section>

      {/* Smart Scheduling */}
      <Section title="Smart Scheduling">
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSchedule}
              onChange={(e) => setShowSchedule(e.target.checked)}
              className="rounded"
            />
            <span className="font-medium">Schedule recurring reports</span>
          </label>

          {showSchedule && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <FiClock /> Frequency
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                    value={scheduleConfig.frequency}
                    onChange={(e) =>
                      setScheduleConfig({
                        ...scheduleConfig,
                        frequency:
                          e.target.value as NonNullable<
                            AnalyticsFilters["frequency"]
                          >,
                      })
                    }
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Delivery Method
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                    value={scheduleConfig.deliveryMethod}
                    onChange={(e) =>
                      setScheduleConfig({
                        ...scheduleConfig,
                        deliveryMethod:
                          e.target.value as NonNullable<
                            AnalyticsFilters["deliveryMethod"]
                          >,
                      })
                    }
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Section>

      {/* Preview Card */}
      {reportPreview && (
        <Section title="Report Preview">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {reportPreview.topMetrics.map((metric, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                  {metric.change && (
                    <div
                      className={`text-xs ${
                        metric.trend === "up"
                          ? "text-green-600"
                          : metric.trend === "down"
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {metric.trend === "up"
                        ? "↗"
                        : metric.trend === "down"
                          ? "↘"
                          : "→"}{" "}
                      {Math.abs(metric.change)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Estimated size: {reportPreview.estimatedSize} • Processing time: ~
              {reportPreview.processingTime}s
            </div>
          </div>
        </Section>
      )}

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          {showSchedule ? (
            <button
              className="bg-green-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-green-700 transition disabled:opacity-60"
              onClick={handleSchedule}
              disabled={loading}
            >
              {loading ? "Scheduling..." : "Schedule Report"}
            </button>
          ) : (
            <button
              className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          )}
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
