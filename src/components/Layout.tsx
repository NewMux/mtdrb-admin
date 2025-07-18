import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useTheme } from '../contexts/ThemeContext';
import PageThemeDetector from './PageThemeDetector';

const Layout: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen bg-[#FAFAFA] dark:bg-[#111827] transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <PageThemeDetector />
      <div className="flex h-screen">
        {/* Sidebar always visible on desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <TopBar onMenuClick={() => {}} />
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-[#FAFAFA] dark:bg-[#111827] transition-colors duration-300">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={window.location.pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
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