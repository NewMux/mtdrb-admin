import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiUsers,
  FiUser,
  FiSettings,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiZap,
  FiStar,
  FiTrendingUp,
} from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import {
  FormField,
  SelectField,
  TimeField,
  DateField,
  SmartRecommendationCard,
  ConflictAlert,
} from "./SmartFormComponents";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";
import { SmartButton } from "../../ui/DesignSystem";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

const AddClassModal: React.FC<AddClassModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isPro = false,
}) => {
  const [formData, setFormData] = useState({
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
    isValid,
    checkConflicts,
    validateForm,
    getPopularTimeSlots,
  } = useSmartClassModal({ isPro });

  useEffect(() => {
    const fetchPopularSlots = async () => {
      const slots = await getPopularTimeSlots();
      setPopularTimeSlots(slots);
    };
    fetchPopularSlots();
  }, []);

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
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onSuccess?.();
      onClose();
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

  const isTimeValid = () => {
    if (!formData.start_time || !formData.end_time) return true;
    const start = new Date(`2000-01-01T${formData.start_time}`);
    const end = new Date(`2000-01-01T${formData.end_time}`);
    return start < end;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title="Add New Class"
          subtitle="Create a new class with smart scheduling"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {conflicts.length > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-orange-600">
                    <FiAlertTriangle className="h-4 w-4" />
                    <span>{conflicts.length} conflicts detected</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <SmartButton
                  variant="secondary"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2.5"
                >
                  Cancel
                </SmartButton>
                <SmartButton
                  variant="primary"
                  onClick={handleSave}
                  loading={loading}
                  disabled={!isFormValid || loading || !isTimeValid()}
                  className="px-6 py-2.5"
                >
                  {loading ? "Creating..." : "Create Class"}
                </SmartButton>
              </div>
            </div>
          }
        >
          <form
            className="space-y-6"
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
                  <FiZap className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Smart Recommendations
                  </h3>
                  <div className="flex items-center space-x-1 bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded-full">
                    <FiStar className="h-3 w-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FiSettings className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Class Details
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Basic information about your class
                  </p>
                </div>
              </div>
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
            </motion.div>
            {/* Trainer & Room Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FiUser className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Trainer & Location
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Assign trainer and select room
                  </p>
                </div>
              </div>
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
            </motion.div>
            {/* Date & Time Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <FiClock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Date & Time
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Schedule your class
                  </p>
                </div>
              </div>
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
              {/* Time validation error */}
              {formData.start_time && formData.end_time && !isTimeValid() && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 mt-2 text-red-600 dark:text-red-400"
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
                    <FiTrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Popular Time Slots
                    </span>
                    <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
                      <FiStar className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        PRO
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularTimeSlots.slice(0, 5).map((time, index) => (
                      <button
                        key={index}
                        onClick={() => handleInputChange("start_time", time)}
                        className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors border border-blue-200 dark:border-blue-700"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
            {/* Recurrence Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FiCalendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recurrence
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Set up recurring classes
                  </p>
                </div>
              </div>
              <SelectField
                label="Recurrence Pattern"
                value={formData.recurrence}
                onChange={(value) => handleInputChange("recurrence", value)}
                options={recurrenceOptions}
              />
            </motion.div>
            {/* Capacity Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <FiUsers className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Capacity
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Set maximum number of participants
                  </p>
                </div>
              </div>
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
                    Available spots: {formData.capacity}
                  </span>
                </div>
              </div>
            </motion.div>
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
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default AddClassModal;
