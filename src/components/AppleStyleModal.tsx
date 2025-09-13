import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FiX, FiLock } from "react-icons/fi";

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
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={closeOnBackdropClick ? onClose : () => {}}
      >
        <div className="flex min-h-screen items-center justify-center p-6">
          {/* Backdrop with frosted glass effect */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
            />
          </Transition.Child>

          {/* Modal content */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-2xl shadow-2xl border border-gray-200 ${className}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {isProFeature && (
                    <div className="flex items-center space-x-2">
                      <FiLock className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                        PRO
                      </span>
                    </div>
                  )}
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 tracking-tight">
                      {title}
                    </Dialog.Title>
                    {subtitle && (
                      <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                    )}
                  </div>
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl p-2"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="px-8 py-6">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="px-8 py-6 border-t border-gray-200">
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
>(({ label, error, className = "", required = false, ...props }, ref) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        ref={ref}
        className={`
          w-full px-4 py-3 text-base font-medium text-gray-900
          bg-white border border-gray-200 rounded-xl
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md
          transition-all duration-300 ease-in-out
          placeholder:text-gray-400
          ${error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
});

AppleInput.displayName = "AppleInput";

export const AppleSelect: React.FC<
  {
    label: string;
    error?: string;
    className?: string;
    required?: boolean;
    children: React.ReactNode;
  } & React.SelectHTMLAttributes<HTMLSelectElement>
> = ({
  label,
  error,
  className = "",
  required = false,
  children,
  ...props
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        className={`
          w-full px-4 py-3 text-base font-medium text-gray-900
          bg-white border border-gray-200 rounded-xl
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md
          transition-all duration-300 ease-in-out
          ${error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export const AppleTextarea = React.forwardRef<
  HTMLTextAreaElement,
  {
    label: string;
    error?: string;
    className?: string;
    required?: boolean;
  } & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ label, error, className = "", required = false, ...props }, ref) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        ref={ref}
        className={`
          w-full px-4 py-3 text-base font-medium text-gray-900
          bg-white border border-gray-200 rounded-xl resize-y
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-md
          transition-all duration-300 ease-in-out
          placeholder:text-gray-400
          ${error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
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
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${checked ? "bg-blue-600" : "bg-gray-200"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ease-in-out
            ${checked ? "translate-x-6" : "translate-x-1"}
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
    "font-semibold rounded-xl transition-all duration-300 ease-in-out flex items-center justify-center min-h-[44px] focus:ring-4 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md",
    secondary: "border border-gray-300 text-gray-700 hover:bg-gray-100",
    ghost: "text-gray-500 hover:text-gray-700 px-4 py-2",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md",
    warning:
      "bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow-md",
  };

  const sizeClasses = {
    sm: "px-4 py-2.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
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
  return <div className={`flex space-x-3 ${className}`}>{children}</div>;
};
