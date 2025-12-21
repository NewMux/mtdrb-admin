import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

interface ColorfulModalUIProps {
  open: boolean;
  onClose: () => void;
  onAction?: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  modalRef?: React.RefObject<HTMLDivElement>;
}

const ColorfulModalUI: React.FC<ColorfulModalUIProps> = ({
  open,
  onClose,
  onAction,
  actionLabel = "Confirm",
  actionVariant = "primary",
  title,
  subtitle,
  children,
  modalRef,
}) => {
  // Standardized modal animation
  const modalAnimation = {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
    transition: { type: "spring", damping: 25, stiffness: 200 },
  };

  return (
    <AnimatePresence>
      {open && (
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
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={modalRef}
            {...modalAnimation}
            className="relative h-full w-full max-w-4xl bg-white shadow-2xl rounded-l-3xl flex flex-col"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-8 py-6 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex-1">
                <h2
                  id="modal-title"
                  className="text-2xl font-bold text-gray-900 tracking-tight"
                >
                  {title || "Modal"}
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
              <button
                onClick={onClose}
                className="ml-4 p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Close modal"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="space-y-6">
                {children}
              </div>
            </div>

            {/* Footer with Action Button */}
            {onAction && (
              <div className="sticky bottom-0 px-8 py-5 bg-white border-t border-gray-100">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onAction}
                    className={`px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      actionVariant === "danger"
                        ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500"
                        : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500"
                    }`}
                  >
                    {actionLabel}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ColorfulModalUI;
