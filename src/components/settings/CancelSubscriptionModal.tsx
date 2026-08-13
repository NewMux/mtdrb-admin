import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAlertTriangle,
  FiX,
  FiCreditCard,
  FiCalendar,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";
import { SmartModal } from "../ui/SmartModal";
import { SmartButton } from "../ui/DesignSystem";
import { supabase } from "../../supabaseClient";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  subscriptionStart?: string;
  onSuccess: () => void;
}

interface CancellationReason {
  id: string;
  label: string;
}

/**
 * CancelSubscriptionModal - Modal for canceling MTDRB SaaS subscription
 * 
 * This modal allows gym owners to cancel their MTDRB subscription with:
 * - Clear information about what they'll lose
 * - Reason collection for product improvement
 * - Option to provide feedback
 * - Confirmation with implications summary
 */
const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  subscriptionStart,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  const CANCELLATION_REASONS: CancellationReason[] = [
    { id: "too_expensive", label: t("settings.reasonTooExpensive") },
    { id: "not_using", label: t("settings.reasonNotUsingFeatures") },
    { id: "switching_competitor", label: t("settings.reasonSwitchingCompetitor") },
    { id: "closing_business", label: t("settings.reasonClosingBusiness") },
    { id: "missing_features", label: t("settings.reasonMissingFeatures") },
    { id: "technical_issues", label: t("settings.reasonTechnicalIssues") },
    { id: "temporary_pause", label: t("settings.reasonTemporaryPause") },
    { id: "other", label: t("settings.reasonOther") },
  ];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setStep(1);
    setSelectedReason("");
    setFeedback("");
    setConfirmText("");
    setError(null);
    onClose();
  };

  const handleCancelSubscription = async () => {
    if (confirmText.toLowerCase() !== "cancel") {
      setError(t("settings.typeCancelToConfirmError"));
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Update user metadata to cancel subscription
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          paid: false,
          subscription_tier: null,
          subscription_cancelled: true,
          subscription_cancelled_at: new Date().toISOString(),
          cancellation_reason: selectedReason,
          cancellation_feedback: feedback,
        },
      });

      if (updateError) throw updateError;

      // Log the cancellation event (if activities table exists)
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.from("activities").insert({
            tenant_id: userData.user.user_metadata?.tenant_id,
            type: "subscription",
            title: "Subscription Cancelled",
            description: `${currentPlan} subscription cancelled. Reason: ${selectedReason}`,
            status: "success",
            metadata: {
              plan: currentPlan,
              reason: selectedReason,
              feedback: feedback,
            },
          });
        }
      } catch (logError) {
        // Silently fail logging - subscription is still cancelled
        console.error("Failed to log cancellation:", logError);
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.cancelSubscriptionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Current Plan Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <FiCreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {currentPlan} {t("settings.plan", "Plan")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subscriptionStart 
                ? t("settings.memberSince", `Member since ${new Date(subscriptionStart).toLocaleDateString()}`)
                : t("settings.activeSubscription", "Active subscription")}
            </p>
          </div>
        </div>
      </div>

      {/* What You'll Lose */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 dark:text-white">
          {t("settings.whatYouLose", "What you'll lose access to:")}
        </h4>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <ul className="space-y-2">
            {[
              t("settings.loseMemberManagement", "Member management tools"),
              t("settings.loseClassScheduling", "Class scheduling"),
              t("settings.losePaymentProcessing", "Payment processing"),
              t("settings.loseAnalytics", "Analytics and reports"),
              t("settings.loseTrainerTools", "Trainer management"),
              t("settings.loseAutomation", "Automation features"),
            ].map((item, index) => (
              <li key={index} className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 text-sm text-red-700 dark:text-red-300`}>
                <FiX className="w-4 h-4 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Alternative Options */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
          {t("settings.beforeYouGo", "Before you go, have you considered?")}
        </h4>
        <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          <li className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
            <FiCheck className="w-4 h-4 flex-shrink-0" />
            <span>{t("settings.considerDowngrade", "Downgrade to a lower plan")}</span>
          </li>
          <li className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
            <FiCheck className="w-4 h-4 flex-shrink-0" />
            <span>{t("settings.considerPause", "Pause your subscription temporarily")}</span>
          </li>
          <li className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
            <FiCheck className="w-4 h-4 flex-shrink-0" />
            <span>{t("settings.considerSupport", "Contact support for help with issues")}</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("settings.helpUsImprove", "Help us improve")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("settings.whyLeaving", "Why are you cancelling your subscription?")}
        </p>
      </div>

      {/* Reason Selection */}
      <div className="space-y-2">
        {CANCELLATION_REASONS.map((reason) => (
          <button
            key={reason.id}
            onClick={() => setSelectedReason(reason.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedReason === reason.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
            }`}
          >
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedReason === reason.id
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300 dark:border-gray-500"
              }`}>
                {selectedReason === reason.id && (
                  <FiCheck className="w-3 h-3 text-white" />
                )}
              </div>
              <span className={`font-medium ${
                selectedReason === reason.id
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-gray-900 dark:text-white"
              }`}>
                {reason.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Additional Feedback */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("settings.additionalFeedback", "Additional feedback")} ({t("common.optional", "optional")})
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t("settings.feedbackPlaceholder", "Tell us more about your experience...")}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Warning */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <FiAlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("settings.confirmCancellation", "Confirm Cancellation")}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {t("settings.confirmCancellationDesc", "This action will cancel your subscription and you'll lose access to all MTDRB features.")}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Confirmation Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("settings.typeCancel", "Type 'cancel' to confirm")}
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="cancel"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
        />
      </div>

      {/* Final Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <div className={`flex items-start ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
          <FiCalendar className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">
              {t("settings.accessUntil", "Your access will continue until the end of your current billing period.")}
            </p>
            <p className="mt-1 text-xs">
              {t("settings.dataRetention", "Your data will be retained for 30 days in case you change your mind.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const getStepFooter = () => {
    switch (step) {
      case 1:
        return (
          <>
            <SmartButton variant="secondary" onClick={handleClose}>
              {t("settings.keepSubscription", "Keep Subscription")}
            </SmartButton>
            <SmartButton
              variant="danger"
              onClick={() => setStep(2)}
              icon={<FiArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {t("settings.continueCancel", "Continue to Cancel")}
            </SmartButton>
          </>
        );
      case 2:
        return (
          <>
            <SmartButton variant="secondary" onClick={() => setStep(1)}>
              {t("common.back", "Back")}
            </SmartButton>
            <SmartButton
              variant="danger"
              onClick={() => setStep(3)}
              disabled={!selectedReason}
              icon={<FiArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {t("settings.continueCancel", "Continue")}
            </SmartButton>
          </>
        );
      case 3:
        return (
          <>
            <SmartButton variant="secondary" onClick={() => setStep(2)}>
              {t("common.back", "Back")}
            </SmartButton>
            <SmartButton
              variant="danger"
              onClick={handleCancelSubscription}
              loading={isProcessing}
              disabled={confirmText.toLowerCase() !== "cancel" || isProcessing}
            >
              {isProcessing 
                ? t("settings.cancelling", "Cancelling...") 
                : t("settings.cancelSubscription", "Cancel Subscription")}
            </SmartButton>
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={handleClose}
          title={t("settings.cancelSubscription", "Cancel Subscription")}
          subtitle={t("settings.cancelSubscriptionSubtitle", "We're sorry to see you go")}
          size="lg"
          footer={
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3 justify-end w-full`}>
              {getStepFooter()}
            </div>
          }
        >
          {/* Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? "w-8 bg-blue-600"
                      : s < step
                        ? "bg-blue-600"
                        : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </motion.div>
          </AnimatePresence>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default CancelSubscriptionModal;
