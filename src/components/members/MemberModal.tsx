import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiUser,
  FiHeart,
  FiTarget,
  FiDollarSign,
  FiSettings,
  FiMessageSquare,
  FiFileText,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiShield,
  FiZap,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

// Types
interface Member {
  id?: string;
  name: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  date_of_birth?: string;
  national_id?: string;
  emergency_contact?: string;
  language: "English" | "Arabic";
  address?: string;

  // Health & Fitness
  height?: number;
  weight?: number;
  target_weight?: number;
  fitness_level: "Beginner" | "Intermediate" | "Advanced";
  medical_conditions: string[];
  injuries: string[];
  previous_gym_experience: boolean;

  // Goals & Preferences
  primary_goals: string[];
  goal_timeline: "1_month" | "3_months" | "6_months" | "1_year";
  workout_frequency_goal: number;
  preferred_workout_times: string[];

  // Membership
  membership_status: "active" | "trial" | "cancelled" | "paused";
  membership_type: string;
  membership_price: number;
  start_date: string;
  end_date: string;
  billing_cycle: "monthly" | "quarterly" | "semi-annual" | "annual";
  auto_renewal: boolean;

  // Access & Features
  access_level: "Basic" | "Premium" | "VIP";
  access_hours: "Standard" | "24/7" | "Premium Hours";
  facility_access: string[];
  assigned_trainer_id?: string;
  plan_id?: string;

  // Communication
  preferred_contact_method: "email" | "app";
  workout_reminders: boolean;
  progress_tracking_consent: boolean;
  marketing_consent: boolean;

  // Additional
  add_ons: string[];
  tags: string[];
  staff_notes?: string;
  medical_notes?: string;
  consent_signed: boolean;
  corporate_membership: boolean;
  company_name?: string;
  referral_code?: string;
  discount_percentage?: number;
  discount_amount?: number;
}

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
  member?: Member;
  mode: "add" | "edit";
}

// Smart Field Component
interface SmartFieldProps {
  label: string;
  name: keyof Member;
  type:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "number"
    | "select"
    | "checkbox"
    | "textarea";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  dependencies?: { [key: string]: any };
  onDependencyChange?: (field: string, value: any) => void;
}

