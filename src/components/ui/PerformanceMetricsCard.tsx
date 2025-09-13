import React from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiTrendingDown, FiActivity, FiArrowUpRight } from "react-icons/fi";

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
        return "text-green-600";
      case "down":
        return "text-red-600";
      case "stable":
        return "text-gray-600";
    }
  };

  const getColorClasses = (color?: string) => {
    switch (color) {
      case "green":
        return "bg-green-50 text-green-600 border-green-200";
      case "blue":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "purple":
        return "bg-purple-50 text-purple-600 border-purple-200";
      case "yellow":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "red":
        return "bg-red-50 text-red-600 border-red-200";
      case "indigo":
        return "bg-indigo-50 text-indigo-600 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
          )}
          {subtitle && <p className="text-gray-600 text-lg">{subtitle}</p>}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {metric.icon && (
                  <div className={`p-2 rounded-lg border ${getColorClasses(metric.color)}`}>
                    {metric.icon}
                  </div>
                )}
                <h3 className="font-semibold text-gray-900">{metric.name}</h3>
              </div>
              <div className={`flex items-center space-x-1 ${getTrendColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900">
                  {formatValue(metric.current, metric.format, metric.suffix)}
                </span>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded-full ${
                    metric.current >= metric.target
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  Target: {formatValue(metric.target, metric.format, metric.suffix)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {Math.round((metric.current / metric.target) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
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

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Previous: {formatValue(metric.previous, metric.format, metric.suffix)}
                </span>
                <div className="flex items-center space-x-1">
                  <FiArrowUpRight className="h-3 w-3" />
                  <span
                    className={`font-medium ${
                      metric.current > metric.previous
                        ? "text-green-600"
                        : metric.current < metric.previous
                          ? "text-red-600"
                          : "text-gray-600"
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
