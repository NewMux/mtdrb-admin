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
  Invoice,
  InvoiceType,
  InvoiceStatus,
} from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { UnifiedModal } from "../ui/UnifiedModal";
import { SmartButton } from "../ui/DesignSystem";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";
import {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_VAT_RATE,
  PLATFORM_CURRENCY,
} from "../../config/runtimeConfig";

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceAdded: () => void;
  tenantId: string | null;
  invoice: Invoice | null;
}

// Smart categorization patterns
const SMART_CATEGORIZATION = {
  MEMBERSHIP: { category: "Membership", description: "Gym Membership Payment" },
  TRAINING: { category: "PT", description: "Personal Training Session" },
  CLASS: { category: "Class", description: "Group Class Session" },
  EQUIPMENT: { category: "Facility", description: "Equipment Purchase" },
  SUPPLEMENT: { category: "Other", description: "Supplement Purchase" },
  MERCHANDISE: { category: "Other", description: "Gym Merchandise" },
  SERVICE: { category: "Other", description: "Gym Service" },
  CONSULTATION: { category: "PT", description: "Fitness Consultation" },
  ASSESSMENT: { category: "PT", description: "Fitness Assessment" },
  PERSONAL: { category: "PT", description: "Personal Training" },
  GROUP: { category: "Class", description: "Group Class" },
  MERCH: { category: "Other", description: "Merchandise" },
  CONSULT: { category: "PT", description: "Consultation" },
  ASSESS: { category: "PT", description: "Assessment" },
};

// Validation schema
const invoiceSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  client: z.string().optional(),
  description: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  recurring: z.boolean().default(false),
  recurring_frequency: z.string().optional(),
  vat_included: z.boolean().default(false),
  vat_rate: z.coerce.number().min(0).max(100).optional(),
  internal_notes: z.string().optional(),
  public_notes: z.string().optional(),
  invoice_file: z.any().optional(),
});

type InvoiceFormData = z.input<typeof invoiceSchema>;

