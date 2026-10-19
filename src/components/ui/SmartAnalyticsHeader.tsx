import React from "react";
import { useTranslation } from "react-i18next";
import { SegmentedControl } from "./SegmentedControl";

type TimeRange = "week" | "month" | "quarter" | "year";

interface SmartAnalyticsHeaderProps {
  title: string;
  subtitle: string;
  /** Accepted for API compatibility; the header no longer shows an icon tile. */
  icon?: React.ReactNode;
  /** Accepted for API compatibility; the header is no longer a gradient banner. */
  gradientFrom?: string;
  gradientTo?: string;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  showTimeRange?: boolean;
}

/** Section heading with an optional period picker, as a segmented control. */
export default function SmartAnalyticsHeader({
  title,
  subtitle,
  timeRange = "month",
  onTimeRangeChange,
  showTimeRange = true,
}: SmartAnalyticsHeaderProps) {
  const { t } = useTranslation();
  const timeRangeOptions: { id: TimeRange; label: string }[] = [
    { id: "week", label: t("dashboard.weekly") },
    { id: "month", label: t("dashboard.monthly") },
    { id: "quarter", label: t("dashboard.quarterly") },
    { id: "year", label: t("dashboard.yearly") },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div className="text-start">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {showTimeRange && onTimeRangeChange && (
        <SegmentedControl segments={timeRangeOptions} value={timeRange} onChange={onTimeRangeChange} />
      )}
    </div>
  );
}
