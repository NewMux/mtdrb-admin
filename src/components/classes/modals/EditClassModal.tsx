import React, { useState, useEffect } from "react";
import {
  FiEdit,
  FiClock,
  FiUsers,
  FiUser,
  FiCalendar,
  FiZap,
  FiAlertCircle,
  FiCheck,
  FiBell,
} from "react-icons/fi";
import { UnifiedModal } from "../../ui/UnifiedModal";
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
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

type RecurrenceOption = "none" | "daily" | "weekly" | "biweekly" | "monthly";

interface ClassFormData {
  name: string;
  description: string;
  type: string;
  trainer_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  date: string;
  recurrence: RecurrenceOption;
  capacity: number;
}

const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  isPro = false,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    description: "",
    type: "",
    trainer_id: "",
    room_id: "",
    start_time: "",
    end_time: "",
    date: "",
    recurrence: "none",
    capacity: 20,
  });

  const [loading, setLoading] = useState(false);
  const [notifyMembers, setNotifyMembers] = useState(false);
  const [originalData, setOriginalData] = useState<Record<string, unknown> | null>(null);

  const {
    classData,
    trainers,
    rooms,
    errors,
    recommendations,
    conflicts,
    checkConflicts,
    validateForm,
    fetchClass,
    saveClass,
  } = useSmartClassModal({ classId, isPro });

  // Load class data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
    }
  }, [isOpen, classId, fetchClass]);

  // Populate form when class data is loaded
  useEffect(() => {
    if (classData) {
      const data = {
        name: classData.name || "",
        description: classData.description || "",
        type: classData.type || "",
        trainer_id: classData.trainer_id || "",
        room_id: classData.room_id || "",
        start_time: classData.start_time || "",
        end_time: classData.end_time || "",
        date: classData.date || "",
        recurrence: classData.recurrence || "none",
        capacity: classData.capacity || 20,
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [classData]);

  // Check for conflicts when trainer or time changes
  useEffect(() => {
    if (
      formData.trainer_id &&
      formData.start_time &&
      formData.end_time &&
      formData.date
    ) {
      checkConflicts(
        formData.trainer_id,
        formData.start_time,
        formData.end_time,
        formData.date,
        classId,
      );
    }
  }, [
    formData.trainer_id,
    formData.start_time,
    formData.end_time,
    formData.date,
    checkConflicts,
    classId,
  ]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!validateForm(formData)) {
      return;
    }

    setLoading(true);
    try {
      const success = await saveClass({ ...formData, id: classId });
      if (success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error("Error updating class:", error);
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) => {
    return errors.find((error) => error.field === field)?.message;
  };

  const hasChanges = () => {
    if (!originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
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
    { value: "none", label: "No Recurrence" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  const isFormValid =
    formData.name &&
    formData.type &&
    formData.start_time &&
    formData.end_time &&
    formData.date &&
    formData.capacity > 0;

  if (!classData) {
    return (
      <UnifiedModal
        isOpen={isOpen}
        onClose={onClose}
        title={t("classes.editClass", "تعديل الحصة")}
        subtitle={t("classes.loadingClassData", "جاري تحميل بيانات الحصة...")}
        maxWidth="4xl"
        slideFrom="right"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedModal>
    );
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("classes.editClass", "تعديل الحصة")}
      subtitle={`${t("classes.update", "تحديث تفاصيل")} ${classData.name}`}
      isProFeature={isPro}
      maxWidth="4xl"
      slideFrom="right"
      footer={
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
            {isPro && recommendations.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <FiZap className="h-4 w-4 flex-shrink-0" />
                <span>{t("classes.smartSuggestions", `${recommendations.length} مقترحات ذكية`)}</span>
              </div>
            )}
            {hasChanges() && (
              <div className="flex items-center gap-1 text-sm text-orange-600">
                <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{t("classes.changesDetected", "تم اكتشاف تغييرات")}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t("common.cancel", "إلغاء")}
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t("classes.updating", "جاري التحديث...") : t("classes.updateClass", "تحديث الحصة")}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-start" dir={isRTL ? "rtl" : "ltr"}>
        {/* Class Status */}
        <div className="p-4 bg-light-50 dark:bg-dark-700 rounded-xl border border-light-200 dark:border-dark-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
                Class Status
              </h3>
              <p className="text-sm text-light-600 dark:text-dark-400">
                {classData.enrolled_count} enrolled • {classData.waitlist_count}{" "}
                on waitlist
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                classData.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : classData.status === "cancelled"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
              }`}
            >
              {classData.status}
            </div>
          </div>
        </div>

        {/* Smart Recommendations */}
        {isPro && recommendations.length > 0 && (
          <FormSection
            title={t("classes.smartRecommendations")}
            subtitle={t("classes.smartSuggestionsToOptimize") || "Smart suggestions to optimize your class"}
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
          subtitle="Basic details about your class"
          icon={<FiEdit className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Class Name"
              value={formData.name}
              onChange={(value) => handleInputChange("name", value)}
              placeholder="e.g., Morning Yoga Flow"
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
          <FormField
            label="Description"
            value={formData.description}
            onChange={(value) => handleInputChange("description", value)}
            placeholder="Describe the class, equipment needed, difficulty level..."
            type="textarea"
          />
        </FormSection>

        {/* Trainer & Location */}
        <FormSection
          title={t("classes.trainerLocation")}
          subtitle="Assign trainer and select room"
          icon={<FiUser className="h-5 w-5" />}
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

        {/* Time & Date */}
        <FormSection
          title="Time & Date"
          subtitle="Schedule your class"
          icon={<FiClock className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateField
              label="Date"
              value={formData.date}
              onChange={(value) => handleInputChange("date", value)}
              error={getError("date")}
              required
              min={new Date().toISOString().split("T")[0]}
            />
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
        </FormSection>

        {/* Recurrence */}
        <FormSection
          title="Recurrence"
          subtitle="Set up recurring classes"
          icon={<FiCalendar className="h-5 w-5" />}
        >
          <SelectField
            label="Recurrence Pattern"
            value={formData.recurrence}
            onChange={(value) => handleInputChange("recurrence", value)}
            options={recurrenceOptions}
          />
        </FormSection>

        {/* Capacity */}
        <FormSection
          title="Capacity"
          subtitle="Set maximum number of participants"
          icon={<FiUsers className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Maximum Capacity"
              value={formData.capacity.toString()}
              onChange={(value) =>
                handleInputChange("capacity", parseInt(value) || 0)
              }
              type="number"
              error={getError("capacity")}
              required
            />
            <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
              <FiCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Available spots: {formData.capacity - classData.enrolled_count}
              </span>
            </div>
          </div>
        </FormSection>

        {/* Notification Settings */}
        {hasChanges() && classData.enrolled_count > 0 && (
          <FormSection
            title="Member Notifications"
            subtitle="Notify enrolled members about changes"
            icon={<FiBell className="h-5 w-5" />}
          >
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
              <input
                type="checkbox"
                id="notify-members"
                checked={notifyMembers}
                onChange={(e) => setNotifyMembers(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="notify-members"
                className="text-sm text-blue-900 dark:text-blue-100"
              >
                Send notification to {classData.enrolled_count} enrolled members
                about schedule changes
              </label>
            </div>
          </FormSection>
        )}

        {/* Conflict Alert */}
        <ConflictAlert conflicts={conflicts} />
      </div>
    </UnifiedModal>
  );
};

export default EditClassModal;
