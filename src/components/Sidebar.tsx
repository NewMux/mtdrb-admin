import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiCheckSquare,
  FiUser,
  FiLogOut,
  FiMapPin,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

interface SidebarProps {
  onClose?: () => void;
}

const getNavigation = (t: TFunction) => [
  { name: t("sidebar.dashboard"), href: "/dashboard", icon: FiHome },
  { name: t("sidebar.members"), href: "/dashboard/members", icon: FiUsers },
  { name: t("sidebar.classes"), href: "/dashboard/classes", icon: FiCalendar },
  { name: t("sidebar.trainers"), href: "/dashboard/trainers", icon: FiUser },
  { name: t("sidebar.billing"), href: "/dashboard/billing", icon: FiDollarSign },
  { name: t("sidebar.analytics"), href: "/dashboard/analytics", icon: FiBarChart2 },
  { name: t("sidebar.tasks"), href: "/dashboard/tasks", icon: FiCheckSquare },
  { name: t("sidebar.branches"), href: "/dashboard/branches", icon: FiMapPin },
  { name: t("sidebar.settings"), href: "/dashboard/settings", icon: FiSettings },
];

function getActiveSidebarItem(pathname: string): string {
  if (pathname.startsWith("/dashboard/members")) return "/dashboard/members";
  if (pathname.startsWith("/dashboard/classes")) return "/dashboard/classes";
  if (pathname.startsWith("/dashboard/trainers")) return "/dashboard/trainers";
  if (pathname.startsWith("/dashboard/billing")) return "/dashboard/billing";
  if (pathname.startsWith("/dashboard/analytics")) return "/dashboard/analytics";
  if (pathname.startsWith("/dashboard/tasks")) return "/dashboard/tasks";
  if (pathname.startsWith("/dashboard/branches")) return "/dashboard/branches";
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
  const { signOut, user, isLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const activeItem = getActiveSidebarItem(location.pathname);
  // Force re-render when language changes by using i18n.language as dependency
  const currentLang = i18n.language;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- currentLang isn't read directly but forces recompute when t's translations change language
  const navigation = React.useMemo(() => getNavigation(t), [t, currentLang]);
  const isRTL = currentLang === "ar";

  // Logout handler
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    try {
      await signOut();
      // The AuthContext will handle navigation to landing page
    } catch (error) {
      console.error("Logout error:", error);
      // Force navigation even if there's an error
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  };

  return (
    <div className={`h-full bg-white dark:bg-gray-900 ${isRTL ? 'border-l' : 'border-r'} border-gray-200 dark:border-gray-700 flex flex-col w-64 transition-colors duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-center p-6 border-b border-gray-200 dark:border-gray-700">
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
              key={item.href}
              to={item.href}
              aria-label={item.name}
              className={() => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 min-h-[40px] text-start
                ${
                  isActive
                    ? "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }
              `}
              onClick={onClose}
            >
              <span className="flex items-center justify-center flex-shrink-0">
                <item.icon
                  className={`w-5 h-5 ${isActive ? "text-sky-600 dark:text-sky-400" : "text-gray-500 dark:text-gray-400"}`}
                  aria-hidden="true"
                />
              </span>
              <span className="flex-1 leading-normal">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <FiUser className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="text-start">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                {user?.user_metadata?.full_name ||
                  user?.email?.split("@")[0] ||
                  t("sidebar.user")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            aria-label={t("topbar.signOut") || "Sign out"}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiLogOut className={`w-4 h-4 ${isRTL ? 'rtl-flip' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
