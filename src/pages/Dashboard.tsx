import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiCalendar, FiDollarSign, FiTrendingUp, 
  FiActivity, FiStar, FiAlertCircle, FiCheckCircle 
} from 'react-icons/fi';
import { SmartButton } from '../components/ui/DesignSystem';
import { SmartDashboardOverview } from '../components/dashboard/SmartDashboardOverview';
import { LiveKPITracker } from '../components/dashboard/LiveKPITracker';
import MemberEngagement from '../components/dashboard/MemberEngagement';
import BusinessOverview from '../components/dashboard/BusinessOverview';
import { usePageThemeContext } from '../contexts/PageThemeContext';

const Dashboard: React.FC = () => {
  const { theme } = usePageThemeContext();
  
  const stats = [
    {
      name: 'Total Members',
      value: '1,247',
      change: '+12%',
      changeType: 'positive',
      icon: FiUsers,
      color: theme.button,
    },
    {
      name: 'Active Classes',
      value: '23',
      change: '+3',
      changeType: 'positive',
      icon: FiCalendar,
      color: 'bg-emerald-500',
    },
    {
      name: 'Monthly Revenue',
      value: '$45,230',
      change: '+8.2%',
      changeType: 'positive',
      icon: FiDollarSign,
      color: 'bg-rose-500',
    },
    {
      name: 'Growth Rate',
      value: '15.3%',
      change: '+2.1%',
      changeType: 'positive',
      icon: FiTrendingUp,
      color: 'bg-gold-500',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'member',
      title: 'Sarah Johnson joined',
      description: 'New member registration',
      time: '2 minutes ago',
      icon: FiUsers,
      color: 'text-sky-500',
    },
    {
      id: 2,
      type: 'class',
      title: 'Yoga class started',
      description: 'Morning yoga with 12 participants',
      time: '15 minutes ago',
      icon: FiCalendar,
      color: 'text-emerald-500',
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment received',
      description: 'Monthly subscription from Mike Chen',
      time: '1 hour ago',
      icon: FiDollarSign,
      color: 'text-rose-500',
    },
    {
      id: 4,
      type: 'achievement',
      title: 'Goal reached',
      description: 'Monthly revenue target achieved',
      time: '2 hours ago',
      icon: FiStar,
      color: 'text-gold-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Smart Dashboard Overview Cards */}
      <SmartDashboardOverview />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card card-interactive"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Overview */}
        <div className="lg:col-span-2">
          <BusinessOverview />
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              <SmartButton variant="primary" size="sm">
                View All
              </SmartButton>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${activity.color}`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <SmartButton variant="primary" size="lg" fullWidth>
                <FiUsers className="w-4 h-4" />
                <span>Add Member</span>
              </SmartButton>
              <SmartButton variant="primary" size="lg" fullWidth>
                <FiCalendar className="w-4 h-4" />
                <span>Schedule Class</span>
              </SmartButton>
              <SmartButton variant="primary" size="lg" fullWidth>
                <FiDollarSign className="w-4 h-4" />
                <span>Process Payment</span>
              </SmartButton>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveKPITracker />
        <MemberEngagement />
      </div>
    </div>
  );
};

export default Dashboard;
