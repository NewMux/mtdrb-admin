import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FiDollarSign,
  FiFileText,
  FiUpload,
  FiAlertCircle,
  FiShield,
  FiBarChart2,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import {
  AppleInput,
  AppleSelect,
  AppleTextarea,
  AppleToggle,
} from "../AppleStyleModal";
import {
  Expense,
  ExpenseCategory,
} from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { UnifiedModal } from "../ui/UnifiedModal";
import { SmartButton } from "../ui/DesignSystem";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
  tenantId: string | null;
  expense: Expense | null;
}

// Smart categorization patterns
const SMART_CATEGORIZATION = {
  SALARY: { category: "Salaries", description: "Staff Salary Payment" },
  RENT: { category: "Rent", description: "Monthly Rent Payment" },
  ELECTRICITY: { category: "Utilities", description: "Electricity Bill" },
  WATER: { category: "Utilities", description: "Water Bill" },
  INTERNET: { category: "Utilities", description: "Internet Service" },
  EQUIPMENT: { category: "Equipment", description: "Gym Equipment Purchase" },
  CLEANING: { category: "Cleaning", description: "Cleaning Services" },
  MARKETING: { category: "Marketing", description: "Marketing Campaign" },
  ADS: { category: "Marketing", description: "Advertising Campaign" },
  INSURANCE: { category: "Insurance", description: "Insurance Payment" },
  MAINTENANCE: { category: "Maintenance", description: "Maintenance Services" },
  SOFTWARE: { category: "Software", description: "Software Subscription" },
  OFFICE: {
    category: "Office Supplies",
    description: "Office Supplies Purchase",
  },
  SUBSCRIPTION: {
    category: "Subscriptions",
    description: "Service Subscription",
  },
  TRAINER: { category: "Salaries", description: "Trainer Payment" },
  UTILITY: { category: "Utilities", description: "Utility Bill" },
  REPAIR: { category: "Maintenance", description: "Repair Services" },
  ADVERTISING: { category: "Marketing", description: "Advertising Expense" },
  LEGAL: { category: "Insurance", description: "Legal Services" },
  ACCOUNTING: { category: "Other", description: "Accounting Services" },
};

// Validation schema
const expenseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  vendor: z.string().optional(),
  description: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  recurring: z.boolean().default(false),
  recurring_frequency: z.string().optional(),
  vat_included: z.boolean().default(false),
  vat_rate: z.coerce.number().min(0).max(100).optional(),
  internal_notes: z.string().optional(),
  public_notes: z.string().optional(),
  receipt_file: z.any().optional(),
});

type ExpenseFormData = z.input<typeof expenseSchema>;

