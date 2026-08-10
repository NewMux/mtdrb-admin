import * as React from "react";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { SmartButton } from "../../ui/DesignSystem";
import { Branch, BusinessHours } from "../../../types";

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

interface ViewBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  onEdit?: () => void;
}

export default function ViewBranchModal({
  isOpen,
  onClose,
  branch,
  onEdit,
}: ViewBranchModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  const handleEdit = () => {
    onClose();
    onEdit?.();
  };

  const footer = (
    <>
      <SmartButton variant="secondary" onClick={onClose}>
        {t("common.close") || "Close"}
      </SmartButton>
      {onEdit && (
        <SmartButton
          variant="primary"
          onClick={handleEdit}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {t("common.edit") || "Edit"}
        </SmartButton>
      )}
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("branches.branchDetails") || "Branch Details"}
      subtitle={branch.name}
      footer={footer}
      maxWidth="4xl"
      slideFrom="right"
    >
      <div className="space-y-8">
        {/* Status Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${branch.is_active ? 'from-emerald-500 to-emerald-600' : 'from-gray-400 to-gray-500'}`}>
              {branch.is_active ? (
                <FiCheckCircle className="h-5 w-5 text-white" />
              ) : (
                <FiXCircle className="h-5 w-5 text-white" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("branches.status") || "Status"}
            </h3>
          </div>

          <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} justify-start gap-2`}>
            {branch.is_active ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                <FiCheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t("branches.active") || "Active"}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                <FiXCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t("branches.inactive") || "Inactive"}
              </span>
            )}
          </div>
        </section>

        {/* Branch Information Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FiMapPin className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("branches.branchInformation") || "Branch Information"}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <label className={`block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ${isRTL ? 'text-right' : ''}`}>
                {t("branches.branchName") || "Branch Name"}
              </label>
              <p className={`text-base font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : ''}`}>
                {branch.name}
              </p>
            </div>

            {branch.address && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className={`block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-1 ${isRTL ? 'text-right' : ''}`}>
                  <FiMapPin className="w-3 h-3" />
                  {t("branches.address") || "Address"}
                </label>
                <p className={`text-base text-gray-900 dark:text-white ${isRTL ? 'text-right' : ''}`}>
                  {branch.address}
                </p>
              </div>
            )}

            {branch.phone && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className={`block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-1 ${isRTL ? 'text-right' : ''}`}>
                  <FiPhone className="w-3 h-3" />
                  {t("branches.phone") || "Phone"}
                </label>
                <p className={`text-base text-gray-900 dark:text-white ${isRTL ? 'text-right' : ''}`}>
                  {branch.phone}
                </p>
              </div>
            )}

            {branch.email && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className={`block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-1 ${isRTL ? 'text-right' : ''}`}>
                  <FiMail className="w-3 h-3" />
                  {t("branches.email") || "Email"}
                </label>
                <p className={`text-base text-gray-900 dark:text-white ${isRTL ? 'text-right' : ''}`}>
                  {branch.email}
                </p>
              </div>
            )}

            {branch.manager_name && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className={`block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-1 ${isRTL ? 'text-right' : ''}`}>
                  <FiUser className="w-3 h-3" />
                  {t("branches.managerName") || "Manager Name"}
                </label>
                <p className={`text-base text-gray-900 dark:text-white ${isRTL ? 'text-right' : ''}`}>
                  {branch.manager_name}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Business Hours Section */}
        {branch.business_hours && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600">
                <FiClock className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("branches.businessHours") || "Business Hours"}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const dayHours = branch.business_hours?.[day as keyof BusinessHours];
                return (
                  <div
                    key={day}
                    className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700`}
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize w-24">
                      {t(`branches.days.${day}`) || day}
                    </span>
                    {dayHours?.is_open ? (
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {dayHours.open_time} - {dayHours.close_time}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                        {t("branches.closed") || "Closed"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Booking Policies Section */}
        {branch.booking_policies && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                <FiCalendar className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("branches.bookingPolicies") || "Booking Policies"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("branches.minBookingHours") || "Minimum booking notice"}
                </label>
                <p className="text-base text-gray-900 dark:text-white">
                  {branch.booking_policies.min_booking_hours} {t("branches.hours") || "hours"}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("branches.maxAdvanceBookingDays") || "Max advance booking"}
                </label>
                <p className="text-base text-gray-900 dark:text-white">
                  {branch.booking_policies.max_advance_booking_days} {t("branches.daysLabel") || "days"}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("branches.cancellationHours") || "Cancellation window"}
                </label>
                <p className="text-base text-gray-900 dark:text-white">
                  {branch.booking_policies.cancellation_hours} {t("branches.hours") || "hours"}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("branches.maxBookingsPerDay") || "Max bookings per day"}
                </label>
                <p className="text-base text-gray-900 dark:text-white">
                  {branch.booking_policies.max_bookings_per_day}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("branches.waitlist") || "Waitlist"}
                </label>
                <p className="text-base text-gray-900 dark:text-white">
                  {branch.booking_policies.enable_waitlist ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {t("branches.enabled") || "Enabled"} 
                      {branch.booking_policies.max_waitlist_size > 0 && 
                        ` (max ${branch.booking_policies.max_waitlist_size})`}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">
                      {t("branches.disabled") || "Disabled"}
                    </span>
                  )}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t("branches.sameDayBooking") || "Same-day booking"}
                </label>
                <p className="text-base text-gray-900 dark:text-white">
                  {branch.booking_policies.allow_same_day_booking ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {t("branches.allowed") || "Allowed"}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">
                      {t("branches.notAllowed") || "Not Allowed"}
                    </span>
                  )}
                </p>
              </div>

              {branch.booking_policies.require_payment_on_booking && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t("branches.paymentRequired") || "Payment"}
                  </label>
                  <p className="text-base text-amber-600 dark:text-amber-400">
                    {t("branches.requiredOnBooking") || "Required on booking"}
                  </p>
                </div>
              )}

              {branch.booking_policies.no_show_penalty_days > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t("branches.noShowPenalty") || "No-show penalty"}
                  </label>
                  <p className="text-base text-red-600 dark:text-red-400">
                    {branch.booking_policies.no_show_penalty_days} {t("branches.daysRestriction") || "days restriction"}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </UnifiedModal>
  );
}
