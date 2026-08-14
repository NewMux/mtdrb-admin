import * as React from "react";
import { motion } from "framer-motion";
import { FiUsers, FiUserCheck, FiUserX, FiUserPlus } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

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
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  const cards = [
    {
      title: t("members.totalMembers", "إجمالي الأعضاء"),
      value: stats.total,
      change: "+12%",
      changeType: "positive",
      icon: FiUsers,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50/50 dark:bg-blue-900/20",
    },
    {
      title: t("members.activeMembers", "الأعضاء النشطون"),
      value: stats.active,
      change: "+8%",
      changeType: "positive",
      icon: FiUserCheck,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50/50 dark:bg-emerald-900/20",
    },
    {
      title: t("members.inactiveMembers", "الأعضاء غير النشطين"),
      value: stats.inactive,
      change: "-3%",
      changeType: "negative",
      icon: FiUserX,
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-50/50 dark:bg-gray-900/20",
    },
    {
      title: t("members.newThisMonth", "جدد هذا الشهر"),
      value: stats.newThisMonth,
      change: "+15%",
      changeType: "positive",
      icon: FiUserPlus,
      color: "from-rose-500 to-rose-600",
      bgColor: "bg-rose-50/50 dark:bg-rose-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir={isRTL ? "rtl" : "ltr"}>
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`card ${card.bgColor} border border-gray-100 dark:border-gray-700/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Icon on the start side in RTL */}
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center flex-shrink-0 shadow-md`}
            >
              <card.icon className="w-6 h-6 text-white" />
            </div>

            {/* Metrics */}
            <div className="text-start flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {card.value.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span
                  className={`font-semibold ${
                    card.changeType === "positive"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {card.change}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {t("members.fromLastMonth", "مقارنة بالشهر الماضي")}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MemberKPICards;
