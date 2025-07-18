import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiDownload, FiFilter, FiCalendar, FiUser, FiShield } from "react-icons/fi";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { useSmartBillingModal } from "./useSmartBillingModal";

interface ExportBillingDataModalProps {
  open: boolean;
  onClose: () => void;
}

const ExportBillingDataModal: React.FC<ExportBillingDataModalProps> = ({
  open,
  onClose
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');
  const [dataTypes, setDataTypes] = useState(['invoices', 'expenses']);
  const [isLoading, setIsLoading] = useState(false);

  const {
    data,
    loading,
    validation,
    suggestions,
    isProUser,
    updateData
  } = useSmartBillingModal({});

  const branches = [
    'All Branches',
    'Main Branch - Dubai',
    'Fitness Hub - Abu Dhabi',
    'Wellness Center - Sharjah'
  ];

  const members = [
    'All Members',
    'John Doe',
    'Sarah Smith',
    'Mike Johnson',
    'Emma Wilson'
  ];

  const trainers = [
    'All Trainers',
    'Alex Trainer',
    'Maria Coach',
    'David Fitness',
    'Lisa Wellness'
  ];

  const exportFormats = [
    { id: 'csv', name: 'CSV', description: 'Comma-separated values' },
    { id: 'excel', name: 'Excel', description: 'Microsoft Excel format' },
    { id: 'json', name: 'JSON', description: 'Structured data format' }
  ];

  const dataTypeOptions = [
    { id: 'invoices', name: 'Invoices', description: 'All invoice data' },
    { id: 'expenses', name: 'Expenses', description: 'All expense records' },
    { id: 'vat', name: 'VAT Data', description: 'VAT calculations and reports' },
    { id: 'payments', name: 'Payments', description: 'Payment transactions' }
  ];

  const handleDataTypeToggle = (typeId: string) => {
    setDataTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleExportData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsLoading(false);
    onClose();
  };

  return (
    <ColorfulModalUI
      open={open}
      onClose={onClose}
      onAction={handleExportData}
      title="Export Billing Data"
      subtitle="Export filtered billing data for analysis"
    >
      <div className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Date Range */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <FiCalendar className="w-4 h-4 mr-2" />
              Date Range
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <FiFilter className="w-4 h-4 mr-2" />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Branches</option>
                  {branches.slice(1).map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Member
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Members</option>
                  {members.slice(1).map((member) => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trainer
                </label>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Trainers</option>
                  {trainers.slice(1).map((trainer) => (
                    <option key={trainer} value={trainer}>{trainer}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data Types */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Data Types to Export
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dataTypeOptions.map((type) => (
                <div
                  key={type.id}
                  onClick={() => handleDataTypeToggle(type.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    dataTypes.includes(type.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      dataTypes.includes(type.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {dataTypes.includes(type.id) && (
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {type.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Export Format
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {exportFormats.map((format) => (
                <div
                  key={format.id}
                  onClick={() => setExportFormat(format.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    exportFormat === format.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {format.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
              Export Summary
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Data Types:</span>
                <span className="font-medium">{dataTypes.length} selected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Format:</span>
                <span className="font-medium">{exportFormats.find(f => f.id === exportFormat)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Estimated Records:</span>
                <span className="font-medium">~2,450 records</span>
              </div>
            </div>
          </div>

          {/* AI Suggestions for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    AI Export Insights
                  </h3>
                  <div className="space-y-2 mt-2">
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      CSV format recommended for large datasets (&gt;1000 records).
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Consider filtering by date range to reduce file size.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
              Preview Data
            </button>
            <button
              onClick={handleExportData}
              disabled={isLoading || dataTypes.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiDownload className="w-4 h-4" />
              )}
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </div>
    </ColorfulModalUI>
  );
};

export default ExportBillingDataModal; 