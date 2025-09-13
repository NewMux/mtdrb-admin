interface VatReportsSectionProps {
  searchQuery: string;
  page: number;
  onPageChange: (page: number) => void;
  refreshKey: number;
  dateRange?: [Date | null, Date | null];
  tenantId: string | null;
  selectedStatus: string | null;
}

declare const VatReportsSection: React.FC<VatReportsSectionProps>;

export default VatReportsSection;
