import React from 'react';
import { FiX } from 'react-icons/fi';

interface PremiumModalPanelProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
  title?: string;
}

const PremiumModalPanel: React.FC<PremiumModalPanelProps> = ({ open, onClose, onSave, children, title }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-all duration-500 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative h-full w-full max-w-4xl bg-white shadow-2xl rounded-l-2xl flex flex-col transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="relative px-8 py-6 rounded-tl-2xl rounded-tr-none bg-gradient-to-r from-primary via-pink-500 to-indigo-500 text-white flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">{title || 'Premium Feature'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-l-2xl">
          {/* Example input fields in white cards */}
          {children}
        </div>
        {/* Footer */}
        <div className="px-8 py-4 bg-gradient-to-t from-muted/30 to-transparent backdrop-blur rounded-bl-2xl flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition bg-transparent border border-gray-200 shadow-sm"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 rounded-xl font-semibold text-white bg-primary shadow-lg hover:shadow-xl transition relative focus:outline-none focus:ring-2 focus:ring-primary/50"
            style={{ boxShadow: '0 0 16px 0 rgba(139,92,246,0.15)' }}
            type="button"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumModalPanel; 