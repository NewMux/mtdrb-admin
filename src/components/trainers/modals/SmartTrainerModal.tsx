import React from "react";
import { UnifiedModal } from "../../ui/UnifiedModal";

interface SmartTrainerModalProps {
  open: boolean;
  onClose: () => void;
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
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  isProFeature?: boolean;
}

export const SmartTrainerModal: React.FC<SmartTrainerModalProps> = ({
  open,
  onClose,
  children,
  maxWidth = "4xl",
  title = "Trainer",
  subtitle,
  footer,
  isProFeature = false,
}) => {
  return (
    <UnifiedModal
      isOpen={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth={maxWidth}
      isProFeature={isProFeature}
      footer={footer}
      slideFrom="right"
    >
      {children}
    </UnifiedModal>
  );
};
