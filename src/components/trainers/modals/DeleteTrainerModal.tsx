import * as React from "react";
import { FiAlertTriangle, FiUser } from "react-icons/fi";
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

interface DeleteTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer;
  onSuccess?: () => void;
  isPro?: boolean;
}

export default function DeleteTrainerModal({
  isOpen,
  onClose,
  trainer,
  onSuccess,
}: DeleteTrainerModalProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("trainers")
        .delete()
        .eq("id", trainer.id);

      if (error) throw error;

      toast.success(t("trainers.deleteSuccess", `تم حذف المدرب ${trainer.name} بنجاح!`));
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(t("trainers.deleteError", "حدث خطأ أثناء حذف المدرب"));
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
      onAction={handleDelete}
      actionLabel={loading ? t("trainers.deleting", "جاري الحذف...") : t("trainers.deleteTrainer", "تأكيد الحذف")}
      actionVariant="danger"
      title={t("trainers.deleteTrainerTitle", "حذف المدرب")}
      subtitle={t("trainers.cannotBeUndone", "لا يمكن التراجع عن هذا الإجراء")}
    >
      <div className="space-y-6 text-start" dir={isRTL ? "rtl" : "ltr"}>
        {/* Warning Message */}
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
              <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            </div>
            <div className="text-start">
              <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-1">
                {t("trainers.confirmDeletePrompt", "هل أنت تأكد من رغبتك في حذف هذا المدرب؟")}
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                {t("trainers.deleteTrainerWarning", "سيؤدي هذا الإجراء إلى حذف المدرب")} <strong>{trainer.name}</strong> {t("trainers.deleteTrainerWarningEnd", "نهائياً من النظام. جميع البيانات المرتبطة ستُفقد ولا يمكن استعادتها.")}
              </p>
            </div>
          </div>
        </div>

        {/* Trainer Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center shadow-lg ring-2 ring-sky-100 flex-shrink-0">
              <span className="text-white font-semibold text-base">
                {trainer.avatar}
              </span>
            </div>
            <div className="text-start">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{trainer.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{trainer.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{trainer.specialty}</p>
            </div>
          </div>
        </div>

        {/* Impact Information */}
        <div className="space-y-3 text-start">
          <h4 className="font-medium text-gray-900 dark:text-white">{t("trainers.impactTitle", "سيتأثر بهذا الإجراء:")}</h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <FiUser className="text-gray-400 flex-shrink-0" />
              <span>{trainer.classes} {t("trainers.assignedClassesCount", "حصص مسندة")}</span>
            </li>
            <li className="flex items-center gap-2">
              <FiUser className="text-gray-400 flex-shrink-0" />
              <span>{t("trainers.allDataHistory", "جميع بيانات وسجلات المدرب")}</span>
            </li>
          </ul>
        </div>
      </div>
    </ColorfulModalUI>
  );
}
