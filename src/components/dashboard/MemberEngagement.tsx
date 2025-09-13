import React from "react";
import {
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiArrowUpRight,
} from "react-icons/fi";

const MemberEngagement: React.FC = () => {
  const engagementMetrics = [
    {
      title: "Active Members",
      value: "247",
      icon: <FiUsers className="h-5 w-5" />,
      color: "blue",
      change: "+5",
      trend: "up",
    },
    {
      title: "New Signups",
      value: "12",
      icon: <FiUserPlus className="h-5 w-5" />,
      color: "green",
      change: "+2",
      trend: "up",
    },
  ];

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-6 dark:bg-gray-900 dark:border-gray-800 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <FiUserCheck className="text-blue-600 text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight dark:text-white">
              Member Engagement
            </h2>
            <p className="text-sm text-gray-600">Member activity and growth</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Updated</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {engagementMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-${metric.color}-50 text-${metric.color}-600`}>
                {metric.icon}
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <FiArrowUpRight className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">
                  {metric.change > 0 ? "+" : ""}{metric.change}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
            <div className="text-sm text-gray-600">{metric.title}</div>
            <div className="flex items-center space-x-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${
                metric.trend === "up" ? "bg-green-500" : "bg-red-500"
              }`}></div>
              <span className="text-xs text-gray-500 capitalize">{metric.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MemberEngagement;
