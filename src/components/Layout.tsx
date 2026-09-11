import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
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

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
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
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                key="sidebar-drawer"
                className={`fixed inset-y-0 ${isRTL ? "right-0" : "left-0"} z-50 lg:hidden`}
                initial={{ x: isRTL ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? "100%" : "-100%" }}
                transition={{ type: "tween", duration: 0.25 }}
              >
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-6 max-w-6xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={window.location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
