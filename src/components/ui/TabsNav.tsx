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
    className={`mac-segmented max-w-full overflow-x-auto mb-5 ${className}`}
    role="tablist"
  >
    {tabs.map((tab) => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        tabIndex={activeTab === tab.id ? 0 : -1}
        onClick={() => onTabChange(tab.id)}
        className={`mac-segment whitespace-nowrap ${
          activeTab === tab.id ? "mac-segment-active" : "hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        {tab.icon}
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    ))}
  </nav>
);

export default TabsNav;
