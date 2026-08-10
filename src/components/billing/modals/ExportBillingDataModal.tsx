import React, { useState } from "react";
import {
  FiDownload,
  FiFilter,
  FiCalendar,
} from "react-icons/fi";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { exportCSV, exportExcel, exportJSON } from "../../../utils/exportData";
import { toast } from "react-hot-toast";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { useSmartBillingModal } from "./useSmartBillingModal";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";

interface ExportBillingDataModalProps {
  open: boolean;
  onClose: () => void;
}

const ExportBillingDataModal: React.FC<ExportBillingDataModalProps> = ({
  open,
  onClose,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { tenantId } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [exportFormat, setExportFormat] = useState("csv");
  const [dataTypes, setDataTypes] = useState(["invoices", "expenses"]);
  const [isLoading, setIsLoading] = useState(false);

  useSmartBillingModal({});

  const branches = [
    t("billing.allBranches", "جميع الفروع"),
    "الفرع الرئيسي - المنامة",
    "مركز اللياقة - المحرق",
    "مركز الرفاع",
  ];

  const members = [
    t("billing.allMembers", "جميع الأعضاء"),
    "أحمد علي",
    "سارة خالد",
    "محمد حسن",
  ];

  const trainers = [
    t("billing.allTrainers", "جميع المدربين"),
    "الكابتن علي",
    "الكابتن مريم",
  ];

  const exportFormats = [
    { id: "csv", name: "CSV", description: t("billing.csvDesc", "قيم مفصولة بفواصل") },
    { id: "excel", name: "Excel", description: t("billing.excelDesc", "صيغة مايكروسوفت إكسل") },
    { id: "json", name: "JSON", description: t("billing.jsonDesc", "صيغة بيانات برمجية منظمة") },
  ];

  const dataTypeOptions = [
    { id: "invoices", name: t("billing.invoices", "الفواتير"), description: t("billing.allInvoiceData", "جميع سجلات الفواتير") },
    { id: "expenses", name: t("billing.expenses", "المصروفات"), description: t("billing.allExpenseRecords", "جميع سجلات المصروفات") },
    {
      id: "vat",
      name: t("billing.vatData", "بيانات القيمة المضافة"),
      description: t("billing.vatReportsDesc", "حسابات وتقارير الضريبة"),
    },
    { id: "payments", name: t("billing.payments", "المدفوعات"), description: t("billing.paymentTransactions", "معاملات الدفع") },
  ];

  const handleDataTypeToggle = (typeId: string) => {
    setDataTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  const handleExportData = async () => {
    if (!tenantId) {
      toast.error("No tenant ID found");
      return;
    }

    if (dataTypes.length === 0) {
      toast.error("Please select at least one data type to export");
      return;
    }

    setIsLoading(true);

    try {
      const exportData: any[] = [];

      // Build date filter
      let dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = startDate;
      }
      if (endDate) {
        dateFilter.lte = endDate;
      }

      // Fetch invoices if selected
      if (dataTypes.includes("invoices")) {
        let invoiceQuery = supabase
          .from("invoices")
          .select(
            `
            *,
            member:members(id, first_name, last_name, email)
          `,
          )
          .eq("tenant_id", tenantId);

        if (startDate) {
          invoiceQuery = invoiceQuery.gte("created_at", startDate);
        }
        if (endDate) {
          invoiceQuery = invoiceQuery.lte("created_at", endDate);
        }
        if (selectedMember && selectedMember !== "All Members") {
          invoiceQuery = invoiceQuery.eq("member_id", selectedMember);
        }

        const { data: invoices, error: invoicesError } = await invoiceQuery.order(
          "created_at",
          { ascending: false },
        );

        if (invoicesError) throw invoicesError;

        const invoiceData = (invoices || []).map((inv: any) => ({
          Type: "Invoice",
          "Invoice Number": inv.invoice_number || inv.id,
          "Member Name": inv.member
            ? `${inv.member.first_name || ""} ${inv.member.last_name || ""}`.trim()
            : "N/A",
          "Member Email": inv.member?.email || "N/A",
          Amount: inv.amount || 0,
          Status: inv.status || "pending",
          "Due Date": inv.due_date
            ? new Date(inv.due_date).toLocaleDateString()
            : "N/A",
          "Created At": inv.created_at
            ? new Date(inv.created_at).toLocaleDateString()
            : "N/A",
        }));

        exportData.push(...invoiceData);
      }

      // Fetch expenses if selected
      if (dataTypes.includes("expenses")) {
        let expenseQuery = supabase
          .from("expenses")
          .select("*")
          .eq("tenant_id", tenantId);

        if (startDate) {
          expenseQuery = expenseQuery.gte("date", startDate);
        }
        if (endDate) {
          expenseQuery = expenseQuery.lte("date", endDate);
        }

        const { data: expenses, error: expensesError } = await expenseQuery.order(
          "date",
          { ascending: false },
        );

        if (expensesError) throw expensesError;

        const expenseData = (expenses || []).map((exp: any) => ({
          Type: "Expense",
          Category: exp.category || "Other",
          Description: exp.description || "",
          Amount: exp.amount || 0,
          "Payment Method": exp.payment_method || "N/A",
          Date: exp.date ? new Date(exp.date).toLocaleDateString() : "N/A",
          "Created At": exp.created_at
            ? new Date(exp.created_at).toLocaleDateString()
            : "N/A",
        }));

        exportData.push(...expenseData);
      }

      // Fetch VAT data if selected
      if (dataTypes.includes("vat")) {
        // VAT data is typically calculated from invoices
        let vatQuery = supabase
          .from("invoices")
          .select("id, amount, created_at, vat_rate, vat_amount")
          .eq("tenant_id", tenantId);

        if (startDate) {
          vatQuery = vatQuery.gte("created_at", startDate);
        }
        if (endDate) {
          vatQuery = vatQuery.lte("created_at", endDate);
        }

        const { data: vatData, error: vatError } = await vatQuery.order(
          "created_at",
          { ascending: false },
        );

        if (vatError) throw vatError;

        const vatExportData = (vatData || []).map((vat: any) => ({
          Type: "VAT",
          "Invoice ID": vat.id,
          "Subtotal": (vat.amount || 0) - (vat.vat_amount || 0),
          "VAT Rate": vat.vat_rate || 0,
          "VAT Amount": vat.vat_amount || 0,
          "Total Amount": vat.amount || 0,
          Date: vat.created_at
            ? new Date(vat.created_at).toLocaleDateString()
            : "N/A",
        }));

        exportData.push(...vatExportData);
      }

      // Fetch payments if selected
      if (dataTypes.includes("payments")) {
        let paymentQuery = supabase
          .from("invoices")
          .select(
            `
            id,
            invoice_number,
            amount,
            status,
            paid_at,
            payment_method,
            created_at,
            member:members(id, first_name, last_name, email)
          `,
          )
          .eq("tenant_id", tenantId)
          .eq("status", "paid");

        if (startDate) {
          paymentQuery = paymentQuery.gte("paid_at", startDate);
        }
        if (endDate) {
          paymentQuery = paymentQuery.lte("paid_at", endDate);
        }

        const { data: payments, error: paymentsError } = await paymentQuery.order(
          "paid_at",
          { ascending: false },
        );

        if (paymentsError) throw paymentsError;

        const paymentData = (payments || []).map((pay: any) => ({
          Type: "Payment",
          "Invoice Number": pay.invoice_number || pay.id,
          "Member Name": pay.member
            ? `${pay.member.first_name || ""} ${pay.member.last_name || ""}`.trim()
            : "N/A",
          Amount: pay.amount || 0,
          "Payment Method": pay.payment_method || "N/A",
          "Paid At": pay.paid_at
            ? new Date(pay.paid_at).toLocaleDateString()
            : "N/A",
        }));

        exportData.push(...paymentData);
      }

      if (exportData.length === 0) {
        toast.error("No data found for the selected filters");
        setIsLoading(false);
        return;
      }

      const filename = `billing-export-${new Date().toISOString().split("T")[0]}`;

      // Export based on format
      if (exportFormat === "csv") {
        exportCSV(exportData, filename);
      } else if (exportFormat === "excel") {
        await exportExcel(exportData, filename, "Billing Data");
      } else if (exportFormat === "json") {
        exportJSON(exportData, filename);
      }

      toast.success("Billing data exported successfully");
      setIsLoading(false);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(
        `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  return (
    <ColorfulModalUI
      open={open}
      onClose={onClose}
      onAction={handleExportData}
      title={t("billing.exportBillingData", "تصدير البيانات المالية")}
      subtitle={t("billing.exportBillingSubtitle", "تصدير واستخراج سجلات الفواتير والمصروفات حسب النطاق")}
    >
      <div className="flex flex-col h-full" dir={isRTL ? "rtl" : "ltr"}>
        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Date Range */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-start">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiCalendar className="w-4 h-4 flex-shrink-0" />
              <span>{t("billing.dateRange", "نطاق التاريخ")}</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("billing.startDate", "تاريخ البدء")}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("billing.endDate", "تاريخ الانتهاء")}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-start">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiFilter className="w-4 h-4 flex-shrink-0" />
              <span>{t("billing.filters", "التصفية")}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("billing.branch", "الفرع")}
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <option value="">{t("billing.allBranches", "جميع الفروع")}</option>
                  {branches.slice(1).map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("billing.member", "العضو")}
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <option value="">{t("billing.allMembers", "جميع الأعضاء")}</option>
                  {members.slice(1).map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("billing.trainer", "المدرب")}
                </label>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <option value="">{t("billing.allTrainers", "جميع المدربين")}</option>
                  {trainers.slice(1).map((trainer) => (
                    <option key={trainer} value={trainer}>
                      {trainer}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data Types */}
          <div className="text-start">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              {t("billing.dataTypesToExport", "نوع البيانات للتصدير")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dataTypeOptions.map((type) => (
                <div
                  key={type.id}
                  onClick={() => handleDataTypeToggle(type.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    dataTypes.includes(type.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                        dataTypes.includes(type.id)
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {dataTypes.includes(type.id) && (
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-start">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {type.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div className="text-start">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              {t("billing.exportFormat", "صيغة التصدير")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {exportFormats.map((format) => (
                <div
                  key={format.id}
                  onClick={() => setExportFormat(format.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-start ${
                    exportFormat === format.id
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {format.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-start">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
              {t("billing.exportSummary", "ملخص التصدير")}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 dark:text-blue-300">
                  {t("billing.dataTypes", "أنواع البيانات:")}
                </span>
                <span className="font-medium">{dataTypes.length} {t("billing.selected", "محددة")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 dark:text-blue-300">
                  {t("billing.format", "الصيغة:")}
                </span>
                <span className="font-medium">
                  {exportFormats.find((f) => f.id === exportFormat)?.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            {t("common.cancel", "إلغاء")}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportData}
              disabled={isLoading || dataTypes.length === 0}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 font-medium cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiDownload className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{t("billing.exportData", "تصدير البيانات")}</span>
            </button>
          </div>
        </div>
      </div>
    </ColorfulModalUI>
  );
};

export default ExportBillingDataModal;
