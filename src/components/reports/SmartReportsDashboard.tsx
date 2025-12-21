import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiCpu,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiTarget,
  FiZap,
  FiFileText,
  FiCalendar,
  FiDownload,
  FiBarChart,
  FiMessageSquare,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface SmartReportsDashboardProps {
  refreshKey: number;
  stats: {
    totalReports: number;
    automatedReports: number;
    scheduledToday: number;
    totalDownloads: number;
  };
}

interface ReportInsight {
  type: "usage" | "performance" | "automation" | "trends";
  title: string;
  data: any[];
  insight: string;
}

export default function SmartReportsDashboard({
  refreshKey,
  stats,
}: SmartReportsDashboardProps) {
  const [insights, setInsights] = useState<ReportInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    fetchSmartInsights();
  }, [refreshKey]);

  const fetchSmartInsights = async () => {
    setLoading(true);
    try {
      // Generate Smart insights for reporting
      const performanceData = [
        { name: "Jan", automated: 12, manual: 8, efficiency: 60 },
        { name: "Feb", automated: 15, manual: 6, efficiency: 71 },
        { name: "Mar", automated: 18, manual: 5, efficiency: 78 },
        { name: "Apr", automated: 22, manual: 4, efficiency: 85 },
        { name: "May", automated: 25, manual: 3, efficiency: 89 },
        { name: "Jun", automated: 28, manual: 2, efficiency: 93 },
      ];

      setInsights([
        {
          type: "performance",
          title: "Automation Performance",
          data: performanceData,
          insight:
            "Automation efficiency increased 33% this quarter - on track for 95% target",
        },
      ]);

      setRecentReports([
        {
          name: "Monthly Member Analytics",
          type: "Member Report",
          status: "Completed",
          time: "2 hours ago",
          downloads: 23,
        },
        {
          name: "Q2 Financial Summary",
          type: "Financial Report",
          status: "Processing",
          time: "30 mins ago",
          downloads: 0,
        },
        {
          name: "Trainer Performance Review",
          type: "Trainer Report",
          status: "Completed",
          time: "1 hour ago",
          downloads: 12,
        },
        {
          name: "Class Attendance Analysis",
          type: "Class Report",
          status: "Scheduled",
          time: "Tomorrow 9 AM",
          downloads: 0,
        },
        {
          name: "Revenue Forecast",
          type: "Financial Report",
          status: "Completed",
          time: "4 hours ago",
          downloads: 31,
        },
      ]);
    } catch (error) {
      console.error("Error fetching report insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-xl">
            <FiCpu className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Smart Report Intelligence</h2>
            <p className="text-blue-100">
              Smart insights and predictive analytics for comprehensive business
              reporting
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiZap className="text-yellow-300" />
              <span className="text-sm font-medium">Automation</span>
            </div>
            <div className="text-2xl font-bold">93%</div>
            <div className="text-xs text-blue-200">Report Efficiency</div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiTarget className="text-green-300" />
              <span className="text-sm font-medium">Accuracy</span>
            </div>
            <div className="text-2xl font-bold">98.7%</div>
            <div className="text-xs text-blue-200">Data Precision</div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiTrendingUp className="text-purple-300" />
              <span className="text-sm font-medium">Growth</span>
            </div>
            <div className="text-2xl font-bold">+47%</div>
            <div className="text-xs text-blue-200">Usage This Month</div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiActivity className="text-orange-300" />
              <span className="text-sm font-medium">Insights</span>
            </div>
            <div className="text-2xl font-bold">127</div>
            <div className="text-xs text-blue-200">Smart Recommendations</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <FiBarChart className="text-blue-600 text-xl" />
              <h3 className="text-lg font-semibold text-gray-900">
                {insight.title}
              </h3>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={insight.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={
                    insight.type === "performance" ? "efficiency" : "value"
                  }
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <p className="text-sm text-gray-700">{insight.insight}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Reports
          </h3>
          <div className="flex items-center gap-2">
            <FiFileText className="text-blue-600" />
            <span className="text-sm text-gray-600">Latest Activity</span>
          </div>
        </div>

        <div className="space-y-3">
          {recentReports.map((report, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    report.status === "Completed"
                      ? "bg-green-100"
                      : report.status === "Processing"
                        ? "bg-yellow-100"
                        : "bg-blue-100"
                  }`}
                >
                  <FiFileText
                    className={`${
                      report.status === "Completed"
                        ? "text-green-600"
                        : report.status === "Processing"
                          ? "text-yellow-600"
                          : "text-blue-600"
                    }`}
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{report.name}</div>
                  <div className="text-sm text-gray-500">
                    {report.type} • {report.time}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div
                    className={`text-sm font-medium ${
                      report.status === "Completed"
                        ? "text-green-600"
                        : report.status === "Processing"
                          ? "text-yellow-600"
                          : "text-blue-600"
                    }`}
                  >
                    {report.status}
                  </div>
                  {report.downloads > 0 && (
                    <div className="text-xs text-gray-500">
                      {report.downloads} downloads
                    </div>
                  )}
                </div>

                {report.status === "Completed" && (
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <FiDownload />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
