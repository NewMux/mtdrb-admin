import * as React from "react";
import {
  FiMapPin,
  FiClock,
  FiCalendar,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { SmartButton } from "../../ui/DesignSystem";
import { AppleInput } from "../../AppleStyleModal";
import { api } from "../../../api/client";
import { supabase } from "../../../supabaseClient";
import { Branch, BusinessHours, BookingPolicies, DayBusinessHours } from "../../../types";

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const defaultDayHours: DayBusinessHours = {
  is_open: true,
  open_time: "06:00",
  close_time: "22:00",
};

const defaultClosedDay: DayBusinessHours = {
  is_open: false,
  open_time: undefined,
  close_time: undefined,
};

const defaultBusinessHours: BusinessHours = {
  sunday: { ...defaultDayHours },
  monday: { ...defaultDayHours },
  tuesday: { ...defaultDayHours },
  wednesday: { ...defaultDayHours },
  thursday: { ...defaultDayHours },
  friday: { ...defaultClosedDay }, // Friday often closed in Middle East
  saturday: { ...defaultDayHours },
};

const defaultBookingPolicies: BookingPolicies = {
  min_booking_hours: 1,
  max_advance_booking_days: 14,
  cancellation_hours: 4,
  enable_waitlist: true,
  max_waitlist_size: 5,
  auto_promote_waitlist: true,
  allow_same_day_booking: true,
  require_payment_on_booking: false,
  max_bookings_per_day: 3,
  no_show_penalty_days: 0,
};

interface BranchFormData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  is_active: boolean;
  business_hours: BusinessHours;
  booking_policies: BookingPolicies;
}

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export default function AddBranchModal({
  isOpen,
  onClose,
  onSuccess,
}: AddBranchModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [activeSection, setActiveSection] = React.useState<'info' | 'hours' | 'policies'>('info');
  const [formData, setFormData] = React.useState<BranchFormData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    manager_name: "",
    is_active: true,
    business_hours: { ...defaultBusinessHours },
    booking_policies: { ...defaultBookingPolicies },
  });
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<keyof BranchFormData, string>>>({});

  const handleInputChange = (
    field: keyof BranchFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBusinessHoursChange = (
    day: keyof BusinessHours,
    field: keyof DayBusinessHours,
    value: boolean | string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleBookingPolicyChange = (
    field: keyof BookingPolicies,
    value: number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      booking_policies: {
        ...prev.booking_policies,
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BranchFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("branches.errors.nameRequired") || "Branch name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error(t("branches.errors.fillRequiredFields") || "Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Get current user and tenant_id
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (membershipData) {
          tenantId = membershipData.tenant_id;
        }
      }

      if (!tenantId) throw new Error("No tenant ID found");

      const branchData: Omit<Branch, "id" | "created_at" | "updated_at"> = {
        tenant_id: tenantId,
        name: formData.name.trim(),
        address: formData.address?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        manager_name: formData.manager_name?.trim() || undefined,
        is_active: formData.is_active,
        business_hours: formData.business_hours,
        booking_policies: formData.booking_policies,
      };

      const { error } = await api.branches.create(branchData);

      if (error) throw error;

      toast.success(t("branches.branchAddedSuccessfully") || "Branch added successfully!");
      setLoading(false);
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error adding branch:", error);
      toast.error(
        error.message || t("branches.errors.failedToAddBranch") || "Failed to add branch"
      );
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      manager_name: "",
      is_active: true,
      business_hours: { ...defaultBusinessHours },
      booking_policies: { ...defaultBookingPolicies },
    });
    setActiveSection('info');
    setErrors({});
  };

  const handleInputChangeEvent = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    handleInputChange(
      name as keyof BranchFormData,
      type === "checkbox" ? checked : value
    );
  };

  const footer = (
    <>
      <SmartButton variant="secondary" onClick={handleClose} disabled={loading}>
        {t("common.cancel") || "Cancel"}
      </SmartButton>
      <SmartButton
        variant="primary"
        onClick={handleSubmit}
        loading={loading}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {loading ? (t("branches.adding") || "Adding...") : (t("branches.addBranch") || "Add Branch")}
      </SmartButton>
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("branches.addBranch") || "Add New Branch"}
      subtitle={t("branches.addBranchDesc") || "Create a new branch location with all necessary information"}
      footer={footer}
      maxWidth="4xl"
      slideFrom="right"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        {/* Section Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveSection('info')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'info'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FiMapPin className="w-4 h-4" />
            {t("branches.branchInfo") || "Branch Info"}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('hours')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'hours'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FiClock className="w-4 h-4" />
            {t("branches.businessHours") || "Business Hours"}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('policies')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'policies'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FiCalendar className="w-4 h-4" />
            {t("branches.bookingPolicies") || "Booking Policies"}
          </button>
        </div>

        {/* Branch Information Section */}
        {activeSection === 'info' && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                <FiMapPin className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                {t("branches.branchInformation") || "Branch Information"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <AppleInput
                  label={t("branches.branchName") || "Branch Name"}
                  name="name"
                  value={formData.name}
                  onChange={handleInputChangeEvent}
                  required
                  aria-label={t("branches.branchName") || "Branch Name"}
                  error={errors.name}
                  placeholder={t("branches.branchNamePlaceholder") || "Main Branch"}
                />
              </div>

              <div className="md:col-span-2">
                <AppleInput
                  label={t("branches.address") || "Address"}
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChangeEvent}
                  aria-label={t("branches.address") || "Address"}
                  placeholder={t("branches.addressPlaceholder") || "123 Main Street, City, Country"}
                />
              </div>

              <AppleInput
                label={t("branches.phone") || "Phone"}
                name="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={handleInputChangeEvent}
                aria-label={t("branches.phone") || "Phone"}
                placeholder={t("branches.phonePlaceholder") || "+966 50 123 4567"}
              />

              <AppleInput
                label={t("branches.email") || "Email"}
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleInputChangeEvent}
                aria-label={t("branches.email") || "Email"}
                placeholder={t("branches.emailPlaceholder") || "branch@example.com"}
              />

              <AppleInput
                label={t("branches.managerName") || "Manager Name"}
                name="manager_name"
                value={formData.manager_name || ""}
                onChange={handleInputChangeEvent}
                aria-label={t("branches.managerName") || "Manager Name"}
                placeholder={t("branches.managerNamePlaceholder") || "John Doe"}
              />

              <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3 pt-8`}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange("is_active", e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("branches.isActive") || "Active"}
                </label>
              </div>
            </div>
          </section>
        )}

        {/* Business Hours Section */}
        {activeSection === 'hours' && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600">
                <FiClock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  {t("branches.businessHours") || "Business Hours"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t("branches.businessHoursDesc") || "Set operating hours for each day of the week"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600`}
                >
                  <div className="w-28 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {t(`branches.days.${day}`) || day}
                    </span>
                  </div>

                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
                    <input
                      type="checkbox"
                      id={`${day}-open`}
                      checked={formData.business_hours[day].is_open}
                      onChange={(e) => handleBusinessHoursChange(day, 'is_open', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`${day}-open`} className="text-sm text-gray-600 dark:text-gray-400 min-w-[50px]">
                      {formData.business_hours[day].is_open 
                        ? (t("branches.open") || "Open") 
                        : (t("branches.closed") || "Closed")}
                    </label>
                  </div>

                  {formData.business_hours[day].is_open && (
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-2 flex-1`}>
                      <input
                        type="time"
                        value={formData.business_hours[day].open_time || "06:00"}
                        onChange={(e) => handleBusinessHoursChange(day, 'open_time', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                      <input
                        type="time"
                        value={formData.business_hours[day].close_time || "22:00"}
                        onChange={(e) => handleBusinessHoursChange(day, 'close_time', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Booking Policies Section */}
        {activeSection === 'policies' && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                <FiCalendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  {t("branches.bookingPolicies") || "Booking Policies"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t("branches.bookingPoliciesDesc") || "Configure booking rules and cancellation policies"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Booking Time Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t("branches.minBookingHours") || "Minimum booking notice (hours)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="72"
                    value={formData.booking_policies.min_booking_hours}
                    onChange={(e) => handleBookingPolicyChange('min_booking_hours', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("branches.minBookingHoursDesc") || "How far in advance must bookings be made"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t("branches.maxAdvanceBookingDays") || "Max advance booking (days)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.booking_policies.max_advance_booking_days}
                    onChange={(e) => handleBookingPolicyChange('max_advance_booking_days', parseInt(e.target.value) || 14)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("branches.maxAdvanceBookingDaysDesc") || "Maximum days in advance for bookings"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t("branches.cancellationHours") || "Cancellation window (hours)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="72"
                    value={formData.booking_policies.cancellation_hours}
                    onChange={(e) => handleBookingPolicyChange('cancellation_hours', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("branches.cancellationHoursDesc") || "Hours before class for free cancellation"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t("branches.maxBookingsPerDay") || "Max bookings per member per day"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.booking_policies.max_bookings_per_day}
                    onChange={(e) => handleBookingPolicyChange('max_bookings_per_day', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Waitlist Settings */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("branches.waitlistSettings") || "Waitlist Settings"}
                </h4>
                
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("branches.enableWaitlist") || "Enable waitlist"}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("branches.enableWaitlistDesc") || "Allow members to join waitlist when class is full"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBookingPolicyChange('enable_waitlist', !formData.booking_policies.enable_waitlist)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      formData.booking_policies.enable_waitlist ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                    } flex items-center ${formData.booking_policies.enable_waitlist ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")} px-1`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>

                {formData.booking_policies.enable_waitlist && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("branches.maxWaitlistSize") || "Max waitlist size"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={formData.booking_policies.max_waitlist_size}
                          onChange={(e) => handleBookingPolicyChange('max_waitlist_size', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t("branches.maxWaitlistSizeDesc") || "0 = unlimited"}
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between pt-2`}>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t("branches.autoPromoteWaitlist") || "Auto-promote waitlist"}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t("branches.autoPromoteWaitlistDesc") || "Automatically move first waitlisted member when spot opens"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBookingPolicyChange('auto_promote_waitlist', !formData.booking_policies.auto_promote_waitlist)}
                        className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                          formData.booking_policies.auto_promote_waitlist ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                        } flex items-center ${formData.booking_policies.auto_promote_waitlist ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")} px-1`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Additional Policies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600`}>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("branches.allowSameDayBooking") || "Allow same-day booking"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBookingPolicyChange('allow_same_day_booking', !formData.booking_policies.allow_same_day_booking)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      formData.booking_policies.allow_same_day_booking ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                    } flex items-center ${formData.booking_policies.allow_same_day_booking ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")} px-1`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>

                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600`}>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("branches.requirePaymentOnBooking") || "Require payment on booking"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBookingPolicyChange('require_payment_on_booking', !formData.booking_policies.require_payment_on_booking)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      formData.booking_policies.require_payment_on_booking ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                    } flex items-center ${formData.booking_policies.require_payment_on_booking ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")} px-1`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>

              {/* No-show Penalty */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t("branches.noShowPenaltyDays") || "No-show penalty (days)"}
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.booking_policies.no_show_penalty_days}
                  onChange={(e) => handleBookingPolicyChange('no_show_penalty_days', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-xs"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("branches.noShowPenaltyDaysDesc") || "Days to restrict bookings after a no-show (0 = no penalty)"}
                </p>
              </div>
            </div>
          </section>
        )}
      </form>
    </UnifiedModal>
  );
}
