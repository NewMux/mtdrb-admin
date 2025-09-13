import React, { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX } from 'react-icons/fi';
import { MODAL_STYLES, MODAL_ANIMATIONS } from '../../lib/constants/designSystem';

interface MTDRBModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  className?: string;
}

export const MTDRBModal: React.FC<MTDRBModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showCloseButton = true,
  closeOnBackdropClick = true,
  maxWidth = '4xl',
  className = '',
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={MODAL_STYLES.container}
        onClose={closeOnBackdropClick ? onClose : () => {}}
      >
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
          <div className={MODAL_STYLES.backdrop} aria-hidden="true" />
        </Transition.Child>

        {/* Modal Panel - Slide from right */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="transform translate-x-full"
          enterTo="transform translate-x-0"
          leave="ease-in duration-200"
          leaveFrom="transform translate-x-0"
          leaveTo="transform translate-x-full"
        >
          <Dialog.Panel
            className={`${MODAL_STYLES.panel.base} ${maxWidthClasses[maxWidth]} ${MODAL_STYLES.panel.slide} ${className}`}
          >
            {/* Fixed Header */}
            <div className={MODAL_STYLES.header.container}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Dialog.Title className={MODAL_STYLES.header.title}>
                    {title}
                  </Dialog.Title>
                  {subtitle && (
                    <p className={MODAL_STYLES.header.subtitle}>
                      {subtitle}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={MODAL_STYLES.header.closeButton}
                    aria-label="Close modal"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className={MODAL_STYLES.content.container}>
              {children}
            </div>

            {/* Fixed Footer */}
            {footer && (
              <div className={MODAL_STYLES.footer.container}>
                <div className={MODAL_STYLES.footer.actions}>
                  {footer}
                </div>
              </div>
            )}
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
};

/**
 * Smart Form Section Component
 */
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`${MODAL_STYLES.form.section} ${className}`}>
      <div className={MODAL_STYLES.form.sectionTitle}>
        {title}
      </div>
      {description && (
        <p className={MODAL_STYLES.form.sectionDescription}>
          {description}
        </p>
      )}
      <div className={MODAL_STYLES.form.fieldGroup}>
        {children}
      </div>
    </div>
  );
};

/**
 * Smart Form Field Component
 */
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  help?: string;
  required?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  help,
  required = false,
  className = '',
}) => {
  return (
    <div className={`${MODAL_STYLES.form.field} ${className}`}>
      <label className={MODAL_STYLES.form.label}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className={MODAL_STYLES.form.error}>
          {error}
        </p>
      )}
      {help && (
        <p className={MODAL_STYLES.form.help}>
          {help}
        </p>
      )}
    </div>
  );
};

/**
 * Smart Form Grid Component
 */
interface FormGridProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGrid: React.FC<FormGridProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`${MODAL_STYLES.smartForm.grid} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Full Width Form Field Component
 */
interface FullWidthFieldProps {
  children: React.ReactNode;
  className?: string;
}

export const FullWidthField: React.FC<FullWidthFieldProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`${MODAL_STYLES.smartForm.fullWidth} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Toggle Switch Component
 */
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`${MODAL_STYLES.smartForm.inline} ${className}`}>
      {label && (
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          ${MODAL_STYLES.smartForm.toggle}
          ${checked ? MODAL_STYLES.smartForm.toggleActive : MODAL_STYLES.smartForm.toggleInactive}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`
            ${MODAL_STYLES.smartForm.toggleThumb}
            ${checked ? MODAL_STYLES.smartForm.toggleThumbActive : MODAL_STYLES.smartForm.toggleThumbInactive}
          `}
        />
      </button>
    </div>
  );
};

export default MTDRBModal; 