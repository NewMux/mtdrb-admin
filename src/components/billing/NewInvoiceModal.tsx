import React, { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import {
  FiPlus,
  FiDollarSign,
  FiCalendar,
  FiTrash2,
  FiCreditCard,
  FiUser,
  FiFileText,
  FiInfo,
  FiPieChart,
  FiBarChart,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { supabase } from "../../supabaseClient";
import {
  Invoice,
  InvoiceStatus,
  PaymentMethodType,
  LineItem,
  InvoiceType,
  VatRate,
} from "../../types";
import { AppleInput, AppleSelect, AppleTextarea } from "../AppleStyleModal";
import { SmartButton } from "../ui/DesignSystem";
import { SmartModal } from "../ui/SmartModal";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import { PLATFORM_CURRENCY } from "../../config/runtimeConfig";

// Smart suggestions for line items
const SMART_SUGGESTIONS: Record<
  string,
  {
    description: string;
    type: InvoiceType;
    unitPrice: number;
    vatRate: VatRate;
    currency: string;
  }
> = {
  PT: {
    description: "Personal Training Session",
    type: "PT",
    unitPrice: 50,
    vatRate: 5,
    currency: PLATFORM_CURRENCY,
  },
  MEMBERSHIP: {
    description: "Monthly Membership",
    type: "Membership",
    unitPrice: 100,
    vatRate: 5,
    currency: PLATFORM_CURRENCY,
  },
  CLASS: {
    description: "Group Fitness Class",
    type: "Class",
    unitPrice: 25,
    vatRate: 5,
    currency: PLATFORM_CURRENCY,
  },
  EQUIPMENT: {
    description: "Equipment Rental",
    type: "Facility",
    unitPrice: 15,
    vatRate: 5,
    currency: PLATFORM_CURRENCY,
  },
  CONSULTATION: {
    description: "Fitness Consultation",
    type: "PT",
    unitPrice: 75,
    vatRate: 5,
    currency: PLATFORM_CURRENCY,
  },
  SUPPLEMENTS: {
    description: "Nutrition Supplements",
    type: "Other",
    unitPrice: 45,
    vatRate: 5,
    currency: PLATFORM_CURRENCY,
  },
};

// VAT Rate options
const VAT_RATES: { value: VatRate; label: string }[] = [
  { value: 0, label: "0% - Exempt" },
  { value: 5, label: "5% - Standard" },
  { value: 10, label: "10% - Reduced" },
  { value: 15, label: "15% - Premium" },
];

interface ClientHistory {
  lastInvoiceDate: string | null;
  preferredPaymentMethod: string | null;
  outstandingBalance: number;
  overdueInvoices: number;
}

interface ClientOption {
  id: string;
  name: string;
}

type InvoiceSection = "details" | "items" | "summary";

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientOption[];
  tenantId: string;
  onSave: () => void;
  invoice: Invoice | null;
}

export function NewInvoiceModal({
  isOpen,
  onClose,
  clients,
  tenantId,
  onSave,
  invoice: editingInvoice,
}: NewInvoiceModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  // Invoice Details State
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: "",
    type: "Membership" as InvoiceType,
    status: "Unpaid" as InvoiceStatus,
    member_id: "",
    issue_date: dayjs().format("YYYY-MM-DD"),
    due_date: dayjs().add(7, "day").format("YYYY-MM-DD"),
    payment_method: "card" as PaymentMethodType,
    paid_amount: 0,
    currency: PLATFORM_CURRENCY,
    notes: "",
  });

  // Client State
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(
    null,
  );
  const [clientHistory, setClientHistory] = useState<ClientHistory>({
    lastInvoiceDate: null,
    preferredPaymentMethod: null,
    outstandingBalance: 0,
    overdueInvoices: 0,
  });

  // Line Items State
  const [items, setItems] = useState<LineItem[]>(() => {
    const initialItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: "",
      quantity: 1,
      unit_price: 0,
      vat_rate: 5 as VatRate,
      discount_percentage: 0,
      total: 0,
    };
    initialItem.total = 0; // Will be calculated by calculateItemTotal
    return [initialItem];
  });

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] =
    useState<InvoiceSection>("details");

  // Calculate totals with smart logic
  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  const vat_total = items.reduce(
    (sum, item) =>
      sum + item.unit_price * item.quantity * (item.vat_rate / 100),
    0,
  );
  const discount_total = items.reduce(
    (sum, item) =>
      sum + item.unit_price * item.quantity * (item.discount_percentage / 100),
    0,
  );
  const total = subtotal + vat_total - discount_total;
  const remaining_balance = total - invoiceData.paid_amount;

  // Auto-calculate line item totals
  const calculateItemTotal = useCallback((item: LineItem) => {
    return (
      item.quantity *
      item.unit_price *
      (1 + item.vat_rate / 100) *
      (1 - item.discount_percentage / 100)
    );
  }, []);

  useEffect(() => {
    if (editingInvoice) {
      setInvoiceData({
        invoice_number: editingInvoice.invoice_number || "",
        type: editingInvoice.type || "Membership",
        status: editingInvoice.status || "Unpaid",
        member_id: editingInvoice.member?.id || "",
        issue_date: editingInvoice.issue_date || dayjs().format("YYYY-MM-DD"),
        due_date:
          editingInvoice.due_date || dayjs().add(7, "day").format("YYYY-MM-DD"),
        payment_method: editingInvoice.payment_method || "card",
        paid_amount: editingInvoice.paid_amount || 0,
        currency: editingInvoice.currency || PLATFORM_CURRENCY,
        notes: editingInvoice.notes || "",
      });
      setSelectedClient(editingInvoice.member || null);
      if (editingInvoice.line_items && editingInvoice.line_items.length > 0) {
        setItems(editingInvoice.line_items);
      }
    } else {
      // Reset form with smart defaults
      setInvoiceData({
        invoice_number: `INV-${Date.now()}`,
        type: "Membership" as InvoiceType,
        status: "Unpaid" as InvoiceStatus,
        member_id: "",
        issue_date: dayjs().format("YYYY-MM-DD"),
        due_date: dayjs().add(7, "day").format("YYYY-MM-DD"),
        payment_method: "card" as PaymentMethodType,
        paid_amount: 0,
        currency: PLATFORM_CURRENCY,
        notes: "",
      });
      setSelectedClient(null);
      const resetItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: "",
        quantity: 1,
        unit_price: 0,
        vat_rate: 5 as VatRate,
        discount_percentage: 0,
        total: 0,
      };
      resetItem.total = calculateItemTotal(resetItem);
      setItems([resetItem]);
    }
  }, [editingInvoice, calculateItemTotal]);

  const loadClientHistory = useCallback(async (clientId: string) => {
    try {
      const { data: lastInvoice } = await supabase
        .from("invoices")
        .select("issue_date, payment_method")
        .eq("member_id", clientId)
        .order("issue_date", { ascending: false })
        .limit(1)
        .single();

      const { data: outstandingInvoices } = await supabase
        .from("invoices")
        .select("total, due_date")
        .eq("member_id", clientId)
        .eq("status", "Unpaid");

      const outstandingBalance =
        outstandingInvoices?.reduce((sum, inv) => sum + inv.total, 0) || 0;
      const overdueInvoices =
        outstandingInvoices?.filter((inv) =>
          dayjs(inv.due_date).isBefore(dayjs()),
        ).length || 0;

      setClientHistory({
        lastInvoiceDate: lastInvoice?.issue_date || null,
        preferredPaymentMethod: lastInvoice?.payment_method || null,
        outstandingBalance,
        overdueInvoices,
      });

      if (lastInvoice?.payment_method) {
        setInvoiceData((prev) => ({
          ...prev,
          payment_method: lastInvoice.payment_method as PaymentMethodType,
        }));
      }

      if (overdueInvoices > 0) {
        toast.error(`Client has ${overdueInvoices} overdue invoice(s)!`, {
          duration: 4000,
          icon: "⚠️",
        });
      }
    } catch (error) {
      console.error("Error loading client history:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedClient?.id) {
      loadClientHistory(selectedClient.id);
    }
  }, [selectedClient?.id, loadClientHistory]);

  if (!isOpen) {
    return null;
  }

  const handleItemChange = <K extends keyof LineItem>(
    index: number,
    field: K,
    value: LineItem[K],
  ) => {
    try {
      const newItems = [...items];
      const currentItem = { ...newItems[index] };
      currentItem[field] = value;

      currentItem.total = calculateItemTotal(currentItem);
      newItems[index] = currentItem;
      setItems(newItems);
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Error updating item");
    }
  };

  const addItem = () => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: "",
      quantity: 1,
      unit_price: 0,
      vat_rate: 5 as VatRate,
      discount_percentage: 0,
      total: 0,
    };
    newItem.total = calculateItemTotal(newItem);
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const applySmartSuggestion = (suggestionKey: string, index: number) => {
    const suggestion =
      SMART_SUGGESTIONS[suggestionKey as keyof typeof SMART_SUGGESTIONS];
    if (suggestion) {
      handleItemChange(index, "description", suggestion.description);
      handleItemChange(index, "unit_price", suggestion.unitPrice);
      handleItemChange(index, "vat_rate", suggestion.vatRate);
    }
  };

  const handleSave = async (saveAsDraft: boolean = false) => {
    if (!selectedClient) {
      toast.error("Please select a client");
      return;
    }

    if (items.length === 0 || items.every((item) => !item.description)) {
      toast.error("Please add at least one line item");
      return;
    }

    setIsSaving(true);
    try {
      const action = editingInvoice ? "updated" : "created";
      const invoicePayload = {
        invoice_number: invoiceData.invoice_number || `INV-${Date.now()}`,
        type: invoiceData.type,
        status: saveAsDraft ? "Draft" : invoiceData.status,
        member_id: selectedClient.id,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        payment_method: invoiceData.payment_method,
        paid_amount: invoiceData.paid_amount,
        currency: invoiceData.currency,
        notes: invoiceData.notes,
        subtotal,
        vat_total,
        discount_total,
        total,
        line_items: items,
        tenant_id: tenantId,
      };

      let result;
      if (editingInvoice) {
        const { data, error } = await supabase
          .from("invoices")
          .update(invoicePayload)
          .eq("id", editingInvoice.id);
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from("invoices")
          .insert([invoicePayload]);
        result = { data, error };
      }

      if (result.error) throw result.error;

      toast.success(`Invoice ${action} successfully!`);
      onSave();
      onClose();
    } catch (error: unknown) {
      console.error("Error saving invoice:", error);
      const message =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save invoice: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const sections: {
    key: InvoiceSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "details", label: t("billing.invoiceDetailsTab", "تفاصيل الفاتورة"), icon: FiFileText },
    { key: "items", label: t("billing.lineItemsTab", "بنود الفاتورة"), icon: FiDollarSign },
    { key: "summary", label: t("billing.summaryTab", "الملخص والمالية"), icon: FiPieChart },
  ];

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingInvoice ? t("billing.editInvoice", "تعديل الفاتورة") : t("billing.createNewInvoice", "إصدار فاتورة جديدة")}
      subtitle={t("billing.newInvoiceSubtitle", "إنشاء أو تحديث فاتورة مالية للعميل")}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full gap-4" dir={isRTL ? "rtl" : "ltr"}>
          <button
            onClick={() => {
              if (activeSection === "details") {
                setActiveSection("items");
              } else if (activeSection === "items") {
                setActiveSection("summary");
              } else {
                setActiveSection("details");
              }
            }}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            {(() => {
              if (activeSection === "details") return `${t("common.next", "التالي")}: ${t("billing.lineItemsTab", "بنود الفاتورة")} ←`;
              if (activeSection === "items") return `${t("common.next", "التالي")}: ${t("billing.summaryTab", "الملخص")} ←`;
              return `→ ${t("common.backToDetails", "العودة للتفاصيل")}`;
            })()}
          </button>
          <div className="flex items-center gap-3">
            <SmartButton
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              {t("common.cancel", "إلغاء")}
            </SmartButton>
            <SmartButton
              variant="secondary"
              onClick={() => handleSave(true)}
              loading={isSaving}
              disabled={isSaving}
            >
              {t("billing.saveAsDraft", "حفظ كمسودة")}
            </SmartButton>
            <SmartButton
              onClick={() => handleSave(false)}
              loading={isSaving}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? t("common.saving", "جاري الحفظ...") : t("billing.saveInvoice", "حفظ الفاتورة")}
            </SmartButton>
          </div>
        </div>
      }
    >
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex gap-4 sm:gap-8 px-4">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex items-center gap-2 py-3 px-2 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeSection === key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Invoice Details Section */}
        {activeSection === "details" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Client & Invoice Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiUser className="text-blue-500 flex-shrink-0" />
                <span>{t("billing.clientInvoiceInfo", "بيانات العميل والفاتورة")}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AppleInput
                  label={t("billing.invoiceNumber", "رقم الفاتورة")}
                  name="invoice_number"
                  value={invoiceData.invoice_number}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      invoice_number: e.target.value,
                    })
                  }
                  placeholder="INV-12345"
                  required
                />
                <AppleSelect
                  label={t("billing.status", "الحالة")}
                  name="status"
                  value={invoiceData.status}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      status: e.target.value as InvoiceStatus,
                    })
                  }
                  required
                >
                  <option value="Unpaid">{t("billing.unpaid", "غير مدفوعة")}</option>
                  <option value="Paid">{t("billing.paid", "مدفوعة")}</option>
                  <option value="Overdue">{t("billing.overdue", "متأخرة")}</option>
                  <option value="Draft">{t("billing.draft", "مسودة")}</option>
                  <option value="Cancelled">{t("billing.cancelled", "ملغاة")}</option>
                </AppleSelect>
                <AppleSelect
                  label={t("billing.type", "نوع الفاتورة")}
                  value={invoiceData.type}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      type: e.target.value as InvoiceType,
                    })
                  }
                >
                  <option value="Membership">{t("billing.membershipType", "اشتراك عضوية")}</option>
                  <option value="PT">{t("billing.ptType", "تدريب شخصي")}</option>
                  <option value="Class">{t("billing.classType", "حصص جماعية")}</option>
                  <option value="Facility">{t("billing.facilityType", "مرافق وخدمات")}</option>
                  <option value="Other">{t("billing.otherType", "أخرى")}</option>
                </AppleSelect>
              </div>

              {/* Client Selection */}
              <div className="mt-6 text-start">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("billing.client", "العميل / العضو")} <span className="text-red-500">*</span>
                </label>
                <AppleSelect
                  label=""
                  value={selectedClient?.id || ""}
                  onChange={(e) => {
                    try {
                      const client = clients.find(
                        (c) => c.id === e.target.value,
                      );
                      setSelectedClient(client || null);
                    } catch (error) {
                      console.error(
                        "Error selecting client:",
                        error,
                      );
                      toast.error("Error selecting client");
                    }
                  }}
                >
                  <option value="">{t("billing.selectClient", "اختر العميل...")}</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </AppleSelect>
              </div>

              {/* Client History */}
              {selectedClient && (
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 text-start">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FiInfo className="text-blue-500 flex-shrink-0" />
                    <span>{t("billing.clientHistory", "سجل العميل المالية")}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("billing.lastInvoice", "آخر فاتورة:")}
                      </span>
                      <span className="font-medium mx-2 text-gray-900 dark:text-white">
                        {clientHistory.lastInvoiceDate
                          ? dayjs(
                              clientHistory.lastInvoiceDate,
                            ).format("D MMM YYYY")
                          : t("billing.none", "لا يوجد")}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("billing.outstandingBalance", "الرصيد المتبقي:")}
                      </span>
                      <span
                        className={
                          clientHistory.outstandingBalance > 0
                            ? "font-medium mx-2 text-red-600 dark:text-red-400"
                            : "font-medium mx-2 text-green-600 dark:text-green-400"
                        }
                      >
                        {clientHistory.outstandingBalance.toFixed(
                          3,
                        )}{" "}
                        د.ب
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("billing.overdueInvoicesCount", "فواتير متأخرة:")}
                      </span>
                      <span
                        className={
                          clientHistory.overdueInvoices > 0
                            ? "font-medium mx-2 text-red-600 dark:text-red-400"
                            : "font-medium mx-2 text-green-600 dark:text-green-400"
                        }
                      >
                        {clientHistory.overdueInvoices}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {t("billing.preferredPayment", "الدفع المفضل:")}
                      </span>
                      <span className="font-medium mx-2 text-gray-900 dark:text-white">
                        {clientHistory.preferredPaymentMethod ||
                          t("billing.notSet", "غير محدد")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dates Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiCalendar className="text-green-500 flex-shrink-0" />
                <span>{t("billing.invoiceDates", "تواريخ الفاتورة")}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleInput
                  label={t("billing.issueDate", "تاريخ الإصدار")}
                  name="issue_date"
                  type="date"
                  value={invoiceData.issue_date}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      issue_date: e.target.value,
                    })
                  }
                  required
                />
                <AppleInput
                  label={t("billing.dueDate", "تاريخ الاستحقاق")}
                  name="due_date"
                  type="date"
                  value={invoiceData.due_date}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      due_date: e.target.value,
                    })
                  }
                  min={invoiceData.issue_date}
                  required
                />
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiCreditCard className="text-purple-500 flex-shrink-0" />
                <span>{t("billing.paymentInformation", "معلومات الدفع")}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleSelect
                  label={t("billing.paymentMethod", "طريقة الدفع")}
                  value={invoiceData.payment_method}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      payment_method: e.target
                        .value as PaymentMethodType,
                    })
                  }
                >
                  <option value="">{t("billing.selectPaymentMethod", "اختر طريقة الدفع")}</option>
                  <option value="card">{t("billing.card", "بطاقة ائتمان / خصم")}</option>
                  <option value="bank_transfer">{t("billing.bankTransfer", "تحويل بنكي")}</option>
                  <option value="cash">{t("billing.cash", "نقداً")}</option>
                  <option value="digital_wallet">{t("billing.digitalWallet", "محفظة رقمية (BenefitPay)")}</option>
                  <option value="cheque">{t("billing.cheque", "شيك")}</option>
                </AppleSelect>
                <AppleInput
                  label={t("billing.paidAmount", "المبلغ المدفوع")}
                  type="number"
                  step="0.01"
                  value={invoiceData.paid_amount}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      paid_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Line Items Section */}
        {activeSection === "items" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-start">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiDollarSign className="text-green-500 flex-shrink-0" />
                  <span>{t("billing.lineItems", "بنود الفاتورة")}</span>
                </h3>
                <SmartButton
                  onClick={addItem}
                  variant="secondary"
                  size="sm"
                  icon={<FiPlus className="h-4 w-4" />}
                >
                  {t("billing.addItem", "إضافة بند")}
                </SmartButton>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                      {/* Description */}
                      <div className="lg:col-span-2 text-start">
                        <AppleInput
                          label={t("billing.itemDescription", "الوصف / اسم الخدمة")}
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder={t("billing.enterDescription", "أدخل وصف الخدمة")}
                        />
                        {/* Smart Suggestions */}
                        {!item.description && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(SMART_SUGGESTIONS).map(
                              ([key, suggestion]) => (
                                <button
                                  key={key}
                                  onClick={() =>
                                    applySmartSuggestion(key, index)
                                  }
                                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                                >
                                  {suggestion.description}
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="text-start">
                        <AppleInput
                          label={t("billing.quantity", "الكمية")}
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseInt(e.target.value),
                            )
                          }
                          min={1}
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="text-start">
                        <AppleInput
                          label={t("billing.unitPrice", "سعر الوحدة")}
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unit_price",
                              parseFloat(e.target.value),
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>

                      {/* VAT Rate */}
                      <div className="text-start">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t("billing.vatRate", "نسبة الضريبة")}
                        </label>
                        <select
                          value={item.vat_rate}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "vat_rate",
                              Number(e.target.value) as VatRate,
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        >
                          {VAT_RATES.map((rate) => (
                            <option
                              key={rate.value}
                              value={rate.value}
                            >
                              {rate.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Total */}
                      <div className="flex items-end gap-2 text-start">
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t("billing.total", "الإجمالي")}
                          </label>
                          <div className="px-4 py-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl text-gray-900 dark:text-white font-medium border border-green-200 dark:border-green-800">
                            {item.total.toFixed(3)} د.ب
                          </div>
                        </div>
                        {items.length > 1 && (
                          <button
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Summary Section */}
        {activeSection === "summary" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Invoice Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiBarChart className="text-purple-500 flex-shrink-0" />
                <span>{t("billing.invoiceSummaryTitle", "ملخص الفاتورة والحسابات")}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{t("billing.subtotal", "المجموع الفرعي:")}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {subtotal.toFixed(3)} د.ب
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{t("billing.vatTotal", "إجمالي الضريبة:")}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {vat_total.toFixed(3)} د.ب
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{t("billing.discountTotal", "الخصم:")}</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -{discount_total.toFixed(3)} د.ب
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t("billing.grandTotal", "المجموع الكلي:")}
                      </span>
                      <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {total.toFixed(3)} د.b
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("billing.paidAmountLabel", "المبلغ المدفوع:")}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {invoiceData.paid_amount.toFixed(3)} د.ب
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {t("billing.remainingBalanceLabel", "الرصيد المتبقي:")}
                    </span>
                    <span
                      className={
                        remaining_balance > 0
                          ? "font-medium text-red-600 dark:text-red-400"
                          : "font-medium text-green-600 dark:text-green-400"
                      }
                    >
                      {remaining_balance.toFixed(3)} د.ب
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <AppleInput
                    label={t("billing.paidAmount", "المبلغ المدفوع")}
                    type="number"
                    step="0.01"
                    value={invoiceData.paid_amount}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        paid_amount:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiFileText className="text-orange-500 flex-shrink-0" />
                <span>{t("billing.notes", "الملاحظات")}</span>
              </h3>
              <AppleTextarea
                label={t("billing.notes", "الملاحظات")}
                value={invoiceData.notes}
                onChange={(e) =>
                  setInvoiceData({
                    ...invoiceData,
                    notes: e.target.value,
                  })
                }
                placeholder={t("billing.notesPlaceholder", "أدخل أي ملاحظات إضافية للفاتورة...")}
                rows={3}
              />
            </div>
          </motion.div>
        )}
      </div>
    </SmartModal>
  );
}
