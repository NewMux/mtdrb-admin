import React from "react";
import {
  FiCalendar,
  FiUsers,
  FiTrendingUp,
  FiTarget,
  FiDollarSign,
  FiActivity,
  FiClock,
  FiStar,
} from "react-icons/fi";

interface SmartWidgetsProps {
  refreshKey: number;
}

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
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
  const todaySchedule = [
    { time: "06:00", class: "Morning Yoga", trainer: "Sarah", spots: "8/12" },
    { time: "07:30", class: "HIIT Training", trainer: "Mike", spots: "12/15" },
    { time: "09:00", class: "Pilates", trainer: "Emma", spots: "6/10" },
    { time: "18:00", class: "Evening Yoga", trainer: "Sarah", spots: "10/12" },
    { time: "19:30", class: "CrossFit", trainer: "David", spots: "15/20" },
  ];

  const recentMembers = [
    {
      name: "Mohammed Ali",
      joined: "Today",
      plan: "Premium",
      status: "active",
    },
    {
      name: "Sarah Johnson",
      joined: "Yesterday",
      plan: "Basic",
      status: "trial",
    },
    {
      name: "David Chen",
      joined: "2 days ago",
      plan: "Premium",
      status: "active",
    },
    {
      name: "Emma Wilson",
      joined: "3 days ago",
      plan: "Basic",
      status: "active",
    },
  ];

  const topPerformers = [
    { name: "Sarah (Trainer)", metric: "98% attendance", score: 98 },
    { name: "HIIT Class", metric: "45 avg/session", score: 95 },
    { name: "Premium Plan", metric: "₹24.5k revenue", score: 92 },
    { name: "Morning Slot", metric: "89% occupancy", score: 89 },
  ];

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
              value: "89",
              icon: FiActivity,
              color: "text-green-600",
            },
            {
              label: "Active Classes",
              value: "6",
              icon: FiCalendar,
              color: "text-blue-600",
            },
            {
              label: "Revenue Today",
              value: "₹4.2k",
              icon: FiDollarSign,
              color: "text-purple-600",
            },
            {
              label: "Peak Hour",
              value: "6-7PM",
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
