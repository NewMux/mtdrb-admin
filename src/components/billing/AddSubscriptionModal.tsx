import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import {
  AppleInput,
  AppleSelect,
  AppleTextarea,
  AppleToggle,
} from "../AppleStyleModal";
import { PaymentMethodType } from "../../types";
import { FiAlertCircle } from "react-icons/fi";
import { SmartModal } from "../ui/SmartModal";
import { SmartButton } from "../ui/DesignSystem";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

// Add subscription related types
type subscription_status =
  | "Active"
  | "Paused"
  | "Cancelled"
  | "Expired"
  | "Draft";
type billing_cycle = "monthly" | "quarterly" | "semi-annual" | "annual";
type subscription_plan_type = "Membership" | "PT" | "Class Pack" | "Online";

interface Subscription {
  id: string;
  member_id: string;
  plan_id: string | null;
  plan_name: string;
  plan_type: subscription_plan_type;
  status: subscription_status;
  start_date: string;
  end_date: string | null;
  next_billing_date: string | null;
  billing_cycle: billing_cycle;
  amount: number;
  currency: string;
  auto_renew: boolean;
  payment_method: PaymentMethodType | null;
  vat_percentage: number;
  name?: string;
  price?: number;
  duration_months?: number;
  description?: string;
  auto_renewal?: boolean;
  trial_enabled?: boolean;
  trial_days?: number;
}

type SubscriptionFormData = {
  member_id: string;
  plan_id: string | null;
  plan_name: string;
  plan_type: subscription_plan_type;
  status: subscription_status;
  start_date: string;
  end_date: string | null;
  next_billing_date: string | null;
  billing_cycle: billing_cycle;
  amount: number;
  currency: string;
  auto_renew: boolean;
  payment_method: PaymentMethodType | null;
  vat_percentage: number;
  name: string;
  price: number;
  duration_months: number;
  description: string;
  auto_renewal: boolean;
  trial_enabled: boolean;
  trial_days: number;
};

type SubscriptionFeature = {
  name: string;
  included: boolean;
  limit: string;
};

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  tenantId: string;
  subscription?: Subscription | null;
}

