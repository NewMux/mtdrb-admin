import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { SmartClassModal } from "./modals/SmartClassModal";
import { SmartButton } from "../ui/DesignSystem";
import type { Class } from "../../types";

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  mode?: "add" | "edit";
  classData?: Class | null;
}

const schema = z.object({
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
    .max(200, "Capacity cannot exceed 200"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  room: z.string().optional(),
  recurring: z.boolean().optional(),
  recurring_pattern: z.string().optional(),
  recurring_end_date: z.string().optional(),
  recurring_frequency: z.coerce.number().optional(),
  skip_holidays: z.boolean().optional(),
  max_instances: z.coerce.number().optional(),
  equipment_required: z.string().optional(),
  skill_level: z.string().optional(),
  special_requirements: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ClassTypeOption {
  value: string;
  label: string;
  color: string;
  suggestedCapacity: { min: number; max: number };
  suggestedDuration: number;
  equipment: string[];
  skillLevels: string[];
}

const classTypes: ClassTypeOption[] = [
  {
    value: "yoga",
    label: "Yoga",
    color: "#10B981",
    suggestedCapacity: { min: 8, max: 25 },
    suggestedDuration: 60,
    equipment: ["Yoga mats", "Blocks", "Straps"],
    skillLevels: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    value: "hiit",
    label: "HIIT",
    color: "#EF4444",
    suggestedCapacity: { min: 6, max: 20 },
    suggestedDuration: 45,
    equipment: ["Kettlebells", "Dumbbells", "Battle ropes", "Plyo boxes"],
    skillLevels: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    value: "pilates",
    label: "Pilates",
    color: "#8B5CF6",
    suggestedCapacity: { min: 6, max: 15 },
    suggestedDuration: 50,
    equipment: ["Reformer machines", "Mats", "Resistance bands"],
    skillLevels: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    value: "cardio",
    label: "Cardio",
    color: "#F59E0B",
    suggestedCapacity: { min: 10, max: 30 },
    suggestedDuration: 45,
    equipment: ["Treadmills", "Bikes", "Ellipticals"],
    skillLevels: ["All levels"],
  },
  {
    value: "strength",
    label: "Strength Training",
    color: "#3B82F6",
    suggestedCapacity: { min: 4, max: 12 },
    suggestedDuration: 60,
    equipment: ["Barbells", "Dumbbells", "Plates", "Racks"],
    skillLevels: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    value: "spin",
    label: "Spin Class",
    color: "#EC4899",
    suggestedCapacity: { min: 8, max: 25 },
    suggestedDuration: 45,
    equipment: ["Spin bikes", "Towels", "Water bottles"],
    skillLevels: ["All levels"],
  },
  {
    value: "crossfit",
    label: "CrossFit",
    color: "#DC2626",
    suggestedCapacity: { min: 6, max: 15 },
    suggestedDuration: 60,
    equipment: [
      "Olympic bars",
      "Plates",
      "Kettlebells",
      "Pull-up bars",
      "Boxes",
    ],
    skillLevels: ["Intermediate", "Advanced"],
  },
  {
    value: "zumba",
    label: "Zumba",
    color: "#7C3AED",
    suggestedCapacity: { min: 10, max: 40 },
    suggestedDuration: 50,
    equipment: ["Sound system", "Open floor space"],
    skillLevels: ["All levels"],
  },
  {
    value: "boxing",
    label: "Boxing",
    color: "#059669",
    suggestedCapacity: { min: 6, max: 16 },
    suggestedDuration: 60,
    equipment: ["Heavy bags", "Speed bags", "Gloves", "Hand wraps"],
    skillLevels: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    value: "swimming",
    label: "Swimming",
    color: "#0891B2",
    suggestedCapacity: { min: 4, max: 12 },
    suggestedDuration: 45,
    equipment: ["Pool lanes", "Kickboards", "Pull buoys"],
    skillLevels: ["Beginner", "Intermediate", "Advanced"],
  },
];

const rooms = [
  {
    id: "studio-a",
    name: "Studio A (Main)",
    maxCapacity: 40,
    suitableFor: ["yoga", "pilates", "hiit", "zumba"],
    equipment: ["Mirrors", "Sound system", "Air conditioning"],
  },
  {
    id: "studio-b",
    name: "Studio B (Small)",
    maxCapacity: 20,
    suitableFor: ["yoga", "pilates", "strength"],
    equipment: ["Mirrors", "Basic sound system"],
  },
  {
    id: "gym-floor",
    name: "Gym Floor",
    maxCapacity: 30,
    suitableFor: ["strength", "crossfit", "hiit"],
    equipment: ["Full weight equipment", "Cardio machines"],
  },
  {
    id: "spin-room",
    name: "Spin Room",
    maxCapacity: 25,
    suitableFor: ["spin"],
    equipment: ["25 spin bikes", "Sound system", "Climate control"],
  },
  {
    id: "pool",
    name: "Pool Area",
    maxCapacity: 12,
    suitableFor: ["swimming"],
    equipment: ["6 lanes", "Pool equipment storage"],
  },
  {
    id: "boxing-room",
    name: "Boxing Room",
    maxCapacity: 16,
    suitableFor: ["boxing"],
    equipment: ["Heavy bags", "Speed bags", "Ring"],
  },
  {
    id: "outdoor",
    name: "Outdoor Area",
    maxCapacity: 50,
    suitableFor: ["hiit", "cardio", "bootcamp"],
    equipment: ["Weather dependent", "Portable equipment"],
  },
];

// Recurring patterns - for future recurring class scheduling feature
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _recurringPatterns = [
  { value: "daily", label: "Daily", description: "Every day" },
  { value: "weekly", label: "Weekly", description: "Same day each week" },
  { value: "biweekly", label: "Bi-weekly", description: "Every 2 weeks" },
  { value: "monthly", label: "Monthly", description: "Same date each month" },
  { value: "custom", label: "Custom", description: "Set your own pattern" },
];

// Custom frequency types - for future custom scheduling
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _customFrequencyTypes = [
  { value: "days", label: "Days", example: "Every 3 days" },
  { value: "weeks", label: "Weeks", example: "Every 2 weeks" },
  { value: "months", label: "Months", example: "Every 2 months" },
];

interface RoomOption {
  id: string;
  name: string;
  maxCapacity: number;
  suitableFor: string[];
  equipment: string[];
}

interface TrainerOption {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  specialty?: string;
  specialties?: string[];
  rating?: number;
}

export default function ClassFormModal({
  isOpen,
  onClose,
  onSaved,
  mode = "add",
  classData,
}: ClassFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [selectedClassType, setSelectedClassType] =
    useState<ClassTypeOption | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { user, tenantId } = useAuth();

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
      name: "",
      type: "",
      description: "",
      date: "",
      time: "",
      duration: 60,
      trainer_id: "",
      capacity: 20,
      price: 25,
      room: "",
      recurring: false,
      recurring_pattern: "",
      recurring_end_date: "",
      recurring_frequency: 1,
      skip_holidays: false,
      max_instances: 12,
      equipment_required: "",
      skill_level: "",
      special_requirements: "",
    },
  });

  // Watch values for form reactivity - recurring features for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _watchRecurring = watch("recurring");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _watchRecurringPattern = watch("recurring_pattern");
  const watchType = watch("type");
  const watchRoom = watch("room");
  const watchCapacity = watch("capacity");

  useEffect(() => {
    if (isOpen) {
      // Load trainers when modal opens
      const fetchTrainers = async () => {
        try {
          const { data, error } = await supabase
            .from("trainers")
            .select("id, first_name, last_name, specialties, status")
            .eq("tenant_id", tenantId)
            .eq("status", "active")
            .order("first_name");

          if (error) throw error;
          setTrainers(
            (data || []).map((t) => ({
              id: t.id,
              name: `${t.first_name || ""} ${t.last_name || ""}`.trim(),
              specialty: Array.isArray(t.specialties) ? t.specialties.join(", ") : "",
            }))
          );
        } catch (error) {
          console.error("Error loading trainers:", error);
          toast.error("Failed to load trainers");
        }
      };
      
      fetchTrainers();
      
      if (mode === "edit" && classData) {
        // Populate form with existing data
        const classDataObj = classData as unknown as Record<string, string | number | boolean | undefined>;
        Object.keys(classDataObj).forEach((key) => {
          const value = classDataObj[key];
          if (key in schema.shape) {
            setValue(key as keyof FormData, value);
          }
        });
      } else {
        reset();
      }
    }
  }, [isOpen, mode, classData, reset, setValue, tenantId]);

  // Update class type suggestions when type changes
  useEffect(() => {
    const classType = classTypes.find((ct) => ct.value === watchType);
    setSelectedClassType(classType ?? null);

    if (classType && mode === "add") {
      // Auto-suggest capacity and duration
      setValue("capacity", classType.suggestedCapacity.min);
      setValue("duration", classType.suggestedDuration);
    }
  }, [watchType, setValue, mode]);

  // Update room constraints when room changes
  useEffect(() => {
    const room = rooms.find((r) => r.id === watchRoom);
    setSelectedRoom(room ?? null);

    if (room && watchCapacity > room.maxCapacity) {
      setValue("capacity", room.maxCapacity);
      toast.success(`Capacity adjusted to room maximum: ${room.maxCapacity}`);
    }
  }, [watchRoom, setValue, watchCapacity]);

  const onSubmit = async (data: FormData) => {
    if (!tenantId || !user) {
      toast.error("Please log in again");
      return;
    }

    setLoading(true);
    try {
      // Time overlap validation
      const startTime = new Date(`${data.date}T${data.time}`);
      const endTime = new Date(startTime.getTime() + data.duration * 60000);
      // Check for trainer double-booking
      const { data: trainerConflicts, error: trainerError } = await supabase
        .from("classes")
        .select("id, name, start_time, end_time, trainer_id, room")
        .eq("tenant_id", tenantId)
        .eq("trainer_id", data.trainer_id)
        .neq("id", classData?.id || "")
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
          .eq("tenant_id", tenantId)
          .eq("room", data.room)
          .neq("id", classData?.id || "")
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

      const classPayload = {
        ...data,
        tenant_id: tenantId,
        created_by: user.id,
      };

      let result;
      if (mode === "edit" && classData?.id) {
        const { data: updatedClass, error } = await supabase
          .from("classes")
          .update(classPayload)
          .eq("id", classData.id)
          .eq("tenant_id", tenantId)
          .select()
          .single();

        if (error) throw error;
        result = updatedClass;
        toast.success("Class updated successfully!");
      } else {
        const { data: newClass, error } = await supabase
          .from("classes")
          .insert([classPayload])
          .select()
          .single();

        if (error) throw error;
        result = newClass;
        toast.success("Class created successfully!");
      }

      // Handle recurring classes
      if (data.recurring && data.recurring_pattern && mode === "add") {
        const instancesCreated = await createRecurringClasses(result, data);
        toast.success(`Created ${instancesCreated} recurring classes!`);
      }

      onSaved?.();
      onClose();
      reset();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save class");
    } finally {
      setLoading(false);
    }
  };

  const createRecurringClasses = async (
    baseClass: { id: string; tenant_id: string; name: string; [key: string]: unknown },
    formData: FormData,
  ): Promise<number> => {
    try {
      const recurringClasses = [];
      const baseDate = new Date(formData.date);
      const endDate = formData.recurring_end_date
        ? new Date(formData.recurring_end_date)
        : null;
      const maxInstances = formData.max_instances || 12;
      const frequency = formData.recurring_frequency || 1;

      let currentDate = new Date(baseDate);
      let instanceCount = 0;

      while (instanceCount < maxInstances) {
        const nextDate = new Date(currentDate);

        // Calculate next date based on pattern
        switch (formData.recurring_pattern) {
          case "daily":
            nextDate.setDate(currentDate.getDate() + frequency);
            break;
          case "weekly":
            nextDate.setDate(currentDate.getDate() + frequency * 7);
            break;
          case "biweekly":
            nextDate.setDate(currentDate.getDate() + frequency * 14);
            break;
          case "monthly":
            nextDate.setMonth(currentDate.getMonth() + frequency);
            break;
          case "custom":
            // Custom frequency handled by frequency value
            nextDate.setDate(currentDate.getDate() + frequency);
            break;
          default:
            nextDate.setDate(currentDate.getDate() + 7); // Default to weekly
        }

        // Check if we&apos;ve reached the end date
        if (endDate && nextDate > endDate) {
          break;
        }

        // Skip holidays if requested (basic implementation - skip weekends for now)
        if (formData.skip_holidays) {
          const dayOfWeek = nextDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            // Sunday or Saturday
            currentDate = nextDate;
            continue;
          }
        }

        recurringClasses.push({
          ...baseClass,
          id: undefined, // Let Supabase generate new IDs
          date: nextDate.toISOString().split("T")[0],
          created_at: undefined,
          updated_at: undefined,
        });

        currentDate = nextDate;
        instanceCount++;
      }

      if (recurringClasses.length > 0) {
        const { error } = await supabase
          .from("classes")
          .insert(recurringClasses);

        if (error) throw error;
      }

      return recurringClasses.length;
    } catch (error) {
      console.error("Error creating recurring classes:", error);
      toast.error("Failed to create some recurring classes");
      return 0;
    }
  };

  // Helper function for capacity limits - used by form validation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getCapacityLimits = () => {
    let minCapacity = 1;
    let maxCapacity = 200;
    let suggestedCapacity = 20;

    if (selectedClassType) {
      minCapacity = selectedClassType.suggestedCapacity.min;
      suggestedCapacity = selectedClassType.suggestedCapacity.min;
    }

    if (selectedRoom) {
      maxCapacity = selectedRoom.maxCapacity;
    }

    return { min: minCapacity, max: maxCapacity, suggested: suggestedCapacity };
  };

  // Helper function for filtering suitable rooms - used by room selector
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getSuitableRooms = () => {
    if (!watchType) return rooms;
    return rooms.filter((room) => room.suitableFor.includes(watchType));
  };

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
                {classTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
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
                    {trainer.name}
                    {trainer.specialty && ` (${trainer.specialty})`}
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
                    {selectedClassType?.skillLevels.map((level) => (
                      <option key={level} value={level.toLowerCase()}>
                        {level}
                      </option>
                    ))}
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
