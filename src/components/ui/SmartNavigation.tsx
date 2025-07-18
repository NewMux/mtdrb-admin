import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FiHome, FiUsers, FiCalendar, FiCreditCard, FiUserCheck, 
  FiSettings, FiBell, FiTrendingUp, FiClipboard, FiGift,
  FiFileText, FiTarget, FiChevronRight, FiArrowLeft
} from "react-icons/fi";
import { SmartButton } from "./DesignSystem";

// ===== NAVIGATION CONFIGURATION =====
export const navigationConfig = {
  dashboard: {
    title: "Dashboard",
    icon: <FiHome className="h-5 w-5" />,
    path: "/dashboard",
    description: "Smart overview and insights",
    connections: ["members", "classes", "billing", "analytics"]
  },
  members: {
    title: "Members",
    icon: <FiUsers className="h-5 w-5" />,
    path: "/members",
    description: "Member management and analytics",
    connections: ["classes", "billing", "trainers", "analytics"]
  },
  classes: {
    title: "Classes",
    icon: <FiCalendar className="h-5 w-5" />,
    path: "/classes",
    description: "Class scheduling and management",
    connections: ["members", "trainers", "analytics", "dashboard"]
  },
  trainers: {
    title: "Trainers",
    icon: <FiUserCheck className="h-5 w-5" />,
    path: "/trainers",
    description: "Trainer management and performance",
    connections: ["classes", "members", "analytics", "billing"]
  },
  billing: {
    title: "Billing",
    icon: <FiCreditCard className="h-5 w-5" />,
    path: "/billing",
    description: "Payments and financial management",
    connections: ["members", "analytics", "reports", "dashboard"]
  },
  analytics: {
    title: "Analytics",
    icon: <FiTrendingUp className="h-5 w-5" />,
    path: "/analytics",
    description: "Business insights and reports",
    connections: ["dashboard", "members", "classes", "billing"]
  },
  tasks: {
    title: "Tasks",
    icon: <FiClipboard className="h-5 w-5" />,
    path: "/tasks",
    description: "Task management and automation",
    connections: ["dashboard", "members", "notifications"]
  },
  notifications: {
    title: "Notifications",
    icon: <FiBell className="h-5 w-5" />,
    path: "/notifications",
    description: "Communication and alerts",
    connections: ["members", "tasks", "promotions"]
  },
  promotions: {
    title: "Promotions",
    icon: <FiGift className="h-5 w-5" />,
    path: "/promotions",
    description: "Marketing campaigns and offers",
    connections: ["members", "notifications", "analytics"]
  },
  reports: {
    title: "Reports",
    icon: <FiFileText className="h-5 w-5" />,
    path: "/reports",
    description: "Custom reports and exports",
    connections: ["analytics", "billing", "members"]
  },
  insights: {
    title: "Insights",
    icon: <FiTarget className="h-5 w-5" />,
    path: "/insights", 
    description: "AI-powered business insights",
    connections: ["dashboard", "analytics", "members"]
  },
  settings: {
    title: "Settings",
    icon: <FiSettings className="h-5 w-5" />,
    path: "/settings",
    description: "System configuration",
    connections: ["notifications", "billing"]
  }
};

// ===== QUICK NAVIGATION COMPONENT =====
interface QuickNavProps {
  currentPage: string;
  maxConnections?: number;
}

export const QuickNavigation: React.FC<QuickNavProps> = ({
  currentPage,
  maxConnections = 4
}) => {
  const navigate = useNavigate();
  const current = navigationConfig[currentPage as keyof typeof navigationConfig];
  
  if (!current || !current.connections.length) return null;

  const connections = current.connections
    .slice(0, maxConnections)
    .map(key => navigationConfig[key as keyof typeof navigationConfig])
    .filter(Boolean);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Navigation</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {connections.map((connection) => (
          <motion.button
            key={connection.path}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(connection.path)}
            className="flex items-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left"
          >
            <div className="text-blue-600">
              {connection.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">{connection.title}</p>
              <p className="text-xs text-blue-600">{connection.description.split(' ').slice(0, 2).join(' ')}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ===== BREADCRUMB NAVIGATION =====
interface SmartBreadcrumbProps {
  items: Array<{
    label: string;
    path?: string;
    current?: boolean;
  }>;
}

export const SmartBreadcrumb: React.FC<SmartBreadcrumbProps> = ({ items }) => {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center space-x-2 mb-6">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <FiChevronRight className="h-4 w-4 text-gray-400" />
          )}
          {item.current ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <button
              onClick={() => item.path && navigate(item.path)}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// ===== SMART PAGE SUGGESTIONS =====
interface PageSuggestion {
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

interface SmartSuggestionsProps {
  currentPage: string;
  userRole?: string;
  recentActivity?: string[];
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  currentPage,
  userRole = 'owner',
  recentActivity = []
}) => {
  const navigate = useNavigate();

  const generateSuggestions = (): PageSuggestion[] => {
    const suggestions: PageSuggestion[] = [];

    // Smart suggestions based on current page
    if (currentPage === 'dashboard') {
      suggestions.push(
        {
          title: "Check Member Activity",
          description: "Review recent member check-ins and activity",
          path: "/members",
          icon: <FiUsers className="h-5 w-5" />,
          priority: 'high'
        },
        {
          title: "View Class Schedule",
          description: "Manage today's classes and bookings",
          path: "/classes",
          icon: <FiCalendar className="h-5 w-5" />,
          priority: 'high'
        }
      );
    }

    if (currentPage === 'members') {
      suggestions.push(
        {
          title: "Schedule Classes",
          description: "Create classes based on member preferences",
          path: "/classes",
          icon: <FiCalendar className="h-5 w-5" />,
          priority: 'high'
        },
        {
          title: "Send Notifications",
          description: "Communicate with your members",
          path: "/notifications",
          icon: <FiBell className="h-5 w-5" />,
          priority: 'medium'
        }
      );
    }

    if (currentPage === 'billing') {
      suggestions.push(
        {
          title: "View Analytics",
          description: "Analyze revenue trends and patterns",
          path: "/analytics",
          icon: <FiTrendingUp className="h-5 w-5" />,
          priority: 'high'
        },
        {
          title: "Generate Reports",
          description: "Create financial reports and statements",
          path: "/reports",
          icon: <FiFileText className="h-5 w-5" />,
          priority: 'medium'
        }
      );
    }

    return suggestions.slice(0, 3);
  };

  const suggestions = generateSuggestions();

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Smart Suggestions</h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
          AI Powered
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(suggestion.path)}
            className="text-left p-4 bg-white rounded-xl border border-blue-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="text-blue-600">{suggestion.icon}</div>
              <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
            </div>
            <p className="text-sm text-gray-600">{suggestion.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${
                suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {suggestion.priority} priority
              </span>
              <FiChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ===== PAGE NAVIGATION HOOK =====
export const usePageNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentPage = () => {
    const path = location.pathname;
    return Object.entries(navigationConfig).find(([key, config]) => 
      config.path === path
    )?.[0] || 'dashboard';
  };

  const navigateToPage = (pageKey: string) => {
    const page = navigationConfig[pageKey as keyof typeof navigationConfig];
    if (page) {
      navigate(page.path);
    }
  };

  const getPageConnections = (pageKey: string) => {
    const page = navigationConfig[pageKey as keyof typeof navigationConfig];
    return page?.connections || [];
  };

  return {
    currentPage: getCurrentPage(),
    navigateToPage,
    getPageConnections,
    navigationConfig
  };
};
