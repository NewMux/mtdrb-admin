import React from "react";

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

const TabsNav: React.FC<TabsNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}) => (
  <nav
    className={`flex overflow-x-auto gap-4 px-6 py-4 mb-6 mt-2 ${className}`}
    role="tablist"
  >
    {tabs.map((tab) => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        tabIndex={activeTab === tab.id ? 0 : -1}
        onClick={() => onTabChange(tab.id)}
        className={`text-sm font-medium px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 whitespace-nowrap
          ${
            activeTab === tab.id
              ? "bg-lunaLight/30 text-lunaCyan shadow-sm border border-lunaLight/50"
              : "text-lunaNavy/70 hover:bg-gray-100 hover:text-lunaNavy"
          }
        `}
      >
        {tab.icon}
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    ))}
  </nav>
);

export default TabsNav;
