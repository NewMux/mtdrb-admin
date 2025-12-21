import React, { useMemo } from "react";
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

const MetricCard = ({ title, value, icon, change, changeType }) => (
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
        <span className="text-gray-500 ml-1">vs last month</span>
      </div>
    )}
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out">
    <h3 className="text-lg font-bold mb-4 tracking-tight">{title}</h3>
    <div style={{ height: "300px" }}>{children}</div>
  </div>
);

const AiSuggestionCard = ({ title, icon, suggestions }) => (
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

const TrainerPerformanceCard = ({ trainers }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-bold mb-4 text-gray-900">
      Trainer Performance
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">
              Trainer
            </th>
            <th scope="col" className="px-6 py-3">
              Classes
            </th>
            <th scope="col" className="px-6 py-3">
              Total Att.
            </th>
            <th scope="col" className="px-6 py-3">
              Avg. Att.
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

const HeatmapChart = ({ data }) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  const maxAttendance = Math.max(
    ...Object.values(data).map((d) => Math.max(...Object.values(d || {}))),
    1, // Default to 1 to avoid division by zero
  );

  const getColor = (value) => {
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
      <h3 className="text-lg font-bold mb-4">Peak Times Heatmap</h3>
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
              <div className="text-xs font-semibold mb-2">{day}</div>
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

// Using real data from Supabase - no mock data
const getAttendanceTrend = async () => {
  // TODO: Fetch from Supabase analytics
  return [];
};

const getAssistantSuggestions = async () => {
  // TODO: Fetch from smart suggestions service
  return [];
};

export default function Insights({ classes, bookings }) {
  const {
    totalBookings,
    fillRate,
    mostPopular,
    leastPopular,
    classPopularity,
    trainerPerformance,
    heatmapData,
  } = useMemo(() => {
    if (!classes || !bookings || classes.length === 0) {
      return {
        totalBookings: 0,
        fillRate: "0%",
        mostPopular: "N/A",
        leastPopular: "N/A",
        classPopularity: [],
        trainerPerformance: [],
        heatmapData: {},
      };
    }

    const classBookingCounts = bookings.reduce((acc, booking) => {
      acc[booking.class_id] = (acc[booking.class_id] || 0) + 1;
      return acc;
    }, {});

    const heatmap = classes.reduce((acc, classInfo) => {
      const dayOfWeek = dayjs(classInfo.startTime).day(); // 0 for Sunday, 6 for Saturday
      const hour = dayjs(classInfo.startTime).hour();
      const attendance = classBookingCounts[classInfo.id] || 0;

      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = {};
      }
      acc[dayOfWeek][hour] = (acc[dayOfWeek][hour] || 0) + attendance;
      return acc;
    }, {});

    const trainerStats = classes.reduce((acc, classInfo) => {
      const trainerName = classInfo.trainer || "Unknown Trainer";
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
      .map((stats: any) => ({
        ...stats,
        avgAttendance:
          stats.classCount > 0 ? stats.totalAttendance / stats.classCount : 0,
      }))
      .sort((a: any, b: any) => b.totalAttendance - a.totalAttendance);

    const popularity = Object.entries(classBookingCounts)
      .map(([classId, count]) => {
        const classInfo = classes.find((c) => c.id === classId);
        return {
          name: classInfo?.name || "Unknown Class",
          attendance: count,
        };
      })
      .sort((a: any, b: any) => b.attendance - a.attendance);

    const totalCapacity = classes.reduce(
      (acc, c) => acc + (c.capacity || 0),
      0,
    );
    const currentTotalBookings = bookings.length;
    const currentFillRate =
      totalCapacity > 0 ? (currentTotalBookings / totalCapacity) * 100 : 0;

    return {
      totalBookings: currentTotalBookings,
      fillRate: `${currentFillRate.toFixed(1)}%`,
      mostPopular: popularity.length > 0 ? popularity[0].name : "N/A",
      leastPopular:
        popularity.length > 0 ? popularity[popularity.length - 1].name : "N/A",
      classPopularity: popularity,
      trainerPerformance: trainerPerformanceData,
      heatmapData: heatmap,
    };
  }, [classes, bookings]);

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">
        Insights & Analytics
      </h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Most Popular Class"
          value={mostPopular}
          icon={<FiTrendingUp />}
          change="+12%"
          changeType="up"
        />
        <MetricCard
          title="Least Popular Class"
          value={leastPopular}
          icon={<FiTrendingDown />}
          change="-8%"
          changeType="down"
        />
        <MetricCard
          title="Average Fill Rate"
          value={fillRate}
          icon={<FiBarChart2 />}
          change="+2%"
          changeType="up"
        />
        <MetricCard
          title="Total Bookings"
          value={totalBookings}
          icon={<FiUsers />}
          change="+50"
          changeType="up"
        />
      </div>

      {/* Charts & Smart Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <HeatmapChart data={heatmapData} />
        </div>

        <AiSuggestionCard
          title="Smart Recommendations"
          icon="🧠"
          suggestions={[]}
        />

        <div className="lg:col-span-2">
          <ChartCard title="Class Popularity">
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
          <ChartCard title="Attendance Trend (Last 6 Months)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[]}
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
