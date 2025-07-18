import * as React from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiUserCheck, FiUserX, FiUserPlus } from 'react-icons/fi';

interface Stats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

interface MemberKPICardsProps {
  stats: Stats;
}

const MemberKPICards: React.FC<MemberKPICardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Members',
      value: stats.total,
      change: '+12%',
      changeType: 'positive',
      icon: FiUsers,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Active Members',
      value: stats.active,
      change: '+8%',
      changeType: 'positive',
      icon: FiUserCheck,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Inactive Members',
      value: stats.inactive,
      change: '-3%',
      changeType: 'negative',
      icon: FiUserX,
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
    {
      title: 'New This Month',
      value: stats.newThisMonth,
      change: '+15%',
      changeType: 'positive',
      icon: FiUserPlus,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      textColor: 'text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`card ${card.bgColor} border-0`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {card.value.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                <span
                  className={`text-xs font-medium ${
                    card.changeType === 'positive'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {card.change}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  from last month
                </span>
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center`}
            >
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MemberKPICards; 