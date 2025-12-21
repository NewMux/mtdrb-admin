import React from "react";
import {
  FiUsers,
  FiDollarSign,
  FiUserPlus,
  FiArrowDownRight,
  FiTrendingUp,
  FiArrowUpRight,
} from "react-icons/fi";
import SmartKpiCard from "../ui/SmartKpiCard";

/**
 * BusinessOverview displays key gym KPIs in Apple-style cards.
 * Enhanced with better UI/UX design and visual hierarchy.
 * @returns {JSX.Element}
 */
const kpis = [
  {
    label: "Active Members",
    value: 247,
    icon: <FiUsers className="h-6 w-6" />,
    color: "blue",
    trend: "up",
    trendValue: "5",
    tooltip: "Number of currently active memberships.",
    context: "+2% vs. last week",
  },
  {
    label: "Monthly Revenue (VAT)",
    value: "BHD 12,400",
    icon: <FiDollarSign className="h-6 w-6" />,
    color: "green",
    trend: "up",
    trendValue: "BHD 400",
    tooltip: "Total revenue this month including VAT.",
    context: "+3% vs. last month",
  },
  {
    label: "New Signups (30d)",
    value: 32,
    icon: <FiUserPlus className="h-6 w-6" />,
    color: "purple",
    trend: "up",
    trendValue: "4",
    tooltip: "New members in the last 30 days.",
    context: "+14% vs. last 30d",
  },
  {
    label: "Churn Rate",
    value: "3.2%",
    icon: <FiArrowDownRight className="h-6 w-6" />,
    color: "red",
    trend: "down",
    trendValue: "0.4%",
    tooltip: "Monthly churn rate.",
    context: "-0.2% vs. last month",
  },
];

const BusinessOverview: React.FC = () => (
  <section className="bg-white border border-gray-100 rounded-2xl p-6 transition-colors duration-300">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-blue-50 rounded-xl">
          <FiTrendingUp className="text-blue-600 text-xl" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            Business Overview
          </h2>
          <p className="text-sm text-gray-600">Key performance indicators</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Updated</span>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
              {kpi.icon}
            </div>
            <div className="flex items-center space-x-1 text-sm">
              {kpi.trend === "up" ? (
                <FiArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <FiArrowDownRight className="h-4 w-4 text-red-600" />
              )}
              <span className={kpi.trend === "up" ? "text-green-600" : "text-red-600"}>
                {kpi.trendValue}
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
          <div className="text-sm text-gray-600">{kpi.label}</div>
          <div className="text-xs text-gray-500 mt-1">{kpi.context}</div>
        </div>
      ))}
    </div>
  </section>
);

export default BusinessOverview;
