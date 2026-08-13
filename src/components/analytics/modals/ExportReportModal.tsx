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
import type { Database } from "../../../types/supabase";
import { useTranslation } from "react-i18next";

interface ExportReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

// Row shapes for the specific columns each report query selects.
type MemberOverviewRow = Pick<
  Database["public"]["Tables"]["members"]["Row"],
  "id" | "first_name" | "last_name" | "email" | "status" | "created_at"
>;
type InvoiceOverviewRow = Pick<
  Database["public"]["Tables"]["invoices"]["Row"],
  "id" | "member_id" | "amount" | "status" | "created_at"
>;
// `attended` isn't part of the generated class_bookings Row type, but the
// query selects it and the code relies on it below.
type BookingOverviewRow = Pick<
  Database["public"]["Tables"]["class_bookings"]["Row"],
  "id" | "member_id" | "class_id" | "created_at"
> & { attended?: boolean | null };

// `vat_amount` isn't part of the generated invoices Row type (which only
// models vat_total), but the query below selects it and the code relies on
// it - describe the exact shape the query returns.
type FinancialInvoiceRow = Pick<
  Database["public"]["Tables"]["invoices"]["Row"],
  "id" | "amount" | "status" | "created_at"
> & { vat_amount?: number | null };
type FinancialExpenseRow = Pick<
  Database["public"]["Tables"]["expenses"]["Row"],
  "id" | "amount" | "category" | "date"
>;

type CustomMemberRow = Pick<
  Database["public"]["Tables"]["members"]["Row"],
  "id" | "first_name" | "last_name" | "email"
>;
// `attended` / `price` aren't part of the generated class_bookings Row type,
// but the query selects them and the code relies on them below.
type CustomBookingRow = Pick<
  Database["public"]["Tables"]["class_bookings"]["Row"],
  "id" | "member_id" | "class_id" | "created_at"
> & { attended?: boolean | null; price?: number | null };

// The exported rows differ per report but are always a flat map of
// column-label -> primitive value, matching what exportCSV/exportExcel/
// exportPDF/exportJSON expect.
type ExportRow = Record<string, string | number>;

// Current-quarter bounds, computed at module load so "Financial Summary"
// always covers the quarter that's actually in progress, not a fixed past one.
const now = new Date();
const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
const quarterStartMonth = (currentQuarter - 1) * 3;
const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
const quarterEnd = new Date(now.getFullYear(), quarterStartMonth + 3, 0);

