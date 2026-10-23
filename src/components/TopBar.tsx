import * as React from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiBell,
  FiSearch,
  FiUser,
  FiShield,
  FiCreditCard,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { SmartModal } from "./ui/SmartModal";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useTheme } from "../contexts/ThemeContext";
import { FiMoon, FiSun } from "react-icons/fi";
import type { PostgrestError } from "@supabase/supabase-js";

interface TopBarProps {
  onMenuClick: () => void;
}

// Notifications table isn't modeled in src/types/supabase.ts (feature is
// optional / may not exist for every tenant), so we describe the shape we
// actually read/write here based on usage in this component.
interface AppNotification {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  created_at: string;
  read_at?: string | null;
  is_read?: boolean;
  [key: string]: unknown;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { tenantId } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // State for dropdowns and modals
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Force re-render when language changes
  const currentLang = i18n.language;

  // Get page title based on current route - use useMemo to ensure it updates when language changes
  const pageTitle = React.useMemo(() => {
    const path = location.pathname;
    if (path.includes("/members")) return t("members.title");
    if (path.includes("/classes")) return t("classes.title");
    if (path.includes("/trainers")) return t("trainers.title");
    if (path.includes("/billing")) return t("billing.title");
    if (path.includes("/pos")) return t("sidebar.pos");
    if (path.includes("/analytics") || path.includes("/reports")) return t("analytics.title");
    if (path.includes("/attendance")) return t("sidebar.attendance");
    if (path.includes("/tasks")) return t("tasks.title");
    if (path.includes("/branches")) return t("sidebar.branches");
    if (path.includes("/settings")) return t("settings.title");
    if (path.includes("/profile")) return t("settings.profile");
    return t("dashboard.title");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- currentLang isn't read directly but forces recompute when t's translations change language
  }, [location.pathname, t, currentLang]);

  const isRTL = currentLang === "ar";

  // Handle notification click
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    // Skip if no database-backed tenant or if it's the invalid/null UUID
    if (!tenantId || tenantId === "00000000-0000-0000-0000-000000000000") {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        // Handle specific error cases
        if (error.code === "PGRST116" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
          // Table doesn't exist - silently fail (notifications feature not set up)
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        
        // Log detailed error information
        console.error("Error fetching notifications:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: (error as PostgrestError & { status?: number; statusCode?: number }).status,
          statusCode: (error as PostgrestError & { status?: number; statusCode?: number }).statusCode,
          fullError: error,
        });
        return;
      }

