import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const TabsNav: React.FC<TabsNavProps> = ({ tabs, activeTab, onTabChange, className = '' }) => (
  <nav
    className={`flex overflow-x-auto gap-4 px-4 py-2 mb-8 mt-2 ${className}`}
    role="tablist"
  >
    {tabs.map((tab) => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        tabIndex={activeTab === tab.id ? 0 : -1}
        onClick={() => onTabChange(tab.id)}
        className={`text-sm font-medium px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap
          ${activeTab === tab.id
            ? 'bg-blue-100 text-blue-700 shadow-sm dark:bg-gray-800 dark:text-blue-300'
            : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800'}
        `}
      >
        {tab.icon}
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    ))}
  </nav>
);

export default TabsNav; 