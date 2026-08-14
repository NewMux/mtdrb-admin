import React from "react";
import { UnifiedModal } from "../../ui/UnifiedModal";

interface SmartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
  isPro?: boolean;
  proFeature?: string;
}

const SmartModal: React.FC<SmartModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "4xl",
  isPro = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  proFeature,
}) => {
  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth={maxWidth}
      isProFeature={isPro}
      footer={footer}
      slideFrom="right"
    >
      {children}
    </UnifiedModal>
  );
};

export default SmartModal;
