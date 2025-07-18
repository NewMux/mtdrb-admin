import React from 'react';
import { FiTrendingUp, FiUsers, FiClock, FiTarget, FiActivity, FiPieChart } from 'react-icons/fi';

interface SmartTaskAnalyticsProps {
  refreshKey: number;
}

const SmartTaskAnalytics: React.FC<SmartTaskAnalyticsProps> = ({ refreshKey }) => {
  const analytics = {
    taskCompletion: [
      { period: 'This Week', completed: 45, total: 52, rate: 87 },
      { period: 'Last Week', completed: 38, total: 41, rate: 93 },
      { period: 'This Month', completed: 187, total: 215, rate: 87 },
    ],
    categories: [
      { name: 'Member Management', count: 28, percentage: 54, color: 'bg-blue-500' },
      { name: 'Class Operations', count: 12, percentage: 23, color: 'bg-green-500' },
      { name: 'Facility Maintenance', count: 8, percentage: 15, color: 'bg-purple-500' },
      { name: 'Staff Training', count: 4, percentage: 8, color: 'bg-yellow-500' },
    ],
    productivity: [
      { day: 'Mon', completed: 8, assigned: 10 },
      { day: 'Tue', completed: 12, assigned: 14 },
      { day: 'Wed', completed: 9, assigned: 11 },
      { day: 'Thu', completed: 15, assigned: 16 },
      { day: 'Fri', completed: 11, assigned: 13 },
    ]
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Task Analytics</h1>
          <p className="text-gray-600 mt-1">Advanced insights and performance metrics</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            Export Report
          </button>
          <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 ease-in-out font-semibold min-h-[44px]">
            View Details
          </button>
        </div>
      </div>

      {/* Completion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analytics.taskCompletion.map((metric, index) => (
          <div key={index} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{metric.period}</h3>
              <FiTarget className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-gray-900">{metric.rate}%</p>
              <p className="text-sm text-gray-600">{metric.completed} of {metric.total} completed</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metric.rate}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Task Categories</h2>
          <div className="space-y-4">
            {analytics.categories.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                  <span className="text-gray-700 font-medium">{category.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-900 font-bold">{category.count}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Productivity</h2>
          <div className="space-y-4">
            {analytics.productivity.map((day) => (
              <div key={day.day} className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{day.day}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-3 relative">
                    <div 
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${(day.completed / day.assigned) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-16">{day.completed}/{day.assigned}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Peak Hours', value: '10-12 AM', icon: FiClock, color: 'text-blue-600' },
            { title: 'Top Performer', value: 'Sarah J.', icon: FiUsers, color: 'text-green-600' },
            { title: 'Avg Resolution', value: '2.3 hours', icon: FiActivity, color: 'text-purple-600' },
            { title: 'Automation Rate', value: '34%', icon: FiTrendingUp, color: 'text-yellow-600' },
          ].map((insight, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <insight.icon className={`h-5 w-5 ${insight.color}`} />
                <span className="text-xs text-gray-500">INSIGHT</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{insight.value}</p>
              <p className="text-sm text-gray-600">{insight.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SmartTaskAnalytics; 