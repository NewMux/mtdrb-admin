import React from "react";
import { FiActivity } from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";
import { useTranslation } from "react-i18next";

interface DashboardHeaderProps {
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onRefresh }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-start">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("dashboard.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t("dashboard.welcomeMessage")}
        </p>
      </div>

      <SmartButton
        variant="secondary"
        size="sm"
        icon={<FiActivity className="w-4 h-4" />}
        onClick={onRefresh}
      >
        {t("dashboard.refresh")}
      </SmartButton>
    </div>
  );
}; 