import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiUsers,
  FiUser,
  FiSettings,
  FiAlertTriangle,
  FiCheck,
  FiZap,
  FiStar,
  FiTrendingUp,
} from "react-icons/fi";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { AppleInput, AppleSelect, AppleTextarea } from "../../AppleStyleModal";
import {
  SmartRecommendationCard,
  ConflictAlert,
} from "./SmartFormComponents";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";
import { SmartButton } from "../../ui/DesignSystem";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const AddClassModal: React.FC<AddClassModalProps> = ({
  isOpen,
  onClose,
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
  const [popularTimeSlots, setPopularTimeSlots] = useState<string[]>([]);

  const {
    trainers,
    rooms,
    errors,
    recommendations,
    conflicts,
    checkConflicts,
    validateForm,
    getPopularTimeSlots,
    saveClass,
  } = useSmartClassModal({ isPro });

  useEffect(() => {
    const fetchPopularSlots = async () => {
      const slots = await getPopularTimeSlots();
      setPopularTimeSlots(slots);
    };
    fetchPopularSlots();
  }, [getPopularTimeSlots]);

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
      );
    }
  }, [
    formData.trainer_id,
    formData.start_time,
    formData.end_time,
    formData.date,
    checkConflicts,
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value) || 0 : value,
    }));
  };

  const handleInputChangeDirect = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!validateForm(formData)) {
      return;
    }
    setLoading(true);
    try {
      const success = await saveClass(formData);
      if (success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error("Error creating class:", error);
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) => {
    return errors.find((error) => error.field === field)?.message;
  };

  const classTypes = [
    { value: "yoga", label: t("classes.yoga") },
    { value: "pilates", label: t("classes.pilates") },
    { value: "hiit", label: t("classes.hiit") },
    { value: "strength", label: t("classes.strengthTraining") },
    { value: "cardio", label: t("classes.cardio") },
    { value: "spinning", label: t("classes.spinning") },
    { value: "zumba", label: t("classes.zumba") },
    { value: "boxing", label: t("classes.boxing") },
    { value: "martial-arts", label: t("classes.martialArts") },
    { value: "dance", label: t("classes.dance") },
  ];

  const recurrenceOptions = [
    { value: "none", label: t("classes.noRecurrence") },
    { value: "daily", label: t("classes.daily") },
    { value: "weekly", label: t("classes.weekly") },
    { value: "biweekly", label: t("classes.biweekly") },
    { value: "monthly", label: t("classes.monthly") },
  ];

  const isFormValid =
    formData.name &&
    formData.type &&
    formData.start_time &&
    formData.end_time &&
    formData.date &&
    formData.capacity > 0;

  const isTimeValid = () => {
    if (!formData.start_time || !formData.end_time) return true;
    const start = new Date(`2000-01-01T${formData.start_time}`);
    const end = new Date(`2000-01-01T${formData.end_time}`);
    return start < end;
  };

  const footer = (
    <div className="flex items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-2">
        {conflicts.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-orange-600">
            <FiAlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{t("classes.conflictsDetected", { count: conflicts.length })}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <SmartButton
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {t("common.cancel", "إلغاء")}
        </SmartButton>
        <SmartButton
          variant="primary"
          onClick={handleSave}
          loading={loading}
          disabled={!isFormValid || loading || !isTimeValid()}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {loading ? t("classes.creatingClass", "جاري الإنشاء...") : t("classes.createClass", "إنشاء الحصة")}
        </SmartButton>
      </div>
    </div>
  );

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("classes.addNewClass", "إضافة حصة جديدة")}
      subtitle={t("classes.createNewClassWithSmartScheduling", "إنشاء حصة رياضية جديدة بخيارات الجدولة الذكية")}
      footer={footer}
      maxWidth="4xl"
      slideFrom="right"
    >
      <form
        className="space-y-8 text-start"
        dir={isRTL ? "rtl" : "ltr"}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {/* Pro-only Smart Recommendations */}
        {isPro && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4"
          >
            <div className="flex items-center space-x-2 mb-3">
              <FiZap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("classes.smartRecommendations")}
              </h3>
              <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full">
                <FiStar className="h-3 w-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">
                  PRO
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {recommendations.map((recommendation) => (
                <SmartRecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onApply={() => {
                    // TODO: Implement recommendation application
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Class Details Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <FiSettings className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("classes.classDetails")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label={t("classes.className")}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Morning Yoga Flow"
              error={getError("name")}
              required
              aria-label={t("classes.className")}
            />
            <AppleSelect
              label={t("classes.classType") || "Class Type"}
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              aria-label={t("classes.classType") || "Class type"}
              error={getError("type")}
            >
              <option value="">{t("classes.selectClassType")}</option>
              {classTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </AppleSelect>
          </div>

          <AppleTextarea
            label={t("classes.description")}
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder={t("classes.describeClassEquipment")}
            rows={4}
            aria-label={t("classes.classDescription")}
          />
        </section>
        {/* Trainer & Location Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600">
              <FiUser className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("classes.trainerLocation")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleSelect
              label={t("classes.trainer")}
              name="trainer_id"
              value={formData.trainer_id}
              onChange={handleInputChange}
              required
              aria-label={t("classes.trainer")}
              error={getError("trainer_id")}
            >
              <option value="">{t("classes.selectTrainer")}</option>
              {trainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name}
                </option>
              ))}
            </AppleSelect>
            <AppleSelect
              label={t("classes.room")}
              name="room_id"
              value={formData.room_id}
              onChange={handleInputChange}
              aria-label={t("classes.room")}
            >
              <option value="">{t("classes.selectRoom")}</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.capacity} {t("classes.capacity")})
                </option>
              ))}
            </AppleSelect>
          </div>
        </section>
        {/* Date & Time Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600">
              <FiClock className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("classes.dateTime") || "Date & Time"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AppleInput
              label={t("classes.date")}
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              aria-label={t("classes.date")}
              error={getError("date")}
              min={new Date().toISOString().split("T")[0]}
            />
            <AppleInput
              label={t("classes.startTime")}
              name="start_time"
              type="time"
              value={formData.start_time}
              onChange={handleInputChange}
              required
              aria-label={t("classes.startTime")}
              error={getError("start_time")}
            />
            <AppleInput
              label={t("classes.endTime")}
              name="end_time"
              type="time"
              value={formData.end_time}
              onChange={handleInputChange}
              required
              aria-label={t("classes.endTime")}
              error={getError("end_time")}
            />
          </div>
          {/* Time validation error */}
          {formData.start_time && formData.end_time && !isTimeValid() && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 mt-2 text-red-600"
            >
              <FiAlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                End time must be after start time
              </span>
            </motion.div>
          )}

          {/* Pro-only Popular Time Slots */}
          {isPro && popularTimeSlots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <div className="flex items-center space-x-2 mb-3">
                <FiTrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Popular Time Slots
                </span>
                <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                  <FiStar className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    PRO
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTimeSlots.slice(0, 5).map((time, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleInputChangeDirect("start_time", time)}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors border border-blue-200"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </section>
        {/* Recurrence Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
              <FiCalendar className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("classes.recurrence")}
            </h3>
          </div>

          <AppleSelect
            label={t("classes.recurrencePattern")}
            name="recurrence"
            value={formData.recurrence}
            onChange={handleInputChange}
            aria-label={t("classes.recurrencePattern")}
          >
            {recurrenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AppleSelect>
        </section>

        {/* Capacity Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600">
              <FiUsers className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {t("classes.capacity")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppleInput
              label={t("classes.maximumCapacity")}
              name="capacity"
              type="number"
              value={formData.capacity.toString()}
              onChange={handleInputChange}
              required
              aria-label={t("classes.maximumCapacity")}
              error={getError("capacity")}
              min="1"
            />
            <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <FiCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Available spots: {formData.capacity}
              </span>
            </div>
          </div>
        </section>

        {/* Conflict Alert */}
        {conflicts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ConflictAlert conflicts={conflicts} />
          </motion.div>
        )}
      </form>
    </UnifiedModal>
  );
};

export default AddClassModal;
