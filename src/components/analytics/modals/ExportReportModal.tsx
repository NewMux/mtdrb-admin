import * as React from "react";
import { motion } from "framer-motion";
import {
  FiDownload,
  FiFileText,
  FiImage,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal } from "./useSmartAnalyticsModal";

interface ExportReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

const savedReports = [
  {
    id: "1",
    name: "Member Overview Report",
    description: "Comprehensive member activity and engagement metrics",
    lastGenerated: "2024-01-15T10:30:00Z",
    size: "2.3 MB",
    sections: ["Attendance", "Payments", "Progress"],
    isStale: false,
  },
  {
    id: "2",
    name: "Financial Summary Q4",
    description: "Revenue, expenses, and profit analysis for Q4 2023",
    lastGenerated: "2024-01-10T14:20:00Z",
    size: "1.8 MB",
    sections: ["Revenue", "Expenses", "Profit", "VAT"],
    isStale: true,
  },
  {
    id: "3",
    name: "Custom Report Template",
    description: "Your custom report with attendance and payment data",
    lastGenerated: "2024-01-12T09:15:00Z",
    size: "3.1 MB",
    sections: ["Attendance", "Payment", "Trainer Feedback"],
    isStale: false,
  },
];

const exportFormats = [
  {
    id: "csv",
    label: "CSV",
    description: "Spreadsheet format, good for data analysis",
    icon: FiFileText,
  },
  {
    id: "excel",
    label: "Excel",
    description: "Rich formatting and charts",
    icon: FiFileText,
  },
  {
    id: "pdf",
    label: "PDF",
    description: "Professional presentation format",
    icon: FiFileText,
  },
  {
    id: "json",
    label: "JSON",
    description: "API-friendly data format",
    icon: FiFileText,
  },
];

export default function ExportReportModal({
  open,
  onClose,
  onSuccess,
  isPro,
}: ExportReportModalProps) {
  const { loading, generateReport, alerts, clearAlerts } =
    useSmartAnalyticsModal();

  const [selectedReport, setSelectedReport] = React.useState<string>("");
  const [exportFormat, setExportFormat] = React.useState("csv");
  const [includeVisuals, setIncludeVisuals] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleExport = async () => {
    if (!selectedReport) return;

    setExporting(true);
    try {
      const result = await generateReport();
      if (result.success) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setExporting(false);
    }
  };

  const handleRefreshReport = async (reportId: string) => {
    setExporting(true);
    try {
      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Update the report's lastGenerated timestamp
    } finally {
      setExporting(false);
    }
  };

  const getSelectedReport = () =>
    savedReports.find((r) => r.id === selectedReport);

  function Section({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {title}
        </h3>
        <div className="space-y-4">{children}</div>
      </section>
    );
  }

  return (
    <SmartAnalyticsModal
      open={open}
      onClose={onClose}
      title="Export Report"
      subtitle="Select a saved report and export in your preferred format"
    >
      {/* Alerts */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2 ${
            alert.type === "error"
              ? "bg-red-50 text-red-700"
              : alert.type === "warning"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {alert.type === "warning" && (
            <FiAlertTriangle className="text-yellow-500" />
          )}
          {alert.type === "error" && (
            <FiAlertTriangle className="text-red-500" />
          )}
          {alert.type === "info" && <FiCheckCircle className="text-blue-500" />}
          {alert.message}
        </div>
      ))}

      {/* Saved Reports */}
      <Section title="Select Report">
        <div className="space-y-3">
          {savedReports.map((report) => (
            <label
              key={report.id}
              className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name="selectedReport"
                value={report.id}
                checked={selectedReport === report.id}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{report.name}</h4>
                  {report.isStale && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      Stale
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {report.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Size: {report.size}</span>
                  <span>
                    Last generated:{" "}
                    {new Date(report.lastGenerated).toLocaleDateString()}
                  </span>
                  <span>Sections: {report.sections.join(", ")}</span>
                </div>
              </div>
              {report.isStale && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRefreshReport(report.id);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Refresh report data"
                >
                  <FiRefreshCw
                    className={`w-4 h-4 ${exporting ? "animate-spin" : ""}`}
                  />
                </button>
              )}
            </label>
          ))}
        </div>
      </Section>

      {/* Export Options */}
      {selectedReport && (
        <>
          <Section title="Export Options">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <FiDownload /> Format
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  {exportFormats.map((format) => {
                    const Icon = format.icon;
                    return (
                      <option key={format.id} value={format.id}>
                        {format.label} - {format.description}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <FiImage /> Content
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeVisuals}
                      onChange={(e) => setIncludeVisuals(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">
                      Include charts and graphs
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-600">
                      Include raw data
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </Section>

          {/* Report Preview */}
          <Section title="Report Preview">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  {getSelectedReport()?.name}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Size: {getSelectedReport()?.size}</span>
                  <span>•</span>
                  <span>
                    Format:{" "}
                    {exportFormats.find((f) => f.id === exportFormat)?.label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getSelectedReport()?.sections.map((section, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {section}
                    </div>
                    <div className="text-xs text-gray-500">Section {i + 1}</div>
                  </div>
                ))}
              </div>
              {getSelectedReport()?.isStale && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <FiAlertTriangle className="text-yellow-500" />
                    <span>
                      This report contains data older than 7 days. Consider
                      refreshing for the latest information.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </>
      )}

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={onClose}
            disabled={loading || exporting}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleExport}
            disabled={loading || exporting || !selectedReport}
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FiDownload />
                Export Report
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
