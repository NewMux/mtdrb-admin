import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiStar,
} from "react-icons/fi";
import { SmartDashboardOverview } from "./SmartDashboardOverview";
import { LiveKPITracker } from "./LiveKPITracker";
import MemberEngagement from "./MemberEngagement";
import BusinessOverview from "./BusinessOverview";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

interface DashboardOverviewProps {
  refreshKey: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  refreshKey 
}) => {
  const { tenantId } = useAuth();
  const [primaryStats, setPrimaryStats] = useState([
    {
      name: "Total Revenue",
      value: "$0",
      change: "Loading...",
      icon: <FiDollarSign className="w-6 h-6" />,
      color: "green" as const,
      target: "$0",
      progress: 0,
    },
    {
      name: "Active Members",
      value: "0",
      change: "Loading...",
      icon: <FiUsers className="w-6 h-6" />,
      color: "blue" as const,
      target: "0",
      progress: 0,
    },
    {
      name: "Class Attendance",
      value: "0%",
      change: "Loading...",
      icon: <FiCalendar className="w-6 h-6" />,
      color: "purple" as const,
      target: "85%",
      progress: 0,
    },
    {
      name: "Member Satisfaction",
      value: "0/5",
      change: "Loading...",
      icon: <FiStar className="w-6 h-6" />,
      color: "yellow" as const,
      target: "4.8",
      progress: 0,
    },
  ]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Fetch invoices for revenue
      const [currentInvoices, previousInvoices] = await Promise.all([
        supabase
          .from("invoices")
          .select("amount, total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("created_at", formatDate(currentMonthStart)),
        supabase
          .from("invoices")
          .select("amount, total, status")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
          .gte("created_at", formatDate(previousMonthStart))
          .lte("created_at", formatDate(previousMonthEnd)),
      ]);

      // Fetch members
      const [currentMembers, previousMembers] = await Promise.all([
        supabase
          .from("members")
          .select("id, status, membership_status, created_at")
          .eq("tenant_id", tenantId)
          .in("status", ["active"])
          .in("membership_status", ["active", "trial"]),
        supabase
          .from("members")
          .select("id, status, membership_status, created_at")
          .eq("tenant_id", tenantId)
          .in("status", ["active"])
          .in("membership_status", ["active", "trial"])
          .gte("created_at", formatDate(previousMonthStart))
          .lte("created_at", formatDate(previousMonthEnd)),
      ]);

      // Fetch class bookings for attendance
      const [currentBookings, previousBookings] = await Promise.all([
        supabase
          .from("class_bookings")
          .select("id, status")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(currentMonthStart)),
        supabase
          .from("class_bookings")
          .select("id, status")
          .eq("tenant_id", tenantId)
          .gte("created_at", formatDate(previousMonthStart))
          .lte("created_at", formatDate(previousMonthEnd)),
      ]);

      // Calculate revenue
      const currentRevenue = (currentInvoices.data || []).reduce(
        (sum, inv) => sum + Number(inv.total || inv.amount || 0),
        0
      );
      const previousRevenue = (previousInvoices.data || []).reduce(
        (sum, inv) => sum + Number(inv.total || inv.amount || 0),
        0
      );
      const revenueChange = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      // Calculate members
      const currentMemberCount = (currentMembers.data || []).length;
      const previousMemberCount = (previousMembers.data || []).length;
      const memberChange = currentMemberCount - previousMemberCount;

      // Calculate attendance
      const currentAttended = (currentBookings.data || []).filter(
        b => b.status === "checked_in" || b.status === "completed"
      ).length;
      const currentTotal = (currentBookings.data || []).length;
      const currentAttendanceRate = currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0;

      const previousAttended = (previousBookings.data || []).filter(
        b => b.status === "checked_in" || b.status === "completed"
      ).length;
      const previousTotal = (previousBookings.data || []).length;
      const previousAttendanceRate = previousTotal > 0 ? (previousAttended / previousTotal) * 100 : 0;
      const attendanceChange = currentAttendanceRate - previousAttendanceRate;

      // Get currency from settings
      const { data: settings } = await supabase
        .from("gym_settings")
        .select("currency")
        .eq("tenant_id", tenantId)
        .single();

      const currency = settings?.currency || "AED";
      const currencySymbol = currency === "AED" ? "AED" : currency === "SAR" ? "SAR" : "$";

      // Calculate average trainer rating as proxy for member satisfaction
      const { data: trainers } = await supabase
        .from("trainers")
        .select("rating")
        .eq("tenant_id", tenantId)
        .not("rating", "is", null);

      const avgRating = trainers && trainers.length > 0
        ? trainers.reduce((sum, t) => sum + Number(t.rating || 0), 0) / trainers.length
        : 0;

      const satisfactionValue = avgRating > 0 ? `${avgRating.toFixed(1)}/5` : "N/A";
      const satisfactionChange = avgRating > 0 ? "Based on trainer ratings" : "No rating data";

      setPrimaryStats([
        {
          name: "Total Revenue",
          value: `${currencySymbol} ${currentRevenue.toLocaleString()}`,
          change: revenueChange >= 0
            ? `+${currencySymbol} ${Math.abs(currentRevenue - previousRevenue).toLocaleString()} vs last month`
            : `-${currencySymbol} ${Math.abs(currentRevenue - previousRevenue).toLocaleString()} vs last month`,
          icon: <FiDollarSign className="w-6 h-6" />,
          color: "green" as const,
          target: `${currencySymbol} ${(currentRevenue * 1.1).toLocaleString()}`,
          progress: currentRevenue > 0 ? Math.min(100, (currentRevenue / (currentRevenue * 1.1)) * 100) : 0,
        },
        {
          name: "Active Members",
          value: currentMemberCount.toLocaleString(),
          change: memberChange >= 0
            ? `+${memberChange} vs last month`
            : `${memberChange} vs last month`,
          icon: <FiUsers className="w-6 h-6" />,
          color: "blue" as const,
          target: (currentMemberCount * 1.05).toLocaleString(),
          progress: currentMemberCount > 0 ? Math.min(100, (currentMemberCount / (currentMemberCount * 1.05)) * 100) : 0,
        },
        {
          name: "Class Attendance",
          value: `${currentAttendanceRate.toFixed(1)}%`,
          change: attendanceChange >= 0
            ? `+${attendanceChange.toFixed(1)}% vs last month`
            : `${attendanceChange.toFixed(1)}% vs last month`,
          icon: <FiCalendar className="w-6 h-6" />,
          color: "purple" as const,
          target: "85%",
          progress: Math.min(100, (currentAttendanceRate / 85) * 100),
        },
        {
          name: "Member Satisfaction",
          value: satisfactionValue,
          change: satisfactionChange,
          icon: <FiStar className="w-6 h-6" />,
          color: "yellow" as const,
          target: "4.8",
          progress: avgRating > 0 ? Math.min(100, (avgRating / 4.8) * 100) : 0,
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Primary Stats - Enhanced 2x2 Grid with Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {primaryStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-600">Target</div>
                  <div className="text-sm font-semibold text-gray-900">{stat.target}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.name}</div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">{Math.round(stat.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-${stat.color}-500 transition-all duration-300`}
                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{stat.change}</span>
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium">Live</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content - Enhanced Single Column Layout */}
      <div className="space-y-8">
        <SmartDashboardOverview refreshKey={refreshKey} />
        <BusinessOverview />
        <LiveKPITracker />
        <MemberEngagement />
      </div>
    </div>
  );
}; 