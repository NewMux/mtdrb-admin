import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiMessageSquare,
  FiCheck,
  FiX as FiXIcon,
  FiClock,
  FiShield,
} from "react-icons/fi";
import { SmartTrainerModal } from "./SmartTrainerModal";

interface TrainerRequestsModalProps {
  open: boolean;
  onClose: () => void;
  trainer?: any;
}

const TrainerRequestsModal: React.FC<TrainerRequestsModalProps> = ({
  open,
  onClose,
  trainer,
}) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mockRequests = [
    {
      id: 1,
      type: "schedule_change",
      title: "Request for Schedule Adjustment",
      description:
        "I would like to adjust my Monday morning class from 8 AM to 9 AM to accommodate my commute.",
      status: "pending",
      priority: "medium",
      createdAt: "2024-01-20T10:00:00Z",
      trainer: "John Doe",
    },
    {
      id: 2,
      type: "equipment",
      title: "Additional Equipment Request",
      description:
        "Need additional yoga mats and blocks for the advanced class. Current inventory is insufficient.",
      status: "approved",
      priority: "high",
      createdAt: "2024-01-19T14:30:00Z",
      trainer: "John Doe",
    },
    {
      id: 3,
      type: "training",
      title: "Professional Development Request",
      description:
        "Requesting approval to attend the Advanced Yoga Certification workshop next month.",
      status: "pending",
      priority: "low",
      createdAt: "2024-01-18T09:15:00Z",
      trainer: "John Doe",
    },
  ];

  const handleApprove = async (requestId: number) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleReject = async (requestId: number) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const isProUser = true; // Mock Pro user status

  return (
    <SmartTrainerModal open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <FiMessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Trainer Requests
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage trainer requests and approvals
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
                  Active Requests:
                </span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  2 Pending
                </span>
              </div>
            </div>
          </div>

          {/* Request Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                2
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pending Requests
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                1
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Approved This Month
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                3.2
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg. Response Time (days)
              </div>
            </div>
          </div>

          {/* Smart Insights for Pro Users */}
          {isProUser && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    Smart Request Analysis
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    This trainer has a 95% approval rate for reasonable
                    requests. Consider fast-tracking schedule and equipment
                    requests to maintain satisfaction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Requests List */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Recent Requests
            </h3>
            <div className="space-y-3">
              {mockRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {request.title}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.priority === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : request.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {request.priority}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === "approved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : request.status === "rejected"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {request.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {request.status === "pending" && (
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={isLoading}
                          className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={isLoading}
                          className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        >
                          <FiXIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
              <FiClock className="w-4 h-4" />
              <span>Request History</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2">
              <FiMessageSquare className="w-4 h-4" />
              <span>Bulk Actions</span>
            </button>
          </div>
        </div>
      </div>
    </SmartTrainerModal>
  );
};

export default TrainerRequestsModal;
