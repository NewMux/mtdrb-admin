import * as React from "react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
} from "react-icons/fi";

const BillingKPICards: React.FC = () => {
  const kpis = [
    {
      name: "Monthly Revenue",
      value: "$45,230",
      change: "+8.2%",
      changeType: "positive",
      icon: FiDollarSign,
      color: "bg-emerald-500",
      description: "Total revenue this month",
    },
    {
      name: "Outstanding Payments",
      value: "$12,450",
      change: "-15%",
      changeType: "negative",
      icon: FiCreditCard,
      color: "bg-rose-500",
      description: "Pending payments",
    },
    {
      name: "Payment Rate",
      value: "94.2%",
      change: "+2.1%",
      changeType: "positive",
      icon: FiTrendingUp,
      color: "bg-sky-500",
      description: "On-time payment rate",
    },
    {
      name: "Active Subscriptions",
      value: "1,189",
      change: "+23",
      changeType: "positive",
      icon: FiUsers,
      color: "bg-gold-500",
      description: "Active memberships",
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
                  from last month
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

export default BillingKPICards;
