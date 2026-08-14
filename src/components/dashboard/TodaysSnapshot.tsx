import React from "react";
import {
  FiCalendar,
  FiClock,
  FiUserCheck,
  FiCheckCircle,
  FiZap,
} from "react-icons/fi";
import SmartKpiCard, { type SmartKpiCardProps } from "../ui/SmartKpiCard";

const snapshots: SmartKpiCardProps[] = [
  {
    label: "Upcoming Classes",
    value: 8,
    icon: <FiCalendar className="h-6 w-6 text-blue-600" />,
    color: "blue",
    trend: "up",
    trendValue: "2",
    tooltip: "Number of classes scheduled for today.",
    context: "+33% vs. yesterday",
  },
  {
    label: "Trainer Shifts",
    value: "6 Active",
    icon: <FiClock className="h-6 w-6 text-green-600" />,
    color: "green",
    trend: "up",
    trendValue: "1",
    tooltip: "Number of trainers currently on shift.",
    context: "+1 vs. yesterday",
  },
  {
    label: "Check-ins Today",
    value: 45,
    icon: <FiUserCheck className="h-6 w-6 text-purple-600" />,
    color: "purple",
    trend: "up",
    trendValue: "5",
    tooltip: "Total member check-ins so far today.",
    context: "+12% vs. yesterday",
  },
  {
    label: "Pending Tasks",
    value: 12,
    icon: <FiCheckCircle className="h-6 w-6 text-orange-500" />,
    color: "orange",
    trend: "down",
    trendValue: "2",
    tooltip: "Number of tasks pending for today.",
    context: "-14% vs. yesterday",
  },
];

const TodaysSnapshot: React.FC = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <FiZap className="text-blue-500" /> Today&apos;s Snapshot
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {snapshots.map((item, idx) => (
        <SmartKpiCard key={idx} {...item} />
      ))}
    </div>
  </section>
);

export default TodaysSnapshot;
