import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiShoppingCart,
  FiBarChart2,
  FiActivity,
  FiSettings,
  FiCheckSquare,
  FiUser,
  FiLogOut,
  FiMapPin,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { BrandMark } from "./BrandMark";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

interface SidebarProps {
  onClose?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
}

interface NavSection {
  // Untitled sections render without a heading, like the top group of a
  // Finder sidebar.
  title?: string;
  items: NavItem[];
}

const getNavigation = (t: TFunction): NavSection[] => [
  {
    items: [{ name: t("sidebar.dashboard"), href: "/dashboard", icon: FiHome }],
  },
  {
    title: t("sidebar.sectionPeople"),
    items: [
      { name: t("sidebar.members"), href: "/dashboard/members", icon: FiUsers },
      { name: t("sidebar.classes"), href: "/dashboard/classes", icon: FiCalendar },
      { name: t("sidebar.trainers"), href: "/dashboard/trainers", icon: FiUser },
      { name: t("sidebar.attendance"), href: "/dashboard/attendance", icon: FiActivity },
    ],
  },
  {
    title: t("sidebar.sectionBusiness"),
    items: [
      { name: t("sidebar.billing"), href: "/dashboard/billing", icon: FiDollarSign },
      { name: t("sidebar.pos"), href: "/dashboard/pos", icon: FiShoppingCart },
      { name: t("sidebar.analytics"), href: "/dashboard/analytics", icon: FiBarChart2 },
    ],
  },
  {
    title: t("sidebar.sectionWorkspace"),
    items: [
      { name: t("sidebar.tasks"), href: "/dashboard/tasks", icon: FiCheckSquare },
      { name: t("sidebar.branches"), href: "/dashboard/branches", icon: FiMapPin },
      { name: t("sidebar.settings"), href: "/dashboard/settings", icon: FiSettings },
    ],
  },
];

function getActiveSidebarItem(pathname: string): string {
  if (pathname.startsWith("/dashboard/members")) return "/dashboard/members";
  if (pathname.startsWith("/dashboard/classes")) return "/dashboard/classes";
  if (pathname.startsWith("/dashboard/trainers")) return "/dashboard/trainers";
  if (pathname.startsWith("/dashboard/billing")) return "/dashboard/billing";
  if (pathname.startsWith("/dashboard/pos")) return "/dashboard/pos";
  if (pathname.startsWith("/dashboard/analytics")) return "/dashboard/analytics";
  if (pathname.startsWith("/dashboard/attendance")) return "/dashboard/attendance";
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

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || t("sidebar.user");
  const initials = String(displayName)
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`mac-sidebar h-full ${isRTL ? "border-l" : "border-r"} border-black/10 dark:border-black/60 flex flex-col w-60 lg:w-56 select-none`}
    >
      {/* Header: sits in the title-bar row, same height as the toolbar. */}
      <div className="flex items-center h-[52px] px-4 shrink-0">
        <BrandMark className="text-[15px] text-gray-900 dark:text-white" />
      </div>

      {/* Source list */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-4">
        {navigation.map((section, index) => (
          <div key={section.title ?? index}>
            {section.title && (
              <h2 className="px-2 pb-1 text-[11px] font-semibold text-gray-500/90 dark:text-gray-400/80">
                {section.title}
              </h2>
            )}
            <ul className="space-y-px">
              {section.items.map((item) => {
                const isActive = item.href === activeItem;
                return (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      aria-label={item.name}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-2 h-7 px-2 rounded-md text-sm text-start transition-colors duration-75 ${
                        isActive
                          ? "bg-black/[0.08] dark:bg-white/[0.12] text-gray-900 dark:text-white font-medium"
                          : "text-gray-800 dark:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                      }`}
                      onClick={onClose}
                    >
                      <item.icon
                        className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-500"
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Account */}
      <div className="px-2.5 py-2.5 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2 px-2 h-9">
          <div className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-500 flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
            {initials || <FiUser className="w-3 h-3" />}
          </div>
          <p className="flex-1 min-w-0 truncate text-sm text-gray-800 dark:text-gray-200 text-start">
            {displayName}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            aria-label={t("topbar.signOut") || "Sign out"}
            title={t("topbar.signOut") || "Sign out"}
            className="mac-toolbar-button h-6 min-w-[24px] px-1 disabled:opacity-40"
          >
            <FiLogOut className={`w-3.5 h-3.5 ${isRTL ? "rtl-flip" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
