import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiBell, FiSearch, FiUser, FiSettings, FiX, FiLogOut, FiMail, FiShield, FiCreditCard } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { SmartModal } from './ui/SmartModal';
import { SmartButton } from './ui/DesignSystem';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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
      toast.success('Successfully signed out!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out. Please try again.');
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
      if (!target.closest('.dropdown-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search members, classes, trainers..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">

            {/* Quick Actions */}
            <div className="hidden sm:flex items-center space-x-2">
              <button 
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={handleSettingsClick}
                aria-label="Settings"
              >
                <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              <div className="relative dropdown-container">
                <button 
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={handleUserMenuClick}
                  aria-expanded={showUserMenu}
                  aria-controls="user-menu-dropdown"
                  aria-label="User menu"
                >
                  <FiUser className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>

                {/* User Menu Dropdown */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      id="user-menu-dropdown"
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user?.email?.[0]?.toUpperCase() || 'A'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user?.user_metadata?.name || 'Admin User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user?.email || 'admin@mtdrb.com'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/settings');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                          role="menuitem"
                        >
                          <FiUser className="w-4 h-4" />
                          <span>Profile</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/settings');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                          role="menuitem"
                        >
                          <FiSettings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/billing');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                          role="menuitem"
                        >
                          <FiCreditCard className="w-4 h-4" />
                          <span>Billing</span>
                        </button>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                          role="menuitem"
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

            {/* User Avatar */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.user_metadata?.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email || 'admin@mtdrb.com'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SmartModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Settings"
        subtitle="Manage your account and system preferences"
        footer={
          <div className="flex items-center justify-end space-x-3">
            <SmartButton variant="secondary" onClick={() => setShowSettingsModal(false)}>
              Close
            </SmartButton>
            <SmartButton 
              variant="primary" 
              onClick={() => {
                setShowSettingsModal(false);
                navigate('/settings');
              }}
            >
              Open Settings
            </SmartButton>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiUser className="w-5 h-5 mr-2" />
                Account Settings
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Profile Management</span>
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      navigate('/settings');
                    }}
                    className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700"
                  >
                    Manage
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Security Settings</span>
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      navigate('/settings');
                    }}
                    className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700"
                  >
                    Configure
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiSettings className="w-5 h-5 mr-2" />
                System Settings
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {isDarkMode ? 'Dark' : 'Light'}
                  </span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </SmartModal>
    </>
  );
}; 