import React from "react";
import { useTranslation } from "react-i18next";

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

const colorBg = {
  blue: "bg-blue-50 dark:bg-blue-900/20",
  green: "bg-emerald-50 dark:bg-emerald-900/20",
  yellow: "bg-yellow-50 dark:bg-yellow-900/20",
  red: "bg-red-50 dark:bg-red-900/20",
  purple: "bg-purple-50 dark:bg-purple-900/20",
  orange: "bg-orange-50 dark:bg-orange-900/20",
};

const colorText = {
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-emerald-600 dark:text-emerald-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  red: "text-red-600 dark:text-red-400",
  purple: "text-purple-600 dark:text-purple-400",
  orange: "text-orange-600 dark:text-orange-400",
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
}) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const bgColor = colorBg[color];
  const textColor = colorText[color];
  const iconBg = colorBg[color];
  const subtext =
    trendValue && trend
      ? `${trendValue} ${trend === "up" ? "↗" : "↘"}`
      : undefined;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`p-6 rounded-2xl shadow-sm gap-2 flex flex-col items-start bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${bgColor} ${textColor} transition-colors duration-300 ease-in-out`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
          {icon}
        </div>
        <span className="text-sm font-medium opacity-80 dark:opacity-90 text-start text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className="text-2xl font-bold text-start text-gray-900 dark:text-gray-100">{value}</div>
      {subtext && <div className="text-xs mt-1 opacity-70 dark:opacity-80 text-start text-gray-600 dark:text-gray-400">{subtext}</div>}
    </div>
  );
};

export default SmartKpiCard;
