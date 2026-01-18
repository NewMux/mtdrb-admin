import * as React from "react";
import { motion } from "framer-motion";
import {
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiTarget,
  FiHeart,
  FiFileText,
  FiUsers,
  FiSettings,
} from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import { SmartButton } from "../../ui/DesignSystem";
import { Member } from "../../../types/member";

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
  modalRef,
}) => {
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

  const membershipTypes = [
    { value: "Basic", label: "Basic" },
    { value: "Standard", label: "Standard" },
    { value: "Premium", label: "Premium" },
    { value: "VIP", label: "VIP" },
    { value: "Student", label: "Student" },
  ];

  const fitnessLevels = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

  const handleInputChange = (field: string, value: any) => {
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

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Member"
      subtitle="Create a new member profile with all necessary information"
      footer={
        <div className="flex items-center justify-end space-x-3">
          <SmartButton variant="secondary" onClick={handleClose}>
            Cancel
          </SmartButton>
          <SmartButton
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            {loading ? "Adding..." : "Add Member"}
          </SmartButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="bg-whitebg-gray-800 rounded-xl border border-gray-200border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100bg-blue-900/30 rounded-lg">
              <FiUser className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900text-white">
                Basic Info
              </h3>
              <p className="text-sm text-gray-600text-gray-400">
                Member's personal details
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.name ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1.5 font-medium">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.email ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.phone ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                placeholder="+973 XXXX XXXX"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="form-select"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  handleInputChange("date_of_birth", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                National ID
              </label>
              <input
                type="text"
                value={formData.national_id}
                onChange={(e) =>
                  handleInputChange("national_id", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-all"
                placeholder="Enter national ID"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Emergency Contact
              </label>
              <input
                type="tel"
                value={formData.emergency_contact}
                onChange={(e) =>
                  handleInputChange("emergency_contact", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-all"
                placeholder="Emergency contact number"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preferred Language *
              </label>
              <select
                value={formData.language}
                onChange={(e) => handleInputChange("language", e.target.value)}
                className="form-select"
              >
                <option value="English">English</option>
                <option value="Arabic">Arabic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-all"
                placeholder="Enter full address"
              />
            </div>
          </div>
        </div>
        {/* Health & Fitness Section */}
        <div className="bg-whitebg-gray-800 rounded-xl border border-gray-200border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-pink-100bg-pink-900/30 rounded-lg">
              <FiHeart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900text-white">
                Health & Fitness
              </h3>
              <p className="text-sm text-gray-600text-gray-400">
                Member's health and fitness details
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Weight (kg)
              </label>
              <input
                type="number"
                value={formData.weight || ""}
                onChange={(e) =>
                  handleInputChange(
                    "weight",
                    parseFloat(e.target.value) || undefined,
                  )
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-all"
                placeholder="Enter current weight"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Weight (kg)
              </label>
              <input
                type="number"
                value={formData.target_weight || ""}
                onChange={(e) =>
                  handleInputChange(
                    "target_weight",
                    parseFloat(e.target.value) || undefined,
                  )
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-all"
                placeholder="Enter target weight"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                value={formData.height || ""}
                onChange={(e) =>
                  handleInputChange(
                    "height",
                    parseFloat(e.target.value) || undefined,
                  )
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-all"
                placeholder="Enter height"
              />
            </div>
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.previous_gym_experience}
                  onChange={(e) =>
                    handleInputChange(
                      "previous_gym_experience",
                      e.target.checked,
                    )
                  }
                  className="form-checkbox"
                />
                <span className="text-sm text-gray-700text-gray-300">
                  Previous Gym Experience
                </span>
              </label>
            </div>
          </div>
        </div>
        {/* Goals & Preferences Section */}
        <div className="bg-whitebg-gray-800 rounded-xl border border-gray-200border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-100bg-yellow-900/30 rounded-lg">
              <FiTarget className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900text-white">
                Goals & Preferences
              </h3>
              <p className="text-sm text-gray-600text-gray-400">
                Member's goals and workout preferences
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {goalOptions.map((goal) => (
              <label key={goal.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.goals.includes(goal.value)}
                  onChange={(e) =>
                    handleArrayChange("goals", goal.value, e.target.checked)
                  }
                  className="form-checkbox"
                />
                <span className="text-sm text-gray-700text-gray-300">
                  {goal.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        {/* Health Conditions */}
        <div className="bg-whitebg-gray-800 rounded-xl border border-gray-200border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-pink-100bg-pink-900/30 rounded-lg">
              <FiHeart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900text-white">
                Health Conditions
              </h3>
              <p className="text-sm text-gray-600text-gray-400">
                Member's health conditions and previous injuries
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {healthConditionOptions.map((condition) => (
              <label
                key={condition.value}
                className="flex items-center space-x-2"
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
                  className="form-checkbox"
                />
                <span className="text-sm text-gray-700text-gray-300">
                  {condition.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        {/* Medical Conditions & Injuries */}
        <div className="bg-whitebg-gray-800 rounded-xl border border-gray-200border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100bg-red-900/30 rounded-lg">
              <FiHeart className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900text-white">
                Medical Information
              </h3>
              <p className="text-sm text-gray-600text-gray-400">
                Member's medical conditions and previous injuries
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  "None",
                ].map((condition) => (
                  <label
                    key={condition}
                    className="flex items-center space-x-2"
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
                      className="form-checkbox"
                    />
                    <span className="text-xs text-gray-700text-gray-300">
                      {condition}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Previous Injuries
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Shoulder",
                  "Knee",
                  "Back",
                  "Ankle",
                  "Wrist",
                  "Hip",
                  "None",
                ].map((injury) => (
                  <label key={injury} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.injuries.includes(injury)}
                      onChange={(e) =>
                        handleArrayChange("injuries", injury, e.target.checked)
                      }
                      className="form-checkbox"
                    />
                    <span className="text-xs text-gray-700text-gray-300">
                      {injury}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Notes */}
        <div className="bg-whitebg-gray-800 rounded-xl border border-gray-200border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gray-100bg-gray-900/30 rounded-lg">
              <FiFileText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900text-white">
                Additional Notes
              </h3>
              <p className="text-sm text-gray-600text-gray-400">
                Notes and staff information
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Staff Notes
              </label>
              <textarea
                value={formData.staff_notes}
                onChange={(e) =>
                  handleInputChange("staff_notes", e.target.value)
                }
                className="form-textarea"
                rows={3}
                placeholder="Internal staff notes about the member"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medical Notes
              </label>
              <textarea
                value={formData.medical_notes}
                onChange={(e) =>
                  handleInputChange("medical_notes", e.target.value)
                }
                className="form-textarea"
                rows={3}
                placeholder="Medical information and restrictions"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700text-gray-300 mb-2">
              General Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="form-textarea"
              rows={4}
              placeholder="Add any additional notes about the member..."
            />
          </div>
        </div>
      </form>
    </SmartModal>
  );
};

export default AddMemberModal;
