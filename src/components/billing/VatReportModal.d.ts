interface VatReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
}

declare const VatReportModal: React.FC<VatReportModalProps>;

export default VatReportModal; 