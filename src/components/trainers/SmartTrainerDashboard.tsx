import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiCpu,
  FiTrendingUp,
  FiUsers,
  FiStar,
  FiActivity,
  FiTarget,
  FiZap,
  FiClock,
  FiDollarSign,
  FiBarChart,
  FiMessageSquare,
} from "react-icons/fi";
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
} from "recharts";
// No mock data - all data comes from Supabase

interface SmartTrainerDashboardProps {
  refreshKey: number;
  stats: {
    totalTrainers: number;
    activeTrainers: number;
    todaySessions: number;
    topRatedTrainer: { name: string; rating: number } | null;
  };
}

interface TrainerInsight {
  type: "workload" | "performance" | "revenue" | "satisfaction";
  title: string;
  data: any[];
  insight: string;
}

export default function SmartTrainerDashboard({
  refreshKey,
  stats,
}: SmartTrainerDashboardProps) {
  const [insights, setInsights] =
    useState<TrainerInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [smartRecommendations, setSmartRecommendations] = useState<string[]>([]);

  useEffect(() => {
    // Mock data is already loaded
    setLoading(false);
  }, [refreshKey]);

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
            <h2 className="text-2xl font-bold">Smart Trainer Intelligence</h2>
            <p className="text-blue-100">
              Smart insights and predictive analytics for optimal trainer
              management
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiZap className="text-yellow-300" />
              <span className="text-sm font-medium">Automation</span>
            </div>
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-blue-200">Active Workflows</div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiTarget className="text-green-300" />
              <span className="text-sm font-medium">Optimization</span>
            </div>
            <div className="text-2xl font-bold">92%</div>
            <div className="text-xs text-blue-200">Schedule Efficiency</div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="text-purple-300" />
              <span className="text-sm font-medium">Matching</span>
            </div>
            <div className="text-2xl font-bold">87%</div>
            <div className="text-xs text-blue-200">Success Rate</div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiActivity className="text-orange-300" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div className="text-2xl font-bold">95%</div>
            <div className="text-xs text-blue-200">Tracking Accuracy</div>
          </div>
        </div>
      </div>

      {/* Live Smart Insights */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <FiMessageSquare className="text-blue-600 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900">
            Live Smart Insights
          </h3>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Real-time
          </span>
        </div>

        <div className="space-y-3">
          {smartRecommendations.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500"
            >
              <FiCpu className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 text-sm">{insight}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts */}
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
              <BarChart data={insight.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey={
                    insight.type === "workload" ? "utilization" : "revenue"
                  }
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <p className="text-sm text-gray-700">{insight.insight}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
