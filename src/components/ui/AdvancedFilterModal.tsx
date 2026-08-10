import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { useRTL } from "../../hooks/useRTL";
import { useTranslation } from "react-i18next";

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  onClear?: () => void;
  onApply?: () => void;
  clearLabel?: string;
  applyLabel?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

/**
 * Reusable Advanced Filter Modal Component
 * Slides from the right (or left in RTL) with smooth animation
 * Follows Apple-style design system
 */
export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onClear,
  onApply,
  clearLabel,
  applyLabel,
  maxWidth = "md",
}) => {
  const { isRTL } = useRTL();
  const { t } = useTranslation();

  // Handle escape key
  React.useEffect(() => {
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
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
    onClose();
  };

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Filter Panel */}
          <motion.div
            initial={{ x: isRTL ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "-100%" : "100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
              duration: 0.3,
            }}
            className={`fixed ${isRTL ? "left-0" : "right-0"} top-0 h-full w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 z-10">
              <div
                className={`flex items-center ${isRTL ? "flex-row-reverse" : ""} justify-between`}
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Close filters"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">{children}</div>

            {/* Footer with Action Buttons */}
            {(onClear || onApply) && (
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200/50 dark:border-gray-700/50 px-6 py-4">
                <div className={`flex ${isRTL ? "flex-row-reverse" : ""} gap-3`}>
                  {onClear && (
                    <button
                      onClick={handleClear}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {clearLabel || t("common.clearAll") || "Clear All"}
                    </button>
                  )}
                  {onApply && (
                    <button
                      onClick={handleApply}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                    >
                      {applyLabel || t("common.applyFilters") || "Apply Filters"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdvancedFilterModal;
