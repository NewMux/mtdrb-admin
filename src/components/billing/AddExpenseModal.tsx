import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiFileText,
  FiUpload,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiSearch,
  FiClock,
  FiTrendingUp,
  FiShield,
  FiBarChart2,
  FiZap,
  FiStar,
  FiTarget,
  FiActivity,
  FiHeart,
  FiSave,
  FiArrowRight,
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import {
  AppleStyleModal,
  AppleInput,
  AppleSelect,
  AppleTextarea,
  AppleButton,
  AppleButtonGroup,
  AppleToggle,
} from "../AppleStyleModal";
import {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  RecurringFrequency,
  PaymentMethodType,
} from "../../types";
import { Database } from "../../types/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { SmartModal } from "../ui/SmartModal";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
  tenantId: string | null;
  expense: Expense | null;
}

// Enhanced expense categories with smart suggestions
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Salaries",
  "Rent",
  "Utilities",
  "Equipment",
  "Cleaning",
  "Subscriptions",
  "Marketing",
  "Insurance",
  "Maintenance",
  "Software",
  "Office Supplies",
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
const EXPENSE_STATUSES = ["pending", "paid", "approved", "rejected"];

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

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface RecentVendor {
  id: string;
  name: string;
  category: string;
  last_used: string;
  total_expenses: number;
}

