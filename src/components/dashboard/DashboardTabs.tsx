import React from "react";
import { FiActivity, FiBarChart } from "react-icons/fi";

interface DashboardTabsProps {
  activeTab: "overview" | "analytics";
  onTabChange: (tab: "overview" | "analytics") => void;
}

const tabs = [
  { id: "overview" as const, name: "Overview", icon: FiActivity },
  { id: "analytics" as const, name: "Analytics", icon: FiBarChart },
];

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-1">
      <div className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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