import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { supabase } from "../../supabaseClient";
import { Member } from "../../types/member";
import dayjs from "dayjs";
import { useWorkoutPlans } from "../../contexts/WorkoutPlansContext";
import {
  FiMail,
  FiDollarSign,
  FiShield,
  FiCheck,
  FiHeart,
} from "react-icons/fi";
import toast from "react-hot-toast";
// ColorfulModalUI replaced with SmartModal
import { SmartModal } from "../ui/SmartModal";
import { SmartButton } from "../ui/DesignSystem";
import { AnimatePresence } from "framer-motion";

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (member: Member) => void;
  member?: Member;
}

// Corresponds to the form shape based on Zod schema
type MemberFormData = z.infer<typeof schema>;

// Updated Zod schema based on the new fields
const schema = z
  .object({
    name: z.string().min(1, "Full Name is required"),
    gender: z.enum(["Male", "Female", "Other"]),
    date_of_birth: z.string().optional(),
    email: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    phone: z.string().min(1, "Phone number is required"),
    national_id: z.string().optional(),
    emergency_contact: z.string().optional(),
    language: z.enum(["English", "Arabic"]),
    membership_status: z.enum(["active", "trial", "cancelled", "paused"]),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    membership_type: z.string(),
    membership_price: z.coerce
      .number()
      .min(0, "Price must be positive")
      .optional(),
    plan_id: z.string().uuid().optional().nullable(),
    assigned_trainer_id: z.string().optional().nullable(),
    add_ons: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    staff_notes: z.string().optional(),
    medical_notes: z.string().optional(),
    consent_signed: z.boolean(),
    // Invoice validation
    create_invoice: z.boolean(),
    invoice_amount: z.coerce
      .number()
      .min(0, "Amount must be positive")
      .optional(),
    invoice_items: z.string().optional(),
    invoice_due_date: z.string().optional(),
    payment_method: z
      .enum(["card", "bank_transfer", "cash", "digital_wallet", "cheque"])
      .optional(),

    // Smart Health & Fitness Fields
    height: z.coerce
      .number()
      .min(100, "Height must be at least 100cm")
      .max(250, "Height must be under 250cm")
      .optional(),
    weight: z.coerce
      .number()
      .min(30, "Weight must be at least 30kg")
      .max(300, "Weight must be under 300kg")
      .optional(),
    target_weight: z.coerce
      .number()
      .min(30, "Target weight must be at least 30kg")
      .max(300, "Target weight must be under 300kg")
      .optional(),
    fitness_level: z.enum(["Beginner", "Intermediate", "Advanced"]),
    medical_conditions: z.array(z.string()).optional(),
    injuries: z.array(z.string()).optional(),
    previous_gym_experience: z.boolean(),

    // Smart Goals & Preferences
    primary_goals: z
      .array(z.string())
      .min(1, "Select at least one fitness goal"),
    goal_timeline: z.enum(["1_month", "3_months", "6_months", "1_year"]),
    workout_frequency_goal: z.coerce
      .number()
      .min(1, "At least 1 workout per week")
      .max(7, "Maximum 7 workouts per week"),
    preferred_workout_times: z
      .array(z.string())
      .min(1, "Select at least one preferred time"),

    // Staff Management - Membership Setup
    access_level: z.enum(["Basic", "Premium", "VIP"]),
    membership_duration: z.enum([
      "1_month",
      "3_months",
      "6_months",
      "1_year",
      "2_years",
      "lifetime",
    ]),
    billing_cycle: z.enum(["monthly", "quarterly", "semi-annual", "annual"]),
    discount_percentage: z.coerce
      .number()
      .min(0, "Discount must be 0 or positive")
      .max(100, "Discount cannot exceed 100%")
      .optional(),
    discount_amount: z.coerce
      .number()
      .min(0, "Discount amount must be positive")
      .optional(),
    auto_renewal: z.boolean(),
    payment_method_preference: z
      .enum(["card", "bank_transfer", "cash", "digital_wallet", "cheque"])
      .optional(),

    // Modern Gym SaaS Features
    access_hours: z.enum(["Standard", "24/7", "Premium Hours"]),
    facility_access: z.array(z.string()).min(1, "Select at least one facility"),
    fitness_tracker_integration: z.boolean(),
    body_composition_tracking: z.boolean(),
    progress_photos_consent: z.boolean(),
    referral_code: z.string().optional(),
    corporate_membership: z.boolean(),
    family_plan: z.boolean(),

    // Communication & Automation Features
    preferred_contact_method: z.enum(["email", "sms", "whatsapp", "app"]),
    workout_reminders: z.boolean(),
    progress_tracking_consent: z.boolean(),
    marketing_consent: z.boolean(),
    auto_schedule_intro: z.boolean(),
    buddy_system_interest: z.boolean(),
    send_welcome_sequence: z.boolean(),
  })
  .refine(
    (data) => {
      // If creating invoice, amount and due date are required
      if (data.create_invoice) {
        return (
          data.invoice_amount &&
          data.invoice_amount > 0 &&
          data.invoice_due_date
        );
      }
      return true;
    },
    {
      message: "Amount and due date are required when creating an invoice",
      path: ["invoice_amount"], // This will show the error on the amount field
    },
  )
  .refine(
    (data) => {
      // If membership type is Custom, end date must be after start date
      if (data.membership_type === "Custom") {
        return dayjs(data.end_date).isAfter(dayjs(data.start_date));
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["end_date"],
    },
  )
  .refine(
    (data) => {
      // 🚀 SMART VALIDATION: Realistic weight goal timeline
      if (data.target_weight && data.weight) {
        const weightDiff = Math.abs(data.target_weight - data.weight);
        const timelineWeeks = {
          "1_month": 4,
          "3_months": 12,
          "6_months": 24,
          "1_year": 52,
        }[data.goal_timeline];

        // Max healthy weight change: 2 lbs/week loss, 1 lb/week gain
        const maxHealthyChange =
          data.target_weight < data.weight
            ? timelineWeeks * 0.9
            : timelineWeeks * 0.45; // kg conversion

        return weightDiff <= maxHealthyChange;
      }
      return true;
    },
    {
      message:
        "Goal timeline may be unrealistic for target weight change. Consider a longer timeline.",
      path: ["goal_timeline"],
    },
  );

const normalizeMembershipStatus = (
  status?: string | null,
): MemberFormData["membership_status"] => {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "active";
    case "trial":
      return "trial";
    case "paused":
      return "paused";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "active";
  }
};

