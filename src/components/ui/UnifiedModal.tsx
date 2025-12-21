import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiLock } from "react-icons/fi";

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

  const getSlideClasses = () => {
    if (slideFrom === "right") {
      return "fixed right-0 top-0 h-full w-full";
    }
    return "relative mx-auto my-8 w-full";
  };

  const getSlideTransitions = () => {
    if (slideFrom === "right") {
      return {
        enter: "ease-out duration-300",
        enterFrom: "transform translate-x-full",
        enterTo: "transform translate-x-0",
        leave: "ease-in duration-200",
        leaveFrom: "transform translate-x-0",
        leaveTo: "transform translate-x-full",
      };
    }
    return {
      enter: "ease-out duration-300",
      enterFrom: "opacity-0 scale-95",
      enterTo: "opacity-100 scale-100",
      leave: "ease-in duration-200",
      leaveFrom: "opacity-100 scale-100",
      leaveTo: "opacity-0 scale-95",
    };
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
            onClick={closeOnBackdropClick ? onClose : () => {}}
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
                      className="text-sm text-lunaNavy/70 mt-1"
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


