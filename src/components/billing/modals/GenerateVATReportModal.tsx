import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiCalendar,
  FiDownload,
  FiFileText,
  FiShield,
  FiBarChart2,
} from "react-icons/fi";
import { SmartBillingModal } from "./SmartBillingModal";
import { useSmartBillingModal } from "./useSmartBillingModal";

interface GenerateVATReportModalProps {
  open: boolean;
  onClose: () => void;
}

const GenerateVATReportModal: React.FC<GenerateVATReportModalProps> = ({
  open,
  onClose,
}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState("all");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isLoading, setIsLoading] = useState(false);

  const { data, loading, validation, suggestions, isProUser, updateData } =
    useSmartBillingModal({});

  const reportTypes = [
    {
      id: "all",
      name: "All Transactions",
      description: "Invoices, expenses, and refunds",
    },
    {
      id: "invoices",
      name: "Invoices Only",
      description: "Revenue and VAT collected",
    },
    {
      id: "expenses",
      name: "Expenses Only",
      description: "Expenses and VAT paid",
    },
    {
      id: "refunds",
      name: "Refunds Only",
      description: "Refunds and VAT adjustments",
    },
  ];

  const exportFormats = [
    {
      id: "pdf",
      name: "PDF Report",
      description: "Professional formatted report",
    },
    { id: "csv", name: "CSV Data", description: "Raw data for analysis" },
    {
      id: "excel",
      name: "Excel Spreadsheet",
      description: "Detailed spreadsheet with calculations",
    },
  ];

  const mockVATSummary = {
    totalRevenue: 45000,
    totalExpenses: 18000,
    vatCollected: 6750,
    vatPaid: 2700,
    vatDue: 4050,
    refundableVAT: 0,
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsLoading(false);
    onClose();
  };

  return (
    <SmartBillingModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FiFileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generate VAT Report
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create comprehensive VAT reports for tax compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Date Range */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <FiCalendar className="w-4 h-4 mr-2" />
              Report Period
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

          {/* Report Type */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Report Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    reportType === type.id
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {type.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {type.description}
                  </p>
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
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
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

          {/* VAT Summary Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center">
              <FiBarChart2 className="w-4 h-4 mr-2" />
              VAT Summary Preview
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    Total Revenue:
                  </span>
                  <span className="font-medium">
                    ${mockVATSummary.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    VAT Collected:
                  </span>
                  <span className="font-medium">
                    ${mockVATSummary.vatCollected.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    Total Expenses:
                  </span>
                  <span className="font-medium">
                    ${mockVATSummary.totalExpenses.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    VAT Paid:
                  </span>
                  <span className="font-medium">
                    ${mockVATSummary.vatPaid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    VAT Due:
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ${mockVATSummary.vatDue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    Refundable VAT:
                  </span>
                  <span className="font-medium">
                    ${mockVATSummary.refundableVAT.toLocaleString()}
                  </span>
                </div>
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
                    Smart VAT Insights
                  </h3>
                  <div className="space-y-2 mt-2">
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      VAT due is 15% higher than last quarter. Consider
                      reviewing expense categories.
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Recommend quarterly VAT filing to maintain compliance.
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
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2">
              <FiDownload className="w-4 h-4" />
              <span>Preview Report</span>
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={isLoading || !startDate || !endDate}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiFileText className="w-4 h-4" />
              )}
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </SmartBillingModal>
  );
};

export default GenerateVATReportModal;
