import React from "react";
import {
  FiUsers,
  FiSettings,
  FiTrendingUp,
  FiActivity,
  FiHeart,
} from "react-icons/fi";
import SmartKpiCard from "../ui/SmartKpiCard";

const healthItems = [
  {
    label: "Member Satisfaction",
    value: "96%",
    icon: <FiUsers className="h-6 w-6 text-blue-600" />,
    color: "blue",
    trend: "up",
    trendValue: "1%",
    tooltip: "Overall member satisfaction score.",
    context: "+1% vs. last month",
  },
  {
    label: "Equipment Status",
    value: "98%",
    icon: <FiSettings className="h-6 w-6 text-green-600" />,
    color: "green",
    trend: "up",
    trendValue: "2%",
    tooltip: "Percentage of equipment in good condition.",
    context: "+2% vs. last month",
  },
  {
    label: "Revenue Growth",
    value: "+15%",
    icon: <FiTrendingUp className="h-6 w-6 text-purple-600" />,
    color: "purple",
    trend: "up",
    trendValue: "3%",
    tooltip: "Revenue growth compared to last period.",
    context: "+3% vs. last month",
  },
  {
    label: "Operational Efficiency",
    value: "92%",
    icon: <FiActivity className="h-6 w-6 text-orange-500" />,
    color: "orange",
    trend: "up",
    trendValue: "1%",
    tooltip: "Operational efficiency score.",
    context: "+1% vs. last month",
  },
];

const GymHealthScore: React.FC = () => (
  <section className="mb-8">
    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <FiHeart className="text-red-500" /> Gym Health Score
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {healthItems.map((item, idx) => (
        <SmartKpiCard key={idx} {...item} />
      ))}
    </div>
  </section>
);

export default GymHealthScore;
