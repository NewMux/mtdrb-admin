import React, { useEffect, useMemo, useState } from "react";
import {
  FiUsers,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabaseClient";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: "up" | "down";
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

interface AiSuggestion {
  type: "good" | "warning";
  text: string;
}

interface AiSuggestionCardProps {
  title: string;
  icon: React.ReactNode;
  suggestions: AiSuggestion[];
}

interface TrainerPerformanceEntry {
  name: string;
  classCount: number;
  totalAttendance: number;
  avgAttendance: number;
}

interface TrainerPerformanceCardProps {
  trainers: TrainerPerformanceEntry[];
}

type HeatmapData = Record<number, Record<number, number>>;

interface InsightClass {
  id: string;
  name?: string;
  trainer?: string;
  start_time?: string | null;
  trainer_id?: string | null;
  capacity?: number | null;
}

interface InsightBooking {
  class_id?: string | null;
  created_at?: string | null;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  change,
  changeType,
}) => {
  const { t } = useTranslation();
  return (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-gray-500 font-semibold">{title}</h3>
        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">{icon}</div>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
    {change && (
      <div
        className={`mt-4 flex items-center text-sm ${changeType === "up" ? "text-green-600" : "text-red-600"}`}
      >
        {changeType === "up" ? (
          <FiTrendingUp className="mr-1" />
        ) : (
          <FiTrendingDown className="mr-1" />
        )}
        <span>{change}</span>
        <span className="text-gray-500 ml-1">{t("insightsPage.vsLastMonth")}</span>
      </div>
    )}
  </div>
  );
};

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out">
    <h3 className="text-lg font-bold mb-4 tracking-tight">{title}</h3>
    <div style={{ height: "300px" }}>{children}</div>
  </div>
);

