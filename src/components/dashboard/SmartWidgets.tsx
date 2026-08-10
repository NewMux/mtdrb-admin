import React, { useState, useEffect, useCallback } from "react";
import {
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiClock,
  FiStar,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

interface SmartWidgetsProps {
  refreshKey: number;
}

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

interface TrainerPerformance {
  name: string;
  count: number;
}

interface BookingItem {
  id?: string;
  status?: string;
  created_at?: string;
  classes?: {
    trainer_id?: string;
    trainers?: {
      first_name?: string;
      last_name?: string;
    } | Array<{
      first_name?: string;
      last_name?: string;
    }>;
  } | Array<{
    trainer_id?: string;
    trainers?: Array<{
      first_name?: string;
      last_name?: string;
    }>;
  }>;
}

interface ScheduleItem {
  time: string;
  class: string;
  trainer: string;
  spots: string;
}

interface RecentMemberItem {
  name: string;
  joined: string;
  plan: string;
  status: string;
}

interface PerformerItem {
  name: string;
  metric: string;
  score: number;
}

const Widget: React.FC<WidgetProps> = ({ title, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out ${className}`}
  >
    <h3 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">
      {title}
    </h3>
    {children}
  </div>
);

export default Widget;

export const SmartWidgets: React.FC<SmartWidgetsProps> = ({ refreshKey }) => {
  const { tenantId } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [recentMembers, setRecentMembers] = useState<RecentMemberItem[]>([]);
  const [topPerformers, setTopPerformers] = useState<PerformerItem[]>([]);
  const [quickStats, setQuickStats] = useState({
    checkIns: 0,
    activeClasses: 0,
    revenueToday: 0,
    peakHour: "N/A",
  });
  const [, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      const formatDateTime = (date: Date) => date.toISOString();

      // Fetch today's classes
      const { data: todayClasses } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          start_time,
          capacity,
          current_bookings,
          trainers!inner(first_name, last_name)
        `)
        .eq("tenant_id", tenantId)
        .gte("start_time", formatDateTime(todayStart))
        .lte("start_time", formatDateTime(todayEnd))
        .in("status", ["scheduled", "in_progress"])
        .order("start_time", { ascending: true })
        .limit(5);

      // Format schedule
      const schedule = (todayClasses || []).map(cls => {
        const startTime = new Date(cls.start_time);
        const trainer = Array.isArray(cls.trainers)
          ? cls.trainers[0]
          : cls.trainers;
        const trainerName = trainer
          ? `${trainer.first_name ?? ""} ${trainer.last_name ?? ""}`.trim()
          : "TBA";
        return {
          time: startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          class: cls.name,
          trainer: trainerName,
          spots: `${cls.current_bookings || 0}/${cls.capacity}`,
        };
      });
      setTodaySchedule(schedule);

      // Fetch recent members
      const { data: members } = await supabase
        .from("members")
        .select("id, first_name, last_name, membership_type, membership_status, created_at, join_date")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(4);

      const formattedMembers = (members || []).map(m => {
        const joinDate = new Date(m.join_date || m.created_at);
        const daysAgo = Math.floor((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        let joinedText = "Today";
        if (daysAgo === 1) joinedText = "Yesterday";
        else if (daysAgo > 1) joinedText = `${daysAgo} days ago`;

        return {
          name: `${m.first_name} ${m.last_name}`,
          joined: joinedText,
          plan: m.membership_type || "Basic",
          status: m.membership_status || "active",
        };
      });
      setRecentMembers(formattedMembers);

      // Fetch top performers (trainers with most bookings)
      const { data: trainerBookings } = await supabase
        .from("class_bookings")
        .select(`
          classes!inner(
            trainer_id,
            trainers!inner(first_name, last_name)
          )
        `)
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)));

      const trainerMap = new Map<string, TrainerPerformance>();
      (trainerBookings || []).forEach((booking: unknown) => {
        const bookingData = booking as { 
          classes?: Array<{ 
            trainer_id?: string; 
            trainers?: Array<{ first_name?: string; last_name?: string }> 
          }> | { 
            trainer_id?: string; 
            trainers?: Array<{ first_name?: string; last_name?: string }> 
          } 
        };
        const classes = Array.isArray(bookingData.classes) ? bookingData.classes[0] : bookingData.classes;
        const trainer = Array.isArray(classes?.trainers) ? classes.trainers[0] : classes?.trainers;
        if (trainer && classes?.trainer_id) {
          const trainerId = classes.trainer_id;
          const trainerName = `${trainer.first_name || ''} ${trainer.last_name || ''}`.trim();
          trainerMap.set(trainerId, {
            name: trainerName,
            count: (trainerMap.get(trainerId)?.count || 0) + 1,
          });
        }
      });

      const topTrainers = Array.from(trainerMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 2)
        .map((t) => ({
          name: `${t.name} (Trainer)`,
          metric: `${t.count} bookings`,
          score: Math.min(100, (t.count / 50) * 100),
        }));

      // Fetch class performance
      const { data: classStats } = await supabase
        .from("classes")
        .select("name, current_bookings, capacity")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)));

      const classPerformance = (classStats || [])
        .map(cls => ({
          name: cls.name,
          occupancy: cls.capacity > 0 ? (cls.current_bookings / cls.capacity) * 100 : 0,
        }))
        .sort((a, b) => b.occupancy - a.occupancy)
        .slice(0, 1)
        .map(cls => ({
          name: cls.name,
          metric: `${cls.occupancy.toFixed(0)}% occupancy`,
          score: Math.min(100, cls.occupancy),
        }));

      setTopPerformers([...topTrainers, ...classPerformance].slice(0, 4));

      // Fetch quick stats
      const { data: todayBookings } = await supabase
        .from("class_bookings")
        .select("id, status, created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", formatDateTime(todayStart))
        .lte("created_at", formatDateTime(todayEnd));

      const checkIns = (todayBookings || []).filter(
        b => b.status === "checked_in" || b.status === "completed"
      ).length;

      const activeClassesCount = (todayClasses || []).length;

      const { data: todayInvoices } = await supabase
        .from("invoices")
        .select("amount, total, status")
        .eq("tenant_id", tenantId)
        .eq("status", "paid")
        .gte("created_at", formatDateTime(todayStart))
        .lte("created_at", formatDateTime(todayEnd));

      const revenueToday = (todayInvoices || []).reduce(
        (sum, inv) => sum + Number(inv.total || inv.amount || 0),
        0
      );

      // Find peak hour
      const hourMap = new Map<number, number>();
      (todayBookings || []).forEach((booking: BookingItem) => {
        if (booking.created_at) {
          const hour = new Date(booking.created_at).getHours();
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        }
      });
      const peakHour = Array.from(hourMap.entries())
        .sort((a, b) => b[1] - a[1])[0];
      const peakHourText = peakHour ? `${peakHour[0]}:00-${peakHour[0] + 1}:00` : "N/A";

      setQuickStats({
        checkIns,
        activeClasses: activeClassesCount,
        revenueToday,
        peakHour: peakHourText,
      });
    } catch (error) {
      console.error("Error fetching widget data:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Today's Schedule - horizontal scroll */}
      <Widget
        title="Today's Schedule"
        className="overflow-x-auto whitespace-nowrap"
      >
        <div className="flex space-x-4 pb-2">
          {todaySchedule.map((session, idx) => (
            <div
              key={idx}
              className="min-w-[180px] bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 flex flex-col items-center"
            >
              <span className="text-xs font-mono text-gray-500 mb-1">
                {session.time}
              </span>
              <span className="font-semibold text-gray-900 mb-1">
                {session.class}
              </span>
              <span className="text-xs text-gray-600 mb-1">
                {session.trainer}
              </span>
              <span className="text-xs text-blue-600 font-medium">
                {session.spots}
              </span>
            </div>
          ))}
        </div>
      </Widget>

      {/* Recent Members - compact grid */}
      <Widget title="Recent Members">
        <div className="grid grid-cols-2 gap-4">
          {recentMembers.map((member, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-3"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FiUsers className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 leading-tight">
                  {member.name}
                </p>
                <p className="text-xs text-gray-500">
                  {member.joined} • {member.plan}
                </p>
              </div>
              <span
                className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${member.status === "active" ? "bg-green-100 text-green-800" : member.status === "trial" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
              >
                {member.status}
              </span>
            </div>
          ))}
        </div>
      </Widget>

      {/* Top Performers - compact grid */}
      <Widget title="Top Performers">
        <div className="grid grid-cols-2 gap-4">
          {topPerformers.map((performer, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center bg-gray-50 rounded-2xl p-3"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mb-1">
                <FiStar className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="font-medium text-gray-900 text-center leading-tight">
                {performer.name}
              </p>
              <p className="text-xs text-gray-500 text-center">
                {performer.metric}
              </p>
              <div className="w-full mt-2">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                    style={{ width: `${performer.score}%` }}
                  ></div>
                </div>
                <span className="block text-xs text-gray-700 text-center mt-1">
                  {performer.score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Widget>

      {/* Quick Stats - single wide card */}
      <Widget title="Quick Stats">
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Today's Check-ins",
              value: quickStats.checkIns.toString(),
              icon: FiActivity,
              color: "text-green-600",
            },
            {
              label: "Active Classes",
              value: quickStats.activeClasses.toString(),
              icon: FiCalendar,
              color: "text-blue-600",
            },
            {
              label: "Revenue Today",
              value: `AED ${(quickStats.revenueToday / 1000).toFixed(1)}k`,
              icon: FiDollarSign,
              color: "text-purple-600",
            },
            {
              label: "Peak Hour",
              value: quickStats.peakHour,
              icon: FiClock,
              color: "text-orange-600",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center bg-white rounded-xl p-3 shadow-sm"
            >
              <stat.icon className={`h-6 w-6 mb-2 ${stat.color}`} />
              <span className="text-xl font-bold text-gray-900">
                {stat.value}
              </span>
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </Widget>
    </div>
  );
};
