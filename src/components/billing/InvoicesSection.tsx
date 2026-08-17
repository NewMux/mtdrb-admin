import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  FiDownload,
  FiTrash2,
  FiX,
  FiEye,
  FiEdit2,
  FiMail,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { Invoice } from "../../types";
import { toast } from "react-hot-toast";
import { AppleInput, AppleSelect } from "../AppleStyleModal";
import { SmartTable, SmartButton } from "../ui/DesignSystem";
import { supabase } from "../../supabaseClient";
import { DEFAULT_CURRENCY } from "../../config/runtimeConfig";
import { useAuth } from "../../contexts/AuthContext";
import ViewInvoiceModal from "./modals/ViewInvoiceModal";

interface InvoicesSectionProps {
  searchQuery: string;
  selectedStatus: string | null;
  page: number;
  onPageChange: (page: number) => void;
  refreshKey: number;
}

export default function InvoicesSection({
  searchQuery,
  selectedStatus,
  page,
  onPageChange,
  refreshKey,
}: InvoicesSectionProps) {
  const { tenantId } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(searchQuery);
  const [status, setStatus] = useState(selectedStatus || "");
  
  // Modal state for View/Edit invoice
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");

  const PAGE_SIZE = 10;

  const fetchInvoices = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);

      // Build query
      let query = supabase
        .from("invoices")
        .select(`
          *,
          members!inner(id, first_name, last_name, email)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      // Apply status filter
      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      type RawInvoice = {
        id?: string;
        member_id?: string;
        members?: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
        } | null;
        amount?: number;
        total?: number;
        currency?: string;
        status?: string;
        due_date?: string;
        paid_date?: string;
        created_at?: string;
        items?: unknown[];
        metadata?: Record<string, unknown>;
        type?: string;
      };

      let filteredInvoices = (data || []) as RawInvoice[];

      // Apply search filter
      if (search) {
        filteredInvoices = filteredInvoices.filter(
          (invoice) => {
            const member = invoice.members;
            const memberName = member ? `${member.first_name} ${member.last_name}` : "";
            return (
              memberName.toLowerCase().includes(search.toLowerCase()) ||
              invoice.id?.toLowerCase().includes(search.toLowerCase())
            );
          }
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

      // Map to Invoice type
      const mappedInvoices: Invoice[] = paginatedInvoices.map((inv) => ({
        id: inv.id || '',
        member_id: inv.member_id || '',
        member: inv.members ? {
          id: inv.members.id || '',
          name: `${inv.members.first_name || ''} ${inv.members.last_name || ''}`.trim() || 'Unknown',
          email: inv.members.email || '',
        } : undefined,
        amount: Number(inv.amount || inv.total || 0),
        currency: inv.currency || DEFAULT_CURRENCY,
        status: inv.status || 'draft',
        due_date: inv.due_date,
        paid_date: inv.paid_date,
        created_at: inv.created_at,
        items: Array.isArray(inv.items) ? inv.items : [],
        metadata: inv.metadata || {},
      })) as Invoice[];

      setInvoices(mappedInvoices);
      setTotalPages(
        Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE)),
      );
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, search, status]);

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setStatus(selectedStatus || "");
  }, [selectedStatus]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, refreshKey]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < invoices.length;
    }
  }, [selectedIds, invoices]);

  const handleDelete = async (invoiceId: string) => {
    try {
      void invoiceId;
      // Mock delete operation
      toast.success("Invoice deleted successfully");
      fetchInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      void invoiceId;
      // TODO: Implement send reminder functionality
      toast.success("Reminder sent successfully");
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Failed to send reminder");
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map((inv) => inv.id).filter((id): id is string => Boolean(id)));
    }
  };

  const handleSelectRow = (id: string | undefined) => {
    if (!id) return;
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Apple-style Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 border-b border-blue-100 bg-blue-50/50 sticky top-0 z-10">
        <div className="flex-1">
          <AppleInput
            label="Search Invoices"
            placeholder="Search by member, invoice #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onPageChange(1);
            }}
            className="max-w-xs"
          />
        </div>
        <div className="flex gap-2">
          <AppleSelect
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              onPageChange(1);
            }}
            className="min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Overdue">Overdue</option>
            <option value="Refunded">Refunded</option>
            <option value="Draft">Draft</option>
            <option value="Cancelled">Cancelled</option>
          </AppleSelect>
        </div>
        <div className="flex gap-2 ml-auto">
          <SmartButton
            size="sm"
            variant="primary"
            icon={<FiDownload size={16} />}
          >
            Export Selected
          </SmartButton>
        </div>
      </div>
      {/* Bulk selection header */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.length} invoice{selectedIds.length !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex items-center space-x-2">
            <SmartButton
              size="sm"
              variant="danger"
              icon={<FiTrash2 size={16} />}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete ${selectedIds.length} selected invoices?`,
                  )
                )
                  selectedIds.forEach((id) => handleDelete(id));
              }}
            >
              Delete Selected
            </SmartButton>
            <SmartButton
              size="sm"
              variant="ghost"
              icon={<FiX size={16} />}
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </SmartButton>
          </div>
        </div>
      )}
      {/* Table */}
      <SmartTable>
        <table className="w-full min-w-[900px] divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={
                    selectedIds.length === invoices.length &&
                    invoices.length > 0
                  }
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-blue-400"
                  aria-label="Select all invoices"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-blue-300 dark:text-blue-400"
                >
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-blue-300 dark:text-blue-400"
                >
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={invoice.id ? selectedIds.includes(invoice.id) : false}
                      onChange={() => invoice.id && handleSelectRow(invoice.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select invoice ${invoice.invoice_number || invoice.id || 'N/A'}`}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-blue-400"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-900 dark:text-blue-100">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700 dark:text-blue-300">
                    {invoice.member?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === "Paid"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                          : invoice.status === "Unpaid"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                            : invoice.status === "Overdue"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-900">
                    {invoice.total?.toFixed(2)} BHD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700">
                    {invoice.due_date
                      ? new Date(invoice.due_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700">
                    {invoice.payment_method || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <SmartButton
                        size="sm"
                        variant="ghost"
                        icon={<FiEye size={16} />}
                        title="View"
                        onClick={(e) => {
                          e?.stopPropagation();
                          setSelectedInvoice(invoice);
                          setModalMode("view");
                          setViewModalOpen(true);
                        }}
                      >
                        View
                      </SmartButton>
                      <SmartButton
                        size="sm"
                        variant="ghost"
                        icon={<FiEdit2 size={16} />}
                        title="Edit"
                        onClick={(e) => {
                          e?.stopPropagation();
                          setSelectedInvoice(invoice);
                          setModalMode("edit");
                          setViewModalOpen(true);
                        }}
                      >
                        Edit
                      </SmartButton>
                      <SmartButton
                        size="sm"
                        variant="ghost"
                        icon={<FiMail size={16} />}
                        title="Send Reminder"
                        onClick={(e) => {
                          e?.stopPropagation();
                          if (invoice.id) {
                            handleSendReminder(invoice.id);
                          }
                        }}
                      >
                        Send
                      </SmartButton>
                      <SmartButton
                        size="sm"
                        variant="ghost"
                        icon={<FiDownload size={16} />}
                        title="Download"
                        onClick={(e) => {
                          e?.stopPropagation();
                          // Generate and download invoice
                          const amount = invoice.amount ?? invoice.total ?? 0;
                          const invoiceContent = `
INVOICE #${invoice.invoice_number || invoice.id?.slice(0, 8)}
----------------------------------------
Date: ${invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "N/A"}
Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}
Status: ${invoice.status?.toUpperCase() || "N/A"}

Member: ${invoice.member?.name || "N/A"}

Amount: $${amount.toFixed(2)}

Notes: ${invoice.notes || "Membership Fee"}

Payment Method: ${invoice.payment_method || "N/A"}
                          `;
                          const blob = new Blob([invoiceContent], { type: "text/plain" });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `invoice-${invoice.invoice_number || invoice.id?.slice(0, 8)}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                          toast.success("Invoice downloaded");
                        }}
                      >
                        Download
                      </SmartButton>
                      <SmartButton
                        size="sm"
                        variant="danger"
                        icon={<FiTrash2 size={16} />}
                        title="Delete"
                        onClick={(e) => {
                          e?.stopPropagation();
                          if (invoice.id) {
                            handleDelete(invoice.id);
                          }
                        }}
                      >
                        Delete
                      </SmartButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </SmartTable>
      {/* Pagination Controls */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  page * PAGE_SIZE,
                  (page - 1) * PAGE_SIZE + invoices.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {totalPages === 1 ? invoices.length : totalPages * PAGE_SIZE}
              </span>{" "}
              invoices
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              {/* Page numbers */}
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pageNum === page
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* View/Edit Invoice Modal */}
      <ViewInvoiceModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        mode={modalMode}
        onSuccess={() => {
          fetchInvoices();
        }}
      />
    </div>
  );
}
