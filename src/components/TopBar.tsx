import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiBell,
  FiSearch,
  FiUser,
  FiSettings,
  FiLogOut,
  FiShield,
  FiCreditCard,
} from "react-icons/fi";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { SmartModal } from "./ui/SmartModal";
import { SmartButton } from "./ui/DesignSystem";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { isDarkMode } = useTheme();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  // State for dropdowns and modals
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      toast.success("Successfully signed out!");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  // Handle settings click
  const handleSettingsClick = () => {
    setShowSettingsModal(true);
    setShowUserMenu(false);
  };

  // Handle user menu click
  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".dropdown-container")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Page Title */}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Dashboard
            </h1>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative">
              <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative dropdown-container">
              <button
                onClick={handleUserMenuClick}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.user_metadata?.full_name?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "U"}
                  </span>
                </div>
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.user_metadata?.full_name || user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={handleSettingsClick}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <FiSettings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
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
        title="Settings"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FiUser className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Profile Settings</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FiShield className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Security</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FiCreditCard className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Billing</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FiBell className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Notifications</span>
            </button>
          </div>
        </div>
      </SmartModal>
    </>
  );
};
