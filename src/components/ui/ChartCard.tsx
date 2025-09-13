import React from "react";
import { motion } from "framer-motion";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  className = "",
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      className={`
        bg-white dark:bg-dark-800 rounded-2xl p-6 
        border border-light-200 dark:border-dark-700 
        shadow-soft dark:shadow-lg
        transition-all duration-300 ease-out
        ${onClick ? "cursor-pointer hover:shadow-medium" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-light-600 dark:text-dark-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className="relative">{children}</div>
    </motion.div>
  );
};

export default ChartCard;
