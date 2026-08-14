import React from "react";
import { SmartLoading } from "./ui/DesignSystem";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullScreen = false,
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
