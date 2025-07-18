import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiDollarSign, 
  FiUsers, 
  FiUserPlus, 
  FiTrendingDown, 
  FiStar, 
  FiAlertTriangle 
} from 'react-icons/fi';

interface KPIMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  color: string;
  icon: React.ReactNode;
  subtitle?: string;
}

interface SmartKPIHeaderProps {
  metrics: KPIMetric[];
}

const KPICard = ({ metric }: { metric: KPIMetric }) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700';
      case 'green':
        return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700';
      case 'yellow':
        return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
      case 'red':
        return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700';
      case 'purple':
        return 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700';
      case 'orange':
        return 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-700';
      default:
        return 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600';
    }
  };

  const getTrendColor = (changeType: 'up' | 'down' | 'neutral') => {
    switch (changeType) {
      case 'up':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 ease-in-out"
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${getColorClasses(metric.color)}`}>
          {metric.icon}
        </div>
        <div className={`flex items-center space-x-1 text-sm font-medium ${getTrendColor(metric.changeType)}`}>
          <span className={metric.changeType === 'up' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>
            {metric.changeType === 'up' ? '↗' : metric.changeType === 'down' ? '↘' : '→'}
          </span>
          <span className="ml-1">{metric.change}</span>
        </div>
      </div>
      
      <div className="mb-2">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metric.value}</h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
        {metric.subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{metric.subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

export default function SmartKPIHeader({ metrics }: SmartKPIHeaderProps) {
  // Add null/undefined check
  if (!metrics || !Array.isArray(metrics)) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <motion.div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="mb-2">
                <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <KPICard metric={metric} />
        </motion.div>
      ))}
    </div>
  );
}

// Default metrics for demonstration
export const defaultKPIMetrics: KPIMetric[] = [
  {
    title: 'Total Revenue',
    value: '45,280 BHD',
    change: '+12.5%',
    changeType: 'up',
    icon: <FiDollarSign className="w-6 h-6 text-white" />,
    color: 'blue',
    subtitle: 'vs last month'
  },
  {
    title: 'Active Members',
    value: '1,247',
    change: '+8.2%',
    changeType: 'up',
    icon: <FiUsers className="w-6 h-6 text-white" />,
    color: 'green',
    subtitle: 'vs last month'
  },
  {
    title: 'New Signups',
    value: '89',
    change: '+15.3%',
    changeType: 'up',
    icon: <FiUserPlus className="w-6 h-6 text-white" />,
    color: 'purple',
    subtitle: 'this month'
  },
  {
    title: 'Churn Rate',
    value: '3.2%',
    change: '-0.8%',
    changeType: 'down',
    icon: <FiTrendingDown className="w-6 h-6 text-white" />,
    color: 'red',
    subtitle: 'vs last month'
  },
  {
    title: 'Top Trainer',
    value: 'Sarah Ahmed',
    change: '4.9★',
    changeType: 'up',
    icon: <FiStar className="w-6 h-6 text-white" />,
    color: 'yellow',
    subtitle: '25 sessions'
  },
  {
    title: 'At-Risk Members',
    value: '18',
    change: '+5',
    changeType: 'down',
    icon: <FiAlertTriangle className="w-6 h-6 text-white" />,
    color: 'red',
    subtitle: 'need attention'
  }
]; 