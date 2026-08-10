import * as React from "react";
import {
  FiUser,
  FiTarget,
  FiHeart,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { SmartButton } from "../../ui/DesignSystem";
import { AppleInput, AppleSelect, AppleTextarea } from "../../AppleStyleModal";
import { Member } from "../../../types/member";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (memberData: Omit<Member, "id">) => Promise<void>;
  loading?: boolean;
  modalRef?: React.RefObject<HTMLDivElement>;
}

type GenderOption = "male" | "female" | "other";
type FitnessLevelOption = "beginner" | "intermediate" | "advanced";

interface AddMemberFormData {
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "suspended" | "expired" | "trial";
  membershipType: string;
  gender: GenderOption;
  address: string;
  emergency_contact: string;
  trainer_id: string;
  fitness_level: FitnessLevelOption;
  health_conditions: string[];
  goals: string[];
  notes: string;
  date_of_birth: string;
  national_id: string;
  language: "English" | "Arabic";
  membership_status: "active" | "cancelled" | "trial" | "paused";
  membership_price: number;
  start_date: string;
  end_date: string;
  assigned_trainer_id: string;
  add_ons: string[];
  tags: string[];
  staff_notes: string;
  medical_notes: string;
  weight: number | null;
  target_weight: number | null;
  height: number | null;
  consent_signed: boolean;
  previous_gym_experience: boolean;
  primary_goals: string[];
  workout_frequency_goal: number;
  preferred_workout_times: string[];
  medical_conditions: string[];
  injuries: string[];
  goal_timeline: "1_month" | "3_months" | "6_months" | "12_months";
  access_level: "Basic" | "Standard" | "Premium";
  membership_duration: "1_month" | "3_months" | "6_months" | "12_months";
  billing_cycle: "monthly" | "quarterly" | "semi-annual" | "annual";
  discount_percentage: number;
  discount_amount?: number;
  auto_renewal: boolean;
  payment_method_preference?:
    | "cash"
    | "card"
    | "bank_transfer"
    | "cheque"
    | "digital_wallet";
  access_hours: "Standard" | "Extended" | "24/7";
  facility_access: string[];
  fitness_tracker_integration: boolean;
  body_composition_tracking: boolean;
  progress_photos_consent: boolean;
  referral_code: string;
  corporate_membership: boolean;
  family_plan: boolean;
  preferred_contact_method: "app" | "email" | "sms";
  workout_reminders: boolean;
  progress_tracking_consent: boolean;
  marketing_consent: boolean;
  auto_schedule_intro: boolean;
  buddy_system_interest: boolean;
  send_welcome_sequence: boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  loading = false,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [formData, setFormData] = React.useState<AddMemberFormData>({
    name: "",
    email: "",
    phone: "",
    status: "active" as const,
    membershipType: "Standard",
    gender: "other",
    address: "",
    emergency_contact: "",
    trainer_id: "",
    fitness_level: "beginner",
    health_conditions: [] as string[],
    goals: [] as string[],
    notes: "",
    // Additional fields
    date_of_birth: "",
    national_id: "",
    language: "English",
    membership_status: "active",
    membership_price: 0,
    start_date: "",
    end_date: "",
    assigned_trainer_id: "",
    add_ons: [] as string[],
    tags: [] as string[],
    staff_notes: "",
    medical_notes: "",
    consent_signed: false,
    // Health & Fitness
    height: null,
    weight: null,
    target_weight: null,
    medical_conditions: [] as string[],
    injuries: [] as string[],
    previous_gym_experience: false,
    // Goals & Preferences
    primary_goals: [] as string[],
    goal_timeline: "3_months" as const,
    workout_frequency_goal: 3,
    preferred_workout_times: [] as string[],
    // Membership Setup
    access_level: "Basic" as const,
    membership_duration: "1_month" as const,
    billing_cycle: "monthly" as const,
    discount_percentage: 0,
    discount_amount: 0,
    auto_renewal: false,
    payment_method_preference:
      undefined as AddMemberFormData["payment_method_preference"],
    // Access & Features
    access_hours: "Standard",
    facility_access: ["Gym Floor"] as string[],
    fitness_tracker_integration: false,
    body_composition_tracking: false,
    progress_photos_consent: false,
    referral_code: "",
    corporate_membership: false,
    family_plan: false,
    // Communication
    preferred_contact_method: "app" as const,
    workout_reminders: true,
    progress_tracking_consent: true,
    marketing_consent: false,
    auto_schedule_intro: true,
    buddy_system_interest: false,
    send_welcome_sequence: true,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const goalOptions = [
    { value: "weight_loss", label: "Weight Loss" },
    { value: "muscle_gain", label: "Muscle Gain" },
    { value: "strength", label: "Strength Training" },
    { value: "endurance", label: "Endurance" },
    { value: "flexibility", label: "Flexibility" },
    { value: "general_fitness", label: "General Fitness" },
  ];

  const healthConditionOptions = [
    { value: "asthma", label: "Asthma" },
    { value: "heart_condition", label: "Heart Condition" },
    { value: "back_pain", label: "Back Pain" },
    { value: "knee_injury", label: "Knee Injury" },
    { value: "diabetes", label: "Diabetes" },
    { value: "hypertension", label: "Hypertension" },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.membershipType) {
      newErrors.membershipType = "Membership type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    try {
      const normalizedGender: Member["gender"] =
        formData.gender === "male"
          ? "Male"
          : formData.gender === "female"
            ? "Female"
            : "Other";
      const normalizedFitness: Member["fitness_level"] =
        formData.fitness_level === "beginner"
          ? "Beginner"
          : formData.fitness_level === "intermediate"
            ? "Intermediate"
            : "Advanced";

      const payload: Omit<Member, "id"> = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        status: formData.status,
        membership_type: formData.membershipType,
        gender: normalizedGender,
        emergency_contact: formData.emergency_contact || null,
        assigned_trainer_id:
          formData.assigned_trainer_id || formData.trainer_id || null,
        fitness_level: normalizedFitness,
        medical_conditions: [
          ...formData.health_conditions,
          ...formData.medical_conditions,
        ],
        injuries: formData.injuries,
        primary_goals: formData.goals,
        notes: formData.notes,
        date_of_birth: formData.date_of_birth || null,
        national_id: formData.national_id || null,
        language: formData.language,
        membership_status: formData.membership_status,
        membership_price: formData.membership_price,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        add_ons: formData.add_ons,
        tags: formData.tags,
        staff_notes: formData.staff_notes,
        medical_notes: formData.medical_notes,
        weight: formData.weight,
        target_weight: formData.target_weight,
        height: formData.height,
        consent_signed: formData.consent_signed,
        previous_gym_experience: formData.previous_gym_experience,
        workout_frequency_goal: formData.workout_frequency_goal,
        preferred_workout_times: formData.preferred_workout_times,
      };

      await onSuccess(payload);
      resetForm();
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      status: "active",
      membershipType: "Standard",
      gender: "other",
      address: "",
      emergency_contact: "",
      trainer_id: "",
      fitness_level: "beginner",
      health_conditions: [],
      goals: [],
      notes: "",
      // Additional fields
      date_of_birth: "",
      national_id: "",
      language: "English",
      membership_status: "active",
      membership_price: 0,
      start_date: "",
      end_date: "",
      assigned_trainer_id: "",
      add_ons: [],
      tags: [],
      staff_notes: "",
      medical_notes: "",
      consent_signed: false,
      // Health & Fitness
      height: null,
      weight: null,
      target_weight: null,
      medical_conditions: [],
      injuries: [],
      previous_gym_experience: false,
      // Goals & Preferences
      primary_goals: [],
      goal_timeline: "3_months",
      workout_frequency_goal: 3,
      preferred_workout_times: [],
      // Membership Setup
      access_level: "Basic",
      membership_duration: "1_month",
      billing_cycle: "monthly",
      discount_percentage: 0,
      discount_amount: 0,
      auto_renewal: false,
      payment_method_preference: undefined,
      // Access & Features
      access_hours: "Standard",
      facility_access: ["Gym Floor"],
      fitness_tracker_integration: false,
      body_composition_tracking: false,
      progress_photos_consent: false,
      referral_code: "",
      corporate_membership: false,
      family_plan: false,
      // Communication
      preferred_contact_method: "app",
      workout_reminders: true,
      progress_tracking_consent: true,
      marketing_consent: false,
      auto_schedule_intro: true,
      buddy_system_interest: false,
      send_welcome_sequence: true,
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleInputChangeDirect = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleArrayChange = (
    field: string,
    value: string,
    checked: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...(prev[field as keyof typeof prev] as string[]), value]
        : (prev[field as keyof typeof prev] as string[]).filter(
            (item) => item !== value,
          ),
    }));
  };

  const footer = (
    <>
      <SmartButton variant="secondary" onClick={handleClose} disabled={loading}>
        {t("members.cancel")}
      </SmartButton>
      <SmartButton
        variant="primary"
        onClick={handleSubmit}
        loading={loading}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {loading ? t("members.addingMember") : t("members.addMember")}
      </SmartButton>
    </>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("members.addNewMember")}
      subtitle={t("members.createComprehensiveProfile")}
      footer={footer}
      maxWidth="4xl"
      slideFrom="right"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FiUser className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("members.basicInformation")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label={t("members.fullName")}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              aria-label={t("members.fullName")}
              error={errors.name}
              placeholder={t("members.enterFullName")}
            />
            <AppleInput
              label={t("members.email")}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              aria-label={t("members.emailAddress")}
              error={errors.email}
              placeholder={t("members.emailPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label={t("members.phoneNumber")}
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              required
              aria-label={t("members.phoneNumber")}
              error={errors.phone}
              placeholder={t("members.phonePlaceholder")}
            />
            <AppleSelect
              label={t("members.gender")}
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              required
              aria-label={t("members.gender")}
            >
              <option value="male">{t("members.male")}</option>
              <option value="female">{t("members.female")}</option>
              <option value="other">{t("members.other")}</option>
            </AppleSelect>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label={t("members.dateOfBirth")}
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              aria-label={t("members.dateOfBirth")}
            />
            <AppleInput
              label={t("members.nationalId")}
              name="national_id"
              value={formData.national_id}
              onChange={handleInputChange}
              aria-label={t("members.nationalId")}
              placeholder={t("members.enterNationalId")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label={t("members.emergencyContact")}
              name="emergency_contact"
              type="tel"
              value={formData.emergency_contact}
              onChange={handleInputChange}
              aria-label={t("members.emergencyContact")}
              placeholder={t("members.emergencyContactNumber")}
            />
            <AppleSelect
              label={t("members.preferredLanguage")}
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              required
              aria-label={t("members.preferredLanguage")}
            >
              <option value="English">{t("members.english")}</option>
              <option value="Arabic">{t("members.arabic")}</option>
            </AppleSelect>
          </div>

          <AppleInput
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            aria-label="Address"
            placeholder="Enter full address"
          />
        </section>
        {/* Health & Fitness Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600">
              <FiHeart className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("members.healthFitness")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label={t("members.currentWeight")}
              name="weight"
              type="number"
              value={formData.weight || ""}
              onChange={(e) =>
                handleInputChangeDirect(
                  "weight",
                  e.target.value ? parseFloat(e.target.value) : null,
                )
              }
              aria-label={t("members.currentWeight")}
              placeholder={t("members.enterCurrentWeight")}
              step="0.1"
            />
            <AppleInput
              label={t("members.targetWeight")}
              name="target_weight"
              type="number"
              value={formData.target_weight || ""}
              onChange={(e) =>
                handleInputChangeDirect(
                  "target_weight",
                  e.target.value ? parseFloat(e.target.value) : null,
                )
              }
              aria-label={t("members.targetWeight")}
              placeholder={t("members.enterTargetWeight")}
              step="0.1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label={t("members.height")}
              name="height"
              type="number"
              value={formData.height || ""}
              onChange={(e) =>
                handleInputChangeDirect(
                  "height",
                  e.target.value ? parseFloat(e.target.value) : null,
                )
              }
              aria-label={t("members.height")}
              placeholder={t("members.enterHeight")}
            />
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3 pt-8`}>
              <input
                type="checkbox"
                id="previous_gym_experience"
                checked={formData.previous_gym_experience}
                onChange={(e) =>
                  handleInputChangeDirect(
                    "previous_gym_experience",
                    e.target.checked,
                  )
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="previous_gym_experience"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("members.previousGymExperience")}
              </label>
            </div>
          </div>
        </section>

        {/* Goals & Preferences Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600">
              <FiTarget className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("members.goalsPreferences")}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {goalOptions.map((goal) => (
              <label
                key={goal.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.goals.includes(goal.value)}
                  onChange={(e) =>
                    handleArrayChange("goals", goal.value, e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{goal.label}</span>
              </label>
            ))}
          </div>
        </section>
        {/* Health Conditions Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600">
              <FiHeart className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("members.healthConditions")}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {healthConditionOptions.map((condition) => (
              <label
                key={condition.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.health_conditions.includes(condition.value)}
                  onChange={(e) =>
                    handleArrayChange(
                      "health_conditions",
                      condition.value,
                      e.target.checked,
                    )
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{condition.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Medical Information Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
              <FiAlertCircle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("members.medicalInformation")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Medical Conditions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Asthma",
                  "Heart Condition",
                  "Diabetes",
                  "Hypertension",
                  "Back Pain",
                  "Knee Injury",
                  t("members.none"),
                ].map((condition) => (
                  <label
                    key={condition}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.medical_conditions.includes(condition)}
                      onChange={(e) =>
                        handleArrayChange(
                          "medical_conditions",
                          condition,
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{condition}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t("members.previousInjuries")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Shoulder",
                  "Knee",
                  "Back",
                  "Ankle",
                  "Wrist",
                  "Hip",
                  t("members.none"),
                ].map((injury) => (
                  <label
                    key={injury}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.injuries.includes(injury)}
                      onChange={(e) =>
                        handleArrayChange("injuries", injury, e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{injury}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Information Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600">
              <FiFileText className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("members.additionalNotes")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleTextarea
              label={t("members.staffNotes")}
              name="staff_notes"
              value={formData.staff_notes}
              onChange={handleInputChange}
              rows={3}
              placeholder={t("members.internalStaffNotes")}
              aria-label={t("members.staffNotes")}
            />
            <AppleTextarea
              label={t("members.medicalNotes")}
              name="medical_notes"
              value={formData.medical_notes}
              onChange={handleInputChange}
              rows={3}
              placeholder={t("members.medicalInformation")}
              aria-label={t("members.medicalNotes")}
            />
          </div>

          <AppleTextarea
            label={t("members.generalNotes")}
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            placeholder={t("members.additionalNotes")}
            aria-label={t("members.generalNotes")}
          />
        </section>
      </form>
    </UnifiedModal>
  );
};

export default AddMemberModal;
