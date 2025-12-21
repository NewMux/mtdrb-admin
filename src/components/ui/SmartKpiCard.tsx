import React from "react";
import { FiInfo } from "react-icons/fi";

/**
 * Props for SmartKpiCard
 */
export interface SmartKpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red" | "purple" | "orange";
  trend?: "up" | "down" | null;
  trendValue?: string;
  tooltip?: string;
  context?: string;
}

const colorAccent = {
  blue: "bg-blue-600",
  green: "bg-emerald-600",
  yellow: "bg-yellow-500",
  red: "bg-red-600",
  purple: "bg-purple-600",
  orange: "bg-orange-500",
};

const colorBg = {
  blue: "bg-blue-50",
  green: "bg-emerald-50",
  yellow: "bg-yellow-50",
  red: "bg-red-50",
  purple: "bg-purple-50",
  orange: "bg-orange-50",
};

const colorText = {
  blue: "text-blue-600",
  green: "text-emerald-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
  purple: "text-purple-600",
  orange: "text-orange-600",
};

const trendColor = {
  up: "text-emerald-600",
  down: "text-red-600",
};

/**
 * SmartKpiCard: World-class SaaS KPI card with hierarchy, trend, accent, and tooltip.
 */
const SmartKpiCard: React.FC<SmartKpiCardProps> = ({
  label,
  value,
  icon,
  color,
  trend,
  trendValue,
  tooltip,
  context,
}) => {
  const bgColor = colorBg[color];
  const textColor = colorText[color];
  const iconBg = colorBg[color];
  const subtext =
    trendValue && trend
      ? `${trendValue} ${trend === "up" ? "↗" : "↘"}`
      : undefined;

  return (
    <div
      className={`p-6 rounded-2xl shadow-sm gap-2 flex flex-col items-start bg-white border border-gray-200 ${bgColor} ${textColor} transition-colors duration-300 ease-in-out`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <div className="text-xs mt-1 opacity-70">{subtext}</div>}
    </div>
  );
};

export default SmartKpiCard;
