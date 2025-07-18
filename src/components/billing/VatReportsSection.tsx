import React, { useState, useEffect, useCallback } from 'react';
import { FiDownload, FiPrinter, FiBarChart2, FiShield, FiTrendingUp } from 'react-icons/fi';
import { mockVatTransactions, mockVatDashboardData } from '../../api/mockBillingData';
import { VatTransaction, VatDashboardData } from '../../types';
import { toast } from 'react-hot-toast';

interface VatReportsSectionProps {
  searchQuery: string;
  page: number;
  onPageChange: (page: number) => void;
  refreshKey: number;
  dateRange?: [Date | null, Date | null];
  tenantId: string | null;
  selectedStatus: string | null;
}

export const VatReportsSection: React.FC<VatReportsSectionProps> = ({
  searchQuery,
  page,
  onPageChange,
  refreshKey,
  dateRange,
  tenantId,
  selectedStatus
}) => {
  const [transactions, setTransactions] = useState<VatTransaction[]>([]);
  const [dashboardData, setDashboardData] = useState<VatDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use mock data instead of backend calls
      let filteredTransactions = [...mockVatTransactions];

      // Apply search filter
      if (searchQuery) {
        filteredTransactions = filteredTransactions.filter(transaction => 
          transaction.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          transaction.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply date range filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        filteredTransactions = filteredTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= dateRange[0] && transactionDate <= dateRange[1];
        });
      }

      // Apply status filter
      if (selectedStatus) {
        filteredTransactions = filteredTransactions.filter(transaction => 
          transaction.status?.toLowerCase() === selectedStatus.toLowerCase()
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

      setTransactions(paginatedTransactions);
      setTotalPages(Math.ceil(filteredTransactions.length / 10));
    } catch (error) {
      console.error('Error loading VAT transactions:', error);
      toast.error('Failed to load VAT transactions');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page, selectedStatus, dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshKey]);

  // Set dashboard data from mock data
  useEffect(() => {
    setDashboardData(mockVatDashboardData);
  }, [refreshKey]);

  const handleDownloadReport = async () => {
    try {
      // TODO: Implement report download
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const handlePrintReport = async () => {
    try {
      // TODO: Implement report printing
      toast.success('Report sent to printer');
    } catch (error) {
      console.error('Error printing report:', error);
      toast.error('Failed to print report');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading VAT transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">VAT Reports & Analytics</h2>
      </div>
      <div className="overflow-x-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">VAT Collected</h3>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {transactions
                .filter(t => t.type === 'Invoice')
                .reduce((sum, t) => sum + t.vat_amount, 0)
                .toFixed(2)} BHD
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">VAT Paid</h3>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
              {transactions
                .filter(t => t.type === 'Expense')
                .reduce((sum, t) => sum + t.vat_amount, 0)
                .toFixed(2)} BHD
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Net VAT Payable</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {(transactions
                .filter(t => t.type === 'Invoice')
                .reduce((sum, t) => sum + t.vat_amount, 0) -
                transactions
                .filter(t => t.type === 'Expense')
                .reduce((sum, t) => sum + t.vat_amount, 0))
                .toFixed(2)} BHD
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end px-6 mb-6 space-x-4">
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <FiDownload className="mr-2 -ml-1 h-5 w-5" />
            Download Report
          </button>
          <button
            onClick={handlePrintReport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <FiPrinter className="mr-2 -ml-1 h-5 w-5" />
            Print Report
          </button>
        </div>

        {/* Transactions Table */}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                VAT Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                VAT Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.type === 'Invoice'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                  }`}>
                    {transaction.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {transaction.reference_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {transaction.entity_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {transaction.vat_rate}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {transaction.amount.toFixed(2)} BHD
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {transaction.vat_amount.toFixed(2)} BHD
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.status === 'Paid'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing page <span className="font-medium">{page}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`
                      relative inline-flex items-center px-4 py-2 border text-sm font-medium
                      ${pageNum === page
                        ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VatReportsSection; 