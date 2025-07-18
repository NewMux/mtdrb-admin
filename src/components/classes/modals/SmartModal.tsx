import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLock } from 'react-icons/fi';

interface SmartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  isPro?: boolean;
  proFeature?: string;
}

const SmartModal: React.FC<SmartModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '4xl',
  isPro = false,
  proFeature
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, x: 300, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.95 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.3
              }}
              className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-light-200 dark:border-dark-700 overflow-hidden`}
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-dark-800 border-b border-light-200 dark:border-dark-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h2 className="text-xl font-semibold text-dark-900 dark:text-white">
                        {title}
                      </h2>
                      {subtitle && (
                        <p className="text-sm text-light-600 dark:text-dark-400 mt-1">
                          {subtitle}
                        </p>
                      )}
                    </div>
                    {isPro && proFeature && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-brand-500 to-purple-600 rounded-lg">
                        <FiLock className="h-3 w-3 text-white" />
                        <span className="text-xs font-medium text-white">
                          {proFeature}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-light-400 hover:text-dark-900 dark:hover:text-white hover:bg-light-100 dark:hover:bg-dark-700 rounded-xl transition-all duration-200"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                <div className="p-6">
                  {children}
                </div>
              </div>

              {/* Sticky Footer */}
              {footer && (
                <div className="sticky bottom-0 z-10 bg-white dark:bg-dark-800 border-t border-light-200 dark:border-dark-700 px-6 py-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SmartModal; 