const normalizeBillingCycle = (
  cycle?: string | null,
): MemberFormData["billing_cycle"] => {
  switch ((cycle ?? "").toLowerCase()) {
    case "monthly":
      return "monthly";
    case "quarterly":
      return "quarterly";
    case "semi-annual":
    case "semi annual":
      return "semi-annual";
    case "annual":
      return "annual";
    default:
      return "monthly";
  }
};

const normalizePaymentMethod = (
  method?: string | null,
): MemberFormData["payment_method"] => {
  switch ((method ?? "").toLowerCase()) {
    case "card":
      return "card";
    case "bank transfer":
    case "bank_transfer":
      return "bank_transfer";
    case "digital wallet":
    case "digital_wallet":
      return "digital_wallet";
    case "cheque":
      return "cheque";
    case "cash":
    default:
      return "cash";
  }
};

interface Branch {
  id: string;
  name: string;
}

interface Trainer {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
  billing_cycle: string;
  duration_months?: number;
}

const COUNTRY_CODES = [
  { code: "+973", label: "Bahrain" },
  { code: "+966", label: "Saudi Arabia" },
  { code: "+971", label: "UAE" },
  { code: "+965", label: "Kuwait" },
  { code: "+968", label: "Oman" },
  { code: "+974", label: "Qatar" },
  { code: "+20", label: "Egypt" },
  { code: "+962", label: "Jordan" },
  { code: "+961", label: "Lebanon" },
  { code: "", label: "Other" },
];

const ADD_ON_SERVICES = [
  { label: "Locker", value: "locker" },
  { label: "Towel Service", value: "towel" },
  { label: "Personal Training", value: "pt" },
  { label: "Nutrition Plan", value: "nutrition" },
];

