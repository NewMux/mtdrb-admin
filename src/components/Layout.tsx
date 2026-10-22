import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { PaymentFailedBanner } from "./PaymentFailedBanner";
import PageThemeDetector from "./PageThemeDetector";
import { useRTL } from "../hooks/useRTL";

const Layout: React.FC = () => {
  const { isRTL } = useRTL();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  // Close the mobile drawer on every navigation (covers back/forward and
  // any navigation that isn't a direct Sidebar link click, which already
  // closes it via its own onClose prop).
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Opt the signed-in shell into desktop (AppKit-like) type density; see
  // html.mac-app in index.css. Removed on unmount so marketing pages keep
  // their own scale.
  React.useEffect(() => {
    document.documentElement.classList.add("mac-app");
    return () => document.documentElement.classList.remove("mac-app");
  }, []);

  return (
    <div
      className="min-h-screen bg-white dark:bg-gray-900"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <PageThemeDetector />
      <div className="flex h-screen">
        {/* Sidebar (desktop: static, always visible) */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Sidebar (mobile/tablet: slide-in drawer over a backdrop) */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                key="sidebar-backdrop"
                className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                key="sidebar-drawer"
                className={`fixed inset-y-0 ${isRTL ? "right-0" : "left-0"} z-50 lg:hidden bg-gray-100 dark:bg-gray-800 shadow-2xl`}
                initial={{ x: isRTL ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? "100%" : "-100%" }}
                transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
              >
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Unified toolbar */}
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <PaymentFailedBanner />
          {/* Page Content. A plain fade on navigation, like switching
              panes in a Mac app; no slide. */}
          <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
            <div
              key={location.pathname}
              className="px-4 py-5 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-window-in"
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