export function AddInvoiceModal({
  isOpen,
  onClose,
  onInvoiceAdded,
  invoice: editingInvoice,
}: AddInvoiceModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { user } = useAuth();
  const { tenantId: authTenantId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      title: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      category: "Other",
      payment_method: "card",
      client: "",
      description: "",
      status: "Unpaid",
      recurring: false,
      recurring_frequency: "monthly",
      vat_included: false,
      vat_rate: DEFAULT_VAT_RATE,
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
          setValue("category", suggestion.category as InvoiceType);
          if (!watchedDescription) {
            setValue("description", suggestion.description);
          }
          break;
        }
      }
    }
  }, [watchedTitle, watchedDescription, setValue]);

  // Load editing invoice data
  useEffect(() => {
    if (editingInvoice && isOpen) {
      reset({
        title: editingInvoice.title || "",
        amount: typeof editingInvoice.amount === 'number' ? editingInvoice.amount : (typeof editingInvoice.total === 'number' ? editingInvoice.total : 0),
        date:
          editingInvoice.issue_date || new Date().toISOString().split("T")[0],
        category: editingInvoice.type || "Other",
        payment_method: editingInvoice.payment_method || "card",
        client: editingInvoice.member?.name || "",
        description: editingInvoice.notes || "",
        status: editingInvoice.status || "Unpaid",
        recurring: false,
        recurring_frequency: "monthly",
        vat_included: false,
        vat_rate: DEFAULT_VAT_RATE,
        internal_notes: "",
        public_notes: "",
      });
    }
  }, [editingInvoice, isOpen, reset]);

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
    setValue("invoice_file", file);

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

  // Handle client autocomplete
  const handleClientInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("client", value);
  };

  // Calculate VAT amount
  const calculateVatAmount = () => {
    const amount =
      typeof watchedAmount === "number"
        ? watchedAmount
        : typeof watchedAmount === "string"
          ? parseFloat(watchedAmount)
          : 0;
    const vatRate = watch("vat_rate") || DEFAULT_VAT_RATE;
    return watchedVatIncluded ? (amount * vatRate) / 100 : 0;
  };

  // Handle form submission
  const onSubmit: SubmitHandler<InvoiceFormData> = async (data) => {
    if (isSubmitting) return;

    if (!authTenantId) {
      toast.error("Tenant ID not found. Please ensure you're logged in.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload file if selected
      let invoiceUrl = null;
      if (selectedFile) {
        const safeFileName = selectedFile.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .slice(-120);
        const fileName = `invoices/${authTenantId}/${crypto.randomUUID()}_${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from("invoice-files")
          .upload(fileName, selectedFile);

        if (uploadError) {
          throw uploadError;
        }

        // Store only the object path. The bucket is private; callers must
        // request a short-lived signed URL when they need to view the file.
        invoiceUrl = fileName;
      }

      const invoicePayload = {
        title: data.title,
        issue_date: data.date,
        amount: parseFloat(data.amount.toString()),
        type: data.category as InvoiceType,
        payment_method: data.payment_method,
        member: data.client || null,
        notes: data.description || null,
        invoice_url: invoiceUrl,
        status: data.status as InvoiceStatus,
        tenant_id: authTenantId,
        created_by: user?.id,
        country_code: DEFAULT_COUNTRY_CODE || null,
        vat_amount: calculateVatAmount(),
        currency: PLATFORM_CURRENCY,
        internal_notes: data.internal_notes || null,
        public_notes: data.public_notes || null,
      };

      const { error } = await supabase
        .from("invoices")
        .insert([invoicePayload]);

      if (error) {
        throw error;
      }

      toast.success(
        editingInvoice
          ? "Invoice updated successfully"
          : "Invoice added successfully",
      );
      onInvoiceAdded();
      onClose();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice. Please try again.");
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
          : editingInvoice
            ? t("billing.updateInvoice", "تحديث الفاتورة")
            : t("billing.addInvoice", "إصدار الفاتورة")}
      </SmartButton>
    </div>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingInvoice ? t("billing.editInvoice", "تعديل الفاتورة") : t("billing.addInvoiceTitle", "إصدار فاتورة جديدة")}
      subtitle={t("billing.addInvoiceSubtitle", "إنشاء وإدارة الفواتير الاحترافية للعملاء والأعضاء")}
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
        {/* Invoice Details Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0">
              <FiDollarSign className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-start">
              {t("billing.invoiceDetails", "تفاصيل الفاتورة")}
            </h3>
          </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
                <AppleInput
                  label={t("billing.title", "عنوان الفاتورة")}
                  {...register("title")}
                  error={errors.title?.message}
                  required
                  placeholder={t("billing.titlePlaceholder", "أدخل عنوان الفاتورة (مثال: اشتراك شهري)")}
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
                  label={t("billing.category", "الفئة / النوع")}
                  {...register("category")}
                  error={errors.category?.message}
                  required
                >
                  <option value="">{t("billing.selectCategory", "اختر الفئة")}</option>
                  <option value="Membership">{t("billing.membershipType", "اشتراك عضوية")}</option>
                  <option value="PT">{t("billing.ptType", "تدريب شخصي")}</option>
                  <option value="Class">{t("billing.classType", "حصص جماعية")}</option>
                  <option value="Facility">{t("billing.facilityType", "مرافق وخدمات")}</option>
                  <option value="Other">{t("billing.otherType", "أخرى")}</option>
                </AppleSelect>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
                <AppleInput
                  label={t("billing.client", "العميل / العضو")}
                  {...register("client")}
                  error={errors.client?.message}
                  placeholder={t("billing.enterClientName", "أدخل اسم العميل")}
                  onChange={handleClientInput}
                  ref={clientInputRef}
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
            label={t("billing.description", "الوصف")}
            {...register("description")}
            error={errors.description?.message}
            rows={3}
            placeholder={t("billing.descriptionPlaceholder", "وصف تفصيلي للفاتورة والخدمات المقدمة...")}
          />
        </section>

        {/* VAT & File Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex-shrink-0">
              <FiBarChart2 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-start">
              {t("billing.vatAndFile", "الضريبة والمستندات")}
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
                <h4 className="font-medium flex items-center gap-2">
                  <FiUpload className="flex-shrink-0" />
                  <span>{t("billing.uploadInvoiceFile", "إرفاق ملف أو إيصال الفاتورة")}</span>
                </h4>
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      {filePreview ? (
                        <div className="flex justify-center">
                          <img
                            src={filePreview}
                            alt="Invoice preview"
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
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                          setValue("invoice_file", null);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer"
                      >
                        {t("billing.removeFile", "حذف الملف")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <FiUpload className="h-12 w-12 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("billing.dragAndDropFile", "قم بسحب وإفلات ملف الفاتورة هنا، أو")}{" "}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-start">
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
                  <option value="Unpaid">{t("billing.unpaid", "غير مدفوعة")}</option>
                  <option value="Paid">{t("billing.paid", "مدفوعة")}</option>
                  <option value="Overdue">{t("billing.overdue", "متأخرة")}</option>
                  <option value="Draft">{t("billing.draft", "مسودة")}</option>
                  <option value="Cancelled">{t("billing.cancelled", "ملغاة")}</option>
                </AppleSelect>
                <div className="flex items-center space-x-3 text-start">
                  <AppleToggle
                    label={t("billing.recurringInvoice", "فاتورة متكررة دورية")}
                    checked={watchedRecurring}
                    onChange={(checked) => setValue("recurring", checked)}
                  />
                </div>
              </div>
              {watchedRecurring && (
                <AppleSelect
                  label={t("billing.recurringFrequency", "تكرار الفاتورة")}
                  {...register("recurring_frequency")}
                  error={errors.recurring_frequency?.message}
                >
                  <option value="">{t("billing.selectFrequency", "اختر تكرار الفاتورة")}</option>
                  <option value="weekly">{t("billing.weekly", "أسبوعياً")}</option>
                  <option value="monthly">{t("billing.monthly", "شهرياً")}</option>
                  <option value="quarterly">{t("billing.quarterly", "ربع سنوي")}</option>
                  <option value="yearly">{t("billing.yearly", "سنوياً")}</option>
                </AppleSelect>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
                <AppleTextarea
                  label={t("billing.internalNotes", "ملاحظات داخلية (للموظفين فقط)")}
                  {...register("internal_notes")}
                  error={errors.internal_notes?.message}
                  rows={3}
                  placeholder={t("billing.internalNotesPlaceholder", "ملاحظات سرية خاصة بالإدارة...")}
                />
                <AppleTextarea
                  label={t("billing.publicNotes", "ملاحظات العميل (تظهر بالفاتورة)")}
                  {...register("public_notes")}
                  error={errors.public_notes?.message}
                  rows={3}
                  placeholder={t("billing.publicNotesPlaceholder", "ملاحظات تظهر للعميل على الفاتورة...")}
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
              <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
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

export default AddInvoiceModal;
