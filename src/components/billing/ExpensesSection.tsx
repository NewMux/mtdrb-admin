import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Fragment,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiDownload,
  FiTrash2,
  FiX,
  FiEye,
  FiEdit2,
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
} from "react-icons/fi";
import { mockExpenses } from "../../api/mockBillingData";
import { Expense } from "../../types";
import { toast } from "react-hot-toast";
import { AppleInput, AppleSelect } from "../AppleStyleModal";
import { SmartButton } from "../ui/DesignSystem";

interface ExpensesSectionProps {
  searchQuery: string;
  selectedStatus: string | null;
  page: number;
  onPageChange: (page: number) => void;
  refreshKey: number;
}

export default function ExpensesSection({
  searchQuery,
  selectedStatus,
  page,
  onPageChange,
  refreshKey,
}: ExpensesSectionProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(searchQuery);
  const [status, setStatus] = useState(selectedStatus || "");

  const PAGE_SIZE = 10;

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);

      // Use mock data instead of backend calls
      let filteredExpenses = [...mockExpenses];

      // Apply search filter
      if (search) {
        filteredExpenses = filteredExpenses.filter(
          (expense) =>
            expense.vendor?.toLowerCase().includes(search.toLowerCase()) ||
            expense.description?.toLowerCase().includes(search.toLowerCase()) ||
            expense.category?.toLowerCase().includes(search.toLowerCase()),
        );
      }

      // Apply status filter
      if (status) {
        filteredExpenses = filteredExpenses.filter(
          (expense) => expense.status?.toLowerCase() === status.toLowerCase(),
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

      setExpenses(paginatedExpenses);
      setTotalPages(
        Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE)),
      );
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setStatus(selectedStatus || "");
  }, [selectedStatus]);

  useEffect(() => {
    fetchExpenses();
  }, [page, search, status, refreshKey]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < expenses.length;
    }
  }, [selectedIds, expenses]);

  const handleDelete = async (expenseId: string) => {
    try {
      // Mock delete operation
      toast.success("Expense deleted successfully");
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const handleApprove = async (expenseId: string) => {
    try {
      // Mock approve operation
      toast.success("Expense approved successfully");
      fetchExpenses();
    } catch (error) {
      console.error("Error approving expense:", error);
      toast.error("Failed to approve expense");
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === expenses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(expenses.map((exp) => exp.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      paid: "bg-blue-100 text-blue-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClasses[status.toLowerCase()] || ""}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Apple-style Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-4 border-b border-blue-100 bg-blue-50/50 sticky top-0 z-10">
        <div className="flex-1">
          <AppleInput
            label="Search Expenses"
            placeholder="Search by vendor, description, category..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
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
            {selectedIds.length} expense{selectedIds.length !== 1 ? "s" : ""}{" "}
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
                    `Delete ${selectedIds.length} selected expenses?`,
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={
                    selectedIds.length === expenses.length &&
                    expenses.length > 0
                  }
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-blue-400"
                  aria-label="Select all expenses"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                VAT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Recurring
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
                  colSpan={10}
                  className="px-6 py-8 text-center text-blue-300 dark:text-blue-400"
                >
                  Loading expenses...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-8 text-center text-blue-300 dark:text-blue-400"
                >
                  No expenses found.
                </td>
              </tr>
            ) : (
              expenses.map((expense, i) => (
                <tr
                  key={expense.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(expense.id)}
                      onChange={() => handleSelectRow(expense.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select expense ${expense.vendor}`}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-blue-400"
                    />
                  </td>
                  <td className="px-6 py-4 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-blue-900 dark:text-blue-100 whitespace-nowrap">
                    {expense.vendor || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                    {expense.category}
                  </td>
                  <td
                    className="px-6 py-4 text-blue-700 dark:text-blue-300 whitespace-nowrap max-w-xs truncate"
                    title={expense.description}
                  >
                    {expense.description || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-blue-900 dark:text-blue-100 whitespace-nowrap">
                    {(expense.amount || 0).toFixed(2)}{" "}
                    {expense.currency || "BHD"}
                  </td>
                  <td className="px-6 py-4 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                    {(expense.vat_amount || 0).toFixed(2)}{" "}
                    {expense.currency || "BHD"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(expense.status)}
                  </td>
                  <td className="px-6 py-4 text-blue-700 whitespace-nowrap">
                    {expense.recurring ? (
                      <span className="text-blue-600 font-medium">
                        {expense.recurring_frequency?.charAt(0).toUpperCase() +
                          expense.recurring_frequency?.slice(1)}
                      </span>
                    ) : (
                      "No"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <SmartButton
                        size="sm"
                        variant="ghost"
                        icon={<FiEye size={16} />}
                        title="View"
                        onClick={(e) => {
                          e.stopPropagation(); /* TODO: View handler */
                        }}
                      />
                      <SmartButton
                        size="sm"
                        variant="ghost"
                        icon={<FiEdit2 size={16} />}
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation(); /* TODO: Edit handler */
                        }}
                      />
                      {expense.status === "pending" && (
                        <SmartButton
                          size="sm"
                          variant="ghost"
                          icon={<FiCheck size={16} />}
                          title="Approve"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(expense.id);
                          }}
                        />
                      )}
                      {expense.receipt_url && (
                        <SmartButton
                          size="sm"
                          variant="ghost"
                          icon={<FiDownload size={16} />}
                          title="Download Receipt"
                          onClick={(e) => {
                            e.stopPropagation(); /* TODO: Download handler */
                          }}
                        />
                      )}
                      <SmartButton
                        size="sm"
                        variant="danger"
                        icon={<FiTrash2 size={16} />}
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(expense.id);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  (page - 1) * PAGE_SIZE + expenses.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {totalPages === 1 ? expenses.length : totalPages * PAGE_SIZE}
              </span>{" "}
              expenses
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
    </div>
  );
}
