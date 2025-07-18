import * as React from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiFilter, FiFileText, FiAlertTriangle, FiZap, FiCalendar } from 'react-icons/fi';
import { SmartTaskModal } from './SmartTaskModal';
import { useSmartTaskModal } from './useSmartTaskModal';

interface ExportTaskDataModalProps {
  open: boolean;
  onClose: () => void;
  isPro?: boolean;
}

export const ExportTaskDataModal: React.FC<ExportTaskDataModalProps> = ({
  open,
  onClose,
  isPro = false,
}) => {
  const {
    loading,
    exportTaskData,
    alerts,
    clearAlerts,
  } = useSmartTaskModal({ isPro });

  const [filters, setFilters] = React.useState({
    status: [] as string[],
    priority: [] as string[],
    type: [] as string[],
    assignedTo: [] as string[],
    dateRange: {
      start: '',
      end: '',
    },
  });

  const [exportFormat, setExportFormat] = React.useState<'csv' | 'excel' | 'json'>('csv');
  const [includeInsights, setIncludeInsights] = React.useState(true);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const typeOptions = [
    { value: 'onboarding', label: 'Member Onboarding' },
    { value: 'class_setup', label: 'Class Setup' },
    { value: 'maintenance', label: 'Equipment Maintenance' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'equipment_check', label: 'Equipment Check' },
    { value: 'member_support', label: 'Member Support' },
    { value: 'admin', label: 'Administrative' },
    { value: 'custom', label: 'Custom Task' },
  ];

  const formatOptions = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { value: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
    { value: 'json', label: 'JSON', description: 'Structured data format' },
  ];

  const handleExport = async () => {
    const result = await exportTaskData(filters, exportFormat);
    if (result.success) {
      // Simulate download
      const link = document.createElement('a');
      link.href = result.downloadUrl || '#';
      link.download = `task-data-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      link.click();
    }
  };

  const toggleFilter = (filterType: keyof typeof filters, value: string) => {
    if (filterType === 'dateRange') return;
    
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? (prev[filterType] as string[]).filter(v => v !== value)
        : [...(prev[filterType] as string[]), value]
    }));
  };

  const getFilterCount = (filterType: keyof typeof filters) => {
    if (filterType === 'dateRange') return 0;
    return (filters[filterType] as string[]).length;
  };

  const getSmartInsights = () => {
    return [
      {
        type: 'warning',
        title: 'Overdue Tasks',
        count: 12,
        description: 'Tasks past their due date',
        icon: '⚠️',
      },
      {
        type: 'info',
        title: 'Unassigned Tasks',
        count: 8,
        description: 'Tasks without assignees',
        icon: '👤',
      },
      {
        type: 'success',
        title: 'Completed This Week',
        count: 45,
        description: 'Successfully completed tasks',
        icon: '✅',
      },
    ];
  };

  const smartInsights = getSmartInsights();

  return (
    <SmartTaskModal
      open={open}
      onClose={onClose}
      title="Export Task Data"
      subtitle="Export task data with filters and insights"
    >
      <div className="space-y-6">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  alert.type === 'error' ? 'bg-red-50 text-red-700' :
                  alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-blue-50 text-blue-700'
                }`}
              >
                {alert.message}
              </div>
            ))}
            <button
              onClick={clearAlerts}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear alerts
            </button>
          </div>
        )}

        {/* Smart Insights */}
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-3">
            <FiZap className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Smart Insights
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {smartInsights.map((insight, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{insight.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{insight.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {insight.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{insight.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filters
          </h3>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status {getFilterCount('status') > 0 && `(${getFilterCount('status')})`}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => toggleFilter('status', status.value)}
                  className={`p-2 rounded-lg border text-sm transition-all ${
                    filters.status.includes(status.value)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority {getFilterCount('priority') > 0 && `(${getFilterCount('priority')})`}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => toggleFilter('priority', priority.value)}
                  className={`p-2 rounded-lg border text-sm transition-all ${
                    filters.priority.includes(priority.value)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Type {getFilterCount('type') > 0 && `(${getFilterCount('type')})`}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleFilter('type', type.value)}
                  className={`p-2 rounded-lg border text-sm transition-all ${
                    filters.type.includes(type.value)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Format
          </label>
          <div className="space-y-2">
            {formatOptions.map((format) => (
              <label
                key={format.value}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer dark:border-gray-600"
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.value}
                  checked={exportFormat === format.value}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {format.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Include Insights */}
        <div className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInsights}
              onChange={(e) => setIncludeInsights(e.target.checked)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2">
              <FiZap className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Include smart insights
              </span>
            </div>
          </label>
          {includeInsights && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Export will include overdue tasks, unassigned tasks, and performance metrics
            </p>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-6 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiZap className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {includeInsights ? 'With insights' : 'Basic export'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FiDownload className="w-4 h-4" />
                <span>{loading ? 'Exporting...' : 'Export Data'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SmartTaskModal>
  );
}; 