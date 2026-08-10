import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

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
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      dir={isRTL ? "rtl" : "ltr"}
      className={`
        bg-white dark:bg-gray-800 rounded-2xl p-6 
        border border-gray-200 dark:border-gray-700
        shadow-sm
        transition-all duration-300 ease-out
        ${onClick ? "cursor-pointer hover:shadow-md" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="mb-4 text-start">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <div className="relative">{children}</div>
    </motion.div>
  );
};

export default ChartCard;
