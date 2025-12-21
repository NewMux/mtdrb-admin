import React from "react";
import { FiActivity } from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";

interface DashboardHeaderProps {
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onRefresh }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your gym today.
        </p>
      </div>

      <SmartButton
        variant="secondary"
        size="sm"
        icon={<FiActivity className="w-4 h-4" />}
        onClick={onRefresh}
      >
        Refresh
      </SmartButton>
    </div>
  );
}; 