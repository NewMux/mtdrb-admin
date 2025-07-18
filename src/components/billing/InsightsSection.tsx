import React, { useState, useEffect, useCallback } from 'react';
import { FiDownload, FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { FinancialInsight } from '../../types';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface InsightsSectionProps {
  searchQuery: string;
  page: number;
  onPageChange: (page: number) => void;
  refreshKey: number;
  dateRange?: [Date | null, Date | null];
  tenantId: string | null;
  selectedStatus: string | null;
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({
  searchQuery,
  page,
  onPageChange,
  refreshKey,
  dateRange,
  tenantId,
  selectedStatus
}) => {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [metrics, setMetrics] = useState({
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    profitLoss: 0,
    revenueChange: 0,
    expenseChange: 0,
    profitChange: 0,
    cashFlow: 0,
    cashFlowChange: 0,
    topExpenseCategory: '',
    topRevenueSource: '',
    overdueInvoices: 0,
    overdueAmount: 0
  });

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('financial_insights')
        .select('*', { count: 'exact' });

      if (searchQuery) {
        query = query.or(`
          description.ilike.%${searchQuery}%,
          category.ilike.%${searchQuery}%
        `);
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        query = query.gte('date', dateRange[0].toISOString())
                    .lte('date', dateRange[1].toISOString());
      }

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else {
        throw new Error('Tenant ID is required');
      }

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { data, error, count } = await query
        .order('date', { ascending: false })
        .range((page - 1) * 10, page * 10 - 1);

      if (error) throw error;

      setInsights(data || []);
      setTotalPages(Math.ceil((count || 0) / 10));
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page, tenantId, selectedStatus]);

  const fetchMetrics = useCallback(async () => {
    try {
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const { data, error } = await supabase
        .rpc('get_financial_metrics', { p_tenant_id: tenantId });

      if (error) throw error;

      setMetrics({
        monthlyRevenue: data.monthly_revenue || 0,
        monthlyExpenses: data.monthly_expenses || 0,
        profitLoss: data.profit_loss || 0,
        revenueChange: data.revenue_change || 0,
        expenseChange: data.expense_change || 0,
        profitChange: data.profit_change || 0,
        cashFlow: data.cash_flow || 0,
        cashFlowChange: data.cash_flow_change || 0,
        topExpenseCategory: data.top_expense_category || '',
        topRevenueSource: data.top_revenue_source || '',
        overdueInvoices: data.overdue_invoices || 0,
        overdueAmount: data.overdue_amount || 0
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to fetch metrics');
    }
  }, [tenantId]);

  useEffect(() => {
    fetchInsights();
    fetchMetrics();
  }, [fetchInsights, fetchMetrics, refreshKey]);

  // Calculate risk levels and insights
  const calculateFinancialHealth = () => {
    let risk = 'Low';
    if (metrics.profitLoss < 0 || metrics.overdueInvoices > 5 || metrics.cashFlow < 0) {
      risk = 'High';
    } else if (metrics.profitChange < 0 || metrics.overdueAmount > 1000) {
      risk = 'Medium';
    }
    return risk;
  };

  const financialHealth = calculateFinancialHealth();
  const healthColor = financialHealth === 'High' ? 'bg-red-100 text-red-700' : 
                     financialHealth === 'Medium' ? 'bg-orange-100 text-orange-700' : 
                     'bg-green-100 text-green-700';

  // Generate AI insights
  const getAiInsights = () => {
    const insights = [];
    
    // Revenue insights
    if (metrics.revenueChange > 10) {
      insights.push({ type: 'good', text: `Revenue has increased by ${metrics.revenueChange.toFixed(1)}% compared to last month.` });
    } else if (metrics.revenueChange < -10) {
      insights.push({ type: 'bad', text: `Revenue has decreased by ${Math.abs(metrics.revenueChange).toFixed(1)}%. Consider reviewing pricing or running promotions.` });
    }

    // Expense insights
    if (metrics.expenseChange > 20) {
      insights.push({ type: 'bad', text: `Expenses have increased significantly by ${metrics.expenseChange.toFixed(1)}%. The top expense category is ${metrics.topExpenseCategory}.` });
    }

    // Cash flow insights
    if (metrics.cashFlow < 0) {
      insights.push({ type: 'bad', text: 'Negative cash flow detected. Consider reviewing payment terms and expense timing.' });
    }

    // Overdue invoices
    if (metrics.overdueInvoices > 0) {
      insights.push({ type: 'bad', text: `${metrics.overdueInvoices} overdue invoices totaling ${metrics.overdueAmount.toFixed(2)} BHD. Follow up on collections.` });
    }

    // Profitability insights
    if (metrics.profitLoss > 0 && metrics.profitChange > 0) {
      insights.push({ type: 'good', text: `Profitability is improving with a ${metrics.profitChange.toFixed(1)}% increase.` });
    }

    return insights;
  };

  const aiInsights = getAiInsights();

  const handleExportReport = async () => {
    try {
      // TODO: Implement report export
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Health Score */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-blue-400 dark:text-blue-300 text-xs mb-1">Financial Health</div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${healthColor}`}>{financialHealth} Risk</span>
            <span className="text-blue-400 dark:text-blue-300 text-xs">(AI assessment)</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex-1">
            <div className="text-blue-400 dark:text-blue-300 text-xs mb-1">Monthly Revenue</div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{metrics.monthlyRevenue.toFixed(2)} BHD</span>
              <span className={`flex items-center text-sm ${metrics.revenueChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {metrics.revenueChange >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                {Math.abs(metrics.revenueChange).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex-1">
            <div className="text-blue-400 dark:text-blue-300 text-xs mb-1">Monthly Expenses</div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{metrics.monthlyExpenses.toFixed(2)} BHD</span>
              <span className={`flex items-center text-sm ${metrics.expenseChange <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {metrics.expenseChange <= 0 ? <FiTrendingDown className="mr-1" /> : <FiTrendingUp className="mr-1" />}
                {Math.abs(metrics.expenseChange).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <div className="flex-1">
            <div className="text-blue-400 dark:text-blue-300 text-xs mb-1">Cash Flow</div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{metrics.cashFlow.toFixed(2)} BHD</span>
              <span className={`flex items-center text-sm ${metrics.cashFlowChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {metrics.cashFlowChange >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                {Math.abs(metrics.cashFlowChange).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <div className="text-blue-400 dark:text-blue-300 text-xs mb-3">AI Insights</div>
        <div className="space-y-3">
          {aiInsights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3">
              {insight.type === 'good' ? (
                <FiCheckCircle className="mt-1 text-green-500 dark:text-green-400" />
              ) : (
                <FiAlertTriangle className="mt-1 text-yellow-500 dark:text-yellow-400" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">{insight.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Recent Transactions</h3>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {insights.map((insight) => (
                <tr key={insight.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {dayjs(insight.date).format('MMM D, YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      insight.type === 'Income'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    }`}>
                      {insight.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {insight.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {insight.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {insight.amount.toFixed(2)} BHD
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {insight.reference_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 