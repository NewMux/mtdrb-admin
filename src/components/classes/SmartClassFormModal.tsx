import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiCalendar,
  FiClock,
  FiUsers,
  FiDollarSign,
  FiUser,
  FiMapPin,
  FiZap,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiStar,
  FiTarget,
  FiBarChart,
  FiCpu,
  FiX,
  FiBook,
  FiActivity,
  FiTrendingDown,
  FiAlertCircle,
  FiHeart,
  FiSave,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { SmartClassModal } from "./modals/SmartClassModal";

interface SmartClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  mode?: "add" | "edit";
  classData?: any;
}

interface GymProblem {
  id: string;
  type: "scheduling" | "attendance" | "revenue" | "capacity" | "satisfaction";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  impact: string;
  solution: string;
  estimatedImprovement: string;
  priority: number;
}

interface SmartSolution {
  problemId: string;
  type:
    | "class_creation"
    | "schedule_optimization"
    | "pricing_strategy"
    | "trainer_allocation";
  title: string;
  description: string;
  implementation: any;
  expectedOutcome: string;
  confidence: number;
  timeToImpact: string;
}

interface TrainerAvailability {
  id: string;
  name: string;
  available: boolean;
  nextAvailable?: string;
  rating: number;
  specialties: string[];
  bookingCount: number;
  utilization: number;
  performance: "excellent" | "good" | "average" | "needs_improvement";
}

