import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiLock } from "react-icons/fi";
import { useRTL } from "../../hooks/useRTL";

interface MacSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  isProFeature?: boolean;
  /** Tailwind max-width class for the panel, e.g. "max-w-lg". */
  widthClass: string;
  className?: string;
  panelRef?: React.RefObject<HTMLDivElement>;
}

/**
 * A macOS-style sheet: a centered, compact window with a hairline-divided
 * title bar and a trailing button row. Shared by UnifiedModal and SmartModal
 * so every dialog in the app looks and behaves the same.
 */
export const MacSheet: React.FC<MacSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showCloseButton = true,
  closeOnBackdropClick = true,
  isProFeature = false,
  widthClass,
  className = "",
  panelRef,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center p-4"
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
          aria-describedby={subtitle ? "modal-subtitle" : undefined}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/50"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className={`relative w-full ${widthClass} max-h-[88vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:ring-1 dark:ring-white/10 flex flex-col overflow-hidden text-start ${className}`}
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title bar */}
            <div className="shrink-0 px-5 py-3.5 border-b border-black/5 dark:border-white/10 flex items-start justify-between gap-4">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {isProFeature && (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 dark:text-orange-500 bg-orange-500/15 px-1.5 py-0.5 rounded">
                    <FiLock className="w-3 h-3" />
                    PRO
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <h2
                    id="modal-title"
                    className="text-base font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      id="modal-subtitle"
                      className="text-sm text-gray-500 dark:text-gray-400 mt-0.5"
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="mac-toolbar-button -me-1.5"
                  aria-label="Close"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-5">{children}</div>
            </div>

            {/* Button row */}
            {footer && (
              <div className="shrink-0 px-5 py-3 bg-gray-50/80 dark:bg-white/[0.03] border-t border-black/5 dark:border-white/10">
                <div className="flex justify-end gap-2">{footer}</div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

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
  /** Accepted for API compatibility; every modal now opens as a centered sheet. */
  slideFrom?: "right" | "center";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  className?: string;
}

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

export const UnifiedModal: React.FC<UnifiedModalProps> = ({
  maxWidth = "4xl",
  ...props
}) => <MacSheet widthClass={maxWidthClasses[maxWidth]} {...props} />;
