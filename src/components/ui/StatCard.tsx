import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  trendText?: string;
  trendValue?: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
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
  color = 'blue',
  onClick,
  href,
  className = '',
}) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: {
      bg: 'bg-brand-50 dark:bg-brand-900/20',
      border: 'border-brand-200 dark:border-brand-800',
      icon: 'text-brand-600 dark:text-brand-400',
      trend: 'text-brand-600 dark:text-brand-400',
    },
    green: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-success-200 dark:border-success-800',
      icon: 'text-success-600 dark:text-success-400',
      trend: 'text-success-600 dark:text-success-400',
    },
    red: {
      bg: 'bg-error-50 dark:bg-error-900/20',
      border: 'border-error-200 dark:border-error-800',
      icon: 'text-error-600 dark:text-error-400',
      trend: 'text-error-600 dark:text-error-400',
    },
    yellow: {
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      border: 'border-warning-200 dark:border-warning-800',
      icon: 'text-warning-600 dark:text-warning-400',
      trend: 'text-warning-600 dark:text-warning-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      trend: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-600 dark:text-orange-400',
      trend: 'text-orange-600 dark:text-orange-400',
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
        bg-white dark:bg-dark-800 
        border border-light-200 dark:border-dark-700
        shadow-soft dark:shadow-lg
        transition-all duration-300 ease-out
        ${isClickable ? 'cursor-pointer hover:shadow-medium' : ''}
        ${colorClasses[color].bg}
        ${colorClasses[color].border}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 dark:to-white/5 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-light-500 dark:text-dark-400 uppercase tracking-wider mb-1">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">
              {value}
            </h3>
            {trendText && (
              <div className="flex items-center gap-1">
                {trendValue !== undefined && (
                  <span className={`text-sm font-medium ${colorClasses[color].trend}`}>
                    {trendValue > 0 ? '+' : ''}{trendValue}%
                  </span>
                )}
                <span className="text-sm text-light-500 dark:text-dark-400">
                  {trendText}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className={`p-3 rounded-xl bg-white/50 dark:bg-dark-700/50 ${colorClasses[color].icon}`}>
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Clickable indicator */}
      {isClickable && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 rounded-full bg-brand-500" />
        </div>
      )}
    </motion.div>
  );
};

export default StatCard; 