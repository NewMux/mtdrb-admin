import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
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
  { name: "Members", href: "/dashboard/members", icon: FiUsers },
  { name: "Classes", href: "/dashboard/classes", icon: FiCalendar },
  { name: "Trainers", href: "/dashboard/trainers", icon: FiUser },
  { name: "Billing", href: "/dashboard/billing", icon: FiDollarSign },
  { name: "Analytics", href: "/dashboard/analytics", icon: FiBarChart2 },
  { name: "Tasks", href: "/dashboard/tasks", icon: FiCheckSquare },
  { name: "Settings", href: "/dashboard/settings", icon: FiSettings },
];

function getActiveSidebarItem(pathname) {
  if (pathname.startsWith("/dashboard/members")) return "/dashboard/members";
  if (pathname.startsWith("/dashboard/classes")) return "/dashboard/classes";
  if (pathname.startsWith("/dashboard/trainers")) return "/dashboard/trainers";
  if (pathname.startsWith("/dashboard/billing")) return "/dashboard/billing";
  if (pathname.startsWith("/dashboard/analytics")) return "/dashboard/analytics";
  if (pathname.startsWith("/dashboard/tasks")) return "/dashboard/tasks";
  if (pathname.startsWith("/dashboard/settings")) return "/dashboard/settings";
  if (pathname.startsWith("/dashboard")) return "/dashboard";
  // Handle reports redirect to analytics
  if (pathname.startsWith("/dashboard/reports") || pathname.startsWith("/reports")) {
    return "/dashboard/analytics";
  }
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
    <div className="h-full bg-white border-r border-gray-200 flex flex-col w-64">
      {/* Header */}
      <div className="flex items-center justify-center p-6 border-b border-gray-200">
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
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
              onClick={onClose}
            >
              <item.icon
                className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-500"}`}
              />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
              <FiUser className="w-3 h-3 text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-900">
                {user?.user_metadata?.full_name ||
                  user?.email?.split("@")[0] ||
                  "User"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <FiLogOut className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
