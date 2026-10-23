import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FiX, FiLock } from "react-icons/fi";
import { useRTL } from "../hooks/useRTL";

interface AppleStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
  isProFeature?: boolean;
  footer?: React.ReactNode;
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

export const AppleStyleModal: React.FC<AppleStyleModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "xl",
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = "",
  isProFeature = false,
  footer,
}) => {
  const { isRTL } = useRTL();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={closeOnBackdropClick ? onClose : () => {}}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop with frosted glass effect */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-black/20 dark:bg-black/50"
              aria-hidden="true"
            />
          </Transition.Child>

          {/* Modal content */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-[0.97]"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-[0.98]"
          >
            <Dialog.Panel
              className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:ring-1 dark:ring-white/10 text-start overflow-hidden ${className}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-5 py-3.5 border-b border-black/5 dark:border-white/10 gap-4">
                <div className="flex items-center gap-3">
                  {isProFeature && (
                    <div className="flex items-center gap-2">
                      <FiLock className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded">
                        PRO
                      </span>
                    </div>
                  )}
                  <div className="text-start">
                    <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    {subtitle && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
                    )}
                  </div>
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    type="button"
                    aria-label="Close"
                    className="mac-toolbar-button -me-1.5 flex-shrink-0"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="px-5 py-4 text-start">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="px-5 py-3 bg-gray-50/80 dark:bg-white/[0.03] border-t border-black/5 dark:border-white/10">
                  {footer}
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

// Apple-style form components
export const AppleInput = React.forwardRef<
  HTMLInputElement,
  {
    label: string;
    error?: string;
    className?: string;
    required?: boolean;
  } & React.InputHTMLAttributes<HTMLInputElement>
>(({ label, error, className = "", required = false, id, ...props }, ref) => {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="space-y-1.5 text-start">
      <label htmlFor={fieldId} className="block text-sm text-gray-700 dark:text-gray-300 text-start">
        {label}
        {required && <span className="text-red-500 mx-1">*</span>}
      </label>
      <input
        id={fieldId}
        ref={ref}
        className={`
          w-full px-2.5 py-1.5 text-sm text-gray-900 dark:text-gray-100 text-start
          bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md shadow-sm
          focus:ring-0 focus:border-blue-600 focus:shadow-focus
          transition-shadow
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          ${error ? "border-red-500 focus:border-red-500" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500 text-start">{error}</p>}
    </div>
  );
});

AppleInput.displayName = "AppleInput";

// forwardRef so react-hook-form's register() can read the value: without the ref
// a form built on this component never sees the chosen option.
export const AppleSelect = React.forwardRef<
  HTMLSelectElement,
  {
    label: string;
    error?: string;
    className?: string;
    required?: boolean;
    children: React.ReactNode;
  } & React.SelectHTMLAttributes<HTMLSelectElement>
>(({
  label,
  error,
  className = "",
  required = false,
  children,
  id,
  ...props
}, ref) => {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="space-y-1.5 text-start">
      <label htmlFor={fieldId} className="block text-sm text-gray-700 dark:text-gray-300 text-start">
        {label}
        {required && <span className="text-red-500 mx-1">*</span>}
      </label>
      <select
        id={fieldId}
        ref={ref}
        className={`
          w-full ps-2.5 pe-9 py-1.5 text-sm text-gray-900 dark:text-gray-100 text-start
          bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md shadow-sm
          focus:ring-0 focus:border-blue-600 focus:shadow-focus
          transition-shadow
          ${error ? "border-red-500 focus:border-red-500" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 text-start">{error}</p>}
    </div>
  );
});

AppleSelect.displayName = "AppleSelect";

export const AppleTextarea = React.forwardRef<
  HTMLTextAreaElement,
  {
    label: string;
    error?: string;
    className?: string;
    required?: boolean;
  } & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ label, error, className = "", required = false, id, ...props }, ref) => {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="space-y-1.5 text-start">
      <label htmlFor={fieldId} className="block text-sm text-gray-700 dark:text-gray-300 text-start">
        {label}
        {required && <span className="text-red-500 mx-1">*</span>}
      </label>
      <textarea
        id={fieldId}
        ref={ref}
        className={`
          w-full px-2.5 py-1.5 text-sm text-gray-900 dark:text-gray-100 text-start
          bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md shadow-sm resize-y
          focus:ring-0 focus:border-blue-600 focus:shadow-focus
          transition-shadow
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          ${error ? "border-red-500 focus:border-red-500" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500 text-start">{error}</p>}
    </div>
  );
});

AppleTextarea.displayName = "AppleTextarea";

export const AppleToggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}> = ({ label, checked, onChange, className = "" }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors duration-150 focus:outline-none focus-visible:shadow-focus
          ${checked ? "bg-blue-600" : "bg-black/10 dark:bg-white/20"}
        `}
      >
        <span
          className={`
            inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform duration-150
            ${checked ? "translate-x-[18px] rtl:-translate-x-[18px]" : "translate-x-[2px] rtl:-translate-x-[2px]"}
          `}
        />
      </button>
    </div>
  );
};

export const AppleButton: React.FC<
  {
    variant?:
      | "primary"
      | "secondary"
      | "ghost"
      | "danger"
      | "success"
      | "warning";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    className?: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  className = "",
  children,
  disabled,
  ...props
}) => {
  const baseClasses =
    "font-medium rounded-md transition-colors duration-100 inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:cursor-default select-none";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm",
    secondary:
      "bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/15 shadow-sm",
    ghost: "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm",
    success: "bg-green-500 hover:bg-green-600 text-white shadow-sm",
    warning: "bg-orange-500 hover:bg-orange-600 text-white shadow-sm",
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-sm",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      )}
      {!loading && icon && iconPosition === "left" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === "right" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
};

export const AppleButtonGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
};
