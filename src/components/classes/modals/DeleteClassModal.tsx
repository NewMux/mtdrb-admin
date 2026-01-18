import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiAlertTriangle,
  FiCheck,
} from "react-icons/fi";
import SmartModal from "./SmartModal";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";
import { SmartButton } from "../../ui/DesignSystem";
import { toast } from "react-hot-toast";

interface DeleteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const DeleteClassModal: React.FC<DeleteClassModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  isPro = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [notifyTrainer, setNotifyTrainer] = useState(true);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const { classData, deleteClass, fetchClass } = useSmartClassModal({
    classId,
    isPro,
  });

  // Load class data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
    }
  }, [isOpen, classId, fetchClass]);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const success = await deleteClass();
      if (success) {
        toast.success("Class deleted successfully");
        onSuccess?.();
        onClose();
      } else {
        toast.error("Failed to delete class");
      }
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    } finally {
      setLoading(false);
    }
  };

  const cancellationReasons = [
    { value: "trainer-unavailable", label: "Trainer Unavailable" },
    { value: "low-attendance", label: "Low Attendance" },
    { value: "facility-issue", label: "Facility Issue" },
    { value: "schedule-conflict", label: "Schedule Conflict" },
    { value: "weather", label: "Weather Conditions" },
    { value: "maintenance", label: "Maintenance" },
    { value: "other", label: "Other" },
  ];

  const getReasonLabel = (value: string) => {
    return cancellationReasons.find((r) => r.value === value)?.label || value;
  };

  if (!classData) {
    return (
      <SmartModal
        isOpen={isOpen}
        onClose={onClose}
        title="Delete Class"
        subtitle="Loading class data..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SmartModal>
    );
  }

  const hasEnrolledMembers = classData.enrolled_count > 0;
  const hasWaitlist = classData.waitlist_count > 0;
  const isHighImpact = hasEnrolledMembers || hasWaitlist;

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Class"
      subtitle={`Cancel ${classData.name}`}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isHighImpact && (
              <div className="flex items-center space-x-1 text-sm text-red-600">
                <FiAlertTriangle className="h-4 w-4" />
                <span>High impact action</span>
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
              variant="danger"
              onClick={handleDelete}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Class"}
            </SmartButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Warning Alert */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl"
        >
          <div className="flex items-start space-x-3">
            <FiAlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
                This action cannot be undone
              </h4>
              <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                Deleting this class will permanently remove it from the schedule
                and cancel all enrollments.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Class Details */}
        <div className="p-4 bg-light-50 dark:bg-dark-700 rounded-xl border border-light-200 dark:border-dark-600">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white mb-3">
            Class Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-light-600 dark:text-dark-400">
                Class Name:
              </span>
              <span className="ml-2 text-dark-900 dark:text-white font-medium">
                {classData.name}
              </span>
            </div>
            <div>
              <span className="text-light-600 dark:text-dark-400">Date:</span>
              <span className="ml-2 text-dark-900 dark:text-white font-medium">
                {new Date(classData.date).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-light-600 dark:text-dark-400">Time:</span>
              <span className="ml-2 text-dark-900 dark:text-white font-medium">
                {classData.start_time} - {classData.end_time}
              </span>
            </div>
            <div>
              <span className="text-light-600 dark:text-dark-400">
                Trainer:
              </span>
              <span className="ml-2 text-dark-900 dark:text-white font-medium">
                {classData.trainer_name || "Not assigned"}
              </span>
            </div>
          </div>
        </div>

        {/* Impact Assessment */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
            Impact Assessment
          </h3>

          {/* Enrolled Members */}
          {hasEnrolledMembers && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 border border-orange-200 bg-orange-50 dark:bg-orange-900/10 rounded-xl"
            >
              <div className="flex items-start space-x-3">
                <FiUsers className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    {classData.enrolled_count} Enrolled Members
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                    These members will be automatically unenrolled and can be
                    notified about the cancellation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Waitlist */}
          {hasWaitlist && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/10 rounded-xl"
            >
              <div className="flex items-start space-x-3">
                <FiUsers className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {classData.waitlist_count} Members on Waitlist
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    These members will be removed from the waitlist
                    automatically.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* No Impact */}
          {!hasEnrolledMembers && !hasWaitlist && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/10 rounded-xl"
            >
              <div className="flex items-start space-x-3">
                <FiCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                    No Impact
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                    No members are enrolled or on the waitlist. Safe to delete.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Cancellation Reason */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
            Cancellation Reason
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                Reason Type
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
              >
                <option value="">Select a reason</option>
                {cancellationReasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {reason === "other" && (
              <div>
                <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                  Custom Reason
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom reason"
                  className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        {(hasEnrolledMembers || classData.trainer_id) && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
              Notifications
            </h3>

            <div className="space-y-3">
              {hasEnrolledMembers && (
                <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <input
                    type="checkbox"
                    id="notify-members"
                    checked={notifyMembers}
                    onChange={(e) => setNotifyMembers(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="notify-members"
                    className="text-sm text-blue-900 dark:text-blue-100"
                  >
                    Send cancellation notification to {classData.enrolled_count}{" "}
                    enrolled members
                  </label>
                </div>
              )}

              {classData.trainer_id && (
                <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                  <input
                    type="checkbox"
                    id="notify-trainer"
                    checked={notifyTrainer}
                    onChange={(e) => setNotifyTrainer(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label
                    htmlFor="notify-trainer"
                    className="text-sm text-green-900 dark:text-green-100"
                  >
                    Notify trainer about class cancellation
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white mb-2">
            Action Summary
          </h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Delete class &quot;{classData.name}&quot; permanently</li>
            {hasEnrolledMembers && (
              <li>• Unenroll {classData.enrolled_count} members</li>
            )}
            {hasWaitlist && (
              <li>• Remove {classData.waitlist_count} members from waitlist</li>
            )}
            {notifyMembers && hasEnrolledMembers && (
              <li>• Send cancellation notifications to members</li>
            )}
            {notifyTrainer && classData.trainer_id && (
              <li>• Notify trainer about cancellation</li>
            )}
            {reason && (
              <li>• Record cancellation reason: {getReasonLabel(reason)}</li>
            )}
          </ul>
        </div>
      </div>
    </SmartModal>
  );
};

export default DeleteClassModal;
