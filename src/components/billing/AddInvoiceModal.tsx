import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  AppleButton,
  AppleToggle,
} from "../AppleStyleModal";
import {
  Invoice,
  InvoiceType,
  InvoiceStatus,
  PaymentMethodType,
} from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { SmartModal } from "../ui/SmartModal";

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceAdded: () => void;
  tenantId: string | null;
  invoice: Invoice | null;
}

// Enhanced invoice categories with smart suggestions
const INVOICE_CATEGORIES: InvoiceType[] = [
  "Membership",
  "PT",
  "Class",
  "Facility",
  "Other",
];

const PAYMENT_METHODS: PaymentMethodType[] = [
  "cash",
  "card",
  "bank_transfer",
  "cheque",
  "digital_wallet",
];

const RECURRING_FREQUENCIES = ["weekly", "monthly", "quarterly", "yearly"];
const INVOICE_STATUSES = [
  "Paid",
  "Unpaid",
  "Partial",
  "Overdue",
  "Refunded",
  "Draft",
  "Cancelled",
];

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
        vat_rate: 15,
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
    const vatRate = watch("vat_rate") || 15;
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
        const fileName = `invoices/${authTenantId}/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("invoice-files")
          .upload(fileName, selectedFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("invoice-files")
          .getPublicUrl(fileName);

        invoiceUrl = urlData.publicUrl;
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
        country_code: "AE",
        vat_amount: calculateVatAmount(),
        currency: "BHD",
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

  // Sticky footer
  const Footer = () => (
    <div className="sticky bottom-0 left-0 w-full bg-white border-t border-gray-200 py-4 px-8 flex items-center justify-between z-10">
      <AppleButton variant="secondary" onClick={onClose}>
        Cancel
      </AppleButton>
      <AppleButton
        variant="primary"
        onClick={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting
          ? "Saving..."
          : editingInvoice
            ? "Update Invoice"
            : "Add Invoice"}
      </AppleButton>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={handleClose}
          title={editingInvoice ? "Edit Invoice" : "Add New Invoice"}
          subtitle="Create and manage professional invoices with smart features"
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
            onKeyDown={handleKeyDown}
          >
            {/* Invoice Details Section */}
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <FiDollarSign className="mr-2" />
                Invoice Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleInput
                  label="Title"
                  {...register("title")}
                  error={errors.title?.message}
                  required
                  placeholder="Enter invoice title"
                />
                <AppleInput
                  label="Amount"
                  type="number"
                  step="0.01"
                  {...register("amount")}
                  error={errors.amount?.message}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleInput
                  label="Date"
                  type="date"
                  {...register("date")}
                  error={errors.date?.message}
                  required
                />
                <AppleSelect
                  label="Category"
                  {...register("category")}
                  error={errors.category?.message}
                  required
                >
                  <option value="">Select Category</option>
                  {INVOICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </AppleSelect>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleInput
                  label="Client"
                  {...register("client")}
                  error={errors.client?.message}
                  placeholder="Enter client name"
                  onChange={handleClientInput}
                  ref={clientInputRef}
                />
                <AppleSelect
                  label="Payment Method"
                  {...register("payment_method")}
                  error={errors.payment_method?.message}
                  required
                >
                  <option value="">Select Payment Method</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() +
                        method.slice(1).replace("_", " ")}
                    </option>
                  ))}
                </AppleSelect>
              </div>
              <AppleTextarea
                label="Description"
                {...register("description")}
                error={errors.description?.message}
                rows={3}
                placeholder="Describe the invoice..."
              />
            </div>

            {/* VAT & File Section */}
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <FiBarChart2 className="mr-2" />
                VAT & File
              </h3>
              <div className="flex items-center space-x-4">
                <AppleToggle
                  label="VAT Included"
                  checked={watchedVatIncluded}
                  onChange={(checked) => setValue("vat_included", checked)}
                />
                {watchedVatIncluded && (
                  <AppleSelect
                    label="VAT Rate"
                    {...register("vat_rate")}
                    error={errors.vat_rate?.message}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={15}>15%</option>
                  </AppleSelect>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                {watchedVatIncluded && (
                  <div className="flex justify-between text-sm">
                    <span>VAT ({watch("vat_rate")}%):</span>
                    <span>${vatAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total:</span>
                  <span>${finalAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <FiUpload className="mr-2" />
                  Invoice File Upload
                </h4>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
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
                        <p className="text-sm font-medium text-gray-900">
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
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <FiUpload className="h-12 w-12 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Drag and drop your invoice file here, or{" "}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Supports: JPG, PNG, GIF, PDF (max 10MB)
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
            </div>

            {/* Settings & Notes Section */}
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <FiShield className="mr-2" />
                Settings & Notes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleSelect
                  label="Status"
                  {...register("status")}
                  error={errors.status?.message}
                  required
                >
                  <option value="">Select Status</option>
                  {INVOICE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </AppleSelect>
                <div className="flex items-center space-x-3">
                  <AppleToggle
                    label="Recurring Invoice"
                    checked={watchedRecurring}
                    onChange={(checked) => setValue("recurring", checked)}
                  />
                </div>
              </div>
              {watchedRecurring && (
                <AppleSelect
                  label="Recurring Frequency"
                  {...register("recurring_frequency")}
                  error={errors.recurring_frequency?.message}
                >
                  <option value="">Select Frequency</option>
                  {RECURRING_FREQUENCIES.map((freq) => (
                    <option key={freq} value={freq}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </option>
                  ))}
                </AppleSelect>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleTextarea
                  label="Internal Notes"
                  {...register("internal_notes")}
                  error={errors.internal_notes?.message}
                  rows={3}
                  placeholder="Private notes for staff only..."
                />
                <AppleTextarea
                  label="Public Notes"
                  {...register("public_notes")}
                  error={errors.public_notes?.message}
                  rows={3}
                  placeholder="Notes visible to clients..."
                />
              </div>
            </div>

            {/* Error Display */}
            {Object.keys(errors).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-center mb-2">
                  <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-sm font-medium text-red-700">
                    Please fix the following errors:
                  </p>
                </div>
                <ul className="text-sm text-red-600 space-y-1">
                  {Object.values(errors).map((error, index) => {
                    const errorMessage = error && typeof error === 'object' && 'message' in error 
                      ? String(error.message) 
                      : String(error || 'Unknown error');
                    return <li key={index}>• {errorMessage}</li>;
                  })}
                </ul>
              </motion.div>
            )}

            <Footer />
          </form>
        </SmartModal>
      )}
    </AnimatePresence>
  );
}

export default AddInvoiceModal;
