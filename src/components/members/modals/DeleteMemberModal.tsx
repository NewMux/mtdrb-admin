import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import { SmartButton } from "../../ui/DesignSystem";
import { Member } from "../../../types/member";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member | null;
  onSuccess: (member: Member) => Promise<void>;
  loading?: boolean;
  modalRef?: React.RefObject<HTMLDivElement>;
}

const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onSuccess,
  loading = false,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!member) return;

    try {
      setIsDeleting(true);
      await onSuccess(member);
    } catch (error) {
      console.error("Failed to delete member:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!member) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title={t("members.deleteMemberTitle", "حذف العضو")}
          subtitle={t("members.deleteMemberSubtitle", "إزالة هذا العضو من النظام")}
          footer={
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-2">
                <FiAlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-600">
                  {t("members.cannotBeUndone", "لا يمكن التراجع عن هذا الإجراء")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <SmartButton variant="secondary" onClick={onClose}>
                  {t("members.cancel", "إلغاء")}
                </SmartButton>
                <SmartButton
                  variant="danger"
                  icon={<FiTrash2 className="w-4 h-4" />}
                  onClick={handleDelete}
                  loading={loading || isDeleting}
                >
                  {loading || isDeleting ? t("members.deleting", "جاري الحذف...") : t("members.deleteMember", "حذف العضو")}
                </SmartButton>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-start" dir={isRTL ? "rtl" : "ltr"}>
            {/* Warning Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <FiAlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Member Information */}
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("members.confirmDeleteQuestion", "هل أنت تأكد من رغبتك في حذف هذا العضو؟")}
              </h3>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-sm">
                      {(member.name ?? "M")
                        .split(" ")
                        .filter(Boolean)
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="text-start">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200 text-start">
                  <p className="font-medium mb-1">
                    {t("members.permanentDeleteWarning", "سيؤدي هذا الإجراء إلى حذف ما يلي نهائياً:")}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>{t("members.deleteItem1", "الملف الشخصي للعضو وكافة البيانات المرتبطة")}</li>
                    <li>{t("members.deleteItem2", "سجل العضوية والمدفوعات")}</li>
                    <li>{t("members.deleteItem3", "سجل حضور الحصص والحجوزات")}</li>
                    <li>{t("members.deleteItem4", "تعيينات المدرب الشخصي")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default DeleteMemberModal;
