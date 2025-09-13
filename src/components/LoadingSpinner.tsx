import React from "react";
import { SmartLoading } from "./ui/DesignSystem";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: "small" | "medium" | "large";
  message?: string;
}

const sizeClasses = {
  small: "h-6 w-6",
  medium: "h-12 w-12",
  large: "h-16 w-16",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullScreen = false,
  size = "medium",
  message = "Loading...",
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        <SmartLoading message={message} />
      </div>
    );
  }

  return <SmartLoading message={message} />;
};
