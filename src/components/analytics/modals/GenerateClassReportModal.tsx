import * as React from "react";
import {
  FiCalendar,
  FiUsers,
  FiTrendingUp,
  FiAlertTriangle,
  FiBarChart2,
  FiClock,
  FiZap,
  FiCheckCircle,
  FiDownload,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal } from "./useSmartAnalyticsModal";

interface GenerateClassReportModalProps {
  open: boolean;
  onClose: () => void;
  classId?: string;
  className?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const classData = {
  id: "1",
  name: "HIIT Blast",
  trainer: "Mike Chen",
  schedule: "Mon, Wed, Fri 6:00 PM",
  capacity: 20,
  attendance: {
    averageAttendance: 18,
    attendanceRate: 90,
    noShowRate: 10,
    peakAttendance: 22,
    lowAttendance: 12,
  },
  utilization: {
    averageUtilization: 85,
    peakUtilization: 110,
    lowUtilization: 60,
    totalSessions: 45,
  },
  performance: {
    memberSatisfaction: 4.8,
    trainerRating: 4.9,
    difficultyLevel: "Advanced",
    energyLevel: "High",
  },
  smartInsights: [
    {
      type: "alert",
      title: "High Demand - Consider Duplicate",
      description:
        "Average attendance at 110% capacity, consider adding another session",
      confidence: 92,
      recommendation: "Add Tuesday 6:00 PM session",
      impact: "high",
    },
    {
      type: "trend",
      title: "Growing Popularity",
      description: "Attendance increased 15% over the last 3 months",
      confidence: 88,
      recommendation: "Promote to premium class",
      impact: "medium",
    },
  ],
};

const reportSections = [
  { id: "attendance", label: "Attendance Analytics", icon: FiUsers },
  { id: "utilization", label: "Capacity Utilization", icon: FiBarChart2 },
  { id: "performance", label: "Performance Metrics", icon: FiTrendingUp },
  { id: "comparison", label: "Class Comparison", icon: FiCalendar },
  { id: "ai_insights", label: "Smart Insights", icon: FiZap, isPro: true },
];

export default function GenerateClassReportModal({
  open,
  onClose,
  className = "HIIT Blast",
  onSuccess,
  isPro,
}: GenerateClassReportModalProps) {
  const { loading, generateReport, alerts, clearAlerts } =
    useSmartAnalyticsModal();

  const [selectedSections, setSelectedSections] = React.useState<string[]>([
    "attendance",
    "utilization",
    "performance",
  ]);
  const [includeCharts, setIncludeCharts] = React.useState(true);
  const [dateRange, setDateRange] = React.useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateReport();
      if (result.success) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleAddSection = (sectionId: string) => {
    if (!selectedSections.includes(sectionId)) {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    setSelectedSections(selectedSections.filter((id) => id !== sectionId));
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
      title="Generate Class Report"
      subtitle={`Performance analysis for ${className}`}
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
          {alert.message}
        </div>
      ))}

      {/* Class Overview */}
      <Section title="Class Overview">
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-lg font-semibold">
              {classData.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{classData.name}</h3>
              <p className="text-sm text-gray-600">
                Trainer: {classData.trainer}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FiClock />
                  {classData.schedule}
                </span>
                <span>•</span>
                <span>Capacity: {classData.capacity} members</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Report Sections */}
      <Section title="Report Sections">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportSections.map((section) => {
            const Icon = section.icon;
            const isSelected = selectedSections.includes(section.id);
            const isProOnly = section.isPro && !isPro;

            return (
              <div
                key={section.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : isProOnly
                      ? "border-gray-200 bg-gray-50 opacity-60"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
                onClick={() =>
                  !isProOnly &&
                  (isSelected
                    ? handleRemoveSection(section.id)
                    : handleAddSection(section.id))
                }
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`mt-1 ${isSelected ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {section.label}
                      </h4>
                      {isProOnly && (
                        <FiAlertTriangle
                          className="text-gray-400"
                          title="Pro feature"
                        />
                      )}
                    </div>
                  </div>
                  {isSelected && <FiCheckCircle className="text-blue-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Smart Insights */}
      {isPro && classData.smartInsights.length > 0 && (
        <Section title="Smart Insights">
          <div className="space-y-3">
            {classData.smartInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  insight.type === "alert"
                    ? "border-red-200 bg-red-50"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {insight.type === "alert" ? (
                    <FiAlertTriangle className="text-red-600 mt-1" />
                  ) : (
                    <FiZap className="text-blue-600 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {insight.title}
                      </h4>
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
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {insight.description}
                    </p>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      {insight.recommendation} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

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
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
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
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        </div>
      </Section>

      {/* Class Performance Preview */}
      <Section title="Performance Preview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiUsers className="text-blue-600" />
              <h4 className="font-semibold text-gray-900">Attendance</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Average Attendance</span>
                <span className="font-semibold">
                  {classData.attendance.averageAttendance}/{classData.capacity}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Attendance Rate</span>
                <span className="font-semibold">
                  {classData.attendance.attendanceRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>No-Show Rate</span>
                <span className="font-semibold text-red-600">
                  {classData.attendance.noShowRate}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiBarChart2 className="text-green-600" />
              <h4 className="font-semibold text-gray-900">Utilization</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Average Utilization</span>
                <span className="font-semibold">
                  {classData.utilization.averageUtilization}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Peak Utilization</span>
                <span className="font-semibold text-green-600">
                  {classData.utilization.peakUtilization}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Sessions</span>
                <span className="font-semibold">
                  {classData.utilization.totalSessions}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiTrendingUp className="text-purple-600" />
              <h4 className="font-semibold text-gray-900">Performance</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Member Satisfaction</span>
                <span className="font-semibold">
                  {classData.performance.memberSatisfaction}/5
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trainer Rating</span>
                <span className="font-semibold">
                  {classData.performance.trainerRating}/5
                </span>
              </div>
              <div className="flex justify-between">
                <span>Difficulty Level</span>
                <span className="font-semibold">
                  {classData.performance.difficultyLevel}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiCalendar className="text-orange-600" />
              <h4 className="font-semibold text-gray-900">Trends</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monthly Growth</span>
                <span className="font-semibold text-green-600">+15%</span>
              </div>
              <div className="flex justify-between">
                <span>Waitlist Length</span>
                <span className="font-semibold text-orange-600">8 members</span>
              </div>
              <div className="flex justify-between">
                <span>Recommendation Score</span>
                <span className="font-semibold text-green-600">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Smart Recommendations */}
      <Section title="Smart Recommendations">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-yellow-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Class Optimization
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Consider adding duplicate session due to high demand
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Implement waitlist management for oversubscribed sessions
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Review no-show policy to improve capacity utilization
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Promote to premium class based on performance metrics
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Export Options */}
      <Section title="Export Options">
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="rounded"
            />
            <span className="font-medium">
              Include attendance charts and utilization graphs
            </span>
          </label>
        </div>
      </Section>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={onClose}
            disabled={loading || generating}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleGenerate}
            disabled={loading || generating}
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FiDownload />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
