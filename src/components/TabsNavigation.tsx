import { useSearchParams } from "react-router-dom";

interface TabsNavigationProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  defaultTab?: string;
  className?: string;
}

export const TabsNavigation = ({
  tabs,
  defaultTab = "overview",
  className = "",
}: TabsNavigationProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || defaultTab;

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <div className={`flex space-x-1 bg-gray-100 p-1 rounded-lg ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          aria-selected={activeTab === tab.id}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === tab.id
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
