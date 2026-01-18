import React, { useState } from "react";
import {
  FiX,
  FiCreditCard,
  FiDollarSign,
  FiCheckCircle,
  FiAlertTriangle,
  FiShield,
  FiBarChart2,
} from "react-icons/fi";
import { SmartBillingModal } from "./SmartBillingModal";
import { useSmartBillingModal } from "./useSmartBillingModal";

interface ProcessPaymentModalProps {
  open: boolean;
  onClose: () => void;
  memberId?: string;
  invoiceId?: string;
  amount?: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  processingFee: number;
}

const ProcessPaymentModal: React.FC<ProcessPaymentModalProps> = ({
  open,
  onClose,
  memberId,
  invoiceId,
  amount = 0,
}) => {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(amount);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showBalanceCheck, setShowBalanceCheck] = useState(false);

  const { isProUser } = useSmartBillingModal({ memberId, invoiceId, amount });

  const paymentMethods: PaymentMethod[] = [
    {
      id: "cash",
      name: "Cash",
      icon: <FiDollarSign className="w-4 h-4" />,
      description: "Physical cash payment",
      processingFee: 0,
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: <FiCreditCard className="w-4 h-4" />,
      description: "Card payment via terminal",
      processingFee: 2.5,
    },
    {
      id: "online",
      name: "Online Payment",
      icon: <FiCheckCircle className="w-4 h-4" />,
      description: "Stripe, PayPal, or bank transfer",
      processingFee: 3.0,
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: <FiDollarSign className="w-4 h-4" />,
      description: "Direct bank transfer",
      processingFee: 1.0,
    },
  ];

  const mockMemberBalance = 250;
  const processingFee = selectedMethod
    ? paymentMethods.find((m) => m.id === selectedMethod)?.processingFee || 0
    : 0;
  const totalAmount = paymentAmount + (paymentAmount * processingFee) / 100;

  const handleProcessPayment = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    onClose();
  };

  const handleAmountChange = (value: number) => {
    setPaymentAmount(value);
    if (value > mockMemberBalance) {
      setShowBalanceCheck(true);
    } else {
      setShowBalanceCheck(false);
    }
  };

  return (
    <SmartBillingModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100bg-green-900/20 rounded-lg">
              <FiDollarSign className="w-5 h-5 text-green-600text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900text-white">
                Process Payment
              </h2>
              <p className="text-sm text-gray-500text-gray-400">
                Record and process member payment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Payment Amount */}
          <div className="bg-gray-50bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900text-white mb-4 flex items-center">
              <FiBarChart2 className="w-4 h-4 mr-2" />
              Payment Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700text-gray-300 mb-2">
                  Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) =>
                      handleAmountChange(parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-8 pr-4 py-2 border border-gray-300border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparentbg-gray-700text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {showBalanceCheck && (
                <div className="bg-yellow-50bg-yellow-900/10 border border-yellow-200border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <FiAlertTriangle className="w-4 h-4 text-yellow-600text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800text-yellow-200">
                        Payment amount exceeds member&apos;s outstanding balance ($
                        {mockMemberBalance})
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="font-medium text-gray-900text-white mb-4">
              Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? "border-green-500 bg-green-50bg-green-900/20"
                      : "border-gray-200border-gray-600 hover:border-gray-300hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100bg-green-900/20 rounded-lg">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900text-white">
                        {method.name}
                      </h4>
                      <p className="text-sm text-gray-600text-gray-400">
                        {method.description}
                      </p>
                      {method.processingFee > 0 && (
                        <p className="text-xs text-gray-500text-gray-500">
                          {method.processingFee}% processing fee
                        </p>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${
                        selectedMethod === method.id
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300border-gray-600"
                      }`}
                    >
                      {selectedMethod === method.id && (
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          {selectedMethod && (
            <div className="bg-blue-50bg-blue-900/10 border border-blue-200border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-800text-blue-200 mb-3">
                Payment Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700text-blue-300">
                    Payment Amount:
                  </span>
                  <span className="font-medium">
                    ${paymentAmount.toFixed(2)}
                  </span>
                </div>
                {processingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-blue-700text-blue-300">
                      Processing Fee ({processingFee}%):
                    </span>
                    <span className="font-medium">
                      ${((paymentAmount * processingFee) / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t border-blue-200border-blue-700 pt-2">
                  <span>Total:</span>
                  <span className="text-blue-800text-blue-200">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700text-gray-300 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparentbg-gray-700text-white"
                placeholder="Transaction reference or receipt number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparentbg-gray-700text-white"
                placeholder="Add any additional notes about this payment..."
              />
            </div>
          </div>

          {/* Smart Suggestions for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50bg-blue-900/10 border border-blue-200border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800text-blue-200">
                    Smart Payment Insights
                  </h3>
                  <div className="space-y-2 mt-2">
                    <p className="text-sm text-blue-600text-blue-300">
                      Member typically pays via card on weekdays between 2-4 PM.
                    </p>
                    <p className="text-sm text-blue-600text-blue-300">
                      Consider offering payment plan for amounts over $500.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700text-gray-300 hover:bg-gray-100hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100bg-gray-700 hover:bg-gray-200hover:bg-gray-600 text-gray-700text-gray-300 rounded-lg transition-colors">
              Save Draft
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={isLoading || !selectedMethod || paymentAmount <= 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiDollarSign className="w-4 h-4" />
              )}
              <span>Process Payment</span>
            </button>
          </div>
        </div>
      </div>
    </SmartBillingModal>
  );
};

export default ProcessPaymentModal;
