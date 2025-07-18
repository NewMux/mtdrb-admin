import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiDollarSign, FiCalendar, FiDownload, FiTrendingUp, FiShield } from "react-icons/fi";
import { SmartTrainerModal } from "./SmartTrainerModal";

interface TrainerPaymentsModalProps {
  open: boolean;
  onClose: () => void;
  trainer?: any;
}

const TrainerPaymentsModal: React.FC<TrainerPaymentsModalProps> = ({
  open,
  onClose,
  trainer
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [paymentType, setPaymentType] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mockPayments = [
    {
      id: 1,
      type: "salary",
      amount: 1200.00,
      date: "2024-01-20",
      status: "paid",
      description: "January salary payment"
    },
    {
      id: 2,
      type: "bonus",
      amount: 300.00,
      date: "2024-01-15",
      status: "paid",
      description: "Performance bonus"
    },
    {
      id: 3,
      type: "commission",
      amount: 150.00,
      date: "2024-01-10",
      status: "pending",
      description: "Member referral commission"
    }
  ];

  const handleProcessPayment = async () => {
    if (!paymentType || !amount) return;
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setPaymentType("");
    setAmount("");
  };

  const isProUser = true; // Mock Pro user status

  return (
    <SmartTrainerModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Trainer Payments
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage payments and financial records
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
          {/* Trainer Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Trainer Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium">{trainer?.name || "John Doe"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium">{trainer?.email || "john@fit.com"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                <span className="font-medium">Direct Deposit</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                $1,650
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Paid This Month
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                $150
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pending Payments
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                $2,100
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Expected This Month
              </div>
            </div>
          </div>

          {/* Process Payment */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Process Payment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Type
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select payment type</option>
                  <option value="salary">Salary</option>
                  <option value="bonus">Bonus</option>
                  <option value="commission">Commission</option>
                  <option value="overtime">Overtime</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={handleProcessPayment}
              disabled={!paymentType || !amount || isLoading}
              className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiDollarSign className="w-4 h-4" />
              )}
              <span>Process Payment</span>
            </button>
          </div>

          {/* AI Insights for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    AI Insights
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    Payment trend analysis shows 12% increase in earnings this month. 
                    Consider performance-based bonus structure to maintain motivation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Payment History
            </h3>
            <div className="space-y-3">
              {mockPayments.map((payment) => (
                <div key={payment.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {payment.description}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(payment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${payment.amount.toFixed(2)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Close
          </button>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2">
              <FiCalendar className="w-4 h-4" />
              <span>Payment Schedule</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2">
              <FiDownload className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>
    </SmartTrainerModal>
  );
};

export default TrainerPaymentsModal; 