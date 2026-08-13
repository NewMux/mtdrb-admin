import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiSettings,
  FiUsers,
  FiAlertTriangle,
} from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import { FormField, SelectField, FormSection } from "./SmartFormComponents";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";
import { SmartButton } from "../../ui/DesignSystem";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ClassSettings {
  capacity: number;
  price: number;
  duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  class_type: string;
  location: string;
  description: string;
  auto_waitlist: boolean;
  auto_cancel: boolean;
  min_attendance: number;
  max_waitlist: number;
  trainer_requirements: string[];
  equipment_needed: string[];
  special_instructions: string;
}

interface UpdateClassSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const UpdateClassSettingsModal: React.FC<UpdateClassSettingsModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  isPro = false,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ClassSettings>({
    capacity: 20,
    price: 25,
    duration: 60,
    difficulty: "intermediate",
    class_type: "Yoga",
    location: "Studio A",
    description: "",
    auto_waitlist: true,
    auto_cancel: false,
    min_attendance: 3,
    max_waitlist: 10,
    trainer_requirements: [],
    equipment_needed: [],
    special_instructions: "",
  });
  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");
  const [hasChanges, setHasChanges] = useState(false);

  const { classData, fetchClass } = useSmartClassModal({ classId, isPro });

  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
      loadCurrentSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, classId]);

  const loadCurrentSettings = () => {
    if (classData) {
      setSettings({
        capacity: classData.capacity || 20,
        price: 25, // Mock price
        duration: 60,
        difficulty: "intermediate",
        class_type: classData.type || "Yoga",
        location: "Studio A",
        description: classData.description || "",
        auto_waitlist: true,
        auto_cancel: false,
        min_attendance: 3,
        max_waitlist: 10,
        trainer_requirements: [],
        equipment_needed: [],
        special_instructions: "",
      });
    }
  };

  const handleSettingChange = (key: keyof ClassSettings, value: string | number | boolean | string[]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (validationErrors.length > 0) {
      toast.error(t("classes.pleaseFixValidationErrors"));
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success(t("classes.classSettingsUpdated"));
      setHasChanges(false);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(t("classes.failedToUpdateSettings"));
    } finally {
      setLoading(false);
    }
  };

  const getValidationErrors = () => {
    const errors: string[] = [];

    if (settings.capacity < 1) {
      errors.push(t("classes.capacityMustBeAtLeast1"));
    }

    if (settings.price < 0) {
      errors.push(t("classes.priceCannotBeNegative"));
    }

    if (settings.duration < 15) {
      errors.push(t("classes.durationMustBeAtLeast15"));
    }

    if (settings.min_attendance > settings.capacity) {
      errors.push(t("classes.minAttendanceCannotExceedCapacity"));
    }

    return errors;
  };

  const validationErrors = getValidationErrors();

  if (!classData) {
    return (
      <SmartModal
        isOpen={isOpen}
        onClose={onClose}
        title={t("classes.updateClassSettings")}
        subtitle={t("classes.loadingClassData")}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SmartModal>
    );
  }

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("classes.updateClassSettings")}
      subtitle={t("classes.configureSettingsFor", { name: classData.name })}
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <div className="flex items-center space-x-1 text-sm text-orange-600">
                <FiAlertTriangle className="h-4 w-4" />
                <span>{t("classes.unsavedChanges")}</span>
              </div>
            )}
            {validationErrors.length > 0 && (
              <div className="flex items-center space-x-1 text-sm text-red-600">
                <FiAlertTriangle className="h-4 w-4" />
                <span>{t("classes.validationErrorsCount", { count: validationErrors.length })}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <SmartButton
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t("common.cancel")}
            </SmartButton>
            <SmartButton
              variant="primary"
              onClick={handleSave}
              loading={loading}
              disabled={loading || validationErrors.length > 0}
            >
              {loading ? t("classes.saving") : t("classes.saveSettings")}
            </SmartButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Class Info */}
        <div className="p-4 bg-light-50bg-dark-700 rounded-xl border border-light-200border-dark-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-dark-900text-white">
                {classData.name}
              </h3>
              <p className="text-sm text-light-600text-dark-400">
                {new Date(classData.date).toLocaleDateString()} •{" "}
                {classData.start_time} - {classData.end_time}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-light-600text-dark-400">
                {t("classes.currentCapacity")}
              </div>
              <div className="text-lg font-semibold text-dark-900text-white">
                {classData.capacity}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-light-200border-dark-600">
          <nav className="flex space-x-8">
            {[
              {
                id: "basic",
                label: t("classes.basicSettings"),
                icon: <FiSettings className="h-4 w-4" />,
              },
              {
                id: "advanced",
                label: t("classes.advanced"),
                icon: <FiUsers className="h-4 w-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "basic" | "advanced")}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-light-600text-dark-400 hover:text-light-900hover:text-dark-200"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "basic" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <FormSection
                title={t("classes.basicInformation")}
                subtitle={t("classes.coreClassSettingsAndDetails")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label={t("classes.classType")}
                    value={settings.class_type}
                    onChange={(value) =>
                      handleSettingChange("class_type", value)
                    }
                    placeholder={t("classes.classTypePlaceholder")}
                  />

                  <FormField
                    label={t("classes.location")}
                    value={settings.location}
                    onChange={(value) => handleSettingChange("location", value)}
                    placeholder={t("classes.locationPlaceholder")}
                  />

                  <FormField
                    label={t("classes.capacity")}
                    type="number"
                    value={settings.capacity.toString()}
                    onChange={(value) =>
                      handleSettingChange("capacity", parseInt(value) || 0)
                    }
                    placeholder={t("classes.capacityPlaceholder")}
                  />

                  <FormField
                    label={t("classes.priceLabel")}
                    type="number"
                    value={settings.price.toString()}
                    onChange={(value) =>
                      handleSettingChange("price", parseFloat(value) || 0)
                    }
                    placeholder={t("classes.pricePlaceholder")}
                  />

                  <FormField
                    label={t("classes.durationMinutesLabel")}
                    type="number"
                    value={settings.duration.toString()}
                    onChange={(value) =>
                      handleSettingChange("duration", parseInt(value) || 0)
                    }
                    placeholder={t("classes.durationPlaceholder")}
                  />

                  <SelectField
                    label={t("classes.difficultyLevel")}
                    value={settings.difficulty}
                    onChange={(value) =>
                      handleSettingChange("difficulty", value)
                    }
                    options={[
                      { value: "beginner", label: t("classes.beginner") },
                      { value: "intermediate", label: t("classes.intermediate") },
                      { value: "advanced", label: t("classes.advanced") },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-900text-white mb-2">
                    {t("classes.description")}
                  </label>
                  <textarea
                    value={settings.description}
                    onChange={(e) =>
                      handleSettingChange("description", e.target.value)
                    }
                    placeholder={t("classes.descriptionPlaceholder")}
                    rows={4}
                    className="w-full px-4 py-3 border border-light-200border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50bg-dark-700 text-dark-900text-white"
                  />
                </div>
              </FormSection>
            </motion.div>
          )}

          {activeTab === "advanced" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <FormSection
                title={t("classes.advancedSettingsTitle")}
                subtitle={t("classes.specialRequirementsAndConfigurations")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label={t("classes.minimumAttendance")}
                    type="number"
                    value={settings.min_attendance.toString()}
                    onChange={(value) =>
                      handleSettingChange(
                        "min_attendance",
                        parseInt(value) || 0,
                      )
                    }
                    placeholder={t("classes.minAttendancePlaceholder")}
                  />

                  <FormField
                    label={t("classes.maxWaitlistSizeLabel")}
                    type="number"
                    value={settings.max_waitlist.toString()}
                    onChange={(value) =>
                      handleSettingChange("max_waitlist", parseInt(value) || 0)
                    }
                    placeholder={t("classes.maxWaitlistPlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-900text-white mb-2">
                    {t("classes.trainerRequirements")}
                  </label>
                  <div className="space-y-2">
                    {[
                      t("classes.yogaCertification"),
                      t("classes.firstAidCertified"),
                      t("classes.experienceWithBeginners"),
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`req-${idx}`}
                          checked={settings.trainer_requirements.includes(req)}
                          onChange={(e) => {
                            const newReqs = e.target.checked
                              ? [...settings.trainer_requirements, req]
                              : settings.trainer_requirements.filter(
                                  (r) => r !== req,
                                );
                            handleSettingChange(
                              "trainer_requirements",
                              newReqs,
                            );
                          }}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <label
                          htmlFor={`req-${idx}`}
                          className="text-sm text-dark-900text-white"
                        >
                          {req}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-900text-white mb-2">
                    {t("classes.equipmentNeeded")}
                  </label>
                  <div className="space-y-2">
                    {[t("classes.yogaMats"), t("classes.resistanceBands"), t("classes.waterBottles")].map(
                      (equipment, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`equipment-${idx}`}
                            checked={settings.equipment_needed.includes(
                              equipment,
                            )}
                            onChange={(e) => {
                              const newEquipment = e.target.checked
                                ? [...settings.equipment_needed, equipment]
                                : settings.equipment_needed.filter(
                                    (eq) => eq !== equipment,
                                  );
                              handleSettingChange(
                                "equipment_needed",
                                newEquipment,
                              );
                            }}
                            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          />
                          <label
                            htmlFor={`equipment-${idx}`}
                            className="text-sm text-dark-900text-white"
                          >
                            {equipment}
                          </label>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-900text-white mb-2">
                    {t("classes.specialInstructions")}
                  </label>
                  <textarea
                    value={settings.special_instructions}
                    onChange={(e) =>
                      handleSettingChange(
                        "special_instructions",
                        e.target.value,
                      )
                    }
                    placeholder={t("classes.specialInstructionsPlaceholder")}
                    rows={3}
                    className="w-full px-4 py-3 border border-light-200border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50bg-dark-700 text-dark-900text-white"
                  />
                </div>
              </FormSection>
            </motion.div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50bg-red-900/10 border border-red-200border-red-800 rounded-xl">
            <div className="flex items-start space-x-3">
              <FiAlertTriangle className="h-5 w-5 text-red-600text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-900text-red-100">
                  {t("classes.validationErrorsTitle")}
                </h4>
                <ul className="text-sm text-red-700text-red-200 mt-1 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Smart Suggestions */}
        {isPro && (
          <div className="p-4 bg-green-50bg-green-900/10 border border-green-200border-green-800 rounded-xl">
            <h3 className="text-sm font-semibold text-green-900text-green-100 mb-2">
              {t("classes.smartRecommendations")}
            </h3>
            <div className="space-y-2 text-sm text-green-700text-green-300">
              <p>• {t("classes.considerIncreasingCapacity")}</p>
              <p>
                • {t("classes.setMinAttendanceSuggestion")}
              </p>
              <p>
                • {t("classes.enableAutoCancelSuggestion")}
              </p>
            </div>
          </div>
        )}
      </div>
    </SmartModal>
  );
};

export default UpdateClassSettingsModal;
