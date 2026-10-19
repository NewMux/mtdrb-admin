import React from "react";
import { MacSheet } from "./UnifiedModal";

interface SmartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  maxWidth?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  isProFeature?: boolean;
  className?: string;
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export const SmartModal: React.FC<SmartModalProps> = ({
  size = "md",
  maxWidth,
  closeOnOverlayClick = true,
  ...props
}) => (
  <MacSheet
    widthClass={maxWidth || sizeClasses[size]}
    closeOnBackdropClick={closeOnOverlayClick}
    {...props}
  />
);
