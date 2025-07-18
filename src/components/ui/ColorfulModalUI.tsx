import React from 'react';
import { FiX } from 'react-icons/fi';

interface ColorfulModalUIProps {
  open: boolean;
  onClose: () => void;
  onAction?: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  modalRef?: React.RefObject<HTMLDivElement>;
}

const ColorfulModalUI: React.FC<ColorfulModalUIProps> = ({ 
  open, 
  onClose, 
  onAction,
  title, 
  subtitle, 
  children,
  modalRef 
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-all duration-500 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby="modal-subtitle"
    >
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={modalRef}
        className={`relative h-full w-full max-w-4xl bg-gradient-to-br from-gray-50 via-white to-gray-100 shadow-2xl rounded-l-3xl flex flex-col transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="document"
      >
        {/* Header */}
        <div className="relative px-8 py-6 rounded-tl-3xl rounded-tr-none bg-gradient-to-r from-white/90 to-gray-100/80 text-gray-900 flex items-center justify-between shadow-sm border-b border-gray-200">
          <div>
            <h2 id="modal-title" className="text-2xl font-bold tracking-tight">{title || 'Modal'}</h2>
            {subtitle && (
              <p id="modal-subtitle" className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-sky-500"
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
          <div className="px-8 py-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onAction}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorfulModalUI; 