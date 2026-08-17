import React, { useState, useEffect } from "react";
import { SmartModal } from "../../ui/SmartModal";
import { SmartButton } from "../../ui/DesignSystem";
import { AppleInput, AppleSelect, AppleTextarea } from "../../AppleStyleModal";
import { Invoice } from "../../../types";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";
import { FiDownload, FiEdit2, FiSave, FiX, FiPrinter } from "react-icons/fi";
import { DEFAULT_CURRENCY } from "../../../config/runtimeConfig";

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  mode?: "view" | "edit";
  onSuccess?: () => void;
}

/**
 * ViewInvoiceModal - Modal for viewing and editing invoice details
 * Supports both view-only and edit modes
 */
const ViewInvoiceModal: React.FC<ViewInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  mode = "view",
  onSuccess,
}) => {
  const { tenantId } = useAuth();
  const [isEditing, setIsEditing] = useState(mode === "edit");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    member_id: "",
    amount: "",
    status: "",
    due_date: "",
    notes: "",
    payment_method: "",
  });

  // Reset form when invoice changes or modal opens
  useEffect(() => {
    if (invoice && isOpen) {
      setFormData({
        member_id: invoice.member_id || "",
        amount: (invoice.amount ?? invoice.total)?.toString() || "",
        status: invoice.status || "Unpaid",
        due_date: invoice.due_date || "",
        notes: invoice.notes || "",
        payment_method: invoice.payment_method || "",
      });
      setIsEditing(mode === "edit");
    }
  }, [invoice, isOpen, mode]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!invoice?.id || !tenantId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          amount: parseFloat(formData.amount),
          status: formData.status,
          due_date: formData.due_date,
          notes: formData.notes,
          payment_method: formData.payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice.id)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast.success("Invoice updated successfully");
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    // Generate a simple invoice download/print
    const amount = invoice?.amount ?? invoice?.total;
    const invoiceContent = `
      INVOICE #${invoice?.invoice_number || invoice?.id?.slice(0, 8)}
      ----------------------------------------
      Date: ${formatDate(invoice?.created_at)}
      Due Date: ${formatDate(invoice?.due_date)}
      Status: ${invoice?.status?.toUpperCase()}
      
      Member: ${invoice?.member?.name || "N/A"}
      
      Amount: ${formatCurrency(amount)}
      
      Notes: ${invoice?.notes || "N/A"}
      
      Payment Method: ${invoice?.payment_method || "N/A"}
    `;
    
    // Create a blob and download
    const blob = new Blob([invoiceContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoice?.invoice_number || invoice?.id?.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Invoice downloaded");
  };

  const handlePrintInvoice = () => {
    const amount = invoice?.amount ?? invoice?.total;
    const rawStatus = invoice?.status?.toLowerCase() || "pending";
    const statusClass = ["paid", "unpaid", "overdue", "pending"].includes(rawStatus)
      ? rawStatus
      : "pending";
    const invoiceNumber = escapeHtml(
      invoice?.invoice_number || invoice?.id?.slice(0, 8) || "N/A",
    );
    const invoiceStatus = escapeHtml(invoice?.status?.toUpperCase() || "N/A");
    const memberName = escapeHtml(invoice?.member?.name || "N/A");
    const notes = escapeHtml(invoice?.notes || "Membership Fee");
    const paymentMethod = escapeHtml(invoice?.payment_method || "N/A");
    const printContent = `
      <html>
        <head>
          <title>Invoice #${invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; }
            .invoice-header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .invoice-details { margin-bottom: 30px; }
            .invoice-details p { margin: 8px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-unpaid { background: #fef9c3; color: #854d0e; }
            .status-overdue { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h1>INVOICE</h1>
            <p><strong>#${invoiceNumber}</strong></p>
          </div>
          <div class="invoice-details">
            <p><strong>Date:</strong> ${formatDate(invoice?.created_at)}</p>
            <p><strong>Due Date:</strong> ${formatDate(invoice?.due_date)}</p>
            <p><strong>Status:</strong> <span class="status status-${statusClass}">${invoiceStatus}</span></p>
            <p><strong>Member:</strong> ${memberName}</p>
          </div>
          <div class="invoice-details">
            <p><strong>Notes:</strong> ${notes}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          </div>
          <p class="amount">Total: ${formatCurrency(amount)}</p>
        </body>
      </html>
    `;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "N/A";
    if (!DEFAULT_CURRENCY) {
      return amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: DEFAULT_CURRENCY,
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
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!invoice) return null;

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Invoice" : "Invoice Details"}
      footer={
        <div className="flex justify-between w-full">
          <div className="flex space-x-2">
            <SmartButton
              variant="secondary"
              icon={<FiDownload size={16} />}
              onClick={handleDownloadInvoice}
            >
              Download
            </SmartButton>
            <SmartButton
              variant="secondary"
              icon={<FiPrinter size={16} />}
              onClick={handlePrintInvoice}
            >
              Print
            </SmartButton>
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
              label="Amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              required
            />
            <AppleSelect
              label="Status"
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </AppleSelect>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleChange("due_date", e.target.value)}
              required
            />
            <AppleSelect
              label="Payment Method"
              value={formData.payment_method}
              onChange={(e) => handleChange("payment_method", e.target.value)}
            >
              <option value="">Select method</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
            </AppleSelect>
          </div>

          <AppleTextarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
          />
        </form>
      ) : (
        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Invoice Number</p>
              <p className="text-xl font-bold text-gray-900">
                #{invoice.invoice_number || invoice.id?.slice(0, 8) || "N/A"}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}
            >
              {invoice.status 
                ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) 
                : "Unknown"}
            </span>
          </div>

          {/* Amount */}
          <div className="bg-blue-50 p-6 rounded-xl text-center">
            <p className="text-sm text-blue-600 mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-blue-700">
              {formatCurrency(invoice.amount ?? invoice.total)}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Member</p>
              <p className="font-medium text-gray-900">
                {invoice.member?.name || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium text-gray-900 capitalize">
                {invoice.payment_method?.toString().replace("_", " ") || "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium text-gray-900">
                {formatDate(invoice.created_at)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-medium text-gray-900">
                {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Notes</p>
              <p className="text-gray-900">{invoice.notes}</p>
            </div>
          )}
        </div>
      )}
    </SmartModal>
  );
};

export default ViewInvoiceModal;
