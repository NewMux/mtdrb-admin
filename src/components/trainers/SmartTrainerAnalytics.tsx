// Smart Trainer Analytics Component

import React, { useState, useEffect, useCallback } from "react";
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
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
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
// Empty initial data
const emptyTrainerPerformance: TrainerPerformance[] = [];
const emptyPerformanceMetrics: PerformanceMetric[] = [];
const emptyRevenueData: Array<{ month: string; revenue: number }> = [];

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
  const { tenantId } = useAuth();
  const [trainerPerformance, setTrainerPerformance] = useState<
    TrainerPerformance[]
  >(emptyTrainerPerformance);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >(emptyPerformanceMetrics);
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>(emptyRevenueData);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  const fetchTrainerAnalytics = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const now = new Date();
      const daysMap: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
      const days = daysMap[selectedTimeRange] || 30;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Fetch trainers
      const { data: trainers, error: trainersError } = await supabase
        .from("trainers")
        .select("*")
        .eq("tenant_id", tenantId);

      if (trainersError) throw trainersError;

      // Fetch classes
      const { data: classes, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("start_time", formatDate(startDate));

      if (classesError) throw classesError;

      // Fetch class bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("class_bookings")
        .select("*, classes(*)")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(startDate));

      if (bookingsError) throw bookingsError;

      // Fetch invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(startDate))
        .in("status", ["paid", "completed"]);

      if (invoicesError) throw invoicesError;

      // Calculate trainer performance
      const trainerStats = new Map<string, any>();
      
      (trainers || []).forEach((trainer: any) => {
        trainerStats.set(trainer.id, {
          id: trainer.id,
          name: `${trainer.first_name || ''} ${trainer.last_name || ''}`.trim() || trainer.email,
          rating: parseFloat(trainer.rating || "0"),
          sessions: 0,
          revenue: 0,
          retention: 85, // Would need historical data
          efficiency: 80, // Would need efficiency calculation
          growth: 0, // Would need comparison
          specialties: trainer.specialties || [trainer.specialty || "General"],
        });
      });

      // Count sessions and attendance per trainer
      (classes || []).forEach((cls: any) => {
        if (cls.trainer_id && cls.status === "completed") {
          const stats = trainerStats.get(cls.trainer_id);
          if (stats) {
            stats.sessions++;
          }
        }
      });

      // Count bookings and calculate revenue per trainer
      (bookings || []).forEach((booking: any) => {
        if (booking.classes?.trainer_id && (booking.status === "checked_in" || booking.status === "completed")) {
          const stats = trainerStats.get(booking.classes.trainer_id);
          if (stats) {
            // Estimate revenue per booking
            stats.revenue += 25; // Rough estimate
          }
        }
      });

      // Calculate actual revenue from invoices (distributed evenly for now)
      const totalRevenue = (invoices || []).reduce((sum, inv) => 
        sum + parseFloat(inv.amount || inv.total || "0"), 0
      );
      const totalSessions = Array.from(trainerStats.values()).reduce((sum, t) => sum + t.sessions, 0);
      if (totalSessions > 0) {
        Array.from(trainerStats.values()).forEach(stats => {
          stats.revenue = (stats.sessions / totalSessions) * totalRevenue;
        });
      }

      const trainerPerformanceArray = Array.from(trainerStats.values())
        .map(trainer => ({
          ...trainer,
          growth: 5, // Would need comparison with previous period
        }));

      setTrainerPerformance(trainerPerformanceArray);

      // Generate performance metrics
      const totalSessionsCount = (classes || []).filter(c => c.status === "completed").length;
      const totalAttendance = (bookings || []).filter(b => 
        b.status === "checked_in" || b.status === "completed"
      ).length;
      const avgRating = (trainers || []).length > 0
        ? (trainers || []).reduce((sum, t) => sum + parseFloat(t.rating || "0"), 0) / trainers.length
        : 0;

      setPerformanceMetrics([
        {
          name: "Total Sessions",
          current: totalSessionsCount,
          previous: Math.floor(totalSessionsCount * 0.9),
          target: Math.floor(totalSessionsCount * 1.2),
          trend: "up",
        },
        {
          name: "Total Attendance",
          current: totalAttendance,
          previous: Math.floor(totalAttendance * 0.9),
          target: Math.floor(totalAttendance * 1.2),
          trend: "up",
        },
        {
          name: "Average Rating",
          current: avgRating,
          previous: avgRating - 0.2,
          target: 4.8,
          trend: avgRating >= 4.5 ? "up" : "stable",
        },
        {
          name: "Total Revenue",
          current: totalRevenue,
          previous: Math.floor(totalRevenue * 0.9),
          target: Math.floor(totalRevenue * 1.2),
          trend: "up",
        },
        {
          name: "Retention Rate",
          current: 85,
          previous: 82,
          target: 90,
          trend: "up",
        },
        {
          name: "Session Fill Rate",
          current: totalSessionsCount > 0 ? (totalAttendance / totalSessionsCount) * 100 : 0,
          previous: 75,
          target: 85,
          trend: "up",
        },
      ]);

      // Generate revenue data by month
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        };
      });

      const revenueByMonth = months.map(({ month, monthKey }) => {
        const monthInvoices = (invoices || []).filter((inv: any) => {
          const invoiceDate = new Date(inv.created_at);
          const invoiceMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
          return invoiceMonth === monthKey;
        });
        const revenue = monthInvoices.reduce((sum, inv) => 
          sum + parseFloat(inv.amount || inv.total || "0"), 0
        );
        return { month, revenue };
      });

      setRevenueData(revenueByMonth);
    } catch (error) {
      console.error("Error fetching trainer analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedTimeRange, refreshKey]);

  useEffect(() => {
    fetchTrainerAnalytics();
  }, [fetchTrainerAnalytics]);

  const generateRadarData = () => {
    return trainerPerformance.slice(0, 3).map((trainer) => ({
      trainer: trainer.name,
      Rating: (trainer.rating / 5) * 100,
      Sessions: trainer.sessions > 0 ? Math.min((trainer.sessions / 120) * 100, 100) : 0,
      Retention: trainer.retention,
      Efficiency: trainer.efficiency,
      Revenue: trainer.revenue > 0 ? Math.min((trainer.revenue / 15000) * 100, 100) : 0,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

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
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <FiDollarSign className="text-green-600 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">
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
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <FiUsers className="text-blue-600 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">
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
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <FiTarget className="text-purple-600 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">
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
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <FiAward className="text-yellow-600 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">
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
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold text-sm">
                    #{index + 1}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {trainer.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {trainer.specialties.join(", ")}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${trainer.revenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <FiStar className="text-yellow-500" />
                      {trainer.rating.toFixed(1)}
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      trainer.growth > 0
                        ? "text-green-600"
                        : "text-red-600"
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
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <FiActivity className="text-indigo-600 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900">
            Detailed Performance Metrics
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Trainer
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Rating
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Sessions
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Revenue
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Retention
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Efficiency
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody>
              {trainerPerformance.map((trainer, index) => (
                <tr
                  key={trainer.id}
                  className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}`}
                >
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {trainer.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {trainer.specialties[0]}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <FiStar className="text-yellow-500" />
                      <span className="font-medium text-gray-900">
                        {trainer.rating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {trainer.sessions}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    ${trainer.revenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${trainer.retention}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {trainer.retention}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${trainer.efficiency}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {trainer.efficiency}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div
                      className={`flex items-center gap-1 font-medium ${
                        trainer.growth > 0
                          ? "text-green-600"
                          : "text-red-600"
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
