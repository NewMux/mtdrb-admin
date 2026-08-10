import * as React from "react";
import {
  FiDownload,
  FiFileText,
  FiImage,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
} from "react-icons/fi";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { exportCSV, exportPDF, exportExcel, exportJSON } from "../../../utils/exportData";
import { toast } from "react-hot-toast";
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
  const { tenantId } = useAuth();
  const { loading, generateReport, alerts, clearAlerts } =
    useSmartAnalyticsModal();

  const isProUser = isPro ?? true;

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
    if (!selectedReport) {
      toast.error("Please select a report to export");
      return;
    }

    if (!tenantId) {
      toast.error("No tenant ID found");
      return;
    }

    setExporting(true);
    try {
      const report = savedReports.find((r) => r.id === selectedReport);
      if (!report) {
        toast.error("Report not found");
        return;
      }

      let exportData: any[] = [];

      // Generate report data based on selected report
      if (report.id === "1") {
        // Member Overview Report
        const [membersResult, invoicesResult, bookingsResult] = await Promise.all([
          supabase
            .from("members")
            .select("id, first_name, last_name, email, status, created_at")
            .eq("tenant_id", tenantId),
          supabase
            .from("invoices")
            .select("id, member_id, amount, status, created_at")
            .eq("tenant_id", tenantId),
          supabase
            .from("class_bookings")
            .select("id, member_id, class_id, attended, created_at")
            .eq("tenant_id", tenantId),
        ]);

        if (membersResult.error) throw membersResult.error;
        if (invoicesResult.error) throw invoicesResult.error;
        if (bookingsResult.error) throw bookingsResult.error;

        const members = membersResult.data || [];
        const invoices = invoicesResult.data || [];
        const bookings = bookingsResult.data || [];

        exportData = members.map((member: any) => {
          const memberInvoices = invoices.filter(
            (inv: any) => inv.member_id === member.id,
          );
          const memberBookings = bookings.filter(
            (book: any) => book.member_id === member.id,
          );
          const totalSpent = memberInvoices.reduce(
            (sum: number, inv: any) => sum + (inv.amount || 0),
            0,
          );
          const attendanceRate =
            memberBookings.length > 0
              ? ((memberBookings.filter((b: any) => b.attended).length /
                  memberBookings.length) *
                  100).toFixed(2)
              : "0";

          return {
            "Member Name": `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.email,
            Email: member.email || "",
            Status: member.status || "active",
            "Join Date": member.created_at
              ? new Date(member.created_at).toLocaleDateString()
              : "N/A",
            "Total Spent": totalSpent,
            "Total Bookings": memberBookings.length,
            "Attendance Rate": `${attendanceRate}%`,
          };
        });
      } else if (report.id === "2") {
        // Financial Summary Q4
        const [invoicesResult, expensesResult] = await Promise.all([
          supabase
            .from("invoices")
            .select("id, amount, status, created_at, vat_amount")
            .eq("tenant_id", tenantId)
            .gte("created_at", "2023-10-01")
            .lte("created_at", "2023-12-31"),
          supabase
            .from("expenses")
            .select("id, amount, category, date")
            .eq("tenant_id", tenantId)
            .gte("date", "2023-10-01")
            .lte("date", "2023-12-31"),
        ]);

        if (invoicesResult.error) throw invoicesResult.error;
        if (expensesResult.error) throw expensesResult.error;

        const invoices = invoicesResult.data || [];
        const expenses = expensesResult.data || [];

        const totalRevenue = invoices.reduce(
          (sum: number, inv: any) => sum + (inv.amount || 0),
          0,
        );
        const totalExpenses = expenses.reduce(
          (sum: number, exp: any) => sum + (exp.amount || 0),
          0,
        );
        const totalVAT = invoices.reduce(
          (sum: number, inv: any) => sum + (inv.vat_amount || 0),
          0,
        );

        exportData = [
          {
            Period: "Q4 2023",
            "Total Revenue": totalRevenue,
            "Total Expenses": totalExpenses,
            "Total VAT": totalVAT,
            "Net Profit": totalRevenue - totalExpenses,
            "Profit Margin": totalRevenue > 0
              ? `${(((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(2)}%`
              : "0%",
            "Total Invoices": invoices.length,
            "Total Expenses Count": expenses.length,
          },
        ];
      } else if (report.id === "3") {
        // Custom Report Template
        const [membersResult, bookingsResult] = await Promise.all([
          supabase
            .from("members")
            .select("id, first_name, last_name, email")
            .eq("tenant_id", tenantId),
          supabase
            .from("class_bookings")
            .select("id, member_id, class_id, attended, price, created_at")
            .eq("tenant_id", tenantId),
        ]);

        if (membersResult.error) throw membersResult.error;
        if (bookingsResult.error) throw bookingsResult.error;

        const members = membersResult.data || [];
        const bookings = bookingsResult.data || [];

        exportData = members.map((member: any) => {
          const memberBookings = bookings.filter(
            (book: any) => book.member_id === member.id,
          );
          const totalSpent = memberBookings.reduce(
            (sum: number, book: any) => sum + (book.price || 0),
            0,
          );

          return {
            "Member Name": `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.email,
            Email: member.email || "",
            "Total Bookings": memberBookings.length,
            "Total Spent": totalSpent,
            "Attended Classes": memberBookings.filter((b: any) => b.attended).length,
          };
        });
      }

      const filename = `${report.name.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;

      // Export based on format
      if (exportFormat === "csv") {
        exportCSV(exportData, filename);
      } else if (exportFormat === "excel") {
        await exportExcel(exportData, filename, report.name);
      } else if (exportFormat === "pdf") {
        exportPDF(exportData, filename, report.name);
      } else if (exportFormat === "json") {
        exportJSON(exportData, filename);
      }

      const result = await generateReport();
      if (result.success) {
        toast.success("Report exported successfully");
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(
        `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setExporting(false);
    }
  };

  const handleRefreshReport = async (reportId: string) => {
    void reportId;
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
      {!isProUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm mb-4">
          Exporting reports is available on Pro plans.
        </div>
      )}

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
                  {exportFormats.map((format) => (
                    <option key={format.id} value={format.id}>
                      {format.label} - {format.description}
                    </option>
                  ))}
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
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={onClose}
            disabled={loading || exporting}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleExport}
            disabled={loading || exporting || !selectedReport || !isProUser}
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
