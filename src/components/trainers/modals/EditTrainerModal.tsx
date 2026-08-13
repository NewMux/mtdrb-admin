import * as React from "react";
import { FiUser, FiStar, FiTarget } from "react-icons/fi";
import { toast } from "react-hot-toast";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";
import { supabase } from "../../../supabaseClient";

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  rating: number;
  status: "active" | "inactive" | "busy" | "available";
  classes: number;
  experience: string;
  avatar: string;
}

interface EditTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer;
  onSuccess?: () => void;
  isPro?: boolean;
}

export default function EditTrainerModal({
  isOpen,
  onClose,
  trainer,
  onSuccess,
}: EditTrainerModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  const [formData, setFormData] = React.useState<Trainer>(trainer);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Trainer>>({});

  React.useEffect(() => {
    setFormData(trainer);
  }, [trainer]);

  const handleInputChange = (field: keyof Trainer, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Trainer> = {};

    if (!formData.name.trim()) newErrors.name = t("trainers.nameRequired");
    if (!formData.email.trim()) newErrors.email = t("trainers.emailRequired");
    if (!formData.phone.trim()) newErrors.phone = t("trainers.phoneRequired");
    if (!formData.specialty.trim())
      newErrors.specialty = t("trainers.specialtyRequired");
    if (!formData.experience.trim())
      newErrors.experience = t("trainers.experienceRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const nameParts = formData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // "busy"/"available" have no dedicated column in the trainers.status
      // check constraint (active|inactive|on_leave) - map them to their
      // closest real status and keep the original label in metadata.
      const dbStatus =
        formData.status === "busy"
          ? "on_leave"
          : formData.status === "available"
            ? "active"
            : formData.status;

      // Fetch current metadata so we only overwrite the fields this form edits
      const { data: existing, error: fetchError } = await supabase
        .from("trainers")
        .select("metadata")
        .eq("id", trainer.id)
        .single();

      if (fetchError) throw fetchError;

      const existingMetadata = (existing?.metadata as Record<string, unknown>) || {};

      const { error } = await supabase
        .from("trainers")
        .update({
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          phone: formData.phone,
          specialties: formData.specialty ? [formData.specialty] : [],
          rating: formData.rating,
          status: dbStatus,
          metadata: {
            ...existingMetadata,
            experience_level: formData.experience,
            status_label: formData.status,
          },
        })
        .eq("id", trainer.id);

      if (error) throw error;

      toast.success(t("trainers.trainerUpdated"));
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(t("trainers.updateError"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <ColorfulModalUI
      open={isOpen}
      onClose={handleClose}
      onAction={handleSubmit}
      actionLabel={loading ? t("trainers.updating") : t("trainers.updateTrainer")}
      title={t("trainers.editTrainer")}
      subtitle={t("trainers.editTrainerSubtitle", { name: trainer.name })}
    >
      <div className="space-y-8 text-start" dir={isRTL ? "rtl" : "ltr"}>
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <FiUser className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span>{t("trainers.personalInfo")}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("trainers.fullName")} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${
                  errors.name ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700"
                }`}
                placeholder={t("trainers.namePlaceholder")}
                dir={isRTL ? "rtl" : "ltr"}
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1.5 font-medium">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t("common.email")} *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${
                  errors.email ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700"
                }`}
                placeholder="sarah@example.com"
                dir="ltr"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1.5 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("common.phone")} *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${
                  errors.phone ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700"
                }`}
                placeholder="+973 3300 0000"
                dir="ltr"
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1.5 font-medium">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("trainers.yearsOfExperience")} *
              </label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) =>
                  handleInputChange("experience", e.target.value)
                }
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${
                  errors.experience ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700"
                }`}
                placeholder={t("trainers.experiencePlaceholder")}
                dir={isRTL ? "rtl" : "ltr"}
              />
              {errors.experience && (
                <p className="text-red-600 text-sm mt-1.5 font-medium">{errors.experience}</p>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiTarget className="text-green-500 flex-shrink-0" />
            <span>{t("trainers.professionalInfo")}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("trainers.specialty")} *
              </label>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => handleInputChange("specialty", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${
                  errors.specialty ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700"
                }`}
                placeholder={t("trainers.specialtyPlaceholder")}
                dir={isRTL ? "rtl" : "ltr"}
              />
              {errors.specialty && (
                <p className="text-red-500 text-sm mt-1">{errors.specialty}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("trainers.status")}
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  handleInputChange("status", e.target.value as Trainer["status"])
                }
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="active">{t("trainers.active")}</option>
                <option value="available">{t("trainers.available")}</option>
                <option value="busy">{t("trainers.busy")}</option>
                <option value="inactive">{t("common.inactive")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("trainers.rating")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) =>
                    handleInputChange("rating", parseFloat(e.target.value))
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                />
                <FiStar className="text-yellow-400 flex-shrink-0" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("trainers.classesAssigned")}
              </label>
              <input
                type="number"
                min="0"
                value={formData.classes}
                onChange={(e) =>
                  handleInputChange("classes", parseInt(e.target.value))
                }
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </ColorfulModalUI>
  );
}
