import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiDownload, FiTrash2, FiX, FiEye, FiEdit2, FiMail, 
  FiDollarSign, FiCalendar, FiUser, FiFileText 
} from 'react-icons/fi';
import { mockInvoices } from '../../api/mockBillingData';
import { Invoice } from '../../types';
import { toast } from 'react-hot-toast';
import { AppleInput, AppleSelect, AppleButton } from '../AppleStyleModal';
import { SmartTable, SmartButton } from '../ui/DesignSystem';

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
  refreshKey
}: InvoicesSectionProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(searchQuery);
  const [status, setStatus] = useState(selectedStatus || '');

  const PAGE_SIZE = 10;

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use mock data instead of backend calls
      let filteredInvoices = [...mockInvoices];

      // Apply search filter
      if (search) {
        filteredInvoices = filteredInvoices.filter(invoice => 
          invoice.member?.name?.toLowerCase().includes(search.toLowerCase()) ||
          invoice.invoice_number?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply status filter
      if (status) {
        filteredInvoices = filteredInvoices.filter(invoice => 
          invoice.status?.toLowerCase() === status.toLowerCase()
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

      setInvoices(paginatedInvoices);
      setTotalPages(Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE)));
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setStatus(selectedStatus || '');
  }, [selectedStatus]);

  useEffect(() => {
    fetchInvoices();
  }, [page, search, status, refreshKey]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedIds.length > 0 && selectedIds.length < invoices.length;
    }
  }, [selectedIds, invoices]);

  const handleDelete = async (invoiceId: string) => {
    try {
      // Mock delete operation
      toast.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      // TODO: Implement send reminder functionality
      console.log('Sending reminder for invoice:', invoiceId);
      toast.success('Reminder sent successfully');
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map(inv => inv.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      Paid: 'bg-green-100 text-green-800',
      Unpaid: 'bg-yellow-100 text-yellow-800',
      Partial: 'bg-blue-100 text-blue-800',
      Overdue: 'bg-red-100 text-red-800',
      Refunded: 'bg-purple-100 text-purple-800',
      Draft: 'bg-gray-100 text-gray-800',
      Cancelled: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClasses[status] || ''}`}>{status}</span>
    );
  };

  // Pagination logic
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - 1 && i <= page + 1)
      ) {
        pages.push(
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`min-w-[40px] h-10 rounded-lg border ${page === i ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'} transition-colors`}
          >
            {i}
          </button>
        );
      } else if (
        i === page - 2 ||
        i === page + 2
      ) {
        pages.push(<span key={i} className="px-2">...</span>);
      }
    }
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
        >
          <FiChevronLeft size={18} />
        </button>
        {pages}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
        >
          <FiChevronRight size={18} />
        </button>
      </div>
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
            onChange={e => { setSearch(e.target.value); onPageChange(1); }}
            className="max-w-xs"
          />
        </div>
        <div className="flex gap-2">
          <AppleSelect
            label="Status"
            value={status}
            onChange={e => { setStatus(e.target.value); onPageChange(1); }}
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
          <SmartButton size="sm" variant="primary" icon={<FiDownload size={16} />}>
            Export Selected
          </SmartButton>
        </div>
      </div>
      {/* Bulk selection header */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.length} invoice{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <SmartButton size="sm" variant="danger" icon={<FiTrash2 size={16} />} onClick={() => { if (window.confirm(`Delete ${selectedIds.length} selected invoices?`)) selectedIds.forEach(id => handleDelete(id)); }}>
              Delete Selected
            </SmartButton>
            <SmartButton size="sm" variant="ghost" icon={<FiX size={16} />} onClick={() => setSelectedIds([])}>
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
                  checked={selectedIds.length === invoices.length && invoices.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-blue-400"
                  aria-label="Select all invoices"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-blue-300 dark:text-blue-400">Loading invoices...</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-blue-300 dark:text-blue-400">No invoices found.</td>
              </tr>
            ) : (
              invoices.map((invoice, i) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(invoice.id)}
                      onChange={() => handleSelectRow(invoice.id)}
                      onClick={e => e.stopPropagation()}
                      aria-label={`Select invoice ${invoice.invoice_number}`}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-blue-400"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-900 dark:text-blue-100">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700 dark:text-blue-300">
                    {invoice.member?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'Paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                      invoice.status === 'Unpaid' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                      invoice.status === 'Overdue' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-900">
                    {invoice.total?.toFixed(2)} BHD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-700">
                    {invoice.payment_method || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <SmartButton size="sm" variant="ghost" icon={<FiEye size={16} />} title="View" onClick={e => { e.stopPropagation(); /* TODO: View handler */ }} />
                      <SmartButton size="sm" variant="ghost" icon={<FiEdit2 size={16} />} title="Edit" onClick={e => { e.stopPropagation(); /* TODO: Edit handler */ }} />
                      <SmartButton size="sm" variant="ghost" icon={<FiMail size={16} />} title="Send Reminder" onClick={e => { e.stopPropagation(); handleSendReminder(invoice.id); }} />
                      <SmartButton size="sm" variant="ghost" icon={<FiDownload size={16} />} title="Download" onClick={e => { e.stopPropagation(); /* TODO: Download handler */ }} />
                      <SmartButton size="sm" variant="danger" icon={<FiTrash2 size={16} />} title="Delete" onClick={e => { e.stopPropagation(); handleDelete(invoice.id); }} />
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
              Showing <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * PAGE_SIZE, (page - 1) * PAGE_SIZE + invoices.length)}</span> of{' '}
              <span className="font-medium">{totalPages === 1 ? invoices.length : (totalPages * PAGE_SIZE)}</span> invoices
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
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
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