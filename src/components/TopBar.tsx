import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
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

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // State for dropdowns and modals
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
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
    if (path.includes("/analytics")) return t("analytics.title");
    if (path.includes("/tasks")) return t("tasks.title");
    if (path.includes("/settings")) return t("settings.title");
    if (path.includes("/profile")) return t("settings.profile");
    return t("dashboard.title");
  }, [location.pathname, t, currentLang]);

  const isRTL = currentLang === "ar";

  // Handle notification click
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    const tenantId = user?.user_metadata?.tenant_id;
    
    // Skip if no tenant_id or if it's the invalid/null UUID
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
          status: (error as any).status,
          statusCode: (error as any).statusCode,
          fullError: error,
        });
        return;
      }

      setNotifications(data || []);
      // Count unread (check for read_at or is_read field, or assume all are unread if neither exists)
      const unread = (data || []).filter((n: any) => {
        if (n.read_at !== null && n.read_at !== undefined) return false;
        if (n.is_read === false) return true;
        if (n.is_read === true) return false;
        // If neither field exists, consider it unread
        return true;
      }).length;
      setUnreadCount(unread);
    } catch (err) {
      // Log detailed error information for caught errors
      const errorDetails = err as any;
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
  }, [user]);

  // Fetch notifications on mount and when user changes
  React.useEffect(() => {
    if (user?.user_metadata?.tenant_id) {
      fetchNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [user, fetchNotifications]);

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
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-200">
        <div className="flex items-center justify-between gap-4">
          {/* Start Section (Title & Mobile Menu) */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label={t("topbar.toggleMenu")}
            >
                <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Page Title */}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {pageTitle}
            </h1>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <FiSearch className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <input
                type="text"
                placeholder={t("topbar.searchPlaceholder")}
                className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </div>

          {/* End Section (Theme & Notifications) */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={isDark ? t("topbar.switchToLight") : t("topbar.switchToDark")}
              title={isDark ? t("topbar.switchToLight") : t("topbar.switchToDark")}
            >
              {isDark ? (
                <FiSun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            {/* Notifications */}
            <div className="relative notification-container">
              <button
                onClick={handleNotificationClick}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 relative"
                aria-label={t("topbar.notifications")}
              >
                <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium px-1`}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col`}
                  >
                    <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                      <h3 className={`text-sm font-semibold text-gray-900 dark:text-gray-100 ${isRTL ? 'text-left' : 'text-left'}`}>
                        {t("topbar.notifications")}
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            // Mark all as read
                            if (user?.user_metadata?.tenant_id) {
                              const unreadNotifications = notifications.filter(
                                (n: any) => !n.read_at && n.is_read !== true
                              );
                              
                              // Try to update read_at first, fallback to is_read
                              for (const notif of unreadNotifications) {
                                const update: any = {};
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
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          {t("topbar.markAllRead") || "Mark all read"}
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                          {t("topbar.noNotifications") || "No notifications"}
                        </div>
                      ) : (
                        <div className="py-2">
                          {notifications.map((notification: any) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer ${
                                ((notification.read_at === null || notification.read_at === undefined) && 
                                 notification.is_read !== true)
                                  ? "bg-blue-50 dark:bg-blue-900/20"
                                  : ""
                              }`}
                              onClick={async () => {
                                // Mark as read when clicked
                                const update: any = {};
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
