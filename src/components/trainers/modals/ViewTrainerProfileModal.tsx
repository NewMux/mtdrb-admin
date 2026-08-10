import * as React from "react";
import {
  FiUser,
  FiUsers,
  FiMail,
  FiPhone,
  FiStar,
  FiTarget,
  FiClock,
  FiX,
  FiEdit,
} from "react-icons/fi";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { SmartButton } from "../../ui/DesignSystem";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";

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

interface ViewTrainerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer;
  onSuccess?: () => void;
  onEdit?: () => void;
  isPro?: boolean;
}

export default function ViewTrainerProfileModal({
  isOpen,
  onClose,
  trainer,
  onEdit,
}: ViewTrainerProfileModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400";
      case "available":
        return "bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400";
      case "busy":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
      case "inactive":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : i < rating
              ? "text-yellow-400 fill-current opacity-50"
              : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  const handleEdit = () => {
    onClose();
    if (onEdit) {
      onEdit();
    }
  };

  if (!isOpen) return null;

  return (
    <ColorfulModalUI
      open={isOpen}
      onClose={onClose}
      title={t("trainers.viewProfileTitle", "الملف الشخصي للمدرب")}
      subtitle={t("trainers.viewProfileSubtitle", `عرض تفاصيل الملف الشخصي للمدرب ${trainer.name}`)}
    >
      <div className="space-y-8 text-start" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-5 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center shadow-lg ring-4 ring-sky-100 flex-shrink-0">
            <span className="text-white font-semibold text-xl">
              {trainer.avatar}
            </span>
          </div>
          <div className="flex-1 text-start">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{trainer.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-3">{trainer.specialty}</p>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${getStatusColor(trainer.status)}`}
              >
                {trainer.status === "active" ? t("trainers.active", "نشط") :
                 trainer.status === "available" ? t("trainers.available", "متاح") :
                 trainer.status === "busy" ? t("trainers.busy", "مشغول") : t("trainers.inactive", "غير نشط")}
              </span>
              <div className="flex items-center gap-1.5">
                {renderStars(trainer.rating)}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {trainer.rating}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiUser className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span>{t("trainers.contactInfo", "معلومات الاتصال")}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg flex-shrink-0">
                <FiMail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-start">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{t("trainers.email", "البريد الإلكتروني")}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{trainer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg flex-shrink-0">
                <FiPhone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-start">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{t("trainers.phone", "رقم الهاتف")}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{trainer.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiTarget className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>{t("trainers.professionalInfo", "البيانات المهنية")}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg flex-shrink-0">
                <FiTarget className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-start">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{t("trainers.specialty", "التخصص")}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{trainer.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg flex-shrink-0">
                <FiClock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-start">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{t("trainers.experience", "الخبرة")}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{trainer.experience}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Assigned */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <span>{t("trainers.classesAssignedTitle", "الحصص والأنشطة المسندة")}</span>
          </h3>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="text-start">
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{trainer.classes}</p>
                <p className="text-sm text-purple-700 dark:text-purple-300">{t("trainers.classesAssignedDesc", "إجمالي الحصص الرياضية المسندة لجدول هذا المدرب")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <SmartButton
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            <FiX className="h-4 w-4" />
            <span>{t("common.close", "إغلاق")}</span>
          </SmartButton>

          {onEdit && (
            <SmartButton
              variant="primary"
              size="sm"
              onClick={handleEdit}
            >
              <FiEdit className="h-4 w-4" />
              <span>{t("trainers.editTrainer", "تعديل المدرب")}</span>
            </SmartButton>
          )}
        </div>
      </div>
    </ColorfulModalUI>
  );
}
