import * as React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiGift,
  FiFileText,
  FiCheckSquare,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { usePageThemeContext } from "../contexts/PageThemeContext";
import { useTheme } from "../contexts/ThemeContext";

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: FiHome },
  { name: "Members", href: "/members", icon: FiUsers },
  { name: "Classes", href: "/classes", icon: FiCalendar },
  { name: "Trainers", href: "/trainers", icon: FiUser },
  { name: "Billing", href: "/billing", icon: FiDollarSign },
  { name: "Analytics", href: "/analytics", icon: FiBarChart2 },
  { name: "Tasks", href: "/tasks", icon: FiCheckSquare },
  { name: "Promotions", href: "/promotions", icon: FiGift },
  { name: "Settings", href: "/settings", icon: FiSettings },
];

function getActiveSidebarItem(pathname) {
  if (pathname.startsWith("/dashboard/members")) return "/members";
  if (pathname.startsWith("/dashboard/classes")) return "/classes";
  if (pathname.startsWith("/dashboard/trainers")) return "/trainers";
  if (pathname.startsWith("/dashboard/billing")) return "/billing";
  if (pathname.startsWith("/dashboard/analytics")) return "/analytics";
  if (pathname.startsWith("/dashboard/tasks")) return "/tasks";
  if (pathname.startsWith("/dashboard/promotions")) return "/promotions";

  if (pathname.startsWith("/dashboard/settings")) return "/settings";
  if (pathname.startsWith("/dashboard")) return "/dashboard";
  // Handle reports redirect to analytics
  if (pathname.startsWith("/reports")) return "/analytics";
  // Handle home/landing page
  if (pathname === "/" || pathname === "") return "/";
  // fallback: try to match top-level
  return pathname.split("/").length > 1
    ? `/${pathname.split("/")[1]}`
    : pathname;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const activeItem = getActiveSidebarItem(location.pathname);

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut();
      // The AuthContext will handle navigation to landing page
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col w-64">
      {/* Header */}
      <div className="flex items-center justify-center p-6 border-b border-gray-200 dark:border-gray-800">
        <img 
          src="/mtdrb-logo.svg" 
          alt="MTDRB" 
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = item.href === activeItem;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={() => `
                flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200
                ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }
              `}
              onClick={onClose}
            >
              <item.icon
                className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
              />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <FiUser className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-white">
                {user?.user_metadata?.full_name ||
                  user?.email?.split("@")[0] ||
                  "User"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <FiLogOut className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
