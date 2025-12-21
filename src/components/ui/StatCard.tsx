import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      trend: "text-blue-600",
    },
    green: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "text-emerald-600",
      trend: "text-emerald-600",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      trend: "text-red-600",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: "text-yellow-600",
      trend: "text-yellow-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "text-purple-600",
      trend: "text-purple-600",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "text-orange-600",
      trend: "text-orange-600",
    },
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  const isClickable = onClick || href;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={isClickable ? { scale: 1.02, y: -2 } : {}}
      className={`
        relative overflow-hidden rounded-2xl p-6 
        bg-white 
        border border-gray-200
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
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {value}
            </h3>
            {trendText && (
              <div className="flex items-center gap-1">
                {trendValue !== undefined && (
                  <span
                    className={`text-sm font-medium ${colorClasses[color].trend}`}
                  >
                    {trendValue > 0 ? "+" : ""}
                    {trendValue}%
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {trendText}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className={`p-3 rounded-xl bg-white/50 ${colorClasses[color].icon}`}
            >
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Clickable indicator */}
      {isClickable && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
