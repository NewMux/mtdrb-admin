import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAlertTriangle,
  FiUserX,
  FiCalendar,
  FiClock,
  FiX,
} from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import { SmartButton } from "../../ui/DesignSystem";
import { Member } from "../../../types/member";
import { transactionService } from "../../../services/transactionService";
import { useAuth } from "../../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";

interface CancelMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onSuccess: (member: Member) => void;
}

type CancellationType = "immediate" | "end_of_period";

interface CancellationReason {
  id: string;
  label: string;
  description: string;
}

const CANCELLATION_REASONS: CancellationReason[] = [
  {
    id: "member_request",
    label: "Member Request",
    description: "Member requested to cancel their membership",
  },
  {
    id: "relocation",
    label: "Relocation",
    description: "Member is moving to a different area",
  },
  {
    id: "financial",
    label: "Financial Reasons",
    description: "Member can no longer afford the membership",
  },
  {
    id: "health",
    label: "Health Issues",
    description: "Member has health concerns preventing gym use",
  },
  {
    id: "dissatisfied",
    label: "Dissatisfied with Service",
    description: "Member is unhappy with gym services",
  },
  {
    id: "inactivity",
    label: "Prolonged Inactivity",
    description: "Member has not visited in an extended period",
  },
  {
    id: "violation",
    label: "Policy Violation",
    description: "Membership terminated due to policy violation",
  },
  {
    id: "other",
    label: "Other",
    description: "Other reason not listed above",
  },
];

/**
 * CancelMembershipModal - Modal for canceling a gym member's membership
 * 
 * This modal allows gym owners/staff to cancel a member's membership with:
 * - Option for immediate or end-of-period cancellation
 * - Reason selection for record keeping
 * - Additional notes field
 * - Summary of what will happen (bookings cancelled, etc.)
 */
const CancelMembershipModal: React.FC<CancelMembershipModalProps> = ({
  isOpen,
  onClose,
  member,
  onSuccess,
}) => {
  const { tenantId } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  
  const [cancellationType, setCancellationType] = useState<CancellationType>("immediate");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    // Reset state
    setCancellationType("immediate");
    setSelectedReason("");
    setAdditionalNotes("");
    setConfirmChecked(false);
    setError(null);
    onClose();
  };

  const handleCancelMembership = async () => {
    if (!member?.id || !tenantId) {
      setError("Member or tenant information is missing");
      return;
    }

    if (!selectedReason) {
      setError("Please select a cancellation reason");
      return;
    }

    if (!confirmChecked) {
      setError("Please confirm that you understand the implications");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const reasonLabel = CANCELLATION_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
      const fullReason = additionalNotes 
        ? `${reasonLabel}: ${additionalNotes}`
        : reasonLabel;

      const result = await transactionService.cancelMembership(
        member.id,
        tenantId,
        fullReason
      );

      if (result.success) {
        onSuccess(member);
        handleClose();
      } else {
        setError(result.error || "Failed to cancel membership");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!member) return null;

  const memberName = member.name || member.full_name || "Unknown Member";
  const membershipType = member.membership_type || member.membershipType || "Standard";
  const expiryDate = member.expiry_date || member.end_date || member.planEnd;

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={handleClose}
          title={t("members.cancelMembership", "إلغاء العضوية")}
          subtitle={t("members.cancelMembershipSubtitle", `إلغاء اشتراك العضوية للعضو ${memberName}`)}
          size="lg"
          footer={
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-2">
                <FiAlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  {t("members.actionCannotBeUndone", "لا يمكن التراجع عن هذا الإجراء بسهولة")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <SmartButton variant="secondary" onClick={handleClose}>
                  {t("common.cancel", "إلغاء")}
                </SmartButton>
                <SmartButton
                  variant="danger"
                  icon={<FiUserX className="w-4 h-4" />}
                  onClick={handleCancelMembership}
                  loading={isProcessing}
                  disabled={!confirmChecked || !selectedReason || isProcessing}
                >
                  {isProcessing 
                    ? t("members.cancelling", "جاري الإلغاء...") 
                    : t("members.confirmCancellation", "تأكيد الإلغاء")}
                </SmartButton>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-start" dir={isRTL ? "rtl" : "ltr"}>
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
              >
                <div className="flex items-center gap-2">
                  <FiX className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
              </motion.div>
            )}

            {/* Member Info Card */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-600">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {memberName
                      .split(" ")
                      .filter(Boolean)
                      .map((part: string) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-start">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {memberName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {member.email}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                    }`}>
                      {member.status === "active" ? t("common.active", "نشط") : t("common.inactive", "غير نشط")}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {membershipType} {t("common.membership", "عضوية")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Type */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                {t("members.cancellationType", "Cancellation Type")}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setCancellationType("immediate")}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    cancellationType === "immediate"
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
                    <FiClock className={`w-5 h-5 ${
                      cancellationType === "immediate" 
                        ? "text-red-600 dark:text-red-400" 
                        : "text-gray-400"
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        cancellationType === "immediate"
                          ? "text-red-700 dark:text-red-300"
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {t("members.immediateCancel", "Immediate Cancellation")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("members.immediateCancelDesc", "Cancel membership effective today")}
                      </p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setCancellationType("end_of_period")}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    cancellationType === "end_of_period"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
                    <FiCalendar className={`w-5 h-5 ${
                      cancellationType === "end_of_period" 
                        ? "text-amber-600 dark:text-amber-400" 
                        : "text-gray-400"
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        cancellationType === "end_of_period"
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {t("members.endOfPeriodCancel", "End of Period")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {expiryDate 
                          ? t("members.endOfPeriodCancelDesc", `Cancel effective ${new Date(expiryDate).toLocaleDateString()}`)
                          : t("members.endOfPeriodCancelDescGeneric", "Cancel at end of current billing period")}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Cancellation Reason */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                {t("members.cancellationReason", "Cancellation Reason")} <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">{t("members.selectReason", "Select a reason...")}</option>
                {CANCELLATION_REASONS.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.label}
                  </option>
                ))}
              </select>
              {selectedReason && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {CANCELLATION_REASONS.find(r => r.id === selectedReason)?.description}
                </p>
              )}
            </div>

            {/* Additional Notes */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                {t("members.additionalNotes", "Additional Notes")} ({t("common.optional", "Optional")})
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder={t("members.additionalNotesPlaceholder", "Add any additional details about this cancellation...")}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {/* What Will Happen */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className={`flex items-start ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
                <FiAlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-2">
                    {t("members.whatWillHappen", "What will happen:")}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>{t("members.cancelEffect1", "Member status will be set to inactive")}</li>
                    <li>{t("members.cancelEffect2", "All future class bookings will be cancelled")}</li>
                    <li>{t("members.cancelEffect3", "Member will lose access to gym facilities")}</li>
                    <li>{t("members.cancelEffect4", "Cancellation will be logged in activity history")}</li>
                    {cancellationType === "immediate" && (
                      <li className="text-red-600 dark:text-red-400 font-medium">
                        {t("members.cancelEffect5", "This takes effect immediately")}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className={`flex items-start ${isRTL ? 'space-x-reverse' : ''} space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600`}>
              <input
                type="checkbox"
                id="confirm-cancellation"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="confirm-cancellation" className="text-sm text-gray-700 dark:text-gray-300">
                {t("members.confirmCancellationCheckbox", "I understand that this action will cancel the membership and the member will lose access to gym facilities. I have verified that this cancellation is authorized.")}
              </label>
            </div>
          </div>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default CancelMembershipModal;
