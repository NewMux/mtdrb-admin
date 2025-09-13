import React from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiStar,
} from "react-icons/fi";
import { KPICard } from "../ui/DesignSystem";
import { SmartDashboardOverview } from "./SmartDashboardOverview";
import { LiveKPITracker } from "./LiveKPITracker";
import MemberEngagement from "./MemberEngagement";
import BusinessOverview from "./BusinessOverview";

interface DashboardOverviewProps {
  refreshKey: number;
}

const primaryStats = [
  {
    name: "Total Revenue",
    value: "$45,280",
    change: "+$5,160 vs last month",
    icon: <FiDollarSign className="w-6 h-6" />,
    color: "green" as const,
    target: "$50,000",
    progress: 90.6,
  },
  {
    name: "Active Members",
    value: "1,247",
    change: "+58 vs last month",
    icon: <FiUsers className="w-6 h-6" />,
    color: "blue" as const,
    target: "1,300",
    progress: 95.9,
  },
  {
    name: "Class Attendance",
    value: "78%",
    change: "+6% vs last month",
    icon: <FiCalendar className="w-6 h-6" />,
    color: "purple" as const,
    target: "85%",
    progress: 91.8,
  },
  {
    name: "Member Satisfaction",
    value: "4.7/5",
    change: "+0.2 vs last month",
    icon: <FiStar className="w-6 h-6" />,
    color: "yellow" as const,
    target: "4.8",
    progress: 97.9,
  },
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  refreshKey 
}) => {
  return (
    <div className="space-y-8">
      {/* Primary Stats - Enhanced 2x2 Grid with Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {primaryStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-600">Target</div>
                  <div className="text-sm font-semibold text-gray-900">{stat.target}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.name}</div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">{Math.round(stat.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-${stat.color}-500 transition-all duration-300`}
                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{stat.change}</span>
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium">Live</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content - Enhanced Single Column Layout */}
      <div className="space-y-8">
        <SmartDashboardOverview refreshKey={refreshKey} />
        <BusinessOverview />
        <LiveKPITracker />
        <MemberEngagement />
      </div>
    </div>
  );
}; 