import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface StatCardProps {
  title: string;
  value: string | number;
  trendText?: string;
  trendValue?: number;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "orange";
  onClick?: () => void;
  href?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trendText,
  trendValue,
  icon,
  color = "blue",
  onClick,
  href,
  className = "",
}) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-700",
      icon: "text-blue-600 dark:text-blue-400",
      trend: "text-blue-600 dark:text-blue-400",
    },
    green: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-700",
      icon: "text-emerald-600 dark:text-emerald-400",
      trend: "text-emerald-600 dark:text-emerald-400",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-700",
      icon: "text-red-600 dark:text-red-400",
      trend: "text-red-600 dark:text-red-400",
    },
    yellow: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-700",
      icon: "text-yellow-600 dark:text-yellow-400",
      trend: "text-yellow-600 dark:text-yellow-400",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-200 dark:border-purple-700",
      icon: "text-purple-600 dark:text-purple-400",
      trend: "text-purple-600 dark:text-purple-400",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-700",
      icon: "text-orange-600 dark:text-orange-400",
      trend: "text-orange-600 dark:text-orange-400",
    },
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isClickable = onClick || href;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={isClickable ? { scale: 1.02, y: -2 } : {}}
      dir={isRTL ? "rtl" : "ltr"}
      className={`
        relative overflow-hidden rounded-2xl p-6 
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        shadow-sm
        transition-all duration-300 ease-out
        ${isClickable ? "cursor-pointer hover:shadow-md" : ""}
        ${colorClasses[color].bg}
        ${colorClasses[color].border}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 dark:to-gray-700/5 pointer-events-none" />

      <div className="relative z-10">
        <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between items-start mb-4`}>
          <div className="flex-1 text-start">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {value}
            </h3>
            {trendText && (
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-1`}>
                {trendValue !== undefined && (
                  <span
                    className={`text-sm font-medium ${colorClasses[color].trend}`}
                  >
                    {trendValue > 0 ? "+" : ""}
                    {trendValue}%
                  </span>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {trendText}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className={`p-3 rounded-xl bg-white/50 dark:bg-gray-700/50 ${colorClasses[color].icon} flex-shrink-0`}
            >
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Clickable indicator */}
      {isClickable && (
        <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} opacity-0 group-hover:opacity-100 transition-opacity`}>
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
