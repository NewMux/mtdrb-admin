/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

interface TabState {
  [key: string]: string;
}

interface UIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabHistory: TabState;
  setTabForPath: (path: string, tab: string) => void;
  getTabForPath: (path: string) => string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showLoadingSpinner: (message?: string) => void;
  hideLoadingSpinner: () => void;
  setBottomUIHeight: (height: number) => void;
  bottomUIHeight: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const TAB_HISTORY_KEY = "mtdrb_tab_history";
const DARK_MODE_KEY = "mtdrb_dark_mode";
const SIDEBAR_STATE_KEY = "mtdrb_sidebar_state";

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [tabHistory, setTabHistory] = useState<TabState>(() => {
    try {
      const saved = localStorage.getItem(TAB_HISTORY_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DARK_MODE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [bottomUIHeight, setBottomUIHeight] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const setTabForPath = useCallback(
    (path: string, tab: string) => {
      const newHistory = { ...tabHistory, [path]: tab };
      setTabHistory(newHistory);
      localStorage.setItem(TAB_HISTORY_KEY, JSON.stringify(newHistory));
      setActiveTab(tab);
    },
    [tabHistory],
  );

  const getTabForPath = useCallback(
    (path: string) => {
      return tabHistory[path] || "overview";
    },
    [tabHistory],
  );

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem(DARK_MODE_KEY, JSON.stringify(newValue));
      if (newValue) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newValue;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const newValue = !prev;
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  // Apply dark mode on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, [isDarkMode]);

  const showLoadingSpinner = useCallback((message: string = "Loading...") => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);

  const hideLoadingSpinner = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage("");
  }, []);

  const value = {
    activeTab,
    setActiveTab: handleTabChange,
    tabHistory,
    setTabForPath,
    getTabForPath,
    isDarkMode,
    toggleDarkMode,
    isSidebarOpen,
    toggleSidebar,
    isLoading,
    setIsLoading,
    showLoadingSpinner,
    hideLoadingSpinner,
    setBottomUIHeight,
    bottomUIHeight,
    drawerOpen,
    setDrawerOpen,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-center text-gray-600">{loadingMessage}</p>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}

// Hook to handle tab state with router integration
export function useTabState() {
  const { activeTab, setActiveTab, getTabForPath, setTabForPath } = useUI();

  // This hook can be used in components that need router integration
  const initializeTabForRoute = (pathname: string) => {
    const savedTab = getTabForPath(pathname);
    setActiveTab(savedTab);
  };

  const setTabForRoute = (pathname: string, tab: string) => {
    setTabForPath(pathname, tab);
  };

  return {
    activeTab,
    setActiveTab,
    initializeTabForRoute,
    setTabForRoute,
  };
}
