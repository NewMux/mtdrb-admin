/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { FiLoader } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { PageHeader } from "./PageHeader";

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
  // Mac content doesn't grow under the pointer; kept as a no-op so existing
  // variant names still resolve.
  cardHover: {
    rest: { scale: 1 },
    hover: { scale: 1 },
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
    className={`min-h-screen ${className}`}
  >
    {/* Page Header */}
    <PageHeader title={title} subtitle={subtitle} actions={actions} />

    {/* Page Content */}
    <div className="pt-5">{children}</div>
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
        bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-black/5 dark:border-white/10 p-4
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
    "inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-colors duration-100 focus:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:cursor-default select-none";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm",
    secondary:
      "bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 shadow-sm",
    success: "bg-green-500 hover:bg-green-600 text-white shadow-sm",
    warning: "bg-orange-500 hover:bg-orange-600 text-white shadow-sm",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm",
    ghost:
      "bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300",
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-sm",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
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
      {loading && <FiLoader className="animate-spin w-3.5 h-3.5" />}
      {!loading && icon && iconPosition === "left" && icon}
      {children}
      {!loading && icon && iconPosition === "right" && icon}
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
    blue: "text-blue-600 dark:text-blue-500",
    green: "text-green-600 dark:text-green-500",
    yellow: "text-orange-500",
    red: "text-red-500",
    purple: "text-purple-500",
  };

  const trendColors = {
    up: "text-green-600 dark:text-green-500",
    down: "text-red-500",
    neutral: "text-gray-500 dark:text-gray-400",
  };

  return (
    <SmartCard className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 text-start">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
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
          className={`${colorClasses[color]} flex items-center justify-center flex-shrink-0 [&_svg]:w-4 [&_svg]:h-4`}
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
    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden ${className}`}
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
    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-black/5 dark:border-white/10 p-3 ${className}`}
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
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
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
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300 mx-auto mb-2"></div>
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
    <div className="text-gray-400 dark:text-gray-500 text-3xl flex justify-center mb-3">{icon}</div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
      {title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
      {description}
    </p>
    {action && <div className="flex justify-center">{action}</div>}
  </div>
);
