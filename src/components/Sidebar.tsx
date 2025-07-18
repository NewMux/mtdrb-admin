import * as React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, FiUsers, FiCalendar, FiDollarSign, FiBarChart, 
  FiSettings, FiBell, FiGift, FiFileText, FiCheckSquare,
  FiX, FiMenu, FiUser, FiLogOut
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePageThemeContext } from '../contexts/PageThemeContext';

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Members', href: '/members', icon: FiUsers },
  { name: 'Classes', href: '/classes', icon: FiCalendar },
  { name: 'Trainers', href: '/trainers', icon: FiUser },
  { name: 'Billing', href: '/billing', icon: FiDollarSign },
  { name: 'Analytics & Reports', href: '/analytics', icon: FiBarChart },
  { name: 'Tasks', href: '/tasks', icon: FiCheckSquare },
  { name: 'Promotions', href: '/promotions', icon: FiGift },

  { name: 'Settings', href: '/settings', icon: FiSettings },
];

function getActiveSidebarItem(pathname) {
  if (pathname.startsWith('/dashboard/members')) return '/members';
  if (pathname.startsWith('/dashboard/classes')) return '/classes';
  if (pathname.startsWith('/dashboard/trainers')) return '/trainers';
  if (pathname.startsWith('/dashboard/billing')) return '/billing';
  if (pathname.startsWith('/dashboard/analytics')) return '/analytics';
  if (pathname.startsWith('/dashboard/tasks')) return '/tasks';
  if (pathname.startsWith('/dashboard/promotions')) return '/promotions';
  
  if (pathname.startsWith('/dashboard/settings')) return '/settings';
  if (pathname.startsWith('/dashboard')) return '/dashboard';
  // Handle reports redirect to analytics
  if (pathname.startsWith('/reports')) return '/analytics';
  // fallback for root
  if (pathname === '/' || pathname === '') return '/dashboard';
  // fallback: try to match top-level
  return pathname.split('/').length > 1 ? `/${pathname.split('/')[1]}` : pathname;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { theme } = usePageThemeContext();
  const activeItem = getActiveSidebarItem(location.pathname);
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut();
      // The AuthContext will handle navigation to landing page
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center p-6 border-b border-gray-100 dark:border-gray-700">
        {/* Gradient MTDRB text */}
        <span
          className="font-extrabold text-2xl tracking-widest bg-gradient-to-r from-[#002D9C] via-[#0E5EF2] to-[#7DCCFF] bg-clip-text text-transparent"
        >
          MTDRB
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = item.href === activeItem;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={() => `
                flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? `${theme.card} ${theme.tab}` 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              onClick={onClose}
            >
              <item.icon className={`w-5 h-5 ${isActive ? theme.icon : 'text-gray-400 dark:text-gray-500'}`} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
          <div className={`w-6 h-6 rounded-full transition-colors duration-200 ${
            isDarkMode ? 'bg-sky-500' : 'bg-gray-300'
          }`} />
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
            <span className="text-white font-medium text-sm">A</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">admin@mtdrb.com</p>
          </div>
          <button
            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            onClick={handleLogout}
          >
            <FiLogOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}; 
