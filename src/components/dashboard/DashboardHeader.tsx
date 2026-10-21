import React from "react";
import { FiRefreshCw } from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";
import { useTranslation } from "react-i18next";
import { PageHeader } from "../ui/PageHeader";

interface DashboardHeaderProps {
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onRefresh }) => {
  const { t } = useTranslation();
  return (
    <PageHeader
      title={t("dashboard.title")}
      subtitle={t("dashboard.welcomeMessage")}
      actions={
        <SmartButton
          variant="secondary"
          size="sm"
          icon={<FiRefreshCw className="w-3.5 h-3.5" />}
          onClick={onRefresh}
        >
          {t("dashboard.refresh")}
        </SmartButton>
      }
    />
  );
}; 