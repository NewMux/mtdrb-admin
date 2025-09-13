interface InsightsSectionProps {
  searchQuery: string;
  page: number;
  onPageChange: (page: number) => void;
  refreshKey: number;
  dateRange?: [Date | null, Date | null];
  tenantId: string | null;
  selectedStatus: string | null;
}

declare const InsightsSection: React.FC<InsightsSectionProps>;

export default InsightsSection;
