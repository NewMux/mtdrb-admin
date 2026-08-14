import * as React from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

const ClassKPICards: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  
  const kpis = [
    {
      name: t("classes.totalClasses"),
      value: "23",
      change: "+3",
      changeType: "positive",
      icon: FiCalendar,
      color: "bg-blue-500",
      description: t("classes.activeClassesToday"),
    },
    {
      name: t("classes.totalEnrollments"),
      value: "156",
      change: "+12%",
      changeType: "positive",
      icon: FiUsers,
      color: "bg-emerald-500",
      description: t("classes.membersEnrolled"),
    },
    {
      name: t("classes.averageAttendance"),
      value: "85%",
      change: "+5%",
      changeType: "positive",
      icon: FiClock,
      color: "bg-rose-500",
      description: t("classes.classAttendanceRate"),
    },
    {
      name: t("classes.peakHours"),
      value: "6-8 PM",
      change: "+2 hours",
      changeType: "positive",
      icon: FiTrendingUp,
      color: "bg-amber-500",
      description: t("classes.busiestTimeSlots"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir={isRTL ? "rtl" : "ltr"}>
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="card card-interactive"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-start">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {kpi.name}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {kpi.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {kpi.description}
              </p>

              <div className="flex items-center gap-1.5 mt-3">
                {kpi.changeType === "positive" ? (
                  <FiTrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <FiTrendingDown className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                )}
                <span
                  className={`text-sm font-medium ${
                    kpi.changeType === "positive"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {kpi.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("classes.fromLastWeek")}
                </span>
              </div>
            </div>

            <div
              className={`w-12 h-12 rounded-xl ${kpi.color} flex items-center justify-center flex-shrink-0`}
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
