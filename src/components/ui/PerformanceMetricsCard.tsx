import React from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiTrendingDown, FiActivity, FiArrowUpRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

interface PerformanceMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  trend: "up" | "down" | "stable";
  format?: "currency" | "percentage" | "number" | "decimal";
  suffix?: string;
  icon?: React.ReactNode;
  color?: string;
}

interface PerformanceMetricsCardProps {
  metrics: PerformanceMetric[];
  title?: string;
  subtitle?: string;
}

export default function PerformanceMetricsCard({
  metrics,
  title,
  subtitle,
}: PerformanceMetricsCardProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const formatValue = (value: number, format?: string, suffix?: string) => {
    switch (format) {
      case "currency":
        return `$${value.toLocaleString()}`;
      case "percentage":
        return `${value}%`;
      case "decimal":
        return value.toFixed(1);
      case "number":
      default:
        return suffix ? `${value}${suffix}` : value.toString();
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <FiTrendingUp className="h-4 w-4" />;
      case "down":
        return <FiTrendingDown className="h-4 w-4" />;
      case "stable":
        return <FiActivity className="h-4 w-4" />;
    }
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      case "stable":
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getColorClasses = (color?: string) => {
    switch (color) {
      case "green":
        return "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
      case "blue":
        return "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "purple":
        return "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800";
      case "yellow":
        return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "red":
        return "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800";
      case "indigo":
        return "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";
      default:
        return "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600";
    }
  };

  return (
    <div className="space-y-8">
      {(title || subtitle) && (
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {title && (
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
          )}
          {subtitle && <p className="text-gray-600 dark:text-gray-400 text-lg">{subtitle}</p>}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between mb-4`}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
                {metric.icon && (
                  <div className={`p-2 rounded-lg border ${getColorClasses(metric.color)}`}>
                    {metric.icon}
                  </div>
                )}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{metric.name}</h3>
              </div>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-1 ${getTrendColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)}
              </div>
            </div>

            <div className="space-y-4">
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {formatValue(metric.current, metric.format, metric.suffix)}
                </span>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded-full ${
                    metric.current >= metric.target
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                  }`}
                >
                  {t("dashboard.target")}: {formatValue(metric.target, metric.format, metric.suffix)}
                </span>
              </div>

              <div className="space-y-2">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between text-sm`}>
                  <span className="text-gray-600 dark:text-gray-400">{t("dashboard.progress")}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {Math.round((metric.current / metric.target) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      metric.current >= metric.target
                        ? "bg-green-500"
                        : "bg-orange-500"
                    }`}
                    style={{
                      width: `${Math.min((metric.current / metric.target) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between text-sm`}>
                <span className="text-gray-600 dark:text-gray-400">
                  {t("dashboard.previous")}: {formatValue(metric.previous, metric.format, metric.suffix)}
                </span>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-1`}>
                  <FiArrowUpRight className="h-3 w-3" />
                  <span
                    className={`font-medium ${
                      metric.current > metric.previous
                        ? "text-green-600 dark:text-green-400"
                        : metric.current < metric.previous
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {metric.current > metric.previous ? "+" : ""}
                    {metric.format === "decimal"
                      ? (metric.current - metric.previous).toFixed(1)
                      : metric.current - metric.previous}
                    {metric.format === "percentage" ? "%" : ""}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