const problemTypes = [
  {
    value: "low_attendance",
    label: "Low Class Attendance",
    icon: FiTrendingDown,
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  {
    value: "poor_timing",
    label: "Poor Schedule Optimization",
    icon: FiClock,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    value: "revenue_loss",
    label: "Revenue Optimization",
    icon: FiDollarSign,
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    value: "trainer_utilization",
    label: "Trainer Under-utilization",
    icon: FiUsers,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    value: "member_satisfaction",
    label: "Member Satisfaction Issues",
    icon: FiAlertCircle,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    value: "capacity_waste",
    label: "Room/Capacity Underutilization",
    icon: FiTarget,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
];

const classTypes = [
  { value: "yoga", label: "Yoga", color: "#10B981", popularity: 85 },
  { value: "hiit", label: "HIIT", color: "#EF4444", popularity: 92 },
  { value: "pilates", label: "Pilates", color: "#8B5CF6", popularity: 67 },
  { value: "cardio", label: "Cardio", color: "#F59E0B", popularity: 78 },
  {
    value: "strength",
    label: "Strength Training",
    color: "#3B82F6",
    popularity: 73,
  },
  { value: "spin", label: "Spin Class", color: "#EC4899", popularity: 65 },
];

const optimalTimeSlots = [
  {
    time: "06:00",
    label: "6:00 AM",
    demand: "High",
    revenue: "$45",
    popularity: 88,
  },
  {
    time: "07:00",
    label: "7:00 AM",
    demand: "Very High",
    revenue: "$50",
    popularity: 95,
  },
  {
    time: "09:00",
    label: "9:00 AM",
    demand: "Medium",
    revenue: "$35",
    popularity: 65,
  },
  {
    time: "12:00",
    label: "12:00 PM",
    demand: "Low",
    revenue: "$25",
    popularity: 45,
  },
  {
    time: "17:00",
    label: "5:00 PM",
    demand: "High",
    revenue: "$42",
    popularity: 85,
  },
  {
    time: "18:00",
    label: "6:00 PM",
    demand: "Very High",
    revenue: "$48",
    popularity: 92,
  },
  {
    time: "19:00",
    label: "7:00 PM",
    demand: "High",
    revenue: "$45",
    popularity: 89,
  },
  {
    time: "20:00",
    label: "8:00 PM",
    demand: "Medium",
    revenue: "$38",
    popularity: 72,
  },
];

const schema = z.object({
  problemType: z.string().min(1, "Please select a problem to solve"),
  name: z.string().min(1, "Class name is required"),
  type: z.string().min(1, "Class type is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.coerce
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(180, "Duration cannot exceed 3 hours"),
  trainer_id: z.string().min(1, "Trainer is required"),
  capacity: z.coerce
    .number()
    .min(1, "Capacity must be at least 1")
    .max(50, "Capacity cannot exceed 50"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  room: z.string().optional(),
  solutionStrategy: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SmartClassFormModal({
  isOpen,
  onClose,
  onSaved,
  mode = "add",
  classData,
}: SmartClassFormModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [identifiedProblems, setIdentifiedProblems] = useState<GymProblem[]>(
    [],
  );
  const [smartSolutions, setSmartSolutions] = useState<SmartSolution[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<string>("");
  const [trainerAvailability, setTrainerAvailability] = useState<
    TrainerAvailability[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      problemType: "",
      name: "",
      type: "",
      description: "",
      date: "",
      time: "",
      duration: 60,
      trainer_id: "",
      capacity: 15,
      price: 25,
      room: "",
      solutionStrategy: "",
    },
  });

  const watchedProblemType = watch("problemType");
  const watchedType = watch("type");
  const watchedDate = watch("date");
  const watchedTime = watch("time");

  useEffect(() => {
    if (isOpen) {
      reset();
      setCurrentStep(1);
      setIdentifiedProblems([]);
      setSmartSolutions([]);
      setSelectedProblem("");
      analyzeGymProblems();
    }
  }, [isOpen, reset]);

  const analyzeGymProblems = async () => {
    setAnalyzing(true);

    // Simulate Smart analysis of gym data
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const problems: GymProblem[] = [
      {
        id: "low_attendance_evening",
        type: "attendance",
        severity: "high",
        title: "Evening Classes Under-performing",
        description:
          "6-8 PM slots showing 40% average attendance vs 85% morning slots",
        impact: "Revenue loss: $1,200/month, Member dissatisfaction increasing",
        solution: "Introduce high-energy HIIT classes with popular trainers",
        estimatedImprovement: "+60% attendance, +$800 monthly revenue",
        priority: 1,
      },
      {
        id: "trainer_underutilized",
        type: "capacity",
        severity: "medium",
        title: "Trainer Mike Chen Under-utilized",
        description: "Only 8 hours/week scheduled vs optimal 15 hours",
        impact: "Wasted resource cost: $500/week, Trainer satisfaction risk",
        solution: "Create specialized strength training program",
        estimatedImprovement: "+7 hours utilization, +$350 weekly revenue",
        priority: 2,
      },
      {
        id: "weekend_gap",
        type: "scheduling",
        severity: "medium",
        title: "Weekend Morning Gap",
        description:
          "No classes scheduled 8-10 AM weekends despite high demand",
        impact: "Missing 60 potential bookings/month",
        solution: "Weekend warrior bootcamp series",
        estimatedImprovement: "+50 bookings/month, +$1,250 revenue",
        priority: 3,
      },
      {
        id: "yoga_demand",
        type: "satisfaction",
        severity: "medium",
        title: "Unmet Yoga Demand",
        description:
          "12 members on yoga class waitlist, current classes at 100%",
        impact: "Member churn risk, waiting list growing 15%/month",
        solution: "Add morning yoga session with Sarah Johnson",
        estimatedImprovement: "12 immediate bookings, reduced churn risk",
        priority: 4,
      },
    ];

    setIdentifiedProblems(problems);
    setAnalyzing(false);
  };

  const generateSolutionsForProblem = async (problemType: string) => {
    setAnalyzing(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const solutionMap: Record<string, SmartSolution[]> = {
      low_attendance: [
        {
          problemId: "low_attendance_evening",
          type: "class_creation",
          title: "High-Energy Evening HIIT",
          description:
            "Create 6:30 PM HIIT class with upbeat music and social elements",
          implementation: {
            name: "Power Hour HIIT",
            type: "hiit",
            time: "18:30",
            capacity: 12,
            price: 35,
            trainer_id: "trainer-2",
          },
          expectedOutcome: "+60% attendance, higher member engagement",
          confidence: 87,
          timeToImpact: "2-3 weeks",
        },
      ],
      trainer_utilization: [
        {
          problemId: "trainer_underutilized",
          type: "schedule_optimization",
          title: "Strength Training Specialization",
          description:
            "Leverage Mike Chen's expertise with dedicated strength programs",
          implementation: {
            name: "Strength Foundations",
            type: "strength",
            time: "19:00",
            capacity: 8,
            price: 40,
            trainer_id: "trainer-2",
          },
          expectedOutcome: "+7 hours utilization, premium pricing",
          confidence: 92,
          timeToImpact: "1 week",
        },
      ],
      poor_timing: [
        {
          problemId: "weekend_gap",
          type: "class_creation",
          title: "Weekend Warrior Bootcamp",
          description:
            "High-intensity weekend morning class for busy professionals",
          implementation: {
            name: "Weekend Warrior",
            type: "hiit",
            time: "09:00",
            capacity: 15,
            price: 30,
            trainer_id: "trainer-4",
          },
          expectedOutcome: "+50 weekly bookings, new member segment",
          confidence: 83,
          timeToImpact: "1-2 weeks",
        },
      ],
    };

    const solutions = solutionMap[problemType] || [];
    setSmartSolutions(solutions);
    setAnalyzing(false);
  };

  const applySolution = (solution: SmartSolution) => {
    const impl = solution.implementation;
    setValue("name", impl.name);
    setValue("type", impl.type);
    setValue("time", impl.time);
    setValue("capacity", impl.capacity);
    setValue("price", impl.price);
    setValue("trainer_id", impl.trainer_id);
    setValue("solutionStrategy", solution.title);

    toast.success(`Applied solution: ${solution.title}`);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 1 && (selectedProblem || watchedProblemType)) {
        generateSolutionsForProblem(selectedProblem || watchedProblemType);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Time overlap validation
      const startTime = new Date(`${data.date}T${data.time}`);
      const endTime = new Date(startTime.getTime() + data.duration * 60000);
      // Check for trainer double-booking
      const { data: trainerConflicts, error: trainerError } = await supabase
        .from("classes")
        .select("id, name, start_time, end_time, trainer_id, room")
        .eq("tenant_id", membershipData.tenant_id)
        .eq("trainer_id", data.trainer_id)
        .or(
          `and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`,
        );
      if (trainerError) throw trainerError;
      if (trainerConflicts && trainerConflicts.length > 0) {
        toast.error(
          "Trainer is already booked for another class at this time.",
        );
        setLoading(false);
        return;
      }
      // Check for room double-booking
      if (data.room) {
        const { data: roomConflicts, error: roomError } = await supabase
          .from("classes")
          .select("id, name, start_time, end_time, trainer_id, room")
          .eq("tenant_id", membershipData.tenant_id)
          .eq("room", data.room)
          .or(
            `and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`,
          );
        if (roomError) throw roomError;
        if (roomConflicts && roomConflicts.length > 0) {
          toast.error("Room is already booked for another class at this time.");
          setLoading(false);
          return;
        }
      }
      // Implementation remains the same...
      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .single();

      if (membershipError || !membershipData) {
        throw new Error("Unable to determine tenant");
      }

      const classPayload = {
        tenant_id: membershipData.tenant_id,
        name: data.name,
        description:
          data.description || `Smart solution: ${data.solutionStrategy}`,
        type: data.type,
        starttime: startTime.toISOString(),
        endtime: endTime.toISOString(),
        trainer_id: data.trainer_id,
        capacity: data.capacity,
        price: data.price,
        room: data.room,
        status: "active",
      };

      const { error } = await supabase.from("classes").insert([classPayload]);

      if (error) throw error;

      toast.success("Problem solved! Smart class created successfully!");
      onSaved?.();
      onClose();
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error("Failed to create solution");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: "Problem Analysis",
      description: "Identify gym challenges",
    },
    {
      number: 2,
      title: "Smart Solutions",
      description: "Smart-powered recommendations",
    },
    {
      number: 3,
      title: "Solution Configuration",
      description: "Customize implementation",
    },
    { number: 4, title: "Impact Preview", description: "Expected outcomes" },
  ];

  if (!isOpen) return null;

  return (
    <SmartClassModal
      open={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Edit Class" : "Create New Class"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Name *
              </label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Morning Yoga Flow"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Type *
              </label>
              <select
                {...register("type")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select class type</option>
                <option value="yoga">Yoga</option>
                <option value="pilates">Pilates</option>
                <option value="hiit">HIIT</option>
                <option value="strength">Strength Training</option>
                <option value="cardio">Cardio</option>
                <option value="spinning">Spinning</option>
                <option value="zumba">Zumba</option>
                <option value="boxing">Boxing</option>
                <option value="martial-arts">Martial Arts</option>
                <option value="dance">Dance</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the class, equipment needed, difficulty level..."
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                {...register("date")}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().split("T")[0]}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                {...register("time")}
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.time && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.time.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                {...register("duration")}
                type="number"
                min="15"
                max="180"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Trainer & Capacity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trainer & Capacity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trainer
              </label>
              <select
                {...register("trainer_id")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select trainer</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} - {trainer.specialty}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity
              </label>
              <input
                {...register("capacity")}
                type="number"
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (BHD)
              </label>
              <input
                {...register("price")}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Advanced Settings
            </h3>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Required
                  </label>
                  <input
                    {...register("equipment_required")}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Yoga mat, weights"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Level
                  </label>
                  <select
                    {...register("skill_level")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select skill level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all-levels">All Levels</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requirements
                </label>
                <textarea
                  {...register("special_requirements")}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or notes..."
                />
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Footer with Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-end space-x-3">
          <SmartButton variant="ghost" onClick={onClose}>
            Cancel
          </SmartButton>
          <SmartButton
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : mode === "edit"
                ? "Update Class"
                : "Create Class"}
          </SmartButton>
        </div>
      </div>
    </SmartClassModal>
  );
}
