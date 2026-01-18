import React, { useState, useEffect } from "react";
import {
  FiCalendar,
  FiClock,
  FiRepeat,
  FiZap,
  FiCheck,
} from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import {
  FormField,
  SelectField,
  TimeField,
  DateField,
  FormSection,
  SmartRecommendationCard,
  ConflictAlert,
} from "./SmartFormComponents";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";
import { SmartButton } from "../../ui/DesignSystem";
import { toast } from "react-hot-toast";

interface ScheduleClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const ScheduleClassModal: React.FC<ScheduleClassModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  isPro = false,
}) => {
  type RecurrenceOption = "daily" | "weekly" | "biweekly" | "monthly";

  interface ScheduleFormData {
    name: string;
    type: string;
    trainer_id: string;
    room_id: string;
    start_time: string;
    end_time: string;
    start_date: string;
    end_date: string;
    recurrence: RecurrenceOption;
    days_of_week: string[];
    max_occurrences: number;
  }

  const [formData, setFormData] = useState<ScheduleFormData>({
    name: "",
    type: "",
    trainer_id: "",
    room_id: "",
    start_time: "",
    end_time: "",
    start_date: "",
    end_date: "",
    recurrence: "weekly",
    days_of_week: [],
    max_occurrences: 12,
  });

  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_conflicts, _setConflicts] = useState<{ date: string; reason: string }[]>([]);
  const [optimalTimes, setOptimalTimes] = useState<string[]>([]);
  const [schedulePreview, setSchedulePreview] = useState<{ date: string; time: string; dayOfWeek: string }[]>([]);

  const {
    trainers,
    rooms,
    errors,
    recommendations,
    validateForm,
    getPopularTimeSlots,
  } = useSmartClassModal({ classId, isPro });

  const generateSchedulePreview = () => {
    if (
      !formData.start_date ||
      !formData.end_date ||
      formData.days_of_week.length === 0
    ) {
      setSchedulePreview([]);
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const preview: { date: string; time: string; dayOfWeek: string }[] = [];
    const currentDate = new Date(startDate);
    let occurrenceCount = 0;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    while (
      currentDate <= endDate &&
      (formData.max_occurrences === 0 || occurrenceCount < formData.max_occurrences)
    ) {
      const dayIndex = currentDate.getDay();
      const dayName = dayNames[dayIndex];

      if (formData.days_of_week.includes(dayName)) {
        preview.push({
          date: currentDate.toISOString().split("T")[0],
          time: formData.start_time || "09:00",
          dayOfWeek: dayName,
        });
        occurrenceCount++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setSchedulePreview(preview);
  };

  // Get optimal times on mount
  useEffect(() => {
    const fetchOptimalTimes = async () => {
      const times = await getPopularTimeSlots();
      setOptimalTimes(times);
    };
    fetchOptimalTimes();
  }, [getPopularTimeSlots]);

  // Generate schedule preview when form data changes
  useEffect(() => {
    if (
      formData.start_date &&
      formData.end_date &&
      formData.days_of_week.length > 0
    ) {
      generateSchedulePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.start_date,
    formData.end_date,
    formData.days_of_week,
    formData.recurrence,
    formData.max_occurrences,
    formData.start_time,
  ]);

  const handleInputChange = <K extends keyof ScheduleFormData>(
    field: K,
    value: ScheduleFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  const handleSave = async () => {
    if (!validateForm(formData)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Recurring classes scheduled successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("Failed to create schedule");
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) => {
    return errors.find((error) => error.field === field)?.message;
  };

  const classTypes = [
    { value: "yoga", label: "Yoga" },
    { value: "pilates", label: "Pilates" },
    { value: "hiit", label: "HIIT" },
    { value: "strength", label: "Strength Training" },
    { value: "cardio", label: "Cardio" },
    { value: "spinning", label: "Spinning" },
    { value: "zumba", label: "Zumba" },
    { value: "boxing", label: "Boxing" },
    { value: "martial-arts", label: "Martial Arts" },
    { value: "dance", label: "Dance" },
  ];

  const recurrenceOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  const isFormValid =
    formData.name &&
    formData.type &&
    formData.start_time &&
    formData.end_time &&
    formData.start_date &&
    formData.end_date &&
    formData.days_of_week.length > 0;

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Recurring Classes"
      subtitle="Create a series of classes with advanced scheduling"
      isProFeature={isPro}
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isPro && recommendations.length > 0 && (
              <div className="flex items-center space-x-1 text-sm text-blue-600">
                <FiZap className="h-4 w-4" />
                <span>{recommendations.length} Smart suggestions</span>
              </div>
            )}
            {schedulePreview.length > 0 && (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <FiCheck className="h-4 w-4" />
                <span>{schedulePreview.length} classes scheduled</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <SmartButton
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </SmartButton>
            <SmartButton
              variant="primary"
              onClick={handleSave}
              loading={loading}
              disabled={!isFormValid || loading}
            >
              {loading ? "Scheduling..." : "Create Schedule"}
            </SmartButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Smart Recommendations */}
        {isPro && recommendations.length > 0 && (
          <FormSection
            title="Smart Recommendations"
            subtitle="Smart suggestions for optimal scheduling"
            icon={<FiZap className="h-5 w-5" />}
            collapsible={true}
            defaultOpen={true}
          >
            <div className="space-y-3">
              {recommendations.map((recommendation) => (
                <SmartRecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onApply={() => {
                    // Apply recommendation logic
                  }}
                />
              ))}
            </div>
          </FormSection>
        )}

        {/* Class Information */}
        <FormSection
          title="Class Information"
          subtitle="Basic details about the recurring class"
          icon={<FiCalendar className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Class Name"
              value={formData.name}
              onChange={(value) => handleInputChange("name", value)}
              placeholder="e.g., Morning Yoga Series"
              error={getError("name")}
              required
            />
            <SelectField
              label="Class Type"
              value={formData.type}
              onChange={(value) => handleInputChange("type", value)}
              options={classTypes}
              placeholder="Select class type"
              error={getError("type")}
              required
            />
          </div>
        </FormSection>

        {/* Trainer & Location */}
        <FormSection
          title="Trainer & Location"
          subtitle="Assign trainer and select room"
          icon={<FiCalendar className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Trainer"
              value={formData.trainer_id}
              onChange={(value) => handleInputChange("trainer_id", value)}
              options={trainers.map((trainer) => ({
                value: trainer.id,
                label: trainer.name,
              }))}
              placeholder="Select trainer"
              error={getError("trainer_id")}
              required
            />
            <SelectField
              label="Room"
              value={formData.room_id}
              onChange={(value) => handleInputChange("room_id", value)}
              options={rooms.map((room) => ({
                value: room.id,
                label: `${room.name} (${room.capacity} capacity)`,
              }))}
              placeholder="Select room"
            />
          </div>
        </FormSection>

        {/* Time & Date Range */}
        <FormSection
          title="Time & Date Range"
          subtitle="Set the time and date range for the series"
          icon={<FiClock className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateField
              label="Start Date"
              value={formData.start_date}
              onChange={(value) => handleInputChange("start_date", value)}
              error={getError("start_date")}
              required
              min={new Date().toISOString().split("T")[0]}
            />
            <DateField
              label="End Date"
              value={formData.end_date}
              onChange={(value) => handleInputChange("end_date", value)}
              error={getError("end_date")}
              required
              min={
                formData.start_date || new Date().toISOString().split("T")[0]
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TimeField
              label="Start Time"
              value={formData.start_time}
              onChange={(value) => handleInputChange("start_time", value)}
              error={getError("start_time")}
              required
            />
            <TimeField
              label="End Time"
              value={formData.end_time}
              onChange={(value) => handleInputChange("end_time", value)}
              error={getError("end_time")}
              required
            />
          </div>

          {/* Optimal Times Suggestion */}
          {isPro && optimalTimes.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FiClock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Popular Time Slots
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {optimalTimes.slice(0, 5).map((time, index) => (
                  <button
                    key={index}
                    onClick={() => handleInputChange("start_time", time)}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </FormSection>

        {/* Recurrence Pattern */}
        <FormSection
          title="Recurrence Pattern"
          subtitle="Set how often the class repeats"
          icon={<FiRepeat className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Recurrence Type"
              value={formData.recurrence}
              onChange={(value) =>
                handleInputChange("recurrence", value as RecurrenceOption)
              }
              options={recurrenceOptions}
              required
            />
            <FormField
              label="Maximum Occurrences"
              value={formData.max_occurrences.toString()}
              onChange={(value) =>
                handleInputChange("max_occurrences", parseInt(value) || 12)
              }
              type="number"
              required
            />
          </div>
        </FormSection>

        {/* Days of Week */}
        <FormSection
          title="Days of Week"
          subtitle="Select which days the class will run"
          icon={<FiCalendar className="h-5 w-5" />}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {daysOfWeek.map((day) => (
              <button
                key={day.value}
                onClick={() => handleDayToggle(day.value)}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  formData.days_of_week.includes(day.value)
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                    : "border-light-200 dark:border-dark-600 bg-light-50 dark:bg-dark-700 text-light-700 dark:text-dark-300 hover:border-brand-300"
                }`}
              >
                <div className="text-sm font-medium">{day.label}</div>
              </button>
            ))}
          </div>
        </FormSection>

        {/* Schedule Preview */}
        {schedulePreview.length > 0 && (
          <FormSection
            title="Schedule Preview"
            subtitle={`${schedulePreview.length} classes will be created`}
            icon={<FiCheck className="h-5 w-5" />}
          >
            <div className="max-h-60 overflow-y-auto space-y-2">
              {schedulePreview.slice(0, 10).map((session, index) => (
                <div
                  key={index}
                  className="p-3 bg-light-50 dark:bg-dark-700 rounded-lg border border-light-200 dark:border-dark-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-dark-900 dark:text-white">
                        {new Date(session.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-sm text-light-600 dark:text-dark-400 ml-2">
                        {session.time}
                      </span>
                    </div>
                    <span className="text-xs text-light-500 dark:text-dark-500">
                      {session.dayOfWeek}
                    </span>
                  </div>
                </div>
              ))}
              {schedulePreview.length > 10 && (
                <div className="text-center text-sm text-light-600 dark:text-dark-400 py-2">
                  +{schedulePreview.length - 10} more classes
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Conflict Alert */}
        <ConflictAlert conflicts={_conflicts} />
      </div>
    </SmartModal>
  );
};

export default ScheduleClassModal;
