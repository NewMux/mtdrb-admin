import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiAlertTriangle,
  FiUserMinus,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";
import { SmartTrainerModal } from "./SmartTrainerModal";

interface RemoveTrainerModalProps {
  open: boolean;
  onClose: () => void;
  trainer?: any;
}

const RemoveTrainerModal: React.FC<RemoveTrainerModalProps> = ({
  open,
  onClose,
  trainer,
}) => {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleRemove = async () => {
    if (confirmText !== "REMOVE") {
      return;
    }
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    onClose();
  };

  const isProUser = true; // Mock Pro user status

  return (
    <SmartTrainerModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <FiUserMinus className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Remove Trainer
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Permanently remove trainer from the system
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
          {/* Warning Alert */}
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-200">
                  This action cannot be undone
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  Removing this trainer will permanently delete their profile,
                  schedule, and all associated data.
                </p>
              </div>
            </div>
          </div>

          {/* Trainer Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Trainer Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium">
                  {trainer?.name || "John Doe"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium">
                  {trainer?.email || "john@fit.com"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Removal
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a reason</option>
              <option value="performance">Performance Issues</option>
              <option value="conduct">Code of Conduct Violation</option>
              <option value="resignation">Resignation</option>
              <option value="termination">Termination</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* AI Recommendation for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    AI Recommendation
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    Consider scheduling a final performance review before
                    removal. This trainer has shown consistent improvement in
                    recent months.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type "REMOVE" to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type REMOVE to confirm"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRemove}
            disabled={confirmText !== "REMOVE" || isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiUserMinus className="w-4 h-4" />
            )}
            <span>Remove Trainer</span>
          </button>
        </div>
      </div>
    </SmartTrainerModal>
  );
};

export default RemoveTrainerModal;