export default function ExportReportModal({
  open,
  onClose,
  onSuccess,
  isPro,
}: ExportReportModalProps) {
  const { t } = useTranslation();

  const initialSavedReports = [
    {
      id: "1",
      name: t("reports.memberOverviewReportName"),
      description: t("reports.memberOverviewDesc"),
      lastGenerated: new Date().toISOString(),
      size: "—",
      sections: [t("reports.sectionAttendance"), t("reports.sectionPayments"), t("reports.sectionProgress")],
      isStale: false,
    },
    {
      id: "2",
      name: t("reports.financialSummaryQuarterName", { quarter: currentQuarter }),
      description: t("reports.financialSummaryQuarterDesc", { quarter: currentQuarter, year: now.getFullYear() }),
      lastGenerated: new Date().toISOString(),
      size: "—",
      sections: [t("reports.sectionRevenue"), t("reports.sectionExpenses"), t("reports.sectionProfit"), t("reports.sectionVat")],
      isStale: false,
    },
    {
      id: "3",
      name: t("reports.customReportTemplateName"),
      description: t("reports.customReportDesc"),
      lastGenerated: new Date().toISOString(),
      size: "—",
      sections: [t("reports.sectionAttendance"), t("reports.sectionPayment"), t("reports.sectionTrainerFeedback")],
      isStale: false,
    },
  ];

  const exportFormats = [
    {
      id: "csv",
      label: t("reports.csv"),
      description: t("reports.csvDesc"),
      icon: FiFileText,
    },
    {
      id: "excel",
      label: t("reports.excel"),
      description: t("reports.excelDesc"),
      icon: FiFileText,
    },
    {
      id: "pdf",
      label: t("reports.pdf"),
      description: t("reports.pdfDesc"),
      icon: FiFileText,
    },
    {
      id: "json",
      label: t("reports.json"),
      description: t("reports.jsonDesc"),
      icon: FiFileText,
    },
  ];
  const { tenantId } = useAuth();
  const { loading, generateReport, alerts, clearAlerts } =
    useSmartAnalyticsModal();

  const isProUser = isPro ?? true;

  const [selectedReport, setSelectedReport] = React.useState<string>("");
  const [exportFormat, setExportFormat] = React.useState("csv");
  const [includeVisuals, setIncludeVisuals] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const [savedReports, setSavedReports] = React.useState(initialSavedReports);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleExport = async () => {
    if (!selectedReport) {
      toast.error(t("reports.pleaseSelectReport"));
      return;
    }

    if (!tenantId) {
      toast.error(t("reports.noTenantIdFound"));
      return;
    }

    setExporting(true);
    try {
      const report = savedReports.find((r) => r.id === selectedReport);
      if (!report) {
        toast.error(t("reports.reportNotFound"));
        return;
      }

      let exportData: ExportRow[] = [];

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

        const members = (membersResult.data as MemberOverviewRow[]) || [];
        const invoices = (invoicesResult.data as InvoiceOverviewRow[]) || [];
        const bookings = (bookingsResult.data as BookingOverviewRow[]) || [];

        exportData = members.map((member) => {
          const memberInvoices = invoices.filter(
            (inv) => inv.member_id === member.id,
          );
          const memberBookings = bookings.filter(
            (book) => book.member_id === member.id,
          );
          const totalSpent = memberInvoices.reduce(
            (sum, inv) => sum + (inv.amount || 0),
            0,
          );
          const attendanceRate =
            memberBookings.length > 0
              ? ((memberBookings.filter((b) => b.attended).length /
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
            .gte("created_at", quarterStart.toISOString())
            .lte("created_at", quarterEnd.toISOString()),
          supabase
            .from("expenses")
            .select("id, amount, category, date")
            .eq("tenant_id", tenantId)
            .gte("date", quarterStart.toISOString().split("T")[0])
            .lte("date", quarterEnd.toISOString().split("T")[0]),
        ]);

        if (invoicesResult.error) throw invoicesResult.error;
        if (expensesResult.error) throw expensesResult.error;

        const invoices = (invoicesResult.data as FinancialInvoiceRow[]) || [];
        const expenses = (expensesResult.data as FinancialExpenseRow[]) || [];

        const totalRevenue = invoices.reduce(
          (sum, inv) => sum + (inv.amount || 0),
          0,
        );
        const totalExpenses = expenses.reduce(
          (sum, exp) => sum + (exp.amount || 0),
          0,
        );
        const totalVAT = invoices.reduce(
          (sum, inv) => sum + (inv.vat_amount || 0),
          0,
        );

        exportData = [
          {
            Period: `Q${currentQuarter} ${now.getFullYear()}`,
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

        const members = (membersResult.data as CustomMemberRow[]) || [];
        const bookings = (bookingsResult.data as CustomBookingRow[]) || [];

        exportData = members.map((member) => {
          const memberBookings = bookings.filter(
            (book) => book.member_id === member.id,
          );
          const totalSpent = memberBookings.reduce(
            (sum, book) => sum + (book.price || 0),
            0,
          );

          return {
            "Member Name": `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.email,
            Email: member.email || "",
            "Total Bookings": memberBookings.length,
            "Total Spent": totalSpent,
            "Attended Classes": memberBookings.filter((b) => b.attended).length,
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
        toast.success(t("reports.reportExportedSuccessfully"));
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(
        t("reports.failedToExportGeneric", {
          message: error instanceof Error ? error.message : t("messages.somethingWentWrong"),
        }),
      );
    } finally {
      setExporting(false);
    }
  };

  const handleRefreshReport = async (reportId: string) => {
    setExporting(true);
    try {
      setSavedReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? { ...report, lastGenerated: new Date().toISOString(), isStale: false }
            : report,
        ),
      );
      toast.success(t("reports.reportDataRefreshed"));
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
      title={t("reports.exportReport")}
      subtitle={t("reports.exportReportSubtitle")}
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
          {t("reports.exportingProFeature")}
        </div>
      )}

      {/* Saved Reports */}
      <Section title={t("reports.selectReport")}>
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
                      {t("reports.stale")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {report.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{t("reports.sizeLabel", { size: report.size })}</span>
                  <span>
                    {t("reports.lastGeneratedLabel", { date: new Date(report.lastGenerated).toLocaleDateString() })}
                  </span>
                  <span>{t("reports.sectionsLabel", { sections: report.sections.join(", ") })}</span>
                </div>
              </div>
              {report.isStale && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRefreshReport(report.id);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title={t("reports.refreshReportData")}
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
          <Section title={t("reports.exportOptions")}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <FiDownload /> {t("reports.format")}
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
                  <FiImage /> {t("reports.content")}
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
                      {t("reports.includeChartsGraphs")}
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-600">
                      {t("reports.includeRawData")}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </Section>

          {/* Report Preview */}
          <Section title={t("reports.reportPreview")}>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  {getSelectedReport()?.name}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{t("reports.sizeLabel", { size: getSelectedReport()?.size })}</span>
                  <span>•</span>
                  <span>
                    {t("reports.formatLabel")}{" "}
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
                    <div className="text-xs text-gray-500">{t("reports.sectionNumber", { number: i + 1 })}</div>
                  </div>
                ))}
              </div>
              {getSelectedReport()?.isStale && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <FiAlertTriangle className="text-yellow-500" />
                    <span>
                      {t("reports.staleDataWarning")}
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
            {t("common.cancel")}
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleExport}
            disabled={loading || exporting || !selectedReport || !isProUser}
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("reports.exportingButton")}
              </>
            ) : (
              <>
                <FiDownload />
                {t("reports.exportReport")}
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
