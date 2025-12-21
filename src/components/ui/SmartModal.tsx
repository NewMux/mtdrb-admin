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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : () => {}}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`relative h-full w-full ${maxWidth || sizeClasses[size]} bg-white shadow-2xl rounded-l-3xl flex flex-col`}
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-8 py-6 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {isProFeature && (
                  <div className="flex items-center gap-2">
                    <FiLock className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-200">
                      PRO
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h2
                    id="modal-title"
                    className="text-2xl font-bold text-gray-900 tracking-tight"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      id="modal-subtitle"
                      className="text-sm text-gray-500 mt-1.5"
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-4 p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Close modal"
                >
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="space-y-6">
                {children}
              </div>
            </div>

            {/* Footer */}
            {footer && (
              <div className="sticky bottom-0 px-8 py-5 bg-white border-t border-gray-100">
                <div className="flex justify-end gap-3">
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


