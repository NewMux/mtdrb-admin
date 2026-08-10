import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiLock } from "react-icons/fi";
import { useRTL } from "../../hooks/useRTL";

interface UnifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  isProFeature?: boolean;
  slideFrom?: "right" | "center";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  className?: string;
}

export const UnifiedModal: React.FC<UnifiedModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showCloseButton = true,
  closeOnBackdropClick = true,
  isProFeature = false,
  slideFrom = "right",
  maxWidth = "4xl",
  className = "",
}) => {
  const { isRTL } = useRTL();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  };

  const slideInitial = slideFrom === "right" 
    ? (isRTL ? "-100%" : "100%") 
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex ${slideFrom === "right" ? (isRTL ? "justify-start" : "justify-end") : "justify-center items-center p-4"}`}
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
          aria-describedby="modal-subtitle"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeOnBackdropClick ? onClose : () => {}}
          />

          {/* Panel */}
          <motion.div
            initial={slideFrom === "right" ? { x: slideInitial, opacity: 0 } : { scale: 0.95, opacity: 0 }}
            animate={slideFrom === "right" ? { x: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={slideFrom === "right" ? { x: slideInitial, opacity: 0 } : { scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`relative h-full w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-gray-800 shadow-2xl ${slideFrom === "right" ? (isRTL ? "rounded-r-3xl" : "rounded-l-3xl") : "rounded-3xl max-h-[90vh]"} flex flex-col transition-colors duration-200 ${className}`}
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-8 py-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                {isProFeature && (
                  <div className="flex items-center gap-2">
                    <FiLock className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      PRO
                    </span>
                  </div>
                )}
                <div className="flex-1 text-start">
                  <h2
                    id="modal-title"
                    className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      id="modal-subtitle"
                      className="text-sm text-gray-500 dark:text-gray-400 mt-1.5"
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Close modal"
                >
                  <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
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
              <div className="sticky bottom-0 px-8 py-5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
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


