import React from "react";
import {
  FiUser,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiStar,
} from "react-icons/fi";
import { useRTL } from "../../hooks/useRTL";
import { useTranslation } from "react-i18next";

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

interface TrainerTableProps {
  trainers?: Trainer[];
  onEdit?: (trainer: Trainer) => void;
  onDelete?: (trainer: Trainer) => void;
  onView?: (trainer: Trainer) => void;
  onAssign?: (trainer: Trainer) => void;
  onMessage?: (trainer: Trainer) => void;
  onSchedule?: (trainer: Trainer) => void;
  searchTerm?: string;
  filters?: {
    specialty?: string;
    status?: string;
    gender?: string;
    rating?: string;
  };
  onSelectTrainer?: (trainerId: string) => void;
}

const TrainerTable: React.FC<TrainerTableProps> = ({
  trainers = [],
  onEdit,
  onDelete,
  onView,
}) => {
  const { isRTL } = useRTL();
  const { t } = useTranslation();
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);

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

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case "Yoga & Pilates":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400";
      case "HIIT & Cardio":
        return "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400";
      case "Strength Training":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
      case "CrossFit":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400";
      case "Zumba & Dance":
        return "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400";
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

  // Ensure trainers is always an array
  const safeTrainers = Array.isArray(trainers) ? trainers : [];

  if (safeTrainers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          <FiUser className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t("trainers.noTrainers")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("trainers.getStarted") || "Get started by adding your first trainer"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-6 py-4 text-start text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("trainers.trainerName", "اسم المدرب")}
            </th>
            <th className="px-6 py-4 text-start text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("trainers.contact", "معلومات الاتصال")}
            </th>
            <th className="px-6 py-4 text-start text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("trainers.specialties", "التخصصات")}
            </th>
            <th className="px-6 py-4 text-start text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("trainers.rating", "التقييم")}
            </th>
            <th className="px-6 py-4 text-start text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("trainers.status", "الحالة")}
            </th>
            <th className="px-6 py-4 text-start text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("common.actions", "الإجراءات")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {safeTrainers.map((trainer, index) => (
            <tr
              key={trainer.id}
              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                index % 2 === 0
                  ? "bg-white dark:bg-gray-800"
                  : "bg-gray-50/50 dark:bg-gray-800/50"
              }`}
              onMouseEnter={() => setHoveredRow(trainer.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-sm">
                      {trainer.avatar}
                    </span>
                  </div>
                  <div className="text-start">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {trainer.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {trainer.experience} {t("trainers.experience", "خبرة")}
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="space-y-1 text-start">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {trainer.email}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {trainer.phone}
                  </div>
                </div>
              </td>

              <td className="px-6 py-4 text-start">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpecialtyColor(trainer.specialty)}`}
                >
                  {trainer.specialty}
                </span>
              </td>

              <td className="px-6 py-4 text-start">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {renderStars(trainer.rating)}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {trainer.rating}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 text-start">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trainer.status)}`}
                  >
                    {trainer.status === "active" ? t("trainers.active", "نشط") :
                     trainer.status === "available" ? t("trainers.available", "متاح") :
                     trainer.status === "busy" ? t("trainers.busy", "مشغول") :
                     trainer.status.charAt(0).toUpperCase() + trainer.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {trainer.classes} {t("trainers.classes", "حصص")}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 text-start">
                <div
                  className={`flex items-center justify-start gap-2 transition-opacity duration-200 ${
                    hoveredRow === trainer.id ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    title={t("common.view", "عرض")}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onView?.(trainer);
                    }}
                  >
                    <FiEye size={16} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    title={t("common.edit", "تعديل")}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit?.(trainer);
                    }}
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-red-900/30 transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title={t("common.delete", "حذف")}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete?.(trainer);
                    }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrainerTable;