export function AddSubscriptionModal({
  isOpen,
  onClose,
  onSave,
  tenantId,
  subscription,
}: AddSubscriptionModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubscriptionFormData>({
    member_id: "",
    plan_id: null as string | null,
    plan_name: "",
    plan_type: "Membership" as subscription_plan_type,
    status: "Draft" as subscription_status,
    start_date: "",
    end_date: null as string | null,
    next_billing_date: null as string | null,
    billing_cycle: "monthly" as billing_cycle,
    amount: 0,
    currency: "BHD",
    auto_renew: true,
    payment_method: null as PaymentMethodType | null,
    vat_percentage: 0,
    name: "",
    price: 0,
    duration_months: 1,
    description: "",
    auto_renewal: true,
    trial_enabled: false,
    trial_days: 0,
  });

  const [features, setFeatures] = useState<SubscriptionFeature[]>([
    { name: "Gym Access", included: true, limit: "Unlimited" },
    { name: "Group Classes", included: true, limit: "Unlimited" },
    { name: "Personal Training", included: false, limit: "0" },
    { name: "Online Classes", included: false, limit: "0" },
  ]);

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
    }
    if (subscription) {
      setFormData({
        member_id: subscription.member_id,
        plan_id: subscription.plan_id,
        plan_name: subscription.plan_name,
        plan_type: subscription.plan_type,
        status: subscription.status,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        next_billing_date: subscription.next_billing_date,
        billing_cycle: subscription.billing_cycle,
        amount: subscription.amount,
        currency: subscription.currency,
        auto_renew: subscription.auto_renew,
        payment_method: subscription.payment_method,
        vat_percentage: subscription.vat_percentage,
        name: subscription.name || "",
        price: subscription.price || 0,
        duration_months: subscription.duration_months || 1,
        description: subscription.description || "",
        auto_renewal: subscription.auto_renewal ?? subscription.auto_renew,
        trial_enabled: subscription.trial_enabled || false,
        trial_days: subscription.trial_days || 0,
      });
    } else {
      setFormData({
        member_id: "",
        plan_id: null,
        plan_name: "",
        plan_type: "Membership",
        status: "Draft",
        start_date: "",
        end_date: null,
        next_billing_date: null,
        billing_cycle: "monthly",
        amount: 0,
        currency: "BHD",
        auto_renew: true,
        payment_method: null,
        vat_percentage: 0,
        name: "",
        price: 0,
        duration_months: 1,
        description: "",
        auto_renewal: true,
        trial_enabled: false,
        trial_days: 0,
      });
    }
  }, [subscription, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.member_id || !formData.plan_id || !formData.start_date) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      if (
        formData.end_date &&
        new Date(formData.end_date) <= new Date(formData.start_date)
      ) {
        throw new Error("End date must be after start date");
      }

      // Check for existing active subscriptions
      const { data: existingSubscriptions, error: checkError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("member_id", formData.member_id)
        .eq("status", "active")
        .neq("id", subscription?.id || "");

      if (checkError) throw checkError;

      if (existingSubscriptions && existingSubscriptions.length > 0) {
        throw new Error("Member already has an active subscription");
      }

      // Proceed with save/update
      if (subscription) {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            member_id: formData.member_id,
            plan_id: formData.plan_id,
            status: formData.status,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            billing_cycle: formData.billing_cycle,
            amount: formData.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);

        if (error) throw error;
        toast.success("Subscription updated successfully");
      } else {
        const { error } = await supabase.from("subscriptions").insert([
          {
            tenant_id: tenantId,
            member_id: formData.member_id,
            plan_id: formData.plan_id,
            status: formData.status,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            billing_cycle: formData.billing_cycle,
            amount: formData.amount,
          },
        ]);

        if (error) throw error;
        toast.success("Subscription created successfully");
      }

      onSave();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save subscription";
      console.error("Error saving subscription:", error);
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Add form validation
  const handleChange = <K extends keyof SubscriptionFormData>(
    field: K,
    value: SubscriptionFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFeatureChange = <K extends "included" | "limit">(
    index: number,
    field: K,
    value: SubscriptionFeature[K],
  ) => {
    setFeatures((prev) =>
      prev.map((feature, i) =>
        i === index ? { ...feature, [field]: value } : feature,
      ),
    );
  };

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title={subscription ? t("billing.editSubscription", "تعديل اشتراك العضوية") : t("billing.addNewSubscription", "إضافة اشتراك عضوية جديد")}
      subtitle={t("billing.subscriptionSubtitle", "تخصيص تفاصيل الاشتراك، الدورة المالية، والخدمات المشمولة")}
      size="lg"
      footer={
        <div className="flex justify-end gap-3 w-full" dir={isRTL ? "rtl" : "ltr"}>
          <SmartButton variant="secondary" onClick={onClose} disabled={loading}>
            {t("common.cancel", "إلغاء")}
          </SmartButton>
          <SmartButton
            variant="primary"
            onClick={(e) => {
              e?.preventDefault();
              handleSubmit();
            }}
            loading={loading}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {t("billing.saveSubscription", "حفظ الاشتراك")}
          </SmartButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-start" dir={isRTL ? "rtl" : "ltr"}>
        {/* Subscription Details */}
        <div className="space-y-4 text-start">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("billing.subscriptionDetails", "تفاصيل الخطة والاشتراك")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label={t("billing.planName", "اسم خطة الاشتراك")}
              name="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("name", e.target.value)}
              placeholder={t("billing.planNamePlaceholder", "مثال: الباقة الذهبية الشاملة")}
              required
            />
            <AppleInput
              label={t("billing.priceBhd", "السعر (د.ب)")}
              name="price"
              type="number"
              value={formData.price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("price", Number(e.target.value))}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleSelect
              label={t("billing.billingCycle", "دورة الفوترة")}
              name="billing_cycle"
              value={formData.billing_cycle}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleChange("billing_cycle", e.target.value as billing_cycle)
              }
              required
            >
              <option value="">{t("billing.selectBillingCycle", "اختر دورة الفوترة")}</option>
              <option value="monthly">{t("billing.monthly", "شهرياً")}</option>
              <option value="quarterly">{t("billing.quarterly", "ربع سنوي")}</option>
              <option value="semi-annual">{t("billing.semiAnnual", "نصف سنوي")}</option>
              <option value="annual">{t("billing.yearly", "سنوياً")}</option>
            </AppleSelect>
            <AppleInput
              label={t("billing.durationMonths", "مدة الاشتراك (بالأشهر)")}
              name="duration_months"
              type="number"
              value={formData.duration_months}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("duration_months", Number(e.target.value))}
              required
            />
          </div>

          <AppleTextarea
            label={t("billing.description", "وصف الخطة والاشتراك")}
            name="description"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)}
            placeholder={t("billing.subscriptionDescPlaceholder", "تفاصيل الشروط والخدمات المتاحة لهذا الاشتراك...")}
            rows={3}
          />
        </div>

        {/* Features */}
        <div className="space-y-4 text-start">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("billing.featuresTitle", "المميزات والخدمات المشمولة")}
          </h3>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={feature.included}
                    onChange={(e) =>
                      handleFeatureChange(index, "included", e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {feature.name === "Gym Access" ? "دخول الصالة الرياضية" : feature.name === "Group Classes" ? "الحصص الجماعية" : feature.name === "Personal Training" ? "التدريب الشخصي الفردي" : "الحصص والتدريب أونلاين"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={feature.limit || ""}
                    onChange={(e) =>
                      handleFeatureChange(index, "limit", e.target.value)
                    }
                    placeholder={t("billing.unlimited", "غير محدود")}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t("billing.perMonth", "شهرياً")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4 text-start">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("billing.settingsAndAutomation", "الإعدادات والتجديد التلقائي")}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("billing.autoRenewal", "التجديد التلقائي للاشتراك")}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("billing.autoRenewalDesc", "تجديد الاشتراك تلقائياً بنهاية الصلاحية")}
                </p>
              </div>
              <AppleToggle
                label=""
                checked={formData.auto_renewal}
                onChange={(checked) => handleChange("auto_renewal", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("billing.trialPeriod", "فترة تجريبية مجانية")}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("billing.trialPeriodDesc", "السماح بفترة تجربة مجانية قبل بدء الفوترة")}
                </p>
              </div>
              <AppleToggle
                label=""
                checked={formData.trial_enabled}
                onChange={(checked) => handleChange("trial_enabled", checked)}
              />
            </div>
          </div>

          {formData.trial_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
              <AppleInput
                label={t("billing.trialDurationDays", "مدة التجربة المجانية (بالأيام)")}
                name="trial_days"
                type="number"
                value={formData.trial_days}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("trial_days", Number(e.target.value))}
              />
            </div>
          )}
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-start">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
            </div>
          </div>
        )}
      </form>
    </SmartModal>
  );
}

export default AddSubscriptionModal;
