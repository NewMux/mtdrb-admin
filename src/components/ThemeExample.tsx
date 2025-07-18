import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiUsers, FiCalendar, FiDollarSign, FiBarChart, FiSettings, FiGift, FiCheckSquare } from 'react-icons/fi';
import { usePageThemeContext } from '../contexts/PageThemeContext';

/**
 * Example component demonstrating the page-specific theme system
 * Shows how to use theme colors for various UI elements
 */
const ThemeExample: React.FC = () => {
  const { theme, getButtonClasses, getCardClasses, getBadgeClasses, getTabClasses, getIconClasses, getStatusClasses } = usePageThemeContext();

  const exampleStats = [
    { name: 'Total Items', value: '1,247', icon: FiUsers, change: '+12%' },
    { name: 'Active Items', value: '23', icon: FiCalendar, change: '+3' },
    { name: 'Revenue', value: '$45,230', icon: FiDollarSign, change: '+8.2%' },
    { name: 'Growth', value: '15.3%', icon: FiBarChart, change: '+2.1%' },
  ];

  const exampleTabs = [
    { id: 'overview', name: 'Overview', icon: FiUsers },
    { id: 'analytics', name: 'Analytics', icon: FiBarChart },
    { id: 'settings', name: 'Settings', icon: FiSettings },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header with Theme */}
      <div className="text-center">
        <h1 className={`text-3xl font-bold ${theme.icon} mb-2`}>
          {theme.pageName} Theme Example
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {theme.pageDescription} - Using {theme.accent} color scheme
        </p>
      </div>

      {/* Theme Information Card */}
      <div className={getCardClasses('accent')}>
        <h3 className="text-lg font-semibold mb-4">Current Theme Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Primary Color:</span>
            <div className="flex items-center space-x-2 mt-1">
              <div 
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: theme.accent }}
              />
              <span>{theme.accent}</span>
            </div>
          </div>
          <div>
            <span className="font-medium">Gradient:</span>
            <div className={`w-6 h-6 rounded mt-1 ${theme.gradient}`} />
          </div>
          <div>
            <span className="font-medium">Icon Color:</span>
            <div className={`w-6 h-6 rounded mt-1 ${theme.icon.replace('text-', 'bg-')}`} />
          </div>
          <div>
            <span className="font-medium">Button Style:</span>
            <div className={`w-6 h-6 rounded mt-1 ${theme.button.replace('hover:bg-', '').replace('bg-', 'bg-')}`} />
          </div>
        </div>
      </div>

      {/* Stats Cards with Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {exampleStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={getCardClasses('hover')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <span className={`text-sm font-medium ${theme.icon}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">from last month</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl ${theme.button} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Buttons with Theme */}
      <div className={getCardClasses('default')}>
        <h3 className="text-lg font-semibold mb-4">Theme Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <button className={getButtonClasses('primary')}>
            <FiPlus className="w-4 h-4" />
            <span>Primary Button</span>
          </button>
          <button className={getButtonClasses('secondary')}>
            <FiUsers className="w-4 h-4" />
            <span>Secondary Button</span>
          </button>
          <button className={getButtonClasses('outline')}>
            <FiCalendar className="w-4 h-4" />
            <span>Outline Button</span>
          </button>
        </div>
      </div>

      {/* Tabs with Theme */}
      <div className={getCardClasses('default')}>
        <h3 className="text-lg font-semibold mb-4">Theme Tabs</h3>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {exampleTabs.map((tab, index) => (
              <button
                key={tab.id}
                className={getTabClasses(index === 0)}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Badges with Theme */}
      <div className={getCardClasses('default')}>
        <h3 className="text-lg font-semibold mb-4">Theme Badges</h3>
        <div className="flex flex-wrap gap-4">
          <span className={getBadgeClasses('default')}>Default Badge</span>
          <span className={getBadgeClasses('success')}>Success Badge</span>
          <span className={getBadgeClasses('warning')}>Warning Badge</span>
          <span className={getBadgeClasses('error')}>Error Badge</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className={getCardClasses('default')}>
        <h3 className="text-lg font-semibold mb-4">Status Indicators</h3>
        <div className="flex flex-wrap gap-4">
          <span className={getStatusClasses('active')}>Active</span>
          <span className={getStatusClasses('inactive')}>Inactive</span>
          <span className={getStatusClasses('pending')}>Pending</span>
          <span className={getStatusClasses('completed')}>Completed</span>
          <span className={getStatusClasses('error')}>Error</span>
        </div>
      </div>

      {/* Icons with Theme */}
      <div className={getCardClasses('default')}>
        <h3 className="text-lg font-semibold mb-4">Theme Icons</h3>
        <div className="flex flex-wrap gap-6">
          <FiUsers className={getIconClasses('sm')} />
          <FiCalendar className={getIconClasses('md')} />
          <FiDollarSign className={getIconClasses('lg')} />
          <FiBarChart className={getIconClasses('md')} />
          <FiSettings className={getIconClasses('sm')} />
          <FiGift className={getIconClasses('md')} />
          <FiCheckSquare className={getIconClasses('lg')} />
        </div>
      </div>

      {/* Gradient Examples */}
      <div className={getCardClasses('default')}>
        <h3 className="text-lg font-semibold mb-4">Gradient Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`h-20 rounded-xl ${getGradient('to-r')} flex items-center justify-center text-white font-semibold`}>
            Right Gradient
          </div>
          <div className={`h-20 rounded-xl ${getGradient('to-br')} flex items-center justify-center text-white font-semibold`}>
            Diagonal Gradient
          </div>
          <div className={`h-20 rounded-xl ${getGradient('to-t')} flex items-center justify-center text-white font-semibold`}>
            Top Gradient
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className={getCardClasses('default')}>
        <h3 className="text-lg font-semibold mb-4">Color Palette</h3>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(theme.primary).map(([shade, color]) => (
            <div key={shade} className="text-center">
              <div 
                className="w-12 h-12 rounded border mx-auto mb-1"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{shade}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeExample; 