import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

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

const FROM_GRADIENTS: Record<string, string> = {
  "purple-600": "from-purple-600",
  "blue-600": "from-blue-600",
  "emerald-600": "from-emerald-600",
  "amber-600": "from-amber-600",
  "indigo-600": "from-indigo-600",
  "teal-600": "from-teal-600",
  "rose-600": "from-rose-600",
  "cyan-600": "from-cyan-600",
};

const TO_GRADIENTS: Record<string, string> = {
  "indigo-700": "to-indigo-700",
  "teal-700": "to-teal-700",
  "orange-700": "to-orange-700",
  "blue-800": "to-blue-800",
  "purple-800": "to-purple-800",
  "emerald-800": "to-emerald-800",
  "rose-800": "to-rose-800",
  "cyan-800": "to-cyan-800",
};

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
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const timeRangeOptions = [
    { value: "week", label: t("dashboard.weekly") },
    { value: "month", label: t("dashboard.monthly") },
    { value: "quarter", label: t("dashboard.quarterly") },
    { value: "year", label: t("dashboard.yearly") },
  ];

  const fromClass = FROM_GRADIENTS[gradientFrom] || "from-purple-600";
  const toClass = TO_GRADIENTS[gradientTo] || "to-indigo-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br ${fromClass} ${toClass} rounded-2xl shadow-lg p-8 text-white`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-4`}>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl backdrop-blur-sm">
            {icon}
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            <p className="text-white text-opacity-90 text-lg">{subtitle}</p>
          </div>
        </div>

        {showTimeRange && onTimeRangeChange && (
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-2 bg-white bg-opacity-10 p-2 rounded-xl backdrop-blur-sm`}>
            {timeRangeOptions.map((range) => (
              <motion.button
                key={range.value}
                onClick={() => onTimeRangeChange(range.value as any)}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${
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
