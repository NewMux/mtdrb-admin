import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiAlertTriangle,
  FiBell,
  FiUsers,
  FiDollarSign,
  FiCheck,
} from "react-icons/fi";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { FormSection } from "./SmartFormComponents";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../supabaseClient";

interface CancelClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const CancelClassModal: React.FC<CancelClassModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  isPro = false,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [notifyTrainer, setNotifyTrainer] = useState(true);
  const [autoRefund, setAutoRefund] = useState(false);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);

  const { classData, fetchClass } = useSmartClassModal({ classId, isPro });

  // Load class data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
    }
  }, [isOpen, classId, fetchClass]);

  // Calculate refund amount based on the class's real price
  useEffect(() => {
    if (classData) {
      setRefundAmount((classData.price || 0) * classData.enrolled_count);
    }
  }, [classData]);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { data: existingClass, error: fetchError } = await supabase
        .from("classes")
        .select("metadata")
        .eq("id", classId)
        .single();

      if (fetchError) throw fetchError;

      const { error: classError } = await supabase
        .from("classes")
        .update({
          status: "cancelled",
          metadata: {
            ...((existingClass?.metadata as Record<string, unknown>) || {}),
            cancellation_reason: reason === "other" ? customReason : reason,
          },
        })
        .eq("id", classId);

      if (classError) throw classError;

      if (hasEnrolledMembers) {
        const { error: bookingsError } = await supabase
          .from("class_bookings")
          .update({ status: "cancelled" })
          .eq("class_id", classId)
          .eq("status", "booked");

        if (bookingsError) throw bookingsError;
      }

      if (hasWaitlist) {
        const { error: waitlistError } = await supabase
          .from("class_waitlist")
          .update({ status: "cancelled" })
          .eq("class_id", classId);

        if (waitlistError) throw waitlistError;
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error cancelling class:", error);
      toast.error("Failed to cancel class");
    } finally {
      setLoading(false);
    }
  };

  const cancellationReasons = [
    { value: "trainer-unavailable", label: t("classes.trainerUnavailable") },
    { value: "low-attendance", label: t("classes.lowAttendance") },
    { value: "facility-issue", label: t("classes.facilityIssue") },
    { value: "schedule-conflict", label: t("classes.scheduleConflict") },
    { value: "weather", label: t("classes.weatherConditions") },
    { value: "maintenance", label: t("classes.maintenance") },
    { value: "other", label: t("classes.other") },
  ];

  const getReasonLabel = (value: string) => {
    return cancellationReasons.find((r) => r.value === value)?.label || value;
  };

  if (!classData) {
    return (
      <UnifiedModal
        isOpen={isOpen}
        onClose={onClose}
        title={t("classes.cancelClass")}
        subtitle={t("classes.loading") || "Loading class data..."}
        maxWidth="2xl"
        slideFrom="right"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedModal>
    );
  }

  const hasEnrolledMembers = classData.enrolled_count > 0;
  const hasWaitlist = classData.waitlist_count > 0;
  const isHighImpact = hasEnrolledMembers || hasWaitlist;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("classes.cancelClass")}
      subtitle={t("classes.cancelClassAction", { name: classData.name })}
      maxWidth="2xl"
      slideFrom="right"
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
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("classes.cancel")}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t("classes.canceling") : t("classes.cancelClass")}
            </button>
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
                {t("classes.thisWillCancelClassPermanently") || "This will cancel the class permanently"}
              </h4>
              <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                {t("classes.cancellingClassWillRemove") || "Cancelling this class will remove it from the schedule and notify all enrolled members."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Class Details */}
        <div className="p-4 bg-light-50 dark:bg-dark-700 rounded-xl border border-light-200 dark:border-dark-600">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white mb-3">
            {t("classes.classDetails")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-light-600 dark:text-dark-400">
                {t("classes.name")}:
              </span>
              <span className="ml-2 text-dark-900 dark:text-white font-medium">
                {classData.name}
              </span>
            </div>
            <div>
              <span className="text-light-600 dark:text-dark-400">{t("classes.date")}:</span>
              <span className="ml-2 text-dark-900 dark:text-white font-medium">
                {new Date(classData.date).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-light-600 dark:text-dark-400">{t("classes.time")}:</span>
              <span className="ml-2 text-dark-900 dark:text-white font-medium">
                {classData.start_time} - {classData.end_time}
              </span>
            </div>
            <div>
              <span className="text-light-600 dark:text-dark-400">
                {t("classes.trainer")}:
              </span>
              <span className="ml-2 text-dark-900 dark:text-white font-medium">
                {classData.trainer_name || t("classes.notAssigned")}
              </span>
            </div>
          </div>
        </div>

        {/* Impact Assessment */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
            {t("classes.impactAssessment")}
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
                    {classData.enrolled_count} {t("classes.enrolledMembers")}
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                    {t("classes.theseMembersWillBeAutomaticallyUnenrolled")}
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
                    {classData.waitlist_count} {t("classes.membersOnWaitlist")}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    {t("classes.theseMembersWillBeRemovedFromWaitlist")}
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
                    {t("classes.noImpact")}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                    {t("classes.safeToCancel")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Cancellation Reason */}
        <FormSection
          title={t("classes.cancellationReason")}
          subtitle={t("classes.selectReasonForCancellation") || "Select the reason for cancellation"}
        >
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
                  {t("classes.customReason")}
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={t("classes.enterCustomReason")}
                  className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </FormSection>

        {/* Refund Settings */}
        {hasEnrolledMembers && (
          <FormSection
            title="Refund Settings"
            subtitle="Configure automatic refunds for enrolled members"
            icon={<FiDollarSign className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                <input
                  type="checkbox"
                  id="auto-refund"
                  checked={autoRefund}
                  onChange={(e) => setAutoRefund(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="auto-refund"
                  className="text-sm text-blue-900 dark:text-blue-100"
                >
                  {t("classes.automaticallyRefundMembers", { count: classData.enrolled_count })}
                </label>
              </div>

              {autoRefund && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <FiDollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      {t("classes.totalRefundAmount", { amount: refundAmount.toFixed(2) })}
                    </span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-200 mt-1">
                    {t("classes.willBeProcessedAutomatically")}
                  </p>
                </motion.div>
              )}
            </div>
          </FormSection>
        )}

        {/* Notification Settings */}
        {(hasEnrolledMembers || classData.trainer_id) && (
          <FormSection
            title={t("classes.notifications")}
            subtitle={t("classes.configureWhoToNotify")}
            icon={<FiBell className="h-5 w-5" />}
          >
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
                    {t("classes.notifyTrainerAboutCancellation")}
                  </label>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white mb-2">
            {t("classes.actionSummary")}
          </h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• {t("classes.cancelClassPermanently", { name: classData.name })}</li>
            {hasEnrolledMembers && (
              <li>• Unenroll {classData.enrolled_count} members</li>
            )}
            {hasWaitlist && (
              <li>• Remove {classData.waitlist_count} members from waitlist</li>
            )}
            {notifyMembers && hasEnrolledMembers && (
              <li>• {t("classes.sendCancellationNotifications")}</li>
            )}
            {notifyTrainer && classData.trainer_id && (
              <li>• {t("classes.notifyTrainer")}</li>
            )}
            {autoRefund && hasEnrolledMembers && (
              <li>• {t("classes.processAutomaticRefunds", { amount: refundAmount.toFixed(2) })}</li>
            )}
            {reason && (
              <li>• {t("classes.recordCancellationReason") || "Record cancellation reason"}: {getReasonLabel(reason)}</li>
            )}
          </ul>
        </div>
      </div>
    </UnifiedModal>
  );
};

export default CancelClassModal;
