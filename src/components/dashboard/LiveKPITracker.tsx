import React, { useState, useEffect, useCallback } from "react";
import {
  FiUsers,
  FiActivity,
  FiArrowUpRight,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

interface LiveKPITrackerProps {
  refreshKey?: number;
}

export const LiveKPITracker: React.FC<LiveKPITrackerProps> = ({ refreshKey }) => {
  interface LiveMetric {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: "green" | "blue";
    change: number;
    status: "active" | "stable";
  }

  const { tenantId } = useAuth();
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([
    {
      title: "Members in Gym",
      value: "0",
      icon: <FiUsers className="h-5 w-5" />,
      color: "green",
      change: 0,
      status: "active",
    },
    {
      title: "Classes Running",
      value: "0",
      icon: <FiActivity className="h-5 w-5" />,
      color: "blue",
      change: 0,
      status: "stable",
    },
  ]);
  const [, setLoading] = useState(true);

  const fetchLiveData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayEnd);
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      const formatDateTime = (date: Date) => date.toISOString();

      // Fetch members currently in gym (checked in today and not checked out)
      const { data: todayCheckIns } = await supabase
        .from("class_bookings")
        .select("id, member_id, check_in_time, check_out_time, status")
        .eq("tenant_id", tenantId)
        .gte("check_in_time", formatDateTime(todayStart))
        .lte("check_in_time", formatDateTime(todayEnd))
        .in("status", ["checked_in", "completed"]);

      // Count unique members who checked in today and haven't checked out
      const membersInGym = new Set(
        (todayCheckIns || [])
          .filter(booking => !booking.check_out_time || booking.status === "checked_in")
          .map(booking => booking.member_id)
      ).size;

      // Get yesterday's count for comparison
      const { data: yesterdayCheckIns } = await supabase
        .from("class_bookings")
        .select("id, member_id, check_in_time, check_out_time, status")
        .eq("tenant_id", tenantId)
        .gte("check_in_time", formatDateTime(yesterdayStart))
        .lte("check_in_time", formatDateTime(yesterdayEnd))
        .in("status", ["checked_in", "completed"]);

      const yesterdayMembersInGym = new Set(
        (yesterdayCheckIns || [])
          .filter(booking => !booking.check_out_time || booking.status === "checked_in")
          .map(booking => booking.member_id)
      ).size;

      const membersChange = membersInGym - yesterdayMembersInGym;

      // Fetch classes currently running (in_progress status)
      const { data: runningClasses } = await supabase
        .from("classes")
        .select("id, status, start_time, end_time")
        .eq("tenant_id", tenantId)
        .eq("status", "in_progress")
        .gte("start_time", formatDateTime(todayStart))
        .lte("end_time", formatDateTime(todayEnd));

      // Get yesterday's running classes count
      const { data: yesterdayRunningClasses } = await supabase
        .from("classes")
        .select("id, status")
        .eq("tenant_id", tenantId)
        .eq("status", "in_progress")
        .gte("start_time", formatDateTime(yesterdayStart))
        .lte("end_time", formatDateTime(yesterdayEnd));

      const runningClassesCount = (runningClasses || []).length;
      const yesterdayRunningCount = (yesterdayRunningClasses || []).length;
      const classesChange = runningClassesCount - yesterdayRunningCount;

      setLiveMetrics([
        {
          title: "Members in Gym",
          value: membersInGym.toString(),
          icon: <FiUsers className="h-5 w-5" />,
          color: "green",
          change: membersChange,
          status: membersInGym > 0 ? "active" : "stable",
        },
        {
          title: "Classes Running",
          value: runningClassesCount.toString(),
          icon: <FiActivity className="h-5 w-5" />,
          color: "blue",
          change: classesChange,
          status: runningClassesCount > 0 ? "active" : "stable",
        },
      ]);
    } catch (error) {
      console.error("Error fetching live activity data:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchLiveData();
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveData, refreshKey]);

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-50 rounded-xl">
            <FiActivity className="text-green-600 text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              Live Activity
            </h2>
            <p className="text-sm text-gray-600">Real-time gym status</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-${metric.color}-50 text-${metric.color}-600`}>
                {metric.icon}
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <FiArrowUpRight className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">
                  {metric.change > 0 ? "+" : ""}{metric.change}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
            <div className="text-sm text-gray-600">{metric.title}</div>
            <div className="flex items-center space-x-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${
                metric.status === "active" ? "bg-green-500" : "bg-blue-500"
              }`}></div>
              <span className="text-xs text-gray-500 capitalize">{metric.status}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
