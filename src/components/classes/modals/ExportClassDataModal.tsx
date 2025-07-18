import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiFileText, FiUsers, FiCalendar, FiSettings, FiCheck } from 'react-icons/fi';
import { SmartModal } from '../../ui/SmartModal';
import { useSmartClassModal } from '../../../hooks/useSmartClassModal';
import { SmartButton } from '../../ui/DesignSystem';
import { toast } from 'react-hot-toast';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  format: 'csv' | 'pdf' | 'excel';
  includes: string[];
}

interface ExportFilter {
  dateRange: 'all' | 'this-week' | 'this-month' | 'custom';
  customStart?: string;
  customEnd?: string;
  includeWaitlist: boolean;
  includeAnalytics: boolean;
  includeAttendance: boolean;
  includeRevenue: boolean;
}

interface ExportClassDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const ExportClassDataModal: React.FC<ExportClassDataModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  isPro = false
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedExport, setSelectedExport] = useState<string>('');
  const [filters, setFilters] = useState<ExportFilter>({
    dateRange: 'all',
    includeWaitlist: true,
    includeAnalytics: true,
    includeAttendance: true,
    includeRevenue: false
  });
  const [exportProgress, setExportProgress] = useState(0);

  const {
    classData,
    fetchClass
  } = useSmartClassModal({ classId: classId || '', isPro });

  // Load class data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
    }
  }, [isOpen, classId]);

  const exportOptions: ExportOption[] = [
    {
      id: 'class-roster',
      label: 'Class Roster',
      description: 'Complete list of enrolled members with contact details',
      icon: <FiUsers className="h-5 w-5" />,
      format: 'csv',
      includes: ['Member names', 'Contact info', 'Enrollment date', 'Status']
    },
    {
      id: 'attendance-report',
      label: 'Attendance Report',
      description: 'Detailed attendance tracking and analytics',
      icon: <FiCalendar className="h-5 w-5" />,
      format: 'excel',
      includes: ['Attendance rates', 'No-shows', 'Trends', 'Analytics']
    },
    {
      id: 'financial-summary',
      label: 'Financial Summary',
      description: 'Revenue, costs, and profit analysis',
      icon: <FiFileText className="h-5 w-5" />,
      format: 'pdf',
      includes: ['Revenue', 'Costs', 'Profit margins', 'Per-member metrics']
    },
    {
      id: 'comprehensive-report',
      label: 'Comprehensive Report',
      description: 'Complete class data with all analytics (Pro only)',
      icon: <FiSettings className="h-5 w-5" />,
      format: 'excel',
      includes: ['All data', 'Advanced analytics', 'Predictions', 'Recommendations']
    }
  ];

  const handleExport = async () => {
    if (!selectedExport) {
      toast.error('Please select an export option');
      return;
    }

    setLoading(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Export completed successfully');
      toast.success('Data exported successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
      setExportProgress(0);
    }
  };

  const getSelectedExportOption = () => {
    return exportOptions.find(option => option.id === selectedExport);
  };

  const isProFeature = (optionId: string) => {
    return optionId === 'comprehensive-report';
  };

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Class Data"
      subtitle="Export class information in various formats"
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedExport && (
              <div className="flex items-center space-x-1 text-sm text-blue-600">
                <FiDownload className="h-4 w-4" />
                <span>{getSelectedExportOption()?.label}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <SmartButton
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </SmartButton>
            <SmartButton
              variant="primary"
              onClick={handleExport}
              loading={loading}
              disabled={loading || !selectedExport}
            >
              {loading ? 'Exporting...' : 'Export Data'}
            </SmartButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Class Info */}
        {classData && (
          <div className="p-4 bg-light-50 dark:bg-dark-700 rounded-xl border border-light-200 dark:border-dark-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
                  {classData.name}
                </h3>
                <p className="text-sm text-light-600 dark:text-dark-400">
                  {new Date(classData.date).toLocaleDateString()} • {classData.start_time} - {classData.end_time}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-light-600 dark:text-dark-400">
                  Members
                </div>
                <div className="text-lg font-semibold text-dark-900 dark:text-white">
                  {classData.enrolled_count}/{classData.capacity}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
            Select Export Type
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportOptions.map((option, index) => {
              const isSelected = selectedExport === option.id;
              const isProOnly = isProFeature(option.id);
              
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 border rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-light-200 dark:border-dark-600 bg-light-50 dark:bg-dark-700 hover:border-brand-300'
                  } ${!isPro && isProOnly ? 'opacity-50' : ''}`}
                  onClick={() => !isProOnly || isPro ? setSelectedExport(option.id) : null}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected 
                        ? 'bg-brand-100 dark:bg-brand-900/40' 
                        : 'bg-light-100 dark:bg-dark-600'
                    }`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-dark-900 dark:text-white">
                          {option.label}
                        </h4>
                        {isProOnly && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Pro
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                        {option.description}
                      </p>
                      <div className="mt-2">
                        <div className="text-xs text-light-600 dark:text-dark-400 mb-1">
                          Includes:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {option.includes.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-light-600 dark:text-dark-400">
                        Format: {option.format.toUpperCase()}
                      </div>
                    </div>
                    {isSelected && (
                      <FiCheck className="h-5 w-5 text-brand-600" />
                    )}
                  </div>
                  
                  {!isPro && isProOnly && (
                    <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                      Upgrade to Pro to access this feature
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Export Filters */}
        {selectedExport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
              Export Options
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
                >
                  <option value="all">All Time</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.customStart || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customStart: e.target.value }))}
                      className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.customEnd || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customEnd: e.target.value }))}
                      className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                <input
                  type="checkbox"
                  id="include-waitlist"
                  checked={filters.includeWaitlist}
                  onChange={(e) => setFilters(prev => ({ ...prev, includeWaitlist: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="include-waitlist" className="text-sm text-blue-900 dark:text-blue-100">
                  Include waitlist members
                </label>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <input
                  type="checkbox"
                  id="include-analytics"
                  checked={filters.includeAnalytics}
                  onChange={(e) => setFilters(prev => ({ ...prev, includeAnalytics: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="include-analytics" className="text-sm text-green-900 dark:text-green-100">
                  Include analytics and trends
                </label>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <input
                  type="checkbox"
                  id="include-attendance"
                  checked={filters.includeAttendance}
                  onChange={(e) => setFilters(prev => ({ ...prev, includeAttendance: e.target.checked }))}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <label htmlFor="include-attendance" className="text-sm text-yellow-900 dark:text-yellow-100">
                  Include attendance history
                </label>
              </div>
              
              {isPro && (
                <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <input
                    type="checkbox"
                    id="include-revenue"
                    checked={filters.includeRevenue}
                    onChange={(e) => setFilters(prev => ({ ...prev, includeRevenue: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="include-revenue" className="text-sm text-purple-900 dark:text-purple-100">
                    Include revenue data (Pro feature)
                  </label>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Export Progress */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Exporting data...
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {exportProgress}% complete
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Smart Suggestions */}
        {isPro && selectedExport && (
          <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
              AI Suggestions
            </h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <p>• Include analytics for better insights into class performance</p>
              <p>• Export attendance data to identify patterns and trends</p>
              <p>• Consider revenue data for financial analysis and optimization</p>
            </div>
          </div>
        )}
      </div>
    </SmartModal>
  );
};

export default ExportClassDataModal; 