import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiLock } from "react-icons/fi";

interface SmartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  maxWidth?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  isProFeature?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

export const SmartModal: React.FC<SmartModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
  maxWidth,
  showCloseButton = true,
  closeOnOverlayClick = true,
  isProFeature = false,
  className = "",
  footer,
}) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
          aria-describedby="modal-subtitle"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30"
            onClick={closeOnOverlayClick ? onClose : () => {}}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative h-full w-full max-w-4xl bg-gradient-to-br from-gray-50 via-white to-gray-100 shadow-xl rounded-l-3xl flex flex-col"
            role="document"
          >
            {/* Header */}
            <div className="relative px-8 py-6 rounded-tl-3xl rounded-tr-none bg-gradient-to-r from-white/90 to-gray-100/80 text-gray-900 flex items-center justify-between shadow-sm border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {isProFeature && (
                  <div className="flex items-center space-x-2">
                    <FiLock className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                      PRO
                    </span>
                  </div>
                )}
                <div>
                  <h2
                    id="modal-title"
                    className="text-2xl font-bold tracking-tight"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      id="modal-subtitle"
                      className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label="Close modal"
                >
                  <FiX className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-8 py-6 border-t border-gray-200">
                <div className="flex justify-end space-x-4">
                  {footer}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


