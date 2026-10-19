import React from "react";
import { MacSheet } from "./UnifiedModal";

interface ColorfulModalUIProps {
  open: boolean;
  onClose: () => void;
  onAction?: () => void;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  actionVariant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
  modalRef?: React.RefObject<HTMLDivElement>;
}

const ColorfulModalUI: React.FC<ColorfulModalUIProps> = ({
  open,
  onClose,
  onAction,
  actionLabel = "Confirm",
  actionVariant = "primary",
  title,
  subtitle,
  children,
  modalRef,
}) => (
  <MacSheet
    isOpen={open}
    onClose={onClose}
    title={title || "Modal"}
    subtitle={subtitle}
    widthClass="max-w-4xl"
    panelRef={modalRef}
    footer={
      onAction && (
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onAction}
            className={`btn ${
              actionVariant === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white shadow-sm"
                : "btn-primary"
            }`}
          >
            {actionLabel}
          </button>
        </>
      )
    }
  >
    {children}
  </MacSheet>
);

export default ColorfulModalUI;
