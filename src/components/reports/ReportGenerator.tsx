import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiDownload,
  FiSettings,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiBarChart,
  FiTarget,
  FiActivity,
  FiPlus,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";

interface ReportGeneratorProps {
  refreshKey: number;
  isPro?: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "financial" | "member" | "trainer" | "operational";
  fields: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  popularity: number;
}

interface CustomReport {
  name: string;
  description: string;
  category: string;
  selectedFields: string[];
  filters: Record<string, any>;
  schedule: string;
  recipients: string[];
}

export default function ReportGenerator({
  refreshKey,
  isPro = false,
}: ReportGeneratorProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customReport, setCustomReport] = useState<CustomReport>({
    name: "",
    description: "",
    category: "financial",
    selectedFields: [],
    filters: {},
    schedule: "once",
    recipients: [],
  });
  const [availableFields, setAvailableFields] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    fetchTemplates();
    fetchAvailableFields();
  }, [refreshKey]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const templateData: ReportTemplate[] = [
        {
          id: "1",
          name: "Monthly Revenue Summary",
          description: "Comprehensive monthly financial performance report",
          category: "financial",
          fields: ["revenue", "expenses", "profit_margin", "growth_rate"],
          icon: FiDollarSign,
          color: "blue",
          popularity: 95,
        },
        {
          id: "2",
          name: "Member Engagement Analysis",
          description: "Detailed member activity and retention metrics",
          category: "member",
          fields: [
            "member_count",
            "retention_rate",
            "engagement_score",
            "churn_rate",
          ],
          icon: FiUsers,
          color: "green",
          popularity: 88,
        },
        {
          id: "3",
          name: "Trainer Performance Review",
          description: "Individual trainer metrics and performance analysis",
          category: "trainer",
          fields: [
            "trainer_rating",
            "session_count",
            "member_feedback",
            "revenue_generated",
          ],
          icon: FiTrendingUp,
          color: "purple",
          popularity: 82,
        },
        {
          id: "4",
          name: "Class Utilization Report",
          description:
            "Class attendance, capacity, and optimization recommendations",
          category: "operational",
          fields: [
            "attendance_rate",
            "capacity_utilization",
            "popular_classes",
            "scheduling_efficiency",
          ],
          icon: FiBarChart,
          color: "orange",
          popularity: 76,
        },
        {
          id: "5",
          name: "Financial Forecast",
          description: "Predictive financial analysis and revenue projections",
          category: "financial",
          fields: [
            "projected_revenue",
            "trend_analysis",
            "seasonal_patterns",
            "growth_opportunities",
          ],
          icon: FiTarget,
          color: "indigo",
          popularity: 71,
        },
        {
          id: "6",
          name: "Member Health Dashboard",
          description: "Health metrics, goals progress, and wellness insights",
          category: "member",
          fields: [
            "health_metrics",
            "goal_progress",
            "wellness_score",
            "activity_trends",
          ],
          icon: FiActivity,
          color: "emerald",
          popularity: 68,
        },
      ];

      setTemplates(templateData.sort((a, b) => b.popularity - a.popularity));
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFields = async () => {
    const fields = {
      financial: [
        "revenue",
        "expenses",
        "profit_margin",
        "growth_rate",
        "cash_flow",
        "subscription_revenue",
        "one_time_payments",
        "refunds",
        "tax_analysis",
      ],
      member: [
        "member_count",
        "retention_rate",
        "churn_rate",
        "engagement_score",
        "demographics",
        "membership_types",
        "activity_levels",
        "satisfaction_score",
      ],
      trainer: [
        "trainer_rating",
        "session_count",
        "member_feedback",
        "revenue_generated",
        "specialties",
        "certifications",
        "availability",
        "performance_trends",
      ],
      operational: [
        "attendance_rate",
        "capacity_utilization",
        "equipment_usage",
        "facility_metrics",
        "scheduling_efficiency",
        "peak_hours",
        "maintenance_costs",
        "energy_consumption",
      ],
    };

    setAvailableFields(fields);
  };

  const generateReport = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      toast.success(`Generating ${template.name}...`);
      // Simulate report generation
      setTimeout(() => {
        toast.success(`${template.name} ready for download!`);
      }, 2000);
    }
  };

  const createCustomReport = async () => {
    if (!customReport.name || customReport.selectedFields.length === 0) {
      toast.error("Please provide a name and select at least one field");
      return;
    }

    toast.success(`Creating custom report: ${customReport.name}...`);

    // Reset form
    setCustomReport({
      name: "",
      description: "",
      category: "financial",
      selectedFields: [],
      filters: {},
      schedule: "once",
      recipients: [],
    });

    setIsCustomMode(false);

    setTimeout(() => {
      toast.success("Custom report created successfully!");
    }, 1500);
  };

  const toggleField = (field: string) => {
    setCustomReport((prev) => ({
      ...prev,
      selectedFields: prev.selectedFields.includes(field)
        ? prev.selectedFields.filter((f) => f !== field)
        : [...prev.selectedFields, field],
    }));
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<
      string,
      { bg: string; text: string; border: string }
    > = {
      blue: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        border: "border-blue-500",
      },
      green: {
        bg: "bg-green-100",
        text: "text-green-600",
        border: "border-green-500",
      },
      purple: {
        bg: "bg-purple-100",
        text: "text-purple-600",
        border: "border-purple-500",
      },
      orange: {
        bg: "bg-orange-100",
        text: "text-orange-600",
        border: "border-orange-500",
      },
      indigo: {
        bg: "bg-indigo-100",
        text: "text-indigo-600",
        border: "border-indigo-500",
      },
      emerald: {
        bg: "bg-emerald-100",
        text: "text-emerald-600",
        border: "border-emerald-500",
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiFileText className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Smart Report Generator</h2>
              <p className="text-orange-100">
                Create custom reports with smart-powered insights
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                isCustomMode
                  ? "bg-white text-orange-600"
                  : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
              }`}
            >
              <FiPlus className="text-sm" />
              {isCustomMode ? "Back to Templates" : "Create Custom"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiFileText className="text-yellow-300" />
              <span className="text-sm font-medium">Templates</span>
            </div>
            <div className="text-2xl font-bold">{templates.length}</div>
            <div className="text-xs text-orange-200">Available</div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiDownload className="text-green-300" />
              <span className="text-sm font-medium">Generated</span>
            </div>
            <div className="text-2xl font-bold">247</div>
            <div className="text-xs text-orange-200">This Month</div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="text-purple-300" />
              <span className="text-sm font-medium">Users</span>
            </div>
            <div className="text-2xl font-bold">89</div>
            <div className="text-xs text-orange-200">Active</div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiTarget className="text-blue-300" />
              <span className="text-sm font-medium">Accuracy</span>
            </div>
            <div className="text-2xl font-bold">97%</div>
            <div className="text-xs text-orange-200">Data Quality</div>
          </div>
        </div>
      </div>

      {!isCustomMode ? (
        /* Report Templates */
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Popular Report Templates
            </h3>
            <div className="flex items-center gap-2">
              <FiBarChart className="text-orange-600" />
              <span className="text-sm text-gray-600">Quick Generation</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => {
              const colors = getColorClasses(template.color);
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`p-3 rounded-lg ${colors.bg} group-hover:scale-110 transition-transform`}
                    >
                      <template.icon className={`${colors.text} text-xl`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {template.name}
                      </h4>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        {template.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {template.popularity}%
                      </div>
                      <div className="text-xs text-gray-500">Popular</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {template.description}
                  </p>

                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Includes:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.fields.slice(0, 3).map((field) => (
                        <span
                          key={field}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                        >
                          {field.replace("_", " ")}
                        </span>
                      ))}
                      {template.fields.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{template.fields.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateReport(template.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition ${colors.bg} ${colors.text} hover:shadow-md`}
                    >
                      <FiDownload className="text-sm" />
                      Generate
                    </button>

                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                      <FiSettings className="text-sm" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Custom Report Builder */
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          {!isPro && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔒</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    Advanced Report Features
                  </h4>
                  <p className="text-sm text-gray-600">
                    Unlock multi-branch reports, predictive analytics, and
                    custom date ranges
                  </p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Create Custom Report
            </h3>
            <button
              onClick={() => setIsCustomMode(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <FiX />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={customReport.name}
                  onChange={(e) =>
                    setCustomReport((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Custom Financial Analysis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={customReport.description}
                  onChange={(e) =>
                    setCustomReport((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of the report..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={customReport.category}
                  onChange={(e) =>
                    setCustomReport((prev) => ({
                      ...prev,
                      category: e.target.value,
                      selectedFields: [],
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="financial">Financial</option>
                  <option value="member">Member</option>
                  <option value="trainer">Trainer</option>
                  <option value="operational">Operational</option>
                </select>
              </div>

              {/* Multi-select Branches */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branches{" "}
                  {!isPro && (
                    <span className="text-xs text-gray-500">(Pro feature)</span>
                  )}
                </label>
                <select
                  multiple
                  disabled={!isPro}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    !isPro ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="main">Main Branch</option>
                  <option value="downtown">Downtown Location</option>
                  <option value="suburb">Suburban Branch</option>
                </select>
                {!isPro && (
                  <p className="text-xs text-gray-500 mt-1">
                    Upgrade to Pro for multi-branch reports
                  </p>
                )}
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="last-7-days">Last 7 Days</option>
                  <option value="last-30-days">Last 30 Days</option>
                  <option value="last-90-days">Last 90 Days</option>
                  <option value="this-month">This Month</option>
                  <option value="this-quarter">This Quarter</option>
                  <option value="this-year">This Year</option>
                  {isPro && <option value="custom">Custom Range</option>}
                </select>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="summary">Summary Report</option>
                  <option value="detailed">Detailed Report</option>
                  <option value="comparative">Comparative Report</option>
                  {isPro && (
                    <option value="predictive">Predictive Analysis</option>
                  )}
                </select>
              </div>

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                  {isPro && <option value="json">JSON</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule
                </label>
                <select
                  value={customReport.schedule}
                  onChange={(e) =>
                    setCustomReport((prev) => ({
                      ...prev,
                      schedule: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="once">Generate Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Field Selection */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Select Fields</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableFields[
                  customReport.category as keyof typeof availableFields
                ]?.map((field) => (
                  <div
                    key={field}
                    onClick={() => toggleField(field)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                      customReport.selectedFields.includes(field)
                        ? "bg-orange-50 border border-orange-200"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {field
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    {customReport.selectedFields.includes(field) && (
                      <FiCheck className="text-orange-600" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                  Selected: {customReport.selectedFields.length} fields
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {customReport.selectedFields.length > 0 &&
                `${customReport.selectedFields.length} fields selected`}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCustomMode(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>

              {/* Export Options */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  <FiDownload className="text-sm" />
                  Export
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2">
                      <FiDownload className="w-4 h-4" />
                      Download
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      Email
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg flex items-center gap-2">
                      <FiUsers className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={createCustomReport}
                disabled={
                  !customReport.name || customReport.selectedFields.length === 0
                }
                className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <FiCheck className="text-sm" />
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
