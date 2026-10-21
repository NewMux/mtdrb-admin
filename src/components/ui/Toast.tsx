import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiInfo,
} from "react-icons/fi";
import { Toast as ToastType } from "../../hooks/useToast";

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <FiCheck className="w-5 h-5" />;
      case "error":
        return <FiX className="w-5 h-5" />;
      case "warning":
        return <FiAlertTriangle className="w-5 h-5" />;
      case "info":
        return <FiInfo className="w-5 h-5" />;
      default:
        return <FiInfo className="w-5 h-5" />;
    }
  };

  // Notification Center banner: neutral translucent material, with the
  // status carried by a small tinted glyph rather than a colored box.
  const glyphColors: Record<string, string> = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-orange-500",
    info: "bg-blue-600",
  };
  const glyph = glyphColors[toast.type] ?? "bg-gray-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className="group relative w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl p-3 bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl backdrop-saturate-150 shadow-xl dark:ring-1 dark:ring-white/10"
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <div className={`${glyph} text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 [&_svg]:w-4 [&_svg]:h-4`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0 text-start">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          aria-label="Dismiss"
          className="absolute -top-1.5 -start-1.5 w-5 h-5 rounded-full bg-white dark:bg-gray-700 shadow ring-1 ring-black/10 text-gray-500 dark:text-gray-300 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        >
          <FiX className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  return (
    <div className="fixed top-14 right-3 z-[60] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