export function AddExpenseModal({
  isOpen,
  onClose,
  onExpenseAdded,
  expense: editingExpense,
}: AddExpenseModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { user } = useAuth();
  const { tenantId: authTenantId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vendorInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      category: "Other",
      payment_method: "card",
      vendor: "",
      description: "",
      status: "pending",
      recurring: false,
      recurring_frequency: "monthly",
      vat_included: false,
      vat_rate: 15,
      internal_notes: "",
      public_notes: "",
    },
    mode: "onChange",
  });

  const watchedTitle = watch("title");
  const watchedDescription = watch("description");
  const watchedRecurring = Boolean(watch("recurring"));
  const watchedVatIncluded = Boolean(watch("vat_included"));
  const watchedAmount = watch("amount");

  // Auto-categorization based on title and description
  useEffect(() => {
    if (watchedTitle || watchedDescription) {
      const text = `${watchedTitle} ${watchedDescription}`.toUpperCase();
      for (const [key, suggestion] of Object.entries(SMART_CATEGORIZATION)) {
        if (text.includes(key)) {
          setValue("category", suggestion.category as ExpenseCategory);
          if (!watchedDescription) {
            setValue("description", suggestion.description);
          }
          break;
        }
      }
    }
  }, [watchedTitle, watchedDescription, setValue]);

  // Load editing expense data
  useEffect(() => {
    if (editingExpense && isOpen) {
      reset({
        title: editingExpense.title || "",
        amount: typeof editingExpense.amount === 'number' ? editingExpense.amount : parseFloat(String(editingExpense.amount)) || 0,
        date: editingExpense.date || new Date().toISOString().split("T")[0],
        category: editingExpense.category || "Other",
        payment_method: editingExpense.payment_method || "card",
        vendor: editingExpense.vendor || "",
        description: editingExpense.description || "",
        status: editingExpense.status || "pending",
        recurring: editingExpense.recurring || false,
        recurring_frequency: editingExpense.recurring_frequency || "monthly",
        vat_included: false,
        vat_rate: 15,
        internal_notes: editingExpense.internal_notes || "",
        public_notes: editingExpense.public_notes || "",
      });
    }
  }, [editingExpense, isOpen, reset]);

  // Handle file upload with preview
  const handleFileSelection = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid file type (JPEG, PNG, GIF, or PDF)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setValue("receipt_file", file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result?.toString() || null);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const input = fileInputRef.current;
    if (input) {
      input.files = e.dataTransfer.files;
    }
    handleFileSelection(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle vendor autocomplete
  const handleVendorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("vendor", value);
  };

  // Calculate VAT amount
  const calculateVatAmount = () => {
    const amount =
      typeof watchedAmount === "number"
        ? watchedAmount
        : parseFloat(String(watchedAmount)) || 0;
    const vatRate = watch("vat_rate") || 15;
    return watchedVatIncluded ? (amount * vatRate) / 100 : 0;
  };

  // Handle form submission
  const onSubmit: SubmitHandler<ExpenseFormData> = async (data) => {
    if (isSubmitting) return;

    if (!authTenantId) {
      toast.error("Tenant ID not found. Please ensure you're logged in.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload file if selected, otherwise keep whatever receipt was already there
      let receiptUrl = editingExpense?.receipt_url || null;
      if (selectedFile) {
        const safeFileName = selectedFile.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .slice(-120);
        const fileName = `receipts/${authTenantId}/${crypto.randomUUID()}_${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from("expense-receipts")
          .upload(fileName, selectedFile);

        if (uploadError) {
          throw uploadError;
        }

        // Store only the object path. The bucket is private; callers must
        // request a short-lived signed URL when they need to view the file.
        receiptUrl = fileName;
      }

      const expensePayload = {
        title: data.title,
        date: data.date,
        amount: parseFloat(data.amount.toString()),
        category: data.category,
        payment_method: data.payment_method,
        vendor: data.vendor || null,
        description: data.description || null,
        receipt_url: receiptUrl,
        status: data.status,
        recurring: data.recurring,
        recurring_frequency: data.recurring ? data.recurring_frequency : null,
        tenant_id: authTenantId,
        country_code: "AE",
        vat_amount: calculateVatAmount(),
        currency: "BHD",
        internal_notes: data.internal_notes || null,
        public_notes: data.public_notes || null,
        ...(editingExpense
          ? { updated_by: user?.id }
          : { created_by: user?.id }),
      };

      const { error } = editingExpense
        ? await supabase
            .from("expenses")
            .update(expensePayload)
            .eq("id", editingExpense.id)
        : await supabase.from("expenses").insert([expensePayload]);

      if (error) {
        throw error;
      }

      toast.success(
        editingExpense
          ? "Expense updated successfully"
          : "Expense added successfully",
      );
      onExpenseAdded();
      onClose();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close with data preservation
  const handleClose = () => {
    if (isDirty) {
      const shouldClose = window.confirm(
        "You have unsaved changes. Are you sure you want to close?",
      );
      if (!shouldClose) return;
    }
    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
    if (e.key === "Enter" && e.ctrlKey) {
      handleSubmit(onSubmit)();
    }
  };

  const totalAmount = typeof watchedAmount === 'number' ? watchedAmount : parseFloat(String(watchedAmount)) || 0;
  const vatAmount = calculateVatAmount();
  const finalAmount = totalAmount + vatAmount;

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <SmartButton variant="secondary" onClick={handleClose} disabled={isSubmitting}>
        {t("common.cancel", "إلغاء")}
      </SmartButton>
      <SmartButton
        variant="primary"
        onClick={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={!isValid || isSubmitting}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {isSubmitting
          ? t("billing.saving", "جاري الحفظ...")
          : editingExpense
            ? t("billing.updateExpense", "تحديث المصروف")
            : t("billing.addExpense", "إضافة المصروف")}
      </SmartButton>
    </div>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingExpense ? t("billing.editExpense", "تعديل المصروف") : t("billing.addExpenseTitle", "إضافة مصروف جديد")}
      subtitle={t("billing.addExpenseSubtitle", "تسجيل وتصنيف المصروفات التشغيلية بخيارات متقدمة")}
      footer={footer}
      maxWidth="4xl"
      slideFrom="right"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 text-start"
        dir={isRTL ? "rtl" : "ltr"}
        onKeyDown={handleKeyDown}
      >
        {/* Expense Details Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0">
              <FiDollarSign className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent text-start">
              {t("billing.expenseDetails", "تفاصيل المصروف")}
            </h3>
          </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
                <AppleInput
                  label={t("billing.title", "عنوان المصروف")}
                  {...register("title")}
                  error={errors.title?.message}
                  required
                  placeholder={t("billing.expenseTitlePlaceholder", "أدخل عنوان المصروف (مثال: صيانة معدات الرياضة)")}
                />
                <AppleInput
                  label={t("billing.amount", "المبلغ الإجمالي")}
                  type="number"
                  step="0.01"
                  {...register("amount")}
                  error={errors.amount?.message}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
                <AppleInput
                  label={t("billing.date", "التاريخ")}
                  type="date"
                  {...register("date")}
                  error={errors.date?.message}
                  required
                />
                <AppleSelect
                  label={t("billing.category", "فئة المصروف")}
                  {...register("category")}
                  error={errors.category?.message}
                  required
                >
                  <option value="">{t("billing.selectCategory", "اختر الفئة")}</option>
                  <option value="Salaries">{t("billing.salaries", "الرواتب والأجور")}</option>
                  <option value="Rent">{t("billing.rent", "الإيجار")}</option>
                  <option value="Utilities">{t("billing.utilities", "المرافق والخدمات (كهرباء/ماء/إنترنت)")}</option>
                  <option value="Equipment">{t("billing.equipment", "المعدات والأجهزة")}</option>
                  <option value="Cleaning">{t("billing.cleaning", "النظافة والتطهير")}</option>
                  <option value="Subscriptions">{t("billing.subscriptions", "الاشتراكات والخدمات الرقمية")}</option>
                  <option value="Marketing">{t("billing.marketing", "التسويق والإعلانات")}</option>
                  <option value="Insurance">{t("billing.insurance", "التأمين")}</option>
                  <option value="Maintenance">{t("billing.maintenance", "الصيانة والتشغيل")}</option>
                  <option value="Software">{t("billing.software", "البرامج والأنظمة")}</option>
                  <option value="Office Supplies">{t("billing.officeSupplies", "مستلزمات مكتبية")}</option>
                  <option value="Other">{t("billing.other", "مصروفات أخرى")}</option>
                </AppleSelect>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
                <AppleInput
                  label={t("billing.vendor", "المورد / الجهة المستلمة")}
                  {...register("vendor")}
                  error={errors.vendor?.message}
                  placeholder={t("billing.enterVendorName", "أدخل اسم الشركة أو الجهة")}
                  onChange={handleVendorInput}
                  ref={vendorInputRef}
                />
                <AppleSelect
                  label={t("billing.paymentMethod", "طريقة الدفع")}
                  {...register("payment_method")}
                  error={errors.payment_method?.message}
                  required
                >
                  <option value="">{t("billing.selectPaymentMethod", "اختر طريقة الدفع")}</option>
                  <option value="cash">{t("billing.cash", "نقداً")}</option>
                  <option value="card">{t("billing.card", "بطاقة ائتمان / خصم")}</option>
                  <option value="bank_transfer">{t("billing.bankTransfer", "تحويل بنكي")}</option>
                  <option value="cheque">{t("billing.cheque", "شيك")}</option>
                  <option value="digital_wallet">{t("billing.digitalWallet", "محفظة رقمية (BenefitPay)")}</option>
                </AppleSelect>
              </div>
          <AppleTextarea
            label={t("billing.description", "الوصف التفصيلي")}
            {...register("description")}
            error={errors.description?.message}
            rows={3}
            placeholder={t("billing.expenseDescriptionPlaceholder", "أدخل تفاصيل المصروف والأسباب...")}
          />
        </section>

        {/* VAT & Receipt Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex-shrink-0">
              <FiBarChart2 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent text-start">
              {t("billing.vatAndReceipt", "الضريبة والإيصال")}
            </h3>
          </div>
              <div className="flex items-center space-x-4 text-start">
                <AppleToggle
                  label={t("billing.vatIncluded", "شامل ضريبة القيمة المضافة (10%)")}
                  checked={watchedVatIncluded}
                  onChange={(checked) => setValue("vat_included", checked)}
                />
                {watchedVatIncluded && (
                  <AppleSelect
                    label={t("billing.vatRate", "نسبة الضريبة")}
                    {...register("vat_rate")}
                    error={errors.vat_rate?.message}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                  </AppleSelect>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 border border-gray-200 dark:border-gray-700 text-start">
                <div className="flex justify-between text-sm">
                  <span>{t("billing.subtotal", "المجموع الفرعي:")}</span>
                  <span>{totalAmount.toFixed(3)} د.ب</span>
                </div>
                {watchedVatIncluded && (
                  <div className="flex justify-between text-sm">
                    <span>{t("billing.vatLabel", "ضريبة القيمة المضافة")} ({watch("vat_rate")}%):</span>
                    <span>{vatAmount.toFixed(3)} د.ب</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t border-gray-200 dark:border-gray-700 pt-2 text-base text-blue-600 dark:text-blue-400">
                  <span>{t("billing.grandTotal", "المجموع الكلي:")}</span>
                  <span>{finalAmount.toFixed(3)} د.ب</span>
                </div>
              </div>
              <div className="space-y-4 text-start">
                <h4 className="font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                  <FiUpload className="flex-shrink-0" />
                  <span>{t("billing.receiptUpload", "إرفاق إيصال الدفع أو الفاتورة")}</span>
                </h4>
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-white dark:bg-gray-700/50"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      {filePreview ? (
                        <div className="flex justify-center">
                          <img
                            src={filePreview}
                            alt="Receipt preview"
                            className="max-w-xs max-h-32 object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <FiFileText className="h-12 w-12 text-green-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                          setValue("receipt_file", null);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer"
                      >
                        {t("billing.removeFile", "حذف الملف")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <FiUpload className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("billing.dragAndDropReceipt", "اسحب وأسقط ملف الإيصال هنا، أو")}{" "}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer"
                          >
                            {t("billing.browseFiles", "استعراض الملفات")}
                          </button>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t("billing.supportedFormats", "الصيغ المدعومة: JPG, PNG, GIF, PDF (حد أقصى 10 ميجابايت)")}
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
        </section>

        {/* Settings & Notes Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex-shrink-0">
              <FiShield className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent text-start">
              {t("billing.settingsAndNotes", "الإعدادات والملاحظات")}
            </h3>
          </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
                <AppleSelect
                  label={t("billing.status", "الحالة")}
                  {...register("status")}
                  error={errors.status?.message}
                  required
                >
                  <option value="">{t("billing.selectStatus", "اختر الحالة")}</option>
                  <option value="pending">{t("billing.pending", "قيد الانتظار")}</option>
                  <option value="paid">{t("billing.paid", "مدفوع")}</option>
                  <option value="approved">{t("billing.approved", "معتمد")}</option>
                  <option value="rejected">{t("billing.rejected", "مرفوض")}</option>
                </AppleSelect>
                <div className="flex items-center space-x-3 text-start">
                  <AppleToggle
                    label={t("billing.recurringExpense", "مصروف متكرر دوري")}
                    checked={watchedRecurring}
                    onChange={(checked) => setValue("recurring", checked)}
                  />
                </div>
              </div>
              {watchedRecurring && (
                <AppleSelect
                  label={t("billing.recurringFrequency", "تكرار المصروف")}
                  {...register("recurring_frequency")}
                  error={errors.recurring_frequency?.message}
                >
                  <option value="">{t("billing.selectFrequency", "اختر تكرار المصروف")}</option>
                  <option value="weekly">{t("billing.weekly", "أسبوعياً")}</option>
                  <option value="monthly">{t("billing.monthly", "شهرياً")}</option>
                  <option value="quarterly">{t("billing.quarterly", "ربع سنوي")}</option>
                  <option value="yearly">{t("billing.yearly", "سنوياً")}</option>
                </AppleSelect>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
                <AppleTextarea
                  label={t("billing.internalNotes", "ملاحظات داخلية (للموظفين)")}
                  {...register("internal_notes")}
                  error={errors.internal_notes?.message}
                  rows={3}
                  placeholder={t("billing.internalNotesPlaceholder", "ملاحظات خاصة بالإدارة...")}
                />
                <AppleTextarea
                  label={t("billing.publicNotes", "ملاحظات عامة")}
                  {...register("public_notes")}
                  error={errors.public_notes?.message}
                  rows={3}
                  placeholder={t("billing.publicNotesPlaceholder", "ملاحظات إضافية للمستند...")}
                />
              </div>
        </section>

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-start"
          >
            <div className="flex items-center gap-2 mb-2">
              <FiAlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {t("billing.fixErrorsWarning", "يرجى تصحيح الأخطاء التالية:")}
              </p>
            </div>
            <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
              {Object.values(errors).map((error, index) => {
                const errorMessage = error && typeof error === 'object' && 'message' in error 
                  ? String(error.message) 
                  : String(error || 'Unknown error');
                return <li key={index}>• {errorMessage}</li>;
              })}
            </ul>
          </motion.div>
        )}
      </form>
    </UnifiedModal>
  );
}

export default AddExpenseModal;