      setNotifications((data as AppNotification[] | null) || []);
      // Count unread (check for read_at or is_read field, or assume all are unread if neither exists)
      const unread = ((data as AppNotification[] | null) || []).filter((n) => {
        if (n.read_at !== null && n.read_at !== undefined) return false;
        if (n.is_read === false) return true;
        if (n.is_read === true) return false;
        // If neither field exists, consider it unread
        return true;
      }).length;
      setUnreadCount(unread);
    } catch (err: unknown) {
      // Log detailed error information for caught errors
      const errorDetails =
        typeof err === "object" && err !== null
          ? (err as {
              message?: string;
              code?: string;
              status?: number;
              statusCode?: number;
              name?: string;
              stack?: string;
            })
          : undefined;
      console.error("Error fetching notifications:", {
        message: errorDetails?.message || String(err),
        code: errorDetails?.code,
        status: errorDetails?.status,
        statusCode: errorDetails?.statusCode,
        name: errorDetails?.name,
        stack: errorDetails?.stack,
        fullError: err,
      });
      
      // Set empty state on error
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [tenantId]);

  // Fetch notifications on mount and when tenant changes
  React.useEffect(() => {
    if (tenantId) {
      fetchNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [tenantId, fetchNotifications]);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".notification-container")) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="mac-toolbar sticky top-0 z-30 h-[52px] shrink-0 px-3 sm:px-5 flex items-center">
        <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
          {/* Start Section (Title & Mobile Menu) */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden mac-toolbar-button"
              aria-label={t("topbar.toggleMenu")}
            >
              <FiMenu className="w-4 h-4" />
            </button>

            {/* Window title (chrome; each page renders its own h1) */}
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {pageTitle}
            </span>
          </div>

          {/* End Section (Search, Theme & Notifications) */}
          <div className="flex items-center gap-1">
            <div className="relative w-56 me-2 hidden md:block">
              <FiSearch className={`absolute ${isRTL ? 'right-2' : 'left-2'} top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5 pointer-events-none`} />
              <input
                type="search"
                placeholder={t("topbar.searchPlaceholder")}
                className={`mac-search ${isRTL ? 'pr-7 pl-2 text-right' : 'pl-7 pr-2 text-left'}`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="mac-toolbar-button"
              aria-label={isDark ? t("topbar.switchToLight") : t("topbar.switchToDark")}
              title={isDark ? t("topbar.switchToLight") : t("topbar.switchToDark")}
            >
              {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative notification-container">
              <button
                onClick={handleNotificationClick}
                className="mac-toolbar-button relative"
                aria-label={t("topbar.notifications")}
                title={t("topbar.notifications")}
              >
                <FiBell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className={`absolute top-0.5 ${isRTL ? 'left-0.5' : 'right-0.5'} min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-semibold px-1`}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className={`absolute ${isRTL ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} mt-1.5 w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl backdrop-saturate-150 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden flex flex-col`}
                  >
                    <div className={`px-3 py-2 border-b border-black/5 dark:border-white/10 flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                      <h3 className={`text-sm font-semibold text-gray-900 dark:text-gray-100 ${isRTL ? 'text-left' : 'text-left'}`}>
                        {t("topbar.notifications")}
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            // Mark all as read
                            if (tenantId) {
                              const unreadNotifications = notifications.filter(
                                (n) => !n.read_at && n.is_read !== true
                              );

                              // Try to update read_at first, fallback to is_read
                              for (const notif of unreadNotifications) {
                                const update: Partial<
                                  Pick<AppNotification, "read_at" | "is_read">
                                > = {};
                                if (notif.read_at !== undefined) {
                                  update.read_at = new Date().toISOString();
                                } else if (notif.is_read !== undefined) {
                                  update.is_read = true;
                                } else {
                                  // If neither field exists, try both
                                  update.read_at = new Date().toISOString();
                                  update.is_read = true;
                                }
                                
                                await supabase
                                  .from("notifications")
                                  .update(update)
                                  .eq("id", notif.id);
                              }
                              
                              fetchNotifications();
                            }
                          }}
                          className="text-xs text-blue-600 dark:text-blue-500 hover:underline"
                        >
                          {t("topbar.markAllRead") || "Mark all read"}
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="px-3 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                          {t("topbar.noNotifications") || "No notifications"}
                        </div>
                      ) : (
                        <div className="p-1">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-2.5 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-default ${
                                ((notification.read_at === null || notification.read_at === undefined) && 
                                 notification.is_read !== true)
                                  ? "font-medium"
                                  : ""
                              }`}
                              onClick={async () => {
                                // Mark as read when clicked
                                const update: Partial<
                                  Pick<AppNotification, "read_at" | "is_read">
                                > = {};
                                if (notification.read_at !== undefined) {
                                  update.read_at = new Date().toISOString();
                                } else if (notification.is_read !== undefined) {
                                  update.is_read = true;
                                } else {
                                  update.read_at = new Date().toISOString();
                                  update.is_read = true;
                                }
                                
                                await supabase
                                  .from("notifications")
                                  .update(update)
                                  .eq("id", notification.id);
                                
                                fetchNotifications();
                              }}
                            >
                              <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                                <div className="flex-1" style={{ textAlign: isRTL ? 'right' : 'left' }} dir={isRTL ? "rtl" : "ltr"}>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {notification.title || "Notification"}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                    {notification.message || notification.body}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {new Date(notification.created_at).toLocaleString()}
                                  </p>
                                </div>
                                {((notification.read_at === null || notification.read_at === undefined) && 
                                  notification.is_read !== true) && (
                                  <span className={`${isRTL ? 'mr-2' : 'ml-2'} w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1`}></span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SmartModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title={t("topbar.settings")}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <button 
              type="button"
              onClick={() => {
                setShowSettingsModal(false);
                navigate("/dashboard/profile");
              }}
              className={`w-full flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
            >
              <FiUser className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("topbar.profileSettings")}</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setShowSettingsModal(false);
                navigate("/dashboard/settings");
              }}
              className={`w-full flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
            >
              <FiShield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("topbar.security")}</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setShowSettingsModal(false);
                navigate("/dashboard/billing");
              }}
              className={`w-full flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
            >
              <FiCreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("topbar.billing")}</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setShowSettingsModal(false);
                navigate("/dashboard/settings");
              }}
              className={`w-full flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
            >
              <FiBell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("topbar.notificationsSettings")}</span>
            </button>
          </div>
        </div>
      </SmartModal>
    </>
  );
};
