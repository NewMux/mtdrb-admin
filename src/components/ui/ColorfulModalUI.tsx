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
            className="fixed inset-0 bg-black/30"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={modalRef}
            {...modalAnimation}
            className="relative h-full w-full max-w-4xl bg-gradient-to-br from-gray-50 via-white to-gray-100 shadow-xl rounded-l-3xl flex flex-col"
            role="document"
          >
            {/* Header */}
            <div className="relative px-8 py-6 rounded-tl-3xl rounded-tr-none bg-gradient-to-r from-white/90 to-gray-100/80 text-gray-900 flex items-center justify-between shadow-sm border-b border-gray-200">
              <div>
                <h2
                  id="modal-title"
                  className="text-2xl font-bold tracking-tight"
                >
                  {title || "Modal"}
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
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label="Close modal"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {children}
            </div>

            {/* Footer with Action Button */}
            {onAction && (
              <div className="px-8 py-6 border-t border-gray-200">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onAction}
                    className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Confirm
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
