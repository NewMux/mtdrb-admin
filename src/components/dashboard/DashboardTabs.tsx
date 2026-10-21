import React from "react";
import { FiActivity, FiBarChart } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { SegmentedControl } from "../ui/SegmentedControl";

interface DashboardTabsProps {
  activeTab: "overview" | "analytics";
  onTabChange: (tab: "overview" | "analytics") => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const { t } = useTranslation();
  const tabs = [
    { id: "overview" as const, label: t("dashboard.overview"), icon: FiActivity },
    { id: "analytics" as const, label: t("dashboard.analytics"), icon: FiBarChart },
  ];

  return <SegmentedControl segments={tabs} value={activeTab} onChange={onTabChange} />;
};
