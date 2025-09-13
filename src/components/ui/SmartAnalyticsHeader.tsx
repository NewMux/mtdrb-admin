import React from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
} from "react-icons/fi";

interface SmartAnalyticsHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  timeRange?: "week" | "month" | "quarter" | "year";
  onTimeRangeChange?: (range: "week" | "month" | "quarter" | "year") => void;
  showTimeRange?: boolean;
}

export default function SmartAnalyticsHeader({
  title,
  subtitle,
  icon,
  gradientFrom,
  gradientTo,
  timeRange = "month",
  onTimeRangeChange,
  showTimeRange = true,
}: SmartAnalyticsHeaderProps) {
  const timeRangeOptions = [
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "quarter", label: "Quarter" },
    { value: "year", label: "Year" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br from-${gradientFrom} to-${gradientTo} rounded-2xl shadow-lg p-8 text-white`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-20 p-4 rounded-xl backdrop-blur-sm">
            {icon}
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            <p className="text-white text-opacity-90 text-lg">{subtitle}</p>
          </div>
        </div>

        {showTimeRange && onTimeRangeChange && (
          <div className="flex items-center space-x-2 bg-white bg-opacity-10 p-2 rounded-xl backdrop-blur-sm">
            {timeRangeOptions.map((range) => (
              <motion.button
                key={range.value}
                onClick={() => onTimeRangeChange(range.value as any)}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 capitalize font-medium ${
                  timeRange === range.value
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-white hover:bg-white hover:bg-opacity-20"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {range.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