interface SimilarExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  vendor: string;
  date: string;
  similarity_score: number;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  onExpenseAdded,
  tenantId,
  expense: editingExpense,
}: AddExpenseModalProps) {
  const { user } = useAuth();
  const { tenantId: authTenantId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [recentVendors, setRecentVendors] = useState<RecentVendor[]>([]);
  const [similarExpenses, setSimilarExpenses] = useState<SimilarExpense[]>([]);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const [showSimilarExpenses, setShowSimilarExpenses] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vendorInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors, isValid, isDirty },
    trigger,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      amount: "",
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
  const watchedCategory = watch("category");
  const watchedVendor = watch("vendor");
  const watchedRecurring = watch("recurring");
  const watchedVatIncluded = watch("vat_included");
  const watchedAmount = watch("amount");

  // Load recent vendors and similar expenses
  useEffect(() => {
    if (isOpen) {
      loadRecentVendors();
      if (watchedTitle || watchedDescription) {
        findSimilarExpenses();
      }
    }
  }, [isOpen, watchedTitle, watchedDescription]);

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
        amount: editingExpense.amount.toString(),
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

  // Load recent vendors from database
  const loadRecentVendors = async () => {
    try {
      const { data } = await supabase
        .from("expenses")
        .select("vendor, category, created_at, amount")
        .not("vendor", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        const vendors = data.reduce((acc: RecentVendor[], expense) => {
          const existing = acc.find((v) => v.name === expense.vendor);
          if (existing) {
            existing.total_expenses += expense.amount || 0;
          } else {
            acc.push({
              id: expense.vendor!,
              name: expense.vendor!,
              category: expense.category,
              last_used: expense.created_at,
              total_expenses: expense.amount || 0,
            });
          }
          return acc;
        }, []);

        setRecentVendors(vendors.slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading recent vendors:", error);
    }
  };

  // Find similar expenses for duplicate detection
  const findSimilarExpenses = async () => {
    if (!watchedTitle && !watchedDescription) return;

    setIsAnalyzing(true);
    try {
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .or(
          `title.ilike.%${watchedTitle}%,description.ilike.%${watchedDescription}%`,
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) {
        const similar = data
          .map((expense) => ({
            id: expense.id,
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            vendor: expense.vendor || "",
            date: expense.date,
            similarity_score: calculateSimilarity(expense),
          }))
          .filter((expense) => expense.similarity_score > 0.3);

        setSimilarExpenses(similar);
        setShowSimilarExpenses(similar.length > 0);
      }
    } catch (error) {
      console.error("Error finding similar expenses:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate similarity score between current form and existing expense
  const calculateSimilarity = (expense: any): number => {
    let score = 0;
    const currentText = `${watchedTitle} ${watchedDescription}`.toLowerCase();
    const expenseText =
      `${expense.title} ${expense.description || ""}`.toLowerCase();

    // Title similarity
    if (watchedTitle && expense.title) {
      const titleSimilarity = similarity(
        watchedTitle.toLowerCase(),
        expense.title.toLowerCase(),
      );
      score += titleSimilarity * 0.4;
    }

    // Description similarity
    if (watchedDescription && expense.description) {
      const descSimilarity = similarity(
        watchedDescription.toLowerCase(),
        expense.description.toLowerCase(),
      );
      score += descSimilarity * 0.3;
    }

    // Category match
    if (watchedCategory === expense.category) {
      score += 0.2;
    }

    // Vendor match
    if (
      watchedVendor &&
      expense.vendor &&
      watchedVendor.toLowerCase() === expense.vendor.toLowerCase()
    ) {
      score += 0.1;
    }

    return score;
  };

  // Simple string similarity function
  const similarity = (s1: string, s2: string): number => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    return (longer.length - editDistance(longer, shorter)) / longer.length;
  };

  const editDistance = (s1: string, s2: string): number => {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };

  // Handle file upload with preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
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

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
      setValue("receipt_file", file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        input.files = e.dataTransfer.files;
        handleFileChange({ target: { files: e.dataTransfer.files } } as any);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle vendor autocomplete
  const handleVendorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("vendor", value);
    setShowVendorSuggestions(value.length > 0);
  };

  const selectVendor = (vendor: RecentVendor) => {
    setValue("vendor", vendor.name);
    setValue("category", vendor.category as ExpenseCategory);
    setShowVendorSuggestions(false);
  };

  // Calculate VAT amount
  const calculateVatAmount = () => {
    const amount = parseFloat(watchedAmount) || 0;
    const vatRate = watch("vat_rate") || 15;
    return watchedVatIncluded ? (amount * vatRate) / 100 : 0;
  };

  // Handle form submission
  const onSubmit = async (data: ExpenseFormData) => {
    if (isSubmitting) return;

    if (!authTenantId) {
      toast.error("Tenant ID not found. Please ensure you're logged in.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload file if selected
      let receiptUrl = null;
      if (selectedFile) {
        const fileName = `receipts/${authTenantId}/${Date.now()}_${selectedFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("expense-receipts")
          .upload(fileName, selectedFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("expense-receipts")
          .getPublicUrl(fileName);

        receiptUrl = urlData.publicUrl;
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
        created_by: user?.id,
        country_code: "AE",
        vat_amount: calculateVatAmount(),
        currency: "BHD",
        internal_notes: data.internal_notes || null,
        public_notes: data.public_notes || null,
      };

      const { error } = await supabase
        .from("expenses")
        .insert([expensePayload]);

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

  const totalAmount = parseFloat(watchedAmount) || 0;
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
          : editingExpense
            ? "Update Expense"
            : "Add Expense"}
      </AppleButton>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={handleClose}
          title={editingExpense ? "Edit Expense" : "Add New Expense"}
          subtitle="Track and categorize business expenses with smart features"
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
            onKeyDown={handleKeyDown}
          >
            {/* Expense Details Section */}
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <FiDollarSign className="mr-2" />
                Expense Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleInput
                  label="Title"
                  {...register("title")}
                  error={errors.title?.message}
                  required
                  placeholder="Enter expense title"
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
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </AppleSelect>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppleInput
                  label="Vendor"
                  {...register("vendor")}
                  error={errors.vendor?.message}
                  placeholder="Enter vendor name"
                  onChange={handleVendorInput}
                  ref={vendorInputRef}
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
                placeholder="Describe the expense..."
              />
            </div>

            {/* VAT & Receipt Section */}
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <FiBarChart2 className="mr-2" />
                VAT & Receipt
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
                  Receipt Upload
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
                          setValue("receipt_file", null);
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
                          Drag and drop your receipt here, or{" "}
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
                  {EXPENSE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </AppleSelect>
                <div className="flex items-center space-x-3">
                  <AppleToggle
                    label="Recurring Expense"
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
                  placeholder="Notes visible to members..."
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
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>• {error?.message}</li>
                  ))}
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

export default AddExpenseModal;
