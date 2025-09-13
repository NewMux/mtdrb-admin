// Smart Trainer Analytics Component

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiDollarSign,
  FiStar,
  FiCalendar,
  FiTarget,
  FiActivity,
  FiAward,
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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  mockTrainerPerformance,
  mockPerformanceMetrics,
  mockRevenueData,
} from "../../api/mockTrainerData";

interface SmartTrainerAnalyticsProps {
  refreshKey: number;
}

interface TrainerPerformance {
  id: string;
  name: string;
  rating: number;
  sessions: number;
  revenue: number;
  retention: number;
  efficiency: number;
  growth: number;
  specialties: string[];
}

interface PerformanceMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  trend: "up" | "down" | "stable";
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

export default function SmartTrainerAnalytics({
  refreshKey,
}: SmartTrainerAnalyticsProps) {
  const [trainerPerformance, setTrainerPerformance] = useState<
    TrainerPerformance[]
  >(mockTrainerPerformance);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >(mockPerformanceMetrics);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  useEffect(() => {
    // Mock data is already loaded
    setLoading(false);
  }, [refreshKey, selectedTimeRange]);

  const generateRevenueData = () => {
    return mockRevenueData;
  };

  const generateRadarData = () => {
    return trainerPerformance.slice(0, 3).map((trainer) => ({
      trainer: trainer.name,
      Rating: (trainer.rating / 5) * 100,
      Sessions: (trainer.sessions / 120) * 100,
      Retention: trainer.retention,
      Efficiency: trainer.efficiency,
      Revenue: (trainer.revenue / 15000) * 100,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const revenueData = generateRevenueData();
  const radarData = generateRadarData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <FiBarChart className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Smart Trainer Analytics</h2>
              <p className="text-orange-100">
                Advanced performance metrics and predictive insights
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(["week", "month", "quarter", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-lg transition capitalize ${
                  selectedTimeRange === range
                    ? "bg-white text-orange-600 font-medium"
                    : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {performanceMetrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{metric.name}</h3>
              <div
                className={`flex items-center gap-1 ${
                  metric.trend === "up"
                    ? "text-green-600"
                    : metric.trend === "down"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {metric.trend === "up" && <FiTrendingUp className="text-sm" />}
                {metric.trend === "down" && (
                  <FiTrendingDown className="text-sm" />
                )}
                {metric.trend === "stable" && (
                  <FiActivity className="text-sm" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {metric.name.includes("Revenue")
                    ? `$${metric.current.toLocaleString()}`
                    : metric.name.includes("Rating")
                      ? metric.current.toFixed(1)
                      : `${metric.current}%`}
                </span>
                <span
                  className={`text-sm font-medium ${
                    metric.current >= metric.target
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  Target:{" "}
                  {metric.name.includes("Revenue")
                    ? `$${metric.target.toLocaleString()}`
                    : metric.name.includes("Rating")
                      ? metric.target.toFixed(1)
                      : `${metric.target}%`}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metric.current >= metric.target
                      ? "bg-green-500"
                      : "bg-orange-500"
                  }`}
                  style={{
                    width: `${Math.min((metric.current / metric.target) * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Previous:{" "}
                  {metric.name.includes("Revenue")
                    ? `$${metric.previous.toLocaleString()}`
                    : metric.name.includes("Rating")
                      ? metric.previous.toFixed(1)
                      : `${metric.previous}%`}
                </span>
                <span
                  className={`font-medium ${
                    metric.current > metric.previous
                      ? "text-green-600"
                      : metric.current < metric.previous
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {metric.current > metric.previous ? "+" : ""}
                  {(metric.current - metric.previous).toFixed(1)}
                  {metric.name.includes("Revenue")
                    ? ""
                    : metric.name.includes("Rating")
                      ? ""
                      : "%"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <FiDollarSign className="text-green-600 dark:text-green-400 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Revenue Trends
            </h3>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trainer Performance Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <FiUsers className="text-blue-600 dark:text-blue-400 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Trainer Performance
            </h3>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trainerPerformance.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="rating" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trainer Radar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <FiTarget className="text-purple-600 dark:text-purple-400 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Multi-Dimensional Performance
            </h3>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData[0] ? [radarData[0]] : []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="trainer" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Performance"
                dataKey="Rating"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <FiAward className="text-yellow-600 dark:text-yellow-400 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Top Performers
            </h3>
          </div>

          <div className="space-y-4">
            {trainerPerformance
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 5)
              .map((trainer, index) => (
                <div
                  key={trainer.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold text-sm">
                    #{index + 1}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {trainer.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {trainer.specialties.join(", ")}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      ${trainer.revenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <FiStar className="text-yellow-500" />
                      {trainer.rating.toFixed(1)}
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      trainer.growth > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {trainer.growth > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                    {Math.abs(trainer.growth)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <FiActivity className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Detailed Performance Metrics
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                  Trainer
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                  Rating
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                  Sessions
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                  Revenue
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                  Retention
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                  Efficiency
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody>
              {trainerPerformance.map((trainer, index) => (
                <tr
                  key={trainer.id}
                  className={`border-b border-gray-100 dark:border-gray-700 ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-700/50" : "bg-white dark:bg-gray-800"}`}
                >
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {trainer.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {trainer.specialties[0]}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <FiStar className="text-yellow-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {trainer.rating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    {trainer.sessions}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                    ${trainer.revenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${trainer.retention}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {trainer.retention}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${trainer.efficiency}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {trainer.efficiency}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div
                      className={`flex items-center gap-1 font-medium ${
                        trainer.growth > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {trainer.growth > 0 ? (
                        <FiTrendingUp />
                      ) : (
                        <FiTrendingDown />
                      )}
                      {Math.abs(trainer.growth)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
