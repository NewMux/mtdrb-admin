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
  blue: "bg-mtdrb-600 dark:bg-mtdrb-400",
  green: "bg-emerald-600 dark:bg-emerald-400",
  yellow: "bg-gold-500 dark:bg-gold-300",
  red: "bg-red-600 dark:bg-red-400",
  purple: "bg-purple-600 dark:bg-purple-400",
  orange: "bg-orange-500 dark:bg-orange-300",
};

const colorBg = {
  blue: "bg-mtdrb-50 dark:bg-mtdrb-950",
  green: "bg-emerald-50 dark:bg-emerald-950",
  yellow: "bg-gold-50 dark:bg-gold-950",
  red: "bg-red-50 dark:bg-red-950",
  purple: "bg-purple-50 dark:bg-purple-950",
  orange: "bg-orange-50 dark:bg-orange-950",
};

const colorText = {
  blue: "text-mtdrb-600 dark:text-mtdrb-300",
  green: "text-emerald-600 dark:text-emerald-300",
  yellow: "text-gold-600 dark:text-gold-300",
  red: "text-red-600 dark:text-red-300",
  purple: "text-purple-600 dark:text-purple-300",
  orange: "text-orange-600 dark:text-orange-300",
};

const trendColor = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
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
      className={`p-6 rounded-2xl shadow-sm gap-2 flex flex-col items-start ${bgColor} ${textColor} transition-colors duration-300 ease-in-out`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${iconBg} dark:bg-opacity-80`}>
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
