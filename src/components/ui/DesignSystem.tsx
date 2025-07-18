import React from "react";
import { motion } from "framer-motion";
import { FiLoader } from "react-icons/fi";

// ===== DESIGN SYSTEM CONSTANTS =====
export const DESIGN_SYSTEM = {
  colors: {
    primary: {
      50: '#EBF5FF',
      100: '#E1F5FE', 
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      900: '#1E3A8A'
    },
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      500: '#6B7280',
      600: '#4B5563',
      900: '#111827'
    },
    success: {
      50: '#ECFDF5',
      500: '#10B981',
      600: '#059669'
    },
    warning: {
      50: '#FFFBEB',
      500: '#F97316',
      600: '#EA580C'
    },
    danger: {
      50: '#FEF2F2',
      500: '#EF4444',
      600: '#DC2626'
    }
  }
};

// ===== ANIMATION VARIANTS =====
export const animationVariants = {
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  cardHover: {
    rest: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  },
  buttonPress: {
    rest: { scale: 1 },
    pressed: { scale: 0.98 }
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }
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
  className = ""
}) => (
  <motion.div
    variants={animationVariants.pageTransition}
    initial="initial"
    animate="animate"
    exit="exit"
    className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}
  >
    {/* Page Header */}
    <div className="bg-white border-b border-gray-200 px-8 py-8 dark:bg-gray-900 dark:border-gray-800 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight dark:text-white">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 mt-3 text-lg dark:text-gray-300">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-4">
            {actions}
          </div>
        )}
      </div>
    </div>

    {/* Page Content */}
    <div className="p-8 dark:bg-gray-900 transition-colors duration-300">
      {children}
    </div>
  </motion.div>
);

// ===== SMART CARD COMPONENT =====
interface SmartCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const SmartCard: React.FC<SmartCardProps> = ({
  children,
  className = "",
  hover = true,
  clickable = false,
  onClick
}) => (
  <motion.div
    variants={hover ? animationVariants.cardHover : undefined}
    initial="rest"
    whileHover="hover"
    whileTap={clickable ? "pressed" : undefined}
    onClick={onClick}
    className={`
      bg-white rounded-2xl p-6 shadow-sm border border-gray-200
      ${hover ? 'hover:shadow-lg hover:border-gray-300 transition-all duration-300 ease-in-out' : ''}
      ${clickable ? 'cursor-pointer' : ''}
      ${className}
    `}
  >
    {children}
  </motion.div>
);

// ===== SMART BUTTON COMPONENT =====
interface SmartButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export const SmartButton: React.FC<SmartButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = "",
  onClick,
  disabled = false
}) => {
  const baseClasses = "font-semibold rounded-xl transition-all duration-300 ease-in-out flex items-center justify-center min-h-[44px] focus:ring-4 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md",
    secondary: "border border-gray-300 text-gray-700 hover:bg-gray-100",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md",
    warning: "bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow-md",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md",
    ghost: "text-gray-500 hover:text-gray-700 px-4 py-2"
  };

  const sizeClasses = {
    sm: "px-4 py-2.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg"
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  const widthClasses = fullWidth ? "w-full" : "";

  return (
    <motion.button
      variants={animationVariants.buttonPress}
      initial="rest"
      whileTap={!disabled && !loading ? "pressed" : undefined}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${widthClasses}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <FiLoader className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </motion.button>
  );
};

// ===== KPI CARD COMPONENT =====
interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ease-in-out"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${trendColors[trend || 'neutral']}`}>
            <span>{change}</span>
            {trend === 'up' && <span>↗</span>}
            {trend === 'down' && <span>↘</span>}
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </motion.div>
  );
};

// ===== SMART TABLE COMPONENT =====
interface SmartTableProps {
  children: React.ReactNode;
  className?: string;
}

export const SmartTable: React.FC<SmartTableProps> = ({
  children,
  className = ""
}) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
    <div className="overflow-x-auto">
      {children}
    </div>
  </div>
);

// ===== FILTER BAR COMPONENT =====
interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  className = ""
}) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6 ${className}`}>
    <div className="flex items-center justify-between">
      {children}
    </div>
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
  className = ""
}) => {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
  };

  return (
    <div className={`grid gap-6 ${gridClasses[columns]} ${className}`}>
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
  className = ""
}) => (
  <div className={`mb-8 ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-gray-600 mt-2">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-3">
          {actions}
        </div>
      )}
    </div>
    {children}
  </div>
);

// ===== LOADING COMPONENT =====
export const SmartLoading: React.FC<{ message?: string }> = ({
  message = "Loading..."
}) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">{message}</p>
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
  action
}) => (
  <div className="text-center py-12">
    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
      <div className="text-gray-400 text-2xl">{icon}</div>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    {action && (
      <div className="flex justify-center">
        {action}
      </div>
    )}
  </div>
);
