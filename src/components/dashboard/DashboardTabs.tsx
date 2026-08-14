import React from "react";
import { FiActivity, FiBarChart } from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface DashboardTabsProps {
  activeTab: "overview" | "analytics";
  onTabChange: (tab: "overview" | "analytics") => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const { t } = useTranslation();
  const tabs = [
    { id: "overview" as const, name: t("dashboard.overview"), icon: FiActivity },
    { id: "analytics" as const, name: t("dashboard.analytics"), icon: FiBarChart },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-1">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}; 