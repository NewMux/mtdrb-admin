import React from "react";
import { motion } from "framer-motion";
import {
  FiAlertCircle,
  FiCheck,
  FiClock,
  FiUsers,
  FiMapPin,
  FiUser,
  FiCalendar,
  FiZap,
} from "react-icons/fi";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "number" | "textarea";
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  required = false,
  disabled = false,
  icon,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dark-900 dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-400">
            {icon}
          </div>
        )}
        {type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 ${
              icon ? "pl-10" : ""
            } ${
              error
                ? "border-red-300 bg-red-50 dark:bg-red-900/10"
                : "border-light-200 dark:border-dark-600 bg-light-50 dark:bg-dark-700"
            } ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } text-dark-900 dark:text-white`}
            rows={4}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 ${
              icon ? "pl-10" : ""
            } ${
              error
                ? "border-red-300 bg-red-50 dark:bg-red-900/10"
                : "border-light-200 dark:border-dark-600 bg-light-50 dark:bg-dark-700"
            } ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } text-dark-900 dark:text-white`}
          />
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-1 mt-1 text-red-600 dark:text-red-400"
          >
            <FiAlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required = false,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dark-900 dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 ${
          error
            ? "border-red-300 bg-red-50 dark:bg-red-900/10"
            : "border-light-200 dark:border-dark-600 bg-light-50 dark:bg-dark-700"
        } ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } text-dark-900 dark:text-white`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-1 mt-1 text-red-600 dark:text-red-400"
        >
          <FiAlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </motion.div>
      )}
    </div>
  );
};

interface TimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const TimeField: React.FC<TimeFieldProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dark-900 dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-400 h-4 w-4" />
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 ${
            error
              ? "border-red-300 bg-red-50 dark:bg-red-900/10"
              : "border-light-200 dark:border-dark-600 bg-light-50 dark:bg-dark-700"
          } ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } text-dark-900 dark:text-white`}
        />
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-1 mt-1 text-red-600 dark:text-red-400"
          >
            <FiAlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
}

export const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  min,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dark-900 dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-400 h-4 w-4" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 ${
            error
              ? "border-red-300 bg-red-50 dark:bg-red-900/10"
              : "border-light-200 dark:border-dark-600 bg-light-50 dark:bg-dark-700"
          } ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } text-dark-900 dark:text-white`}
        />
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-1 mt-1 text-red-600 dark:text-red-400"
          >
            <FiAlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  children,
  icon,
  collapsible = false,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (collapsible) {
    return (
      <div className="border border-light-200 dark:border-dark-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-4 bg-light-50 dark:bg-dark-700 hover:bg-light-100 dark:hover:bg-dark-600 transition-colors duration-200 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="text-light-600 dark:text-dark-400">{icon}</div>
            )}
            <div className="text-left">
              <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-light-600 dark:text-dark-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-light-400"
          >
            <FiChevronDown className="h-4 w-4" />
          </motion.div>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 space-y-4">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="text-light-600 dark:text-dark-400">{icon}</div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-light-600 dark:text-dark-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

interface AIRecommendationCardProps {
  recommendation: {
    id: string;
    type: string;
    title: string;
    description: string;
    confidence: number;
    action: string;
    priority: "high" | "medium" | "low";
  };
  onApply?: () => void;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  recommendation,
  onApply,
}) => {
  const priorityColors = {
    high: "border-red-200 bg-red-50 dark:bg-red-900/10",
    medium: "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10",
    low: "border-blue-200 bg-blue-50 dark:bg-blue-900/10",
  };

  const priorityIcons = {
    high: "🔴",
    medium: "🟡",
    low: "🔵",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 border rounded-xl ${priorityColors[recommendation.priority]} space-y-3`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">
            {priorityIcons[recommendation.priority]}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-dark-900 dark:text-white">
              {recommendation.title}
            </h4>
            <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
              {recommendation.description}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-light-600 dark:text-dark-400">
            {Math.round(recommendation.confidence * 100)}% confidence
          </span>
          {onApply && (
            <button
              onClick={onApply}
              className="px-3 py-1 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors duration-200"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface ConflictAlertProps {
  conflicts: any[];
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({ conflicts }) => {
  if (conflicts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl"
    >
      <div className="flex items-start space-x-3">
        <FiAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
            Scheduling Conflict Detected
          </h4>
          <p className="text-sm text-red-700 dark:text-red-200 mt-1">
            The selected trainer has {conflicts.length} conflicting class(es) at
            this time.
          </p>
          <div className="mt-2 space-y-1">
            {conflicts.slice(0, 3).map((conflict, index) => (
              <div
                key={index}
                className="text-xs text-red-600 dark:text-red-300"
              >
                • {conflict.name} ({conflict.start_time} - {conflict.end_time})
              </div>
            ))}
            {conflicts.length > 3 && (
              <div className="text-xs text-red-600 dark:text-red-300">
                • And {conflicts.length - 3} more...
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