const AiSuggestionCard: React.FC<AiSuggestionCardProps> = ({
  title,
  icon,
  suggestions,
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out">
    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
      {icon} {title}
    </h3>
    <ul className="space-y-3">
      {suggestions.map((s, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <div className="pt-1">
            {s.type === "good" ? (
              <FiCheckCircle className="text-emerald-500" />
            ) : (
              <FiAlertTriangle className="text-orange-500" />
            )}
          </div>
          <span>{s.text}</span>
        </li>
      ))}
    </ul>
  </div>
);

const TrainerPerformanceCard: React.FC<TrainerPerformanceCardProps> = ({
  trainers,
}) => {
  const { t } = useTranslation();
  return (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-bold mb-4 text-gray-900">
      {t("insightsPage.trainerPerformance")}
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">
              {t("insightsPage.trainer")}
            </th>
            <th scope="col" className="px-6 py-3">
              {t("insightsPage.classes")}
            </th>
            <th scope="col" className="px-6 py-3">
              {t("insightsPage.totalAttendance")}
            </th>
            <th scope="col" className="px-6 py-3">
              {t("insightsPage.averageAttendance")}
            </th>
          </tr>
        </thead>
        <tbody>
          {trainers.map((trainer, index) => (
            <tr
              key={index}
              className="bg-white border-b border-gray-200 hover:bg-gray-50"
            >
              <th
                scope="row"
                className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
              >
                {trainer.name}
              </th>
              <td className="px-6 py-4 text-gray-700">
                {trainer.classCount}
              </td>
              <td className="px-6 py-4 text-gray-700">
                {trainer.totalAttendance}
              </td>
              <td className="px-6 py-4 text-gray-700">
                {trainer.avgAttendance.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  );
};

const HeatmapChart: React.FC<{ data: HeatmapData }> = ({ data }) => {
  const { t } = useTranslation();
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  const maxAttendance = Math.max(
    ...Object.values(data).map((d) => Math.max(...Object.values(d || {}))),
    1, // Default to 1 to avoid division by zero
  );

  const getColor = (value: number) => {
    if (!value) return "bg-gray-100";
    const intensity = value / maxAttendance;
    if (intensity > 0.8) return "bg-blue-600";
    if (intensity > 0.6) return "bg-blue-500";
    if (intensity > 0.4) return "bg-blue-400";
    if (intensity > 0.2) return "bg-blue-300";
    return "bg-blue-200";
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold mb-4">{t("insightsPage.peakTimes")}</h3>
      <div className="flex gap-4">
        <div className="flex flex-col text-xs text-gray-500">
          {hours.map((hour) => (
            <div key={hour} className="h-8 flex items-center">
              {dayjs().hour(hour).format("ha")}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-1">
          {days.map((day, dayIndex) => (
            <div key={day} className="flex flex-col items-center">
              <div className="text-xs font-semibold mb-2">{t(`insightsPage.days.${day}`)}</div>
              <div className="flex flex-col gap-1">
                {hours.map((hour) => {
                  const value = data[dayIndex]?.[hour] || 0;
                  return (
                    <div
                      key={hour}
                      className={`w-10 h-8 rounded ${getColor(value)}`}
                    >
                      <div className="text-white text-xs text-center leading-8">
                        {value > 0 ? value : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Insights() {
  const { t, i18n } = useTranslation();
  const { tenantId } = useAuth();
  const [classes, setClasses] = useState<InsightClass[]>([]);
  const [bookings, setBookings] = useState<InsightBooking[]>([]);
  const [prevPeriodBookingCount, setPrevPeriodBookingCount] = useState(0);
  const [prevPeriodFillRate, setPrevPeriodFillRate] = useState(0);

  useEffect(() => {
    if (!tenantId) return;
    const now = dayjs();
    const periodStart = now.subtract(30, "day");
    const prevPeriodStart = now.subtract(60, "day");

    const loadData = async () => {
      const { data: classRows } = await supabase
        .from("classes")
        .select("id, name, trainer_id, start_time, capacity, trainers(first_name, last_name)")
        .eq("tenant_id", tenantId);

      const mappedClasses: InsightClass[] = (classRows || []).map((c) => {
        const trainerInfo = Array.isArray(c.trainers) ? c.trainers[0] : c.trainers;
        return {
          id: c.id,
          name: c.name,
          trainer: trainerInfo
            ? `${trainerInfo.first_name || ""} ${trainerInfo.last_name || ""}`.trim()
            : undefined,
          start_time: c.start_time,
          trainer_id: c.trainer_id,
          capacity: c.capacity,
        };
      });
      setClasses(mappedClasses);

      const { data: bookingRows } = await supabase
        .from("class_bookings")
        .select("class_id, created_at")
        .eq("tenant_id", tenantId)
        .eq("status", "booked")
        .gte("created_at", prevPeriodStart.toISOString());

      const currentPeriod = (bookingRows || []).filter(
        (b) => b.created_at && dayjs(b.created_at).isAfter(periodStart),
      );
      const previousPeriod = (bookingRows || []).filter(
        (b) =>
          b.created_at &&
          dayjs(b.created_at).isAfter(prevPeriodStart) &&
          dayjs(b.created_at).isBefore(periodStart),
      );

      setBookings(currentPeriod);
      setPrevPeriodBookingCount(previousPeriod.length);

      const totalCapacity = mappedClasses.reduce((acc, c) => acc + (c.capacity || 0), 0);
      setPrevPeriodFillRate(
        totalCapacity > 0 ? (previousPeriod.length / totalCapacity) * 100 : 0,
      );
    };

    loadData();
  }, [tenantId]);

  const {
    totalBookings,
    fillRate,
    fillRateValue,
    mostPopular,
    leastPopular,
    classPopularity,
    trainerPerformance,
    heatmapData,
    attendanceTrend,
    aiSuggestions,
  } = useMemo(() => {
    if (!classes || !bookings || classes.length === 0) {
      return {
        totalBookings: 0,
        fillRate: "0%",
        fillRateValue: 0,
        mostPopular: t("insightsPage.notAvailable"),
        leastPopular: t("insightsPage.notAvailable"),
        classPopularity: [],
        trainerPerformance: [],
        heatmapData: {},
        attendanceTrend: [],
        aiSuggestions: [],
      };
    }

    const classBookingCounts = bookings.reduce<Record<string, number>>(
      (acc, booking) => {
        if (!booking.class_id) return acc;
        acc[booking.class_id] = (acc[booking.class_id] || 0) + 1;
        return acc;
      },
      {},
    );

    const heatmap = classes.reduce<HeatmapData>((acc, classInfo) => {
      const startTime = classInfo.start_time;
      if (!startTime) return acc;
      const dayOfWeek = dayjs(startTime).day(); // 0 for Sunday, 6 for Saturday
      const hour = dayjs(startTime).hour();
      const attendance = classBookingCounts[classInfo.id] || 0;

      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = {};
      }
      acc[dayOfWeek][hour] = (acc[dayOfWeek][hour] || 0) + attendance;
      return acc;
    }, {});

    const trainerStats = classes.reduce<
      Record<string, { name: string; classCount: number; totalAttendance: number }>
    >((acc, classInfo) => {
      const trainerName = classInfo.trainer || t("insightsPage.unknownTrainer");
      if (!acc[trainerName]) {
        acc[trainerName] = {
          name: trainerName,
          classCount: 0,
          totalAttendance: 0,
        };
      }
      const attendance = classBookingCounts[classInfo.id] || 0;
      acc[trainerName].classCount += 1;
      acc[trainerName].totalAttendance += attendance;
      return acc;
    }, {});

    const trainerPerformanceData = Object.values(trainerStats)
      .map((stats) => ({
        ...stats,
        avgAttendance:
          stats.classCount > 0 ? stats.totalAttendance / stats.classCount : 0,
      }))
      .sort((a, b) => b.totalAttendance - a.totalAttendance);

    const popularity = Object.entries(classBookingCounts)
      .map(([classId, count]) => {
        const classInfo = classes.find((c) => c.id === classId);
        return {
          name: classInfo?.name || t("insightsPage.unknownClass"),
          attendance: count,
        };
      })
      .sort((a, b) => b.attendance - a.attendance);

    const totalCapacity = classes.reduce(
      (acc, c) => acc + (c.capacity || 0),
      0,
    );
    const currentTotalBookings = bookings.length;
    const currentFillRate =
      totalCapacity > 0 ? (currentTotalBookings / totalCapacity) * 100 : 0;

    const trendByDay = bookings.reduce<Record<string, number>>((acc, b) => {
      if (!b.created_at) return acc;
      const day = dayjs(b.created_at).format("MMM D");
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    const attendanceTrendData = Object.entries(trendByDay)
      .map(([name, attendance]) => ({
        name,
        attendance,
        sortKey: dayjs(name, "MMM D").valueOf(),
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ name, attendance }) => ({ name, attendance }));

    const suggestions: AiSuggestion[] = [];
    const nearCapacity = classes.find((c) => {
      const attendance = classBookingCounts[c.id] || 0;
      return (c.capacity || 0) > 0 && attendance / (c.capacity || 1) > 0.9;
    });
    if (nearCapacity) {
      suggestions.push({
        type: "good",
        text: t("insightsPage.suggestionNearCapacity", {
          name: nearCapacity.name || t("insightsPage.unknownClass"),
        }),
      });
    }
    if (popularity.length > 0) {
      const lowest = popularity[popularity.length - 1];
      if (lowest.attendance === 0 || lowest.attendance < currentTotalBookings / Math.max(popularity.length, 1) / 2) {
        suggestions.push({
          type: "warning",
          text: t("insightsPage.suggestionLowAttendance", { name: lowest.name }),
        });
      }
    }
    if (currentFillRate > 0 && currentFillRate < 40) {
      suggestions.push({
        type: "warning",
        text: t("insightsPage.suggestionLowFillRate"),
      });
    }

    return {
      totalBookings: currentTotalBookings,
      fillRate: `${currentFillRate.toFixed(1)}%`,
      fillRateValue: currentFillRate,
      mostPopular: popularity.length > 0 ? popularity[0].name : t("insightsPage.notAvailable"),
      leastPopular:
        popularity.length > 0 ? popularity[popularity.length - 1].name : t("insightsPage.notAvailable"),
      classPopularity: popularity,
      trainerPerformance: trainerPerformanceData,
      heatmapData: heatmap,
      attendanceTrend: attendanceTrendData,
      aiSuggestions: suggestions,
    };
  }, [classes, bookings, t]);

  const bookingsChange =
    prevPeriodBookingCount > 0
      ? ((totalBookings - prevPeriodBookingCount) / prevPeriodBookingCount) * 100
      : null;
  const fillRateChange =
    prevPeriodFillRate > 0 ? fillRateValue - prevPeriodFillRate : null;

  return (
    <div className="p-8 bg-gray-50" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">
        {t("insightsPage.title")}
      </h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t("insightsPage.mostPopular")}
          value={mostPopular}
          icon={<FiTrendingUp />}
        />
        <MetricCard
          title={t("insightsPage.leastPopular")}
          value={leastPopular}
          icon={<FiTrendingDown />}
        />
        <MetricCard
          title={t("insightsPage.averageFill")}
          value={fillRate}
          icon={<FiBarChart2 />}
          change={fillRateChange !== null ? `${fillRateChange >= 0 ? "+" : ""}${fillRateChange.toFixed(1)}pt` : undefined}
          changeType={fillRateChange !== null && fillRateChange >= 0 ? "up" : "down"}
        />
        <MetricCard
          title={t("insightsPage.totalBookings")}
          value={totalBookings}
          icon={<FiUsers />}
          change={bookingsChange !== null ? `${bookingsChange >= 0 ? "+" : ""}${bookingsChange.toFixed(0)}%` : undefined}
          changeType={bookingsChange !== null && bookingsChange >= 0 ? "up" : "down"}
        />
      </div>

      {/* Charts & Smart Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <HeatmapChart data={heatmapData} />
        </div>

        <AiSuggestionCard
          title={t("insightsPage.recommendations")}
          icon="🧠"
          suggestions={aiSuggestions}
        />

        <div className="lg:col-span-2">
          <ChartCard title={t("insightsPage.classPopularity")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classPopularity}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendance" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <TrainerPerformanceCard trainers={trainerPerformance} />

        <div className="lg:col-span-3">
          <ChartCard title={t("insightsPage.attendanceTrend")}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attendanceTrend}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#2563eb"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