const SmartField: React.FC<SmartFieldProps> = ({
  label,
  name,
  type,
  required = false,
  options = [],
  placeholder,
  value,
  onChange,
  error,
  dependencies = {},
  onDependencyChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (newValue: any) => {
    onChange(newValue);

    // Smart behavior based on field
    if (
      name === "fitness_level" &&
      newValue === "Beginner" &&
      onDependencyChange
    ) {
      onDependencyChange("plan_id", "intro-plan");
    }

    if (name === "corporate_membership" && newValue && onDependencyChange) {
      onDependencyChange("company_name", "");
    }

    if (
      name === "medical_conditions" &&
      newValue.length > 0 &&
      onDependencyChange
    ) {
      onDependencyChange("medical_notes", "");
    }
  };

  const renderField = () => {
    const baseClasses = `w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      error
        ? "border-red-300 bg-red-50"
        : isFocused
          ? "border-blue-300 bg-blue-50"
          : "border-gray-300 bg-white"
    }`;

    switch (type) {
      case "text":
      case "email":
      case "tel":
      case "date":
        return (
          <input
            type={type}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={baseClasses}
            placeholder={placeholder}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={baseClasses}
            placeholder={placeholder}
            step={name === "weight" || name === "target_weight" ? "0.1" : "1"}
          />
        );

      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={baseClasses}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        );

      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`${baseClasses} resize-none`}
            rows={3}
            placeholder={placeholder}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {renderField()}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

// Smart Form Section Component
interface SmartFormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  gradient?: boolean;
}

const SmartFormSection: React.FC<SmartFormSectionProps> = ({
  title,
  icon,
  children,
  gradient = false,
}) => {
  return (
    <div className="space-y-6">
      <div
        className={`flex items-center space-x-3 pb-4 ${
          gradient
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-lg"
            : ""
        }`}
      >
        <div className="text-blue-600">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

// Smart Tabs Component
interface SmartTabsProps {
  tabs: { id: string; label: string; icon: React.ReactNode }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const SmartTabs: React.FC<SmartTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-white"
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// Main Modal Component
const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  member,
  mode,
}) => {
  const [formData, setFormData] = useState<Member>({
    name: "",
    email: "",
    phone: "",
    gender: "Male",
    language: "English",
    fitness_level: "Beginner",
    primary_goals: [],
    goal_timeline: "3_months",
    workout_frequency_goal: 3,
    preferred_workout_times: [],
    membership_status: "active",
    membership_type: "Standard",
    membership_price: 0,
    start_date: "",
    end_date: "",
    billing_cycle: "monthly",
    auto_renewal: false,
    access_level: "Basic",
    access_hours: "Standard",
    facility_access: ["Gym Floor"],
    preferred_contact_method: "email",
    workout_reminders: true,
    progress_tracking_consent: true,
    marketing_consent: false,
    add_ons: [],
    tags: [],
    consent_signed: false,
    corporate_membership: false,
    medical_conditions: [],
    injuries: [],
    previous_gym_experience: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // Initialize form data when member is provided (edit mode)
  useEffect(() => {
    if (member) {
      setFormData(member);
    }
  }, [member]);

  // Auto-save on section change
  useEffect(() => {
    if (mode === "edit" && Object.keys(formData).length > 0) {
      // Auto-save logic here
    }
  }, [formData, mode]);

  // Restore tab navigation
  const tabs = [
    { id: "basic", label: "Basic Info", icon: <FiUser className="w-4 h-4" /> },
    {
      id: "health",
      label: "Health & Fitness",
      icon: <FiHeart className="w-4 h-4" />,
    },
    {
      id: "goals",
      label: "Goals & Preferences",
      icon: <FiTarget className="w-4 h-4" />,
    },
    {
      id: "billing",
      label: "Billing & Membership",
      icon: <FiDollarSign className="w-4 h-4" />,
    },
    {
      id: "access",
      label: "Access & Features",
      icon: <FiSettings className="w-4 h-4" />,
    },
    {
      id: "communication",
      label: "Communication",
      icon: <FiMessageSquare className="w-4 h-4" />,
    },
    { id: "notes", label: "Notes", icon: <FiFileText className="w-4 h-4" /> },
  ];

  // Define required fields for each tab
  const requiredFieldsByTab: { [tab: string]: (keyof Member)[] } = {
    basic: ["name", "email", "phone", "gender", "language"],
    health: ["fitness_level"],
    goals: ["goal_timeline", "workout_frequency_goal"],
    billing: [
      "membership_status",
      "membership_type",
      "billing_cycle",
      "start_date",
      "end_date",
    ],
    access: ["access_level", "access_hours"],
    communication: ["preferred_contact_method"],
    notes: [],
  };

  // Helper to check if a tab is complete or has errors
  const getTabStatus = (tab: string) => {
    const fields = requiredFieldsByTab[tab] || [];
    let hasError = false;
    let isComplete = true;
    for (const field of fields) {
      if (
        !formData[field] ||
        (typeof formData[field] === "string" &&
          !formData[field].toString().trim())
      ) {
        hasError = true;
        isComplete = false;
      }
      if (errors[field]) {
        hasError = true;
        isComplete = false;
      }
    }
    return {
      hasError,
      isComplete: isComplete && fields.length > 0 && !hasError,
    };
  };

  function renderTabContent() {
    switch (activeTab) {
      case "basic":
        return renderBasicInfo();
      case "health":
        return renderHealthFitness();
      case "goals":
        return renderGoalsPreferences();
      case "billing":
        return renderBillingMembership();
      case "access":
        return renderAccessFeatures();
      case "communication":
        return renderCommunication();
      case "notes":
        return renderNotes();
      default:
        return null;
    }
  }

  const handleFieldChange = useCallback(
    (field: keyof Member, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error when field is updated
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors],
  );

  const handleArrayFieldChange = useCallback(
    (field: keyof Member, value: string, checked: boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: checked
          ? [...((prev[field] as string[]) || []), value]
          : ((prev[field] as string[]) || []).filter((item) => item !== value),
      }));
    },
    [],
  );

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    let firstErrorTab: string | null = null;
    // Validate all required fields by tab
    Object.entries(requiredFieldsByTab).forEach(([tab, fields]) => {
      for (const field of fields) {
        if (
          !formData[field] ||
          (typeof formData[field] === "string" &&
            !formData[field].toString().trim())
        ) {
          newErrors[field] = "This field is required";
          if (!firstErrorTab) firstErrorTab = tab;
        }
      }
    });
    // Additional custom validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      if (!firstErrorTab) firstErrorTab = "basic";
    }
    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.start_date) >= new Date(formData.end_date)
    ) {
      newErrors.end_date = "End date must be after start date";
      if (!firstErrorTab) firstErrorTab = "billing";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setSummaryError("Please complete all required fields in each section.");
      if (firstErrorTab) setActiveTab(firstErrorTab);
      return false;
    } else {
      setSummaryError("");
      return true;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save member:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SmartField
        label="Full Name"
        name="name"
        type="text"
        required
        value={formData.name}
        onChange={(value) => handleFieldChange("name", value)}
        error={errors.name}
        placeholder="Enter full name"
      />

      <SmartField
        label="Email"
        name="email"
        type="email"
        required
        value={formData.email}
        onChange={(value) => handleFieldChange("email", value)}
        error={errors.email}
        placeholder="email@example.com"
      />

      <SmartField
        label="Phone Number"
        name="phone"
        type="tel"
        required
        value={formData.phone}
        onChange={(value) => handleFieldChange("phone", value)}
        error={errors.phone}
        placeholder="+973 XXXX XXXX"
      />

      <SmartField
        label="Gender"
        name="gender"
        type="select"
        required
        value={formData.gender}
        onChange={(value) => handleFieldChange("gender", value)}
        options={[
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
          { value: "Other", label: "Other" },
        ]}
      />

      <SmartField
        label="Date of Birth"
        name="date_of_birth"
        type="date"
        value={formData.date_of_birth}
        onChange={(value) => handleFieldChange("date_of_birth", value)}
      />

      <SmartField
        label="National ID"
        name="national_id"
        type="text"
        value={formData.national_id}
        onChange={(value) => handleFieldChange("national_id", value)}
        placeholder="Enter national ID"
      />

      <SmartField
        label="Emergency Contact"
        name="emergency_contact"
        type="tel"
        value={formData.emergency_contact}
        onChange={(value) => handleFieldChange("emergency_contact", value)}
        placeholder="Emergency contact number"
      />

      <SmartField
        label="Preferred Language"
        name="language"
        type="select"
        required
        value={formData.language}
        onChange={(value) => handleFieldChange("language", value)}
        options={[
          { value: "English", label: "English" },
          { value: "Arabic", label: "Arabic" },
        ]}
      />

      <div className="md:col-span-2">
        <SmartField
          label="Address"
          name="address"
          type="textarea"
          value={formData.address}
          onChange={(value) => handleFieldChange("address", value)}
          placeholder="Enter full address"
        />
      </div>
    </div>
  );

  const renderHealthFitness = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SmartField
        label="Current Weight (kg)"
        name="weight"
        type="number"
        value={formData.weight}
        onChange={(value) => handleFieldChange("weight", value)}
        placeholder="Enter current weight"
      />

      <SmartField
        label="Target Weight (kg)"
        name="target_weight"
        type="number"
        value={formData.target_weight}
        onChange={(value) => handleFieldChange("target_weight", value)}
        placeholder="Enter target weight"
      />

      <SmartField
        label="Height (cm)"
        name="height"
        type="number"
        value={formData.height}
        onChange={(value) => handleFieldChange("height", value)}
        placeholder="Enter height"
      />

      <SmartField
        label="Fitness Level"
        name="fitness_level"
        type="select"
        required
        value={formData.fitness_level}
        onChange={(value) => handleFieldChange("fitness_level", value)}
        options={[
          { value: "Beginner", label: "Beginner" },
          { value: "Intermediate", label: "Intermediate" },
          { value: "Advanced", label: "Advanced" },
        ]}
      />

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Medical Conditions
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            "Asthma",
            "Heart Condition",
            "Diabetes",
            "Hypertension",
            "Back Pain",
            "Knee Injury",
            "None",
          ].map((condition) => (
            <label key={condition} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medical_conditions.includes(condition)}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "medical_conditions",
                    condition,
                    e.target.checked,
                  )
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{condition}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Previous Injuries
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {["Shoulder", "Knee", "Back", "Ankle", "Wrist", "Hip", "None"].map(
            (injury) => (
              <label key={injury} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.injuries.includes(injury)}
                  onChange={(e) =>
                    handleArrayFieldChange("injuries", injury, e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{injury}</span>
              </label>
            ),
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <SmartField
          label="Previous Gym Experience"
          name="previous_gym_experience"
          type="checkbox"
          value={formData.previous_gym_experience}
          onChange={(value) =>
            handleFieldChange("previous_gym_experience", value)
          }
        />
      </div>
    </div>
  );

  const renderGoalsPreferences = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Primary Goals
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            "Weight Loss",
            "Muscle Gain",
            "Strength Training",
            "Cardio Fitness",
            "Flexibility",
            "Sports Performance",
          ].map((goal) => (
            <label key={goal} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.primary_goals.includes(goal)}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "primary_goals",
                    goal,
                    e.target.checked,
                  )
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{goal}</span>
            </label>
          ))}
        </div>
      </div>

      <SmartField
        label="Goal Timeline"
        name="goal_timeline"
        type="select"
        required
        value={formData.goal_timeline}
        onChange={(value) => handleFieldChange("goal_timeline", value)}
        options={[
          { value: "1_month", label: "1 Month" },
          { value: "3_months", label: "3 Months" },
          { value: "6_months", label: "6 Months" },
          { value: "1_year", label: "1 Year" },
        ]}
      />

      <SmartField
        label="Workout Frequency Goal (per week)"
        name="workout_frequency_goal"
        type="number"
        required
        value={formData.workout_frequency_goal}
        onChange={(value) => handleFieldChange("workout_frequency_goal", value)}
        placeholder="3"
      />

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Workout Times
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Morning", "Afternoon", "Evening", "Late Night"].map((time) => (
            <label key={time} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.preferred_workout_times.includes(time)}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "preferred_workout_times",
                    time,
                    e.target.checked,
                  )
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{time}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBillingMembership = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SmartField
        label="Membership Status"
        name="membership_status"
        type="select"
        required
        value={formData.membership_status}
        onChange={(value) => handleFieldChange("membership_status", value)}
        options={[
          { value: "active", label: "Active" },
          { value: "trial", label: "Trial" },
          { value: "cancelled", label: "Cancelled" },
          { value: "paused", label: "Paused" },
        ]}
      />

      <SmartField
        label="Membership Type"
        name="membership_type"
        type="select"
        required
        value={formData.membership_type}
        onChange={(value) => handleFieldChange("membership_type", value)}
        options={[
          { value: "Basic", label: "Basic" },
          { value: "Standard", label: "Standard" },
          { value: "Premium", label: "Premium" },
          { value: "VIP", label: "VIP" },
        ]}
      />

      <SmartField
        label="Membership Price"
        name="membership_price"
        type="number"
        value={formData.membership_price}
        onChange={(value) => handleFieldChange("membership_price", value)}
        placeholder="0.00"
      />

      <SmartField
        label="Billing Cycle"
        name="billing_cycle"
        type="select"
        required
        value={formData.billing_cycle}
        onChange={(value) => handleFieldChange("billing_cycle", value)}
        options={[
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "semi-annual", label: "Semi-Annual" },
          { value: "annual", label: "Annual" },
        ]}
      />

      <SmartField
        label="Start Date"
        name="start_date"
        type="date"
        required
        value={formData.start_date}
        onChange={(value) => handleFieldChange("start_date", value)}
        error={errors.start_date}
      />

      <SmartField
        label="End Date"
        name="end_date"
        type="date"
        required
        value={formData.end_date}
        onChange={(value) => handleFieldChange("end_date", value)}
        error={errors.end_date}
      />

      <div className="md:col-span-2">
        <SmartField
          label="Auto Renewal"
          name="auto_renewal"
          type="checkbox"
          value={formData.auto_renewal}
          onChange={(value) => handleFieldChange("auto_renewal", value)}
        />
      </div>
    </div>
  );

  const renderAccessFeatures = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SmartField
        label="Access Level"
        name="access_level"
        type="select"
        required
        value={formData.access_level}
        onChange={(value) => handleFieldChange("access_level", value)}
        options={[
          { value: "Basic", label: "Basic" },
          { value: "Premium", label: "Premium" },
          { value: "VIP", label: "VIP" },
        ]}
      />

      <SmartField
        label="Access Hours"
        name="access_hours"
        type="select"
        required
        value={formData.access_hours}
        onChange={(value) => handleFieldChange("access_hours", value)}
        options={[
          { value: "Standard", label: "Standard" },
          { value: "24/7", label: "24/7" },
          { value: "Premium Hours", label: "Premium Hours" },
        ]}
      />

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Facility Access
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            "Gym Floor",
            "Pool",
            "Spa",
            "Sauna",
            "Studio",
            "Cardio Room",
            "Weight Room",
            "Locker Room",
          ].map((facility) => (
            <label key={facility} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.facility_access.includes(facility)}
                onChange={(e) =>
                  handleArrayFieldChange(
                    "facility_access",
                    facility,
                    e.target.checked,
                  )
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{facility}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <SmartField
          label="Corporate Membership"
          name="corporate_membership"
          type="checkbox"
          value={formData.corporate_membership}
          onChange={(value) => handleFieldChange("corporate_membership", value)}
        />
      </div>

      {formData.corporate_membership && (
        <div className="md:col-span-2">
          <SmartField
            label="Company Name"
            name="company_name"
            type="text"
            value={formData.company_name}
            onChange={(value) => handleFieldChange("company_name", value)}
            placeholder="Enter company name"
          />
        </div>
      )}
    </div>
  );

  const renderCommunication = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SmartField
        label="Preferred Contact Method"
        name="preferred_contact_method"
        type="select"
        required
        value={formData.preferred_contact_method}
        onChange={(value) =>
          handleFieldChange("preferred_contact_method", value)
        }
        options={[
          { value: "email", label: "Email" },
          { value: "app", label: "App" },
        ]}
      />

      <div className="md:col-span-2 space-y-4">
        <SmartField
          label="Workout Reminders"
          name="workout_reminders"
          type="checkbox"
          value={formData.workout_reminders}
          onChange={(value) => handleFieldChange("workout_reminders", value)}
        />

        <SmartField
          label="Progress Tracking Consent"
          name="progress_tracking_consent"
          type="checkbox"
          value={formData.progress_tracking_consent}
          onChange={(value) =>
            handleFieldChange("progress_tracking_consent", value)
          }
        />

        <SmartField
          label="Marketing Consent"
          name="marketing_consent"
          type="checkbox"
          value={formData.marketing_consent}
          onChange={(value) => handleFieldChange("marketing_consent", value)}
        />
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <SmartField
          label="Staff Notes"
          name="staff_notes"
          type="textarea"
          value={formData.staff_notes}
          onChange={(value) => handleFieldChange("staff_notes", value)}
          placeholder="Internal staff notes about the member"
        />
      </div>

      {formData.medical_conditions.length > 0 && (
        <div className="md:col-span-2">
          <SmartField
            label="Medical Notes"
            name="medical_notes"
            type="textarea"
            value={formData.medical_notes}
            onChange={(value) => handleFieldChange("medical_notes", value)}
            placeholder="Medical information and restrictions"
          />
        </div>
      )}

      <div className="md:col-span-2">
        <SmartField
          label="Consent Signed"
          name="consent_signed"
          type="checkbox"
          value={formData.consent_signed}
          onChange={(value) => handleFieldChange("consent_signed", value)}
        />
      </div>
    </div>
  );

  // Remove the Member Preview panel and clean up the tab UI
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-[#002D9C] via-[#0E5EF2] to-[#7DCCFF] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {mode === "add" ? "Add New Member" : "Edit Member"}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {mode === "add"
                      ? "Create a new member profile"
                      : "Update member information"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-blue-200 transition-colors"
                  aria-label="Close modal"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Minimal Tabs - horizontally scrollable on mobile */}
            <div className="bg-white shadow-sm border-b border-gray-200">
              <div className="flex space-x-2 overflow-x-auto px-2">
                {tabs.map((tab) => {
                  const { hasError, isComplete } = getTabStatus(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium focus:outline-none transition-all duration-150
                        ${
                          activeTab === tab.id
                            ? "text-blue-700 border-b-2 border-blue-600"
                            : "text-gray-700 hover:text-blue-700 border-b-2 border-transparent"
                        }
                      `}
                      style={{ minWidth: 120 }}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      {hasError && (
                        <FiAlertCircle
                          className="ml-1 text-red-500 w-4 h-4"
                          aria-label="Tab has errors"
                        />
                      )}
                      {!hasError && isComplete && (
                        <FiCheckCircle
                          className="ml-1 text-green-500 w-4 h-4"
                          aria-label="Tab complete"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content: Form only (no preview) */}
            <div className="flex-1 overflow-y-auto px-6 py-8 max-h-[80vh] min-h-0">
              {summaryError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-center text-sm">
                  {summaryError}
                </div>
              )}
              <div className="space-y-8">{renderTabContent()}</div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-gradient-to-br from-[#0E5EF2] to-[#7DCCFF] text-white font-medium rounded-lg hover:from-[#0E4CD9] hover:to-[#6BB8E6] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      <span>
                        {mode === "add" ? "Add Member" : "Save Changes"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MemberModal;
