import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiUserPlus,
  FiShield,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { SmartTrainerModal } from "./SmartTrainerModal";

interface RestoreTrainerModalProps {
  open: boolean;
  onClose: () => void;
  trainer?: any;
}

const RestoreTrainerModal: React.FC<RestoreTrainerModalProps> = ({
  open,
  onClose,
  trainer,
}) => {
  const [restoreType, setRestoreType] = useState("");
  const [scheduleRestore, setScheduleRestore] = useState(false);
  const [restoreDate, setRestoreDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleRestore = async () => {
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
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FiUserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Restore Trainer
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reactivate trainer account and restore access
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
          {/* Success Alert */}
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-200">
                  Trainer can be restored
                </h3>
                <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                  All trainer data is preserved and can be fully restored to the
                  system.
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
                  Removed Date:
                </span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  2024-01-15
                </span>
              </div>
            </div>
          </div>

          {/* Restore Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Restore Type
            </label>
            <select
              value={restoreType}
              onChange={(e) => setRestoreType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select restore type</option>
              <option value="immediate">Immediate Restoration</option>
              <option value="scheduled">Scheduled Restoration</option>
              <option value="conditional">Conditional Restoration</option>
            </select>
          </div>

          {/* Scheduled Restoration */}
          {restoreType === "scheduled" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="scheduleRestore"
                  checked={scheduleRestore}
                  onChange={(e) => setScheduleRestore(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="scheduleRestore"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Schedule for later restoration
                </label>
              </div>
              {scheduleRestore && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Restoration Date
                  </label>
                  <input
                    type="datetime-local"
                    value={restoreDate}
                    onChange={(e) => setRestoreDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* Smart Recommendation for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    Smart Recommendation
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    This trainer had excellent performance metrics before
                    removal. Consider immediate restoration to maintain member
                    relationships.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data Recovery Info */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FiClock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200">
                  Data Recovery
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  The following data will be restored: Profile, Schedule, Member
                  Assignments, Performance History, and Payment Records.
                </p>
              </div>
            </div>
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
            onClick={handleRestore}
            disabled={!restoreType || isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiUserPlus className="w-4 h-4" />
            )}
            <span>Restore Trainer</span>
          </button>
        </div>
      </div>
    </SmartTrainerModal>
  );
};

export default RestoreTrainerModal;