const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  member,
}) => {
  const [, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  useWorkoutPlans();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [, setBranches] = useState<Branch[]>([]);
  const [selectedTags] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  // Removed setDrawerOpen - this component uses Dialog, not drawer

  // Form defaults based on edit mode and new fields
  const defaultValues: MemberFormData = member
    ? {
        name: member.name || "",
        gender: member.gender || "Male",
        date_of_birth: member.date_of_birth
          ? member.date_of_birth.split("T")[0]
          : "",
        email: member.email || "",
        phone: member.phone || "",
        national_id: member.national_id || "",
        emergency_contact: member.emergency_contact || "",
        language: (member.language as "English" | "Arabic") || "English",
        membership_status: normalizeMembershipStatus(member.membership_status),
        start_date: member.start_date ? member.start_date.split("T")[0] : "",
        end_date: member.end_date ? member.end_date.split("T")[0] : "",
        membership_type: member.membership_type || "",
        membership_price: member.membership_price
          ? parseFloat(member.membership_price.toString())
          : undefined,
        plan_id: member.plan_id || null,
        assigned_trainer_id: member.assigned_trainer_id || "",
        add_ons: member.add_ons || [],
        tags: member.tags || [],
        staff_notes: member.staff_notes || "",
        medical_notes: member.medical_notes || "",
        consent_signed: member.consent_signed || false,
        create_invoice: false,
        invoice_amount: 0,
        invoice_items: "",
        invoice_due_date: dayjs().add(30, "day").format("YYYY-MM-DD"),
        payment_method: normalizePaymentMethod(member.payment_method_preference),

        // 🚀 SMART DEFAULTS FOR EXISTING MEMBER
        height: member.height || undefined,
        weight: member.weight || undefined,
        target_weight: member.target_weight || undefined,
        fitness_level:
          (member.fitness_level as "Beginner" | "Intermediate" | "Advanced") ||
          "Beginner",
        medical_conditions: member.medical_conditions || [],
        injuries: member.injuries || [],
        previous_gym_experience: member.previous_gym_experience || false,
        primary_goals: member.primary_goals || [],
        goal_timeline:
          (member.goal_timeline as
            | "1_month"
            | "3_months"
            | "6_months"
            | "1_year") || "3_months",
        workout_frequency_goal: member.workout_frequency_goal || 3,
        preferred_workout_times: member.preferred_workout_times || [],
        // Staff Management - Membership Setup
        access_level:
          (member.access_level as "Basic" | "Premium" | "VIP") || "Basic",
        membership_duration:
          (member.membership_duration as
            | "1_month"
            | "3_months"
            | "6_months"
            | "1_year"
            | "2_years"
            | "lifetime") || "1_month",
        billing_cycle: normalizeBillingCycle(member.billing_cycle),
        discount_percentage: member.discount_percentage || undefined,
        discount_amount: member.discount_amount || undefined,
        auto_renewal: member.auto_renewal || false,
        payment_method_preference: normalizePaymentMethod(
          member.payment_method_preference,
        ),

        // Modern Gym SaaS Features
        access_hours:
          (member.access_hours as "Standard" | "24/7" | "Premium Hours") ||
          "Standard",
        facility_access: member.facility_access || ["Gym Floor"],
        fitness_tracker_integration:
          member.fitness_tracker_integration || false,
        body_composition_tracking: member.body_composition_tracking || false,
        progress_photos_consent: member.progress_photos_consent || false,
        referral_code: member.referral_code || "",
        corporate_membership: member.corporate_membership || false,
        family_plan: member.family_plan || false,

        // Communication & Automation Features
        preferred_contact_method:
          (member.preferred_contact_method as
            | "email"
            | "sms"
            | "whatsapp"
            | "app") || "app",
        workout_reminders: member.workout_reminders || true,
        progress_tracking_consent: member.progress_tracking_consent || true,
        marketing_consent: member.marketing_consent || false,
        auto_schedule_intro: member.auto_schedule_intro || false,
        buddy_system_interest: member.buddy_system_interest || false,
        send_welcome_sequence: member.send_welcome_sequence || false,
      }
    : {
        name: "",
        gender: "Male",
        date_of_birth: "",
        email: "",
        phone: "",
        national_id: "",
        emergency_contact: "",
        language: "English",
        membership_status: "active",
        start_date: dayjs().format("YYYY-MM-DD"),
        end_date: dayjs().add(1, "month").format("YYYY-MM-DD"),
        membership_type: "Monthly",
        membership_price: undefined,
        plan_id: null,
        assigned_trainer_id: "",
        add_ons: [],
        tags: [],
        staff_notes: "",
        medical_notes: "",
        consent_signed: false,
        create_invoice: false,
        invoice_amount: 0,
        invoice_items: "",
        invoice_due_date: dayjs().add(30, "day").format("YYYY-MM-DD"),
        payment_method: "cash",

        // 🚀 SMART DEFAULTS FOR NEW MEMBER - Fix required fields
        height: undefined,
        weight: undefined,
        target_weight: undefined,
        fitness_level: "Beginner",
        medical_conditions: [],
        injuries: [],
        previous_gym_experience: false,
        primary_goals: [],
        goal_timeline: "3_months",
        workout_frequency_goal: 3,
        preferred_workout_times: [],
        // Staff Management - Membership Setup
        access_level: "Basic",
        membership_duration: "1_month",
        billing_cycle: "monthly",
        discount_percentage: undefined,
        discount_amount: undefined,
        auto_renewal: false,
        payment_method_preference: undefined,

        // Modern Gym SaaS Features
        access_hours: "Standard",
        facility_access: ["Gym Floor"],
        fitness_tracker_integration: false,
        body_composition_tracking: false,
        progress_photos_consent: false,
        referral_code: "",
        corporate_membership: false,
        family_plan: false,

        // Communication & Automation Features
        preferred_contact_method: "app",
        workout_reminders: true,
        progress_tracking_consent: true,
        marketing_consent: false,
        auto_schedule_intro: true,
        buddy_system_interest: false,
        send_welcome_sequence: true,
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
  });

  // 🚀 MULTI-STEP NAVIGATION STATE
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 0, title: "Member Details", icon: "👤" },
    { id: 1, title: "Health Profile", icon: "💪" },
    { id: 2, title: "Goals & Schedule", icon: "🎯" },
    { id: 3, title: "Setup & Features", icon: "💳" },
  ];

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  // Simple discount calculation function
  const calculateFinalAmount = useCallback(() => {
    const basePrice = getValues("membership_price") || 0;
    const discountAmount = getValues("discount_amount") || 0;
    return Math.max(0, basePrice - discountAmount).toFixed(2);
  }, []);

  // Staff Form Sections
  const BasicInfoStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Member Information
        </h3>
        <p className="text-sm text-gray-600">
          Enter the member&apos;s basic details and contact information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Full Name *
          </label>
          <input
            id="name"
            autoComplete="name"
            {...register("name")}
            type="text"
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter full name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Gender *
          </label>
          <select
            id="gender"
            autoComplete="sex"
            {...register("gender")}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="date_of_birth"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Date of Birth
          </label>
          <input
            id="date_of_birth"
            autoComplete="bday"
            {...register("date_of_birth")}
            type="date"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Phone Number *
          </label>
          <input
            id="phone"
            autoComplete="tel"
            {...register("phone")}
            type="tel"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+973 XXXX XXXX"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            autoComplete="email"
            {...register("email")}
            type="email"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="emergency_contact"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Emergency Contact
          </label>
          <input
            id="emergency_contact"
            autoComplete="tel"
            {...register("emergency_contact")}
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Emergency contact name & phone"
          />
        </div>

        <div>
          <label
            htmlFor="national_id"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            National ID
          </label>
          <input
            id="national_id"
            autoComplete="off"
            {...register("national_id")}
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter national ID number"
          />
        </div>

        <div>
          <label
            htmlFor="language"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Preferred Language *
          </label>
          <select
            id="language"
            {...register("language")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="English">English</option>
            <option value="Arabic">Arabic</option>
          </select>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <label
            htmlFor="assigned_trainer_id"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Assigned Trainer
          </label>
          <select
            id="assigned_trainer_id"
            {...register("assigned_trainer_id")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a trainer (optional)</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="plan_id"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Workout Plan
          </label>
          <select
            id="plan_id"
            {...register("plan_id")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a workout plan (optional)</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - {plan.type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add-on Services */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Add-on Services
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ADD_ON_SERVICES.map((service) => (
            <label key={service.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={service.value}
                {...register("add_ons")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{service.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Member Tags */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Member Tags
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            "VIP",
            "Athlete",
            "Trial",
            "Student",
            "Senior",
            "Corporate",
            "Staff",
            "New Member",
          ].map((tag) => (
            <label key={tag} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={tag}
                {...register("tags")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notes Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="staff_notes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Staff Notes
          </label>
          <textarea
            id="staff_notes"
            {...register("staff_notes")}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Internal staff notes about the member"
          />
        </div>

        <div>
          <label
            htmlFor="medical_notes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Medical Notes
          </label>
          <textarea
            id="medical_notes"
            {...register("medical_notes")}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Medical information and restrictions"
          />
        </div>
      </div>
    </div>
  );

  const HealthFitnessStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Health & Fitness Profile
        </h3>
        <p className="text-sm text-gray-600">
          Record the member&apos;s health information and fitness background
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <label
            htmlFor="weight"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Current Weight (kg)
          </label>
          <input
            id="weight"
            autoComplete="off"
            {...register("weight", { valueAsNumber: true })}
            type="number"
            step="0.1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter current weight"
          />
        </div>

        <div>
          <label
            htmlFor="target_weight"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Target Weight (kg)
          </label>
          <input
            id="target_weight"
            autoComplete="off"
            {...register("target_weight", { valueAsNumber: true })}
            type="number"
            step="0.1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter target weight"
          />
        </div>

        <div>
          <label
            htmlFor="height"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Height (cm)
          </label>
          <input
            id="height"
            autoComplete="off"
            {...register("height", { valueAsNumber: true })}
            type="number"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter height"
          />
        </div>

        <div>
          <label
            htmlFor="fitness_level"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Fitness Level *
          </label>
          <select
            id="fitness_level"
            autoComplete="off"
            {...register("fitness_level")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              {...register("previous_gym_experience")}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Previous Gym Experience
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            Member has experience with gym equipment and routines
          </p>
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-red-50 p-8 rounded-xl border border-red-100">
        <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
          <FiHeart className="mr-3 text-red-600" />
          Medical Information
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label key={condition} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={condition}
                    {...register("medical_conditions")}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-gray-700">{condition}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    value={injury}
                    {...register("injuries")}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-gray-700">{injury}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const GoalsPreferencesStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Goals & Preferences
        </h3>
        <p className="text-sm text-gray-600">
          Configure the member&apos;s fitness goals and workout preferences
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Primary Goals * (Select all that apply)
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                value={goal}
                {...register("primary_goals")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{goal}</span>
            </label>
          ))}
        </div>
        {errors.primary_goals && (
          <p className="text-red-500 text-sm mt-1">
            {errors.primary_goals.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goal Timeline *
          </label>
          <select
            {...register("goal_timeline")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1_month">1 Month</option>
            <option value="3_months">3 Months</option>
            <option value="6_months">6 Months</option>
            <option value="1_year">1 Year</option>
          </select>
          {errors.goal_timeline && (
            <p className="text-red-500 text-sm mt-1">
              {errors.goal_timeline.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workout Frequency Goal (days/week) *
          </label>
          <input
            {...register("workout_frequency_goal", { valueAsNumber: true })}
            type="number"
            min="1"
            max="7"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Workout Times * (Select all that apply)
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            "Early Morning (6-9 AM)",
            "Morning (9-12 PM)",
            "Afternoon (12-5 PM)",
            "Evening (5-8 PM)",
            "Night (8-11 PM)",
          ].map((time) => (
            <label key={time} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={time}
                {...register("preferred_workout_times")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{time}</span>
            </label>
          ))}
        </div>
        {errors.preferred_workout_times && (
          <p className="text-red-500 text-sm mt-1">
            {errors.preferred_workout_times.message}
          </p>
        )}
      </div>
    </div>
  );

  const BillingMembershipStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Membership Setup & Features
        </h3>
        <p className="text-sm text-gray-600">
          Configure access level, duration, pricing, and automation features
        </p>
      </div>

      {/* Access Level Selection */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100">
        <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
          <FiShield className="mr-3 text-blue-600" />
          Access Level *
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {[
            {
              name: "Basic",
              features: ["Gym Access", "Basic Equipment", "Locker"],
            },
            {
              name: "Premium",
              features: [
                "All Basic",
                "Group Classes",
                "Personal Training Session",
              ],
            },
            {
              name: "VIP",
              features: [
                "All Premium",
                "Nutrition Consultation",
                "24/7 Access",
                "Priority Support",
              ],
            },
          ].map((level) => (
            <div key={level.name} className="relative">
              <input
                {...register("access_level")}
                type="radio"
                value={level.name}
                id={level.name}
                className="sr-only peer"
              />
              <label
                htmlFor={level.name}
                className="block p-4 bg-white border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all"
              >
                <div className="font-semibold text-gray-900">{level.name}</div>
                <ul className="text-sm text-gray-600 space-y-1 mt-2">
                  {level.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <FiCheck className="mr-2 text-green-500 h-3 w-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </label>
            </div>
          ))}
        </div>
        {errors.access_level && (
          <p className="text-red-500 text-sm">{errors.access_level.message}</p>
        )}
      </div>

      {/* Staff Management - Duration & Billing Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Membership Duration *
          </label>
          <select
            {...register("membership_duration")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1_month">1 Month</option>
            <option value="3_months">3 Months</option>
            <option value="6_months">6 Months</option>
            <option value="1_year">1 Year</option>
            <option value="2_years">2 Years</option>
            <option value="lifetime">Lifetime</option>
          </select>
          {errors.membership_duration && (
            <p className="text-red-500 text-sm mt-1">
              {errors.membership_duration.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Billing Frequency *
          </label>
          <select
            {...register("billing_cycle")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="monthly">Monthly Billing</option>
            <option value="quarterly">Quarterly Billing</option>
            <option value="semi-annual">Semi-Annual Billing</option>
            <option value="annual">Annual Billing</option>
          </select>
          {errors.billing_cycle && (
            <p className="text-red-500 text-sm mt-1">
              {errors.billing_cycle.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            How often member gets charged
          </p>
        </div>
      </div>

      {/* Pricing & Discounts */}
      <div className="bg-green-50 p-8 rounded-xl border border-green-100">
        <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
          <FiDollarSign className="mr-3 text-green-600" />
          Pricing & Discounts
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price (BHD) *
            </label>
            <div className="relative">
              <input
                {...register("membership_price", { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
              <FiDollarSign className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.membership_price && (
              <p className="text-red-500 text-sm mt-1">
                {errors.membership_price.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">Base membership price</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount (%) (Optional)
            </label>
            <input
              {...register("discount_percentage", { valueAsNumber: true })}
              type="number"
              step="0.1"
              min="0"
              max="100"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0"
            />
            {errors.discount_percentage && (
              <p className="text-red-500 text-sm mt-1">
                {errors.discount_percentage.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Percentage discount to apply
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Amount (BHD) (Optional)
            </label>
            <div className="relative">
              <input
                {...register("discount_amount", { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
              <FiDollarSign className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.discount_amount && (
              <p className="text-red-500 text-sm mt-1">
                {errors.discount_amount.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">Fixed discount amount</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Final Amount (BHD)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={calculateFinalAmount()}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-gray-50"
                readOnly
              />
              <FiDollarSign className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Amount after discount</p>
          </div>
        </div>
      </div>

      {/* Membership Duration and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            {...register("start_date")}
            type="date"
            min={format(new Date(), "yyyy-MM-dd")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.start_date && (
            <p className="text-red-500 text-sm mt-1">
              {errors.start_date.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            {...register("end_date")}
            type="date"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            readOnly
          />
          {errors.end_date && (
            <p className="text-red-500 text-sm mt-1">
              {errors.end_date.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Auto-calculated based on billing cycle
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Membership Status *
          </label>
          <select
            {...register("membership_status")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="trial">Trial (7 days)</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method Preference
          </label>
          <select
            {...register("payment_method_preference")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select preferred method</option>
            <option value="card">Credit/Debit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="digital_wallet">Digital Wallet</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Staff Management Options */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h5 className="font-medium text-gray-900">Staff Management Options</h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-3">
              <input
                {...register("auto_renewal")}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Auto-Renewal Enabled
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6">
              Member&apos;s subscription will auto-renew
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                {...register("create_invoice")}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Generate Invoice Now
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6">
              Create invoice immediately upon registration
            </p>
          </div>
        </div>
      </div>

      {/* Communication & Automation Features */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <FiMail className="mr-2 text-orange-600" />
          Communication & Automation
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Contact Method *
            </label>
            <select
              {...register("preferred_contact_method")}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="app">Mobile App</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                {...register("send_welcome_sequence")}
                type="checkbox"
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                Send welcome sequence
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                {...register("auto_schedule_intro")}
                type="checkbox"
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                Auto-schedule intro session
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                {...register("workout_reminders")}
                type="checkbox"
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                Send workout reminders
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                {...register("buddy_system_interest")}
                type="checkbox"
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                Workout buddy matching
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <label className="flex items-center space-x-3">
            <input
              {...register("progress_tracking_consent")}
              type="checkbox"
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">
              Allow progress tracking
            </span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              {...register("marketing_consent")}
              type="checkbox"
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">
              Marketing communications
            </span>
          </label>
        </div>
      </div>

      {/* Access & Features */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <FiShield className="mr-2 text-purple-600" />
          Access & Features
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Hours *
            </label>
            <select
              {...register("access_hours")}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Standard">Standard Hours (6am-10pm)</option>
              <option value="Premium Hours">Premium Hours (5am-11pm)</option>
              <option value="24/7">24/7 Access</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facility Access *
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                "Gym Floor",
                "Pool",
                "Sauna",
                "Group Classes",
                "Personal Training Area",
                "Kids Zone",
              ].map((facility) => (
                <label key={facility} className="flex items-center space-x-2">
                  <input
                    {...register("facility_access")}
                    type="checkbox"
                    value={facility}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs text-gray-700">{facility}</span>
                </label>
              ))}
            </div>
            {errors.facility_access && (
              <p className="text-red-500 text-sm mt-1">
                {errors.facility_access.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Code (Optional)
            </label>
            <input
              {...register("referral_code")}
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter referral code"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                {...register("corporate_membership")}
                type="checkbox"
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">
                Corporate Membership
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                {...register("family_plan")}
                type="checkbox"
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Family Plan</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h5 className="font-medium text-gray-900 mb-3">
            Digital Integration & Tracking
          </h5>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                {...register("fitness_tracker_integration")}
                type="checkbox"
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm text-gray-700">
                  Connect fitness tracker
                </span>
                <p className="text-xs text-gray-500">
                  Sync with Apple Health, Fitbit, Garmin, etc.
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                {...register("body_composition_tracking")}
                type="checkbox"
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm text-gray-700">
                  Body composition tracking
                </span>
                <p className="text-xs text-gray-500">
                  Regular DEXA scans and measurements
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                {...register("progress_photos_consent")}
                type="checkbox"
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm text-gray-700">
                  Progress photos consent
                </span>
                <p className="text-xs text-gray-500">
                  Allow trainers to take before/after photos
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Staff Confirmation */}
      <div className="border-t pt-4">
        <label className="flex items-start space-x-3">
          <input
            {...register("consent_signed")}
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Member has signed terms and conditions *
            </span>
            <p className="text-xs text-gray-500">
              Confirm that the member has read and signed the membership
              agreement, privacy policy, and liability waiver.
            </p>
          </div>
        </label>
        {errors.consent_signed && (
          <p className="text-red-500 text-sm mt-1">
            Staff confirmation required
          </p>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep />;
      case 1:
        return <HealthFitnessStep />;
      case 2:
        return <GoalsPreferencesStep />;
      case 3:
        return <BillingMembershipStep />;
      default:
        return <BasicInfoStep />;
    }
  };

  // Staff tool: Calculate end date based on membership duration (not billing cycle)
  const calculateEndDate = useCallback(
    (membershipDuration: string, startDate: string) => {
      if (!startDate) return dayjs().add(1, "month").format("YYYY-MM-DD");

      const start = dayjs(startDate);
      const durations = {
        "1_month": { amount: 1, unit: "month" },
        "3_months": { amount: 3, unit: "month" },
        "6_months": { amount: 6, unit: "month" },
        "1_year": { amount: 1, unit: "year" },
        "2_years": { amount: 2, unit: "year" },
        lifetime: { amount: 50, unit: "year" }, // Lifetime = 50 years from start
      };

      const duration =
        durations[membershipDuration as keyof typeof durations] ||
        durations["1_month"];
      return start
        .add(duration.amount, duration.unit as any)
        .format("YYYY-MM-DD");
    },
    [],
  );

  // Watch for changes in membership duration and start date to auto-calculate end date
  const membershipDuration = watch("membership_duration");
  const startDate = watch("start_date");

  useEffect(() => {
    if (membershipDuration && startDate) {
      const calculatedEndDate = calculateEndDate(membershipDuration, startDate);
      setValue("end_date", calculatedEndDate);
    }
  }, [membershipDuration, startDate, setValue, calculateEndDate]);

  // Also trigger calculation when form values change
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "membership_duration" || name === "start_date") {
        if (value.membership_duration && value.start_date) {
          const calculatedEndDate = calculateEndDate(
            value.membership_duration,
            value.start_date,
          );
          setValue("end_date", calculatedEndDate);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, calculateEndDate]);

  // Reset form when modal opens or member changes
  useEffect(() => {
    if (isOpen) {
      if (member) {
        // Editing an existing member
        const formattedMember = {
          ...member,
          name: member.name ?? "",
          email: member.email ?? "",
          national_id: member.national_id ?? "",
          emergency_contact: member.emergency_contact ?? "",
          date_of_birth: member.date_of_birth
            ? dayjs(member.date_of_birth).format("YYYY-MM-DD")
            : "",
          start_date: member.start_date
            ? dayjs(member.start_date).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD"),
          end_date: member.end_date ? dayjs(member.end_date).format("YYYY-MM-DD") : "",
          phone: member.phone || "+973",
          language: (member.language === "Arabic" ? "Arabic" : "English") as
            | "English"
            | "Arabic",
          membership_status: normalizeMembershipStatus(member.membership_status),
          membership_type: member.membership_type ?? "",
          primary_goals: member.primary_goals ?? [],
          preferred_workout_times: member.preferred_workout_times ?? [],
          billing_cycle: normalizeBillingCycle(member.billing_cycle),
          tags: member.tags ?? [],
          staff_notes: member.staff_notes ?? "",
          medical_notes: member.medical_notes ?? "",
          height: member.height ?? undefined,
          weight: member.weight ?? undefined,
          target_weight: member.target_weight ?? undefined,
          medical_conditions: member.medical_conditions ?? [],
          injuries: member.injuries ?? [],
          payment_method_preference: normalizePaymentMethod(
            member.payment_method_preference,
          ),
        };
        // Try to auto-detect country code from phone
        const found = COUNTRY_CODES.find((c) =>
          formattedMember.phone?.startsWith(c.code),
        );
        if (found) {
          setCountryCode(found.code);
          reset({
            ...formattedMember,
            phone: formattedMember.phone.replace(found.code, ""),
            membership_price:
              typeof formattedMember.membership_price === "string"
                ? parseFloat(formattedMember.membership_price) || 0
                : formattedMember.membership_price || 0,
          });
        } else {
          setCountryCode(COUNTRY_CODES[0].code);
        }
      } else {
        // Adding a new member, reset to defaults
        setCountryCode(COUNTRY_CODES[0].code);
        reset({
          name: "",
          gender: "Male",
          date_of_birth: "",
          email: "",
          phone: "",
          language: "English",
          membership_status: "active",
          membership_price: 0,
          start_date: dayjs().format("YYYY-MM-DD"),
          end_date: dayjs().add(1, "month").format("YYYY-MM-DD"),
          membership_type: "Monthly",
          billing_cycle: "monthly",
          plan_id: null,
          tags: [],
          staff_notes: "",
          medical_notes: "",
          consent_signed: true, // Set to true by default to make it easier
          create_invoice: false,
          invoice_amount: 0,
          invoice_items: "",
          invoice_due_date: "",
          payment_method: "cash",
          payment_method_preference: "cash",
          // Add default values for required fields
          fitness_level: "Beginner",
          primary_goals: ["General Fitness"],
          preferred_workout_times: ["Morning"],
          facility_access: ["Gym Floor"],
        });
      }
    }
  }, [isOpen, member, reset]);

  // Initialize session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch trainers, plans, and branches
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Get session
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (!isMounted || !currentSession?.user) return;
        setSession(currentSession);

        // Get tenant ID from user metadata or memberships table
        let tenantId = currentSession.user.user_metadata?.tenantId;

        if (!tenantId) {
          const { data: membershipData } = await supabase
            .from("memberships")
            .select("tenant_id")
            .eq("user_id", currentSession.user.id)
            .single();

          if (!isMounted) return;

          if (membershipData) {
            tenantId = membershipData.tenant_id;
          }
        }

        if (!isMounted || !tenantId) return;

        // Fetch trainers
        const { data: trainersData, error: trainersError } = await supabase
          .from("trainers")
          .select("id, name")
          .eq("tenant_id", tenantId);

        if (!isMounted) return;

        if (trainersError) {
          console.error("Error fetching trainers:", trainersError);
        } else {
          setTrainers(trainersData as Trainer[]);
        }

        // Fetch plans
        const { data: plansData, error: plansError } = await supabase
          .from("plans")
          .select("id, name, type, price, billing_cycle, duration_months")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .eq("type", "Membership");

        if (!isMounted) return;

        if (plansError) {
          console.error("Error fetching plans:", plansError);
        } else {
          setPlans(plansData as Plan[]);
        }

        // Fetch branches
        const { data: branchesData, error: branchesError } = await supabase
          .from("branches")
          .select("id, name")
          .eq("tenant_id", tenantId);

        if (!isMounted) return;

        if (branchesError) {
          console.error("Error fetching branches:", branchesError);
        } else {
          setBranches(branchesData as Branch[]);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (data: MemberFormData) => {
    setIsLoading(true);
    setError(null);


    // 1. Check Supabase connection
    if (!supabase) {
      const errorMsg = "Supabase client is not connected.";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
      return;
    }

    // 2. Validate required fields before submission
    const requiredFields = [
      "name",
      "phone",
      "membership_status",
      "start_date",
      "end_date",
    ];
    const missingFields = requiredFields.filter(
      (field) => !data[field as keyof MemberFormData],
    );

    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(", ")}`;
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
      return;
    }

    // 2. Build payload - exclude invoice fields from member data
    const {
      create_invoice,
      invoice_amount,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      invoice_items,
      invoice_due_date,
      payment_method,
      ...memberData
    } = data;
    const payload = {
      ...memberData,
      phone: countryCode + memberData.phone,
      date_of_birth: memberData.date_of_birth || null,
      email: memberData.email || null,
      national_id: memberData.national_id || null,
      emergency_contact: memberData.emergency_contact || null,
      language: memberData.language || "English",
      membership_status: memberData.membership_status || "active",
      start_date: memberData.start_date,
      end_date: memberData.end_date,
      membership_type: memberData.membership_type,
      plan_id: memberData.plan_id || null,
      assigned_trainer_id: memberData.assigned_trainer_id || null,
      add_ons: memberData.add_ons || [],
      tags: selectedTags.length > 0 ? selectedTags : null,
      staff_notes: memberData.staff_notes || null,
      medical_notes: memberData.medical_notes || null,
      consent_signed: memberData.consent_signed || false,
      payment_method: normalizePaymentMethod(payment_method),
    };

    try {
      let result;
      let savedMember;

      if (member) {
        // Update existing member
        result = await supabase
          .from("members")
          .update(payload)
          .eq("id", member.id)
          .select()
          .single();
        if (result.error) throw result.error;
        savedMember = result.data;

        // Create invoice for existing member if requested
        if (create_invoice && savedMember) {
          const invoicePayload = {
            tenant_id: savedMember.tenant_id,
            member_id: savedMember.id,
            invoice_number: `INV-${dayjs().format("YYYY")}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            title: `Invoice for ${memberData.name}`,
            issue_date: dayjs().format("YYYY-MM-DD"),
            due_date:
              invoice_due_date || dayjs().add(30, "days").format("YYYY-MM-DD"),
            amount: invoice_amount || 0,
            status: "Draft",
            payment_method: payload.payment_method,
            notes: `Invoice created during member update`,
            vat: 0, // Default VAT rate
          };

          const { error: invoiceError } = await supabase
            .from("invoices")
            .insert(invoicePayload);

          if (invoiceError) {
            console.error("Error creating invoice:", invoiceError);
            console.error("Error details:", {
              message: invoiceError.message,
              details: invoiceError.details,
              hint: invoiceError.hint,
              code: invoiceError.code,
            });
            toast.error(
              `Member updated successfully, but invoice creation failed: ${invoiceError.message}`,
            );
          } else {
            toast.success(`Member updated and invoice created successfully!`);
          }
        } else {
          toast.success(`Member updated successfully!`);
        }
      } else {
        // Insert new member
        // 2. Robustly fetch tenantId
        let tenant_id: string | undefined = undefined;

        try {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();
          if (sessionError) {
            console.error("Session error:", sessionError);
            throw new Error("Could not get session: " + sessionError.message);
          }

          const user = sessionData?.session?.user;
          if (!user) {
            throw new Error("No user session found. Please log in again.");
          }

          tenant_id = user.user_metadata?.tenant_id;

          if (!tenant_id) {
            // Fallback: fetch from memberships table
            const { data: membershipData, error: membershipError } =
              await supabase
                .from("memberships")
                .select("tenant_id")
                .eq("user_id", user.id)
                .single();

            if (membershipError) {
              console.error("Membership error:", membershipError);
              throw new Error(
                "Could not determine tenant ID: " + membershipError.message,
              );
            }

            tenant_id = membershipData?.tenant_id;
          }

          if (!tenant_id) {
            throw new Error(
              "Could not determine tenant ID. Please log in again.",
            );
          }
        } catch (tenantError: any) {
          console.error("❌ Tenant ID fetch error:", tenantError);
          throw new Error(`Tenant ID error: ${tenantError.message}`);
        }


        result = await supabase
          .from("members")
          .insert({ ...payload, tenant_id })
          .select()
          .single();

        if (result.error) {
          console.error("❌ Member insertion error:", result.error);
          throw result.error;
        }

        savedMember = result.data;

        // 3. Create invoice if requested
        if (create_invoice && savedMember) {
          const invoicePayload = {
            tenant_id: tenant_id,
            member_id: savedMember.id,
            invoice_number: `INV-${dayjs().format("YYYY")}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            title: `Invoice for ${memberData.name}`,
            issue_date: dayjs().format("YYYY-MM-DD"),
            due_date:
              invoice_due_date || dayjs().add(30, "days").format("YYYY-MM-DD"),
            amount: invoice_amount || 0,
            status: "Draft",
            payment_method: payload.payment_method,
            notes: `Invoice created during member registration`,
            vat: 0, // Default VAT rate
          };

          const { error: invoiceError } = await supabase
            .from("invoices")
            .insert(invoicePayload);

          if (invoiceError) {
            console.error("Error creating invoice:", invoiceError);
            console.error("Error details:", {
              message: invoiceError.message,
              details: invoiceError.details,
              hint: invoiceError.hint,
              code: invoiceError.code,
            });
            // Don&apos;t throw error here - member was created successfully
            toast.error(
              `Member created successfully, but invoice creation failed: ${invoiceError.message}`,
            );
          } else {
            toast.success(`Member and invoice created successfully!`);
          }
        } else {
          toast.success(`Member ${member ? "updated" : "added"} successfully!`);
        }
      }

      if (onSaved) onSaved(savedMember);
      onClose();
    } catch (err: any) {
      console.error("❌ Form submission error:", err);

      // Enhanced error handling with specific error types
      let errorMessage = "An unknown error occurred.";

      if (err.code === "23505") {
        errorMessage =
          "A member with this email or phone number already exists.";
      } else if (err.code === "23502") {
        errorMessage =
          "Required field is missing. Please check all required fields.";
      } else if (err.code === "23503") {
        errorMessage = "Invalid reference (e.g., trainer, plan, or branch ID).";
      } else if (err.code === "42P01") {
        errorMessage = "Database table not found. Please contact support.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Log detailed error information
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack,
      });

      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed setDrawerOpen useEffect - this component uses Dialog, not drawer

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title={member ? "Edit Member" : "Add New Member"}
          subtitle="Create or update member information"
          maxWidth="max-w-7xl"
          footer={
            <div className="flex items-center justify-end space-x-3">
              <SmartButton variant="secondary" onClick={onClose}>
                Cancel
              </SmartButton>
              <SmartButton
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                loading={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : member
                    ? "Update Member"
                    : "Add Member"}
              </SmartButton>
            </div>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Progress Steps */}
            <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
                      currentStep === index
                        ? "bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-2 border-transparent"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep === index
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span className="text-sm font-medium">{step.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Step Content */}
            <div className="min-h-[600px] bg-gray-50 rounded-2xl p-8">
              {renderCurrentStep()}
            </div>
          </form>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default MemberFormModal;
