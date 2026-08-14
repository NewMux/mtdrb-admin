import React, { useState, useEffect } from "react";
import { SmartModal } from "../../ui/SmartModal";
import { SmartButton } from "../../ui/DesignSystem";
import { AppleInput, AppleSelect, AppleTextarea } from "../../AppleStyleModal";
import { Expense } from "../../../types";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { createPrivateStorageUrl } from "../../../utils/storage";
import toast from "react-hot-toast";
import { FiDownload, FiEdit2, FiSave, FiX } from "react-icons/fi";

interface ViewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  mode?: "view" | "edit";
  onSuccess?: () => void;
}

/**
 * ViewExpenseModal - Modal for viewing and editing expense details
 * Supports both view-only and edit modes
 */
const ViewExpenseModal: React.FC<ViewExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  mode = "view",
  onSuccess,
}) => {
  const { tenantId } = useAuth();
  const [isEditing, setIsEditing] = useState(mode === "edit");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendor: "",
    description: "",
    amount: "",
    category: "",
    date: "",
    status: "",
  });

  // Reset form when expense changes or modal opens
  useEffect(() => {
    if (expense && isOpen) {
      setFormData({
        vendor: expense.vendor || "",
        description: expense.description || "",
        amount: expense.amount?.toString() || "",
        category: expense.category || "",
        date: expense.date || "",
        status: expense.status || "pending",
      });
      setIsEditing(mode === "edit");
    }
  }, [expense, isOpen, mode]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!expense?.id || !tenantId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          vendor: formData.vendor,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", expense.id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast.success("Expense updated successfully");
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!expense?.receipt_url) {
      toast.error("No receipt available for this expense");
      return;
    }

    const signedUrl = await createPrivateStorageUrl(
      "expense-receipts",
      expense.receipt_url,
    );
    if (!signedUrl) {
      toast.error("Unable to open receipt");
      return;
    }

    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!expense) return null;

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Expense" : "Expense Details"}
      footer={
        <div className="flex justify-between w-full">
          <div>
            {expense.receipt_url && (
              <SmartButton
                variant="secondary"
                icon={<FiDownload size={16} />}
                onClick={handleDownloadReceipt}
              >
                Download Receipt
              </SmartButton>
            )}
          </div>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <SmartButton
                  variant="secondary"
                  icon={<FiX size={16} />}
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </SmartButton>
                <SmartButton
                  variant="primary"
                  icon={<FiSave size={16} />}
                  onClick={handleSave}
                  loading={loading}
                >
                  Save Changes
                </SmartButton>
              </>
            ) : (
              <>
                <SmartButton
                  variant="secondary"
                  icon={<FiEdit2 size={16} />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </SmartButton>
                <SmartButton variant="primary" onClick={onClose}>
                  Close
                </SmartButton>
              </>
            )}
          </div>
        </div>
      }
    >
      {isEditing ? (
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Vendor"
              value={formData.vendor}
              onChange={(e) => handleChange("vendor", e.target.value)}
              required
            />
            <AppleInput
              label="Amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              required
            />
          </div>

          <AppleTextarea
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleSelect
              label="Category"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              required
            >
              <option value="">Select category</option>
              <option value="utilities">Utilities</option>
              <option value="equipment">Equipment</option>
              <option value="maintenance">Maintenance</option>
              <option value="marketing">Marketing</option>
              <option value="supplies">Supplies</option>
              <option value="rent">Rent</option>
              <option value="payroll">Payroll</option>
              <option value="other">Other</option>
            </AppleSelect>
            <AppleInput
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              required
            />
          </div>

          <AppleSelect
            label="Status"
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </AppleSelect>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(expense.status)}`}
            >
              {expense.status?.charAt(0).toUpperCase() + expense.status?.slice(1) || "Unknown"}
            </span>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(expense.amount)}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Vendor</p>
              <p className="font-medium text-gray-900">{expense.vendor || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium text-gray-900 capitalize">
                {expense.category || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{formatDate(expense.date)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium text-gray-900">
                {formatDate(expense.created_at)}
              </p>
            </div>
          </div>

          {/* Description */}
          {expense.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p className="text-gray-900">{expense.description}</p>
            </div>
          )}

          {/* Receipt indicator */}
          {expense.receipt_url && (
            <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Receipt Available</p>
                <p className="text-xs text-blue-600">Click download to view the receipt</p>
              </div>
              <SmartButton
                variant="secondary"
                size="sm"
                icon={<FiDownload size={14} />}
                onClick={handleDownloadReceipt}
              >
                View
              </SmartButton>
            </div>
          )}
        </div>
      )}
    </SmartModal>
  );
};

export default ViewExpenseModal;
