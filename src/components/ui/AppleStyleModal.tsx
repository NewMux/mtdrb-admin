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
  slideFrom?: "center" | "right" | "bottom";
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

const AppleStyleModal: React.FC<AppleStyleModalProps> = ({
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
  slideFrom = "center",
}) => {
  const getSlideClasses = () => {
    switch (slideFrom) {
      case "right":
        return "fixed top-0 right-0 h-full w-full max-w-4xl transform";
      case "bottom":
        return "fixed bottom-0 left-0 right-0 h-3/4 w-full transform";
      default:
        return "relative w-full";
    }
  };

  const getSlideTransitions = () => {
    switch (slideFrom) {
      case "right":
        return {
          enter: "ease-out duration-300",
          enterFrom: "translate-x-full",
          enterTo: "translate-x-0",
          leave: "ease-in duration-200",
          leaveFrom: "translate-x-0",
          leaveTo: "translate-x-full",
        };
      case "bottom":
        return {
          enter: "ease-out duration-300",
          enterFrom: "translate-y-full",
          enterTo: "translate-y-0",
          leave: "ease-in duration-200",
          leaveFrom: "translate-y-0",
          leaveTo: "translate-y-full",
        };
      default:
        return {
          enter: "ease-out duration-300",
          enterFrom: "opacity-0 scale-95",
          enterTo: "opacity-100 scale-100",
          leave: "ease-in duration-200",
          leaveFrom: "opacity-100 scale-100",
          leaveTo: "opacity-0 scale-95",
        };
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={closeOnBackdropClick ? onClose : () => {}}
      >
        {slideFrom === "center" ? (
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
            <Transition.Child as={Fragment} {...getSlideTransitions()}>
              <Dialog.Panel
                className={`relative ${maxWidthClasses[maxWidth]} bg-white rounded-2xl shadow-2xl border border-gray-200 ${className}`}
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
        ) : (
          <>
            {/* Backdrop */}
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
            <Transition.Child as={Fragment} {...getSlideTransitions()}>
              <Dialog.Panel
                className={`${getSlideClasses()} bg-white rounded-2xl shadow-2xl border border-gray-200 ${className}`}
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
                <div className="px-8 py-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="px-8 py-6 border-t border-gray-200">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </>
        )}
      </Dialog>
    </Transition.Root>
  );
};

export default AppleStyleModal;
