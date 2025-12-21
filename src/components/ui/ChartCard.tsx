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
        bg-white rounded-2xl p-6 
        border border-gray-200 
        shadow-sm
        transition-all duration-300 ease-out
        ${onClick ? "cursor-pointer hover:shadow-md" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className="relative">{children}</div>
    </motion.div>
  );
};

export default ChartCard;
