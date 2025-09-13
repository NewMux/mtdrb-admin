import * as React from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";

const ClassKPICards: React.FC = () => {
  const kpis = [
    {
      name: "Total Classes",
      value: "23",
      change: "+3",
      changeType: "positive",
      icon: FiCalendar,
      color: "bg-sky-500",
      description: "Active classes today",
    },
    {
      name: "Total Enrollments",
      value: "156",
      change: "+12%",
      changeType: "positive",
      icon: FiUsers,
      color: "bg-emerald-500",
      description: "Members enrolled",
    },
    {
      name: "Average Attendance",
      value: "85%",
      change: "+5%",
      changeType: "positive",
      icon: FiClock,
      color: "bg-rose-500",
      description: "Class attendance rate",
    },
    {
      name: "Peak Hours",
      value: "6-8 PM",
      change: "+2 hours",
      changeType: "positive",
      icon: FiTrendingUp,
      color: "bg-gold-500",
      description: "Busiest time slots",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card card-interactive"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {kpi.name}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {kpi.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {kpi.description}
              </p>

              <div className="flex items-center space-x-1 mt-3">
                {kpi.changeType === "positive" ? (
                  <FiTrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <FiTrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    kpi.changeType === "positive"
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {kpi.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  from last week
                </span>
              </div>
            </div>

            <div
              className={`w-12 h-12 rounded-xl ${kpi.color} flex items-center justify-center`}
            >
              <kpi.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ClassKPICards;
