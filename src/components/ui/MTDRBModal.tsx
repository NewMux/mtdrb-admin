import React, { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX } from 'react-icons/fi';
import { MODAL_STYLES } from '../../lib/constants/designSystem';
import { useRTL } from '../../hooks/useRTL';

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
  const { isRTL } = useRTL();

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

  // RTL-aware animation classes and positioning
  const slideFrom = isRTL ? '-translate-x-full' : 'translate-x-full';
  const slideTo = 'translate-x-0';
  const panelPosition = isRTL ? 'left-0 rounded-r-3xl' : 'right-0 rounded-l-3xl';

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={MODAL_STYLES.container}
        onClose={closeOnBackdropClick ? onClose : () => {}}
        dir={isRTL ? 'rtl' : 'ltr'}
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

        {/* Modal Panel - Slide from right in LTR, from left in RTL */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom={`transform ${slideFrom}`}
          enterTo={`transform ${slideTo}`}
          leave="ease-in duration-200"
          leaveFrom={`transform ${slideTo}`}
          leaveTo={`transform ${slideFrom}`}
        >
          <Dialog.Panel
            className={`fixed top-0 h-full w-full ${panelPosition} max-w-4xl bg-white dark:bg-gray-800 shadow-2xl ${MODAL_STYLES.panel.slide} ${maxWidthClasses[maxWidth]} ${className}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Fixed Header */}
            <div className={MODAL_STYLES.header.container}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-start">
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
                <div className="flex items-center justify-end gap-3">
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
  const { isRTL } = useRTL();
  return (
    <div className={`${MODAL_STYLES.form.field} ${className}`}>
      <label className={MODAL_STYLES.form.label}>
        {label}
        {required && <span className={`text-red-500 ${isRTL ? 'mr-1' : 'ml-1'}`}>*</span>}
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
  const { isRTL } = useRTL();
  return (
    <div className={`${MODAL_STYLES.smartForm.inline} ${className} ${isRTL ? 'flex-row-reverse' : ''}`}>
      {label && (
        <span className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'ml-3' : 'mr-3'}`}>
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
            ${checked ? (isRTL ? MODAL_STYLES.smartForm.toggleThumbActive.replace('translate-x-6', 'translate-x-[-1.5rem]') : MODAL_STYLES.smartForm.toggleThumbActive) : MODAL_STYLES.smartForm.toggleThumbInactive}
          `}
        />
      </button>
    </div>
  );
};

export default MTDRBModal; 