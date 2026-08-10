import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { FiLoader } from "react-icons/fi";
import { useTranslation } from "react-i18next";

// ===== DESIGN SYSTEM CONSTANTS =====
export const DESIGN_SYSTEM = {
  colors: {
    primary: {
      50: "#EBF5FF",
      100: "#E1F5FE",
      500: "#3B82F6",
      600: "#2563EB",
      700: "#1D4ED8",
      900: "#1E3A8A",
    },
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      500: "#6B7280",
      600: "#4B5563",
      900: "#111827",
    },
    success: {
      50: "#ECFDF5",
      500: "#10B981",
      600: "#059669",
    },
    warning: {
      50: "#FFFBEB",
      500: "#F97316",
      600: "#EA580C",
    },
    danger: {
      50: "#FEF2F2",
      500: "#EF4444",
      600: "#DC2626",
    },
  },
};

// ===== ANIMATION VARIANTS =====
export const animationVariants = {
  pageTransition: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  cardHover: {
    rest: { scale: 1 },
    hover: { scale: 1.01, transition: { duration: 0.2 } },
  },
  buttonPress: {
    rest: { scale: 1 },
    pressed: { scale: 0.98 },
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
};

// ===== PAGE LAYOUT COMPONENT =====
interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  children,
  actions,
  className = "",
}) => (
  <motion.div
    variants={animationVariants.pageTransition}
    initial="initial"
    animate="animate"
    exit="exit"
    className={`min-h-screen bg-white dark:bg-gray-900 ${className}`}
  >
    {/* Page Header */}
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-lunaNavy dark:text-gray-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lunaNavy/70 dark:text-gray-400 mt-2">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-4">{actions}</div>
        )}
      </div>
    </div>

    {/* Page Content */}
    <div className="p-6">{children}</div>
  </motion.div>
);

// ===== SMART CARD COMPONENT =====
interface SmartCardProps
  extends Omit<HTMLMotionProps<"div">, "className"> {
  hover?: boolean;
  clickable?: boolean;
  className?: string;
}

export const SmartCard: React.FC<SmartCardProps> = ({
  children,
  className = "",
  hover = true,
  clickable = false,
  onClick,
  ...rest
}) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  return (
    <motion.div
      variants={hover ? animationVariants.cardHover : undefined}
      initial="rest"
      whileHover="hover"
      whileTap={clickable ? "pressed" : undefined}
      onClick={onClick}
      {...rest}
      dir={isRTL ? "rtl" : "ltr"}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4
        ${clickable ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

// ===== SMART BUTTON COMPONENT =====
interface SmartButtonProps
  extends Omit<HTMLMotionProps<"button">, "className" | "loading"> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const SmartButton: React.FC<SmartButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  children,
  className = "",
  disabled = false,
  title,
  type,
  ...rest
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500",
    secondary:
      "bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 text-sky-700 dark:text-sky-300 focus:ring-sky-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    warning:
      "bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    ghost:
      "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <motion.button
      variants={animationVariants.buttonPress}
      initial="rest"
      whileTap="pressed"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      title={title}
      type={type}
      {...rest}
    >
      {loading && <FiLoader className="animate-spin mr-2 w-4 h-4" />}
      {!loading && icon && iconPosition === "left" && (
        <span className={`${children ? "mr-2" : ""}`}>{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === "right" && (
        <span className={`${children ? "ml-2" : ""}`}>{icon}</span>
      )}
    </motion.button>
  );
};




// ===== KPI CARD COMPONENT =====
interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  color = "blue",
}) => {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    yellow: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    red: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  };

  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-gray-600 dark:text-gray-400",
  };

  return (
    <SmartCard className="relative overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-start">
          <p className="text-sm font-medium text-lunaNavy/70 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-xl font-bold text-lunaNavy dark:text-gray-100">
            {value}
          </p>
          {change && (
            <p
              className={`text-xs font-medium mt-1 ${trendColors[trend || "neutral"]}`}
            >
              {change}
            </p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
    </SmartCard>
  );
};

// ===== SMART TABLE COMPONENT =====
interface SmartTableProps {
  children: React.ReactNode;
  className?: string;
}

export const SmartTable: React.FC<SmartTableProps> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

// ===== FILTER BAR COMPONENT =====
interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
  >
    {children}
  </div>
);

// ===== STATS GRID COMPONENT =====
interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  children,
  columns = 4,
  className = "",
}) => {
  const gridClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
};

// ===== SECTION COMPONENT =====
interface SectionProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = "",
}) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-lunaNavy dark:text-gray-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lunaNavy/70 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center space-x-3">{actions}</div>}
    </div>
    {children}
  </div>
);

// ===== LOADING COMPONENT =====
export const SmartLoading: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => (
  <div className="flex items-center justify-center p-6">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-3"></div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
    </div>
  </div>
);

// ===== EMPTY STATE COMPONENT =====
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="text-center py-8">
    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
      <div className="text-lunaNavy/60 dark:text-gray-400 text-xl">{icon}</div>
    </div>
    <h3 className="text-lg font-semibold text-lunaNavy dark:text-gray-100 mb-2">
      {title}
    </h3>
    <p className="text-lunaNavy/70 dark:text-gray-400 mb-4 max-w-md mx-auto">
      {description}
    </p>
    {action && <div className="flex justify-center">{action}</div>}
  </div>
);
