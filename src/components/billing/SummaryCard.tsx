import React from "react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red" | "purple";
  onClick?: () => void;
  subtext?: string;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    hover: "hover:bg-blue-100 dark:hover:bg-blue-900",
    iconBg: "bg-blue-100 dark:bg-blue-900",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900",
    iconBg: "bg-emerald-100 dark:bg-emerald-900",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-950",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
    hover: "hover:bg-yellow-100 dark:hover:bg-yellow-900",
    iconBg: "bg-yellow-100 dark:bg-yellow-900",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    hover: "hover:bg-red-100 dark:hover:bg-red-900",
    iconBg: "bg-red-100 dark:bg-red-900",
  },
  purple: {
    bg: "bg-indigo-50 dark:bg-indigo-950",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
    hover: "hover:bg-indigo-100 dark:hover:bg-indigo-900",
    iconBg: "bg-indigo-100 dark:bg-indigo-900",
  },
};

export default function SummaryCard({
  title,
  value,
  icon,
  color,
  onClick,
  subtext,
}: SummaryCardProps) {
  const { bg, text, border, hover, iconBg } = colorClasses[color];

  return (
    <div
      className={`
        ${bg} ${text} p-6 rounded-2xl shadow-sm gap-2 transition-all duration-300 ease-in-out
        ${onClick ? "cursor-pointer hover:shadow-md hover:border-gray-300 " + hover : ""}
      `}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      aria-pressed={onClick ? false : undefined}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium mb-1 opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtext && <p className="text-xs mt-1 opacity-70">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${iconBg} ${border}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
