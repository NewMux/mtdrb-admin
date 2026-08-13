import * as React from "react";
import { AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiTarget,
  FiHeart,
  FiFileText,
  FiActivity,
  FiTrendingUp,
} from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import { Member } from "../../../types/member";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";

interface ViewMemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member | null;
  modalRef?: React.RefObject<HTMLDivElement>;
}

const ViewMemberProfileModal: React.FC<ViewMemberProfileModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();

  if (!member) {
    return null;
  }

  const memberName = member.name ?? t("members.unknown");
  const status = member.status ?? "inactive";
  const membershipLabel =
    member.membership_type ?? member.membershipType ?? "Standard";
  const avatarInitials = memberName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const joinDateValue = member.join_date ?? member.joinDate ?? member.created_at;
  const lastVisitValue =
    member.lastVisit ?? member.join_date ?? member.created_at;
  const goalsList = member.goals ?? member.primary_goals ?? [];
  const healthConditions =
    member.health_conditions ?? member.medical_conditions ?? [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case "Premium":
        return "bg-rose-100 text-rose-800";
      case "Standard":
        return "bg-sky-100 text-sky-800";
      case "Basic":
        return "bg-gray-100 text-gray-800";
      case "VIP":
        return "bg-purple-100 text-purple-800";
      case "Student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <SmartModal
          isOpen={isOpen}
          onClose={onClose}
          title={t("members.viewProfileTitle")}
          subtitle={t("members.viewProfileSubtitle", { name: memberName })}
        >
          <div className="space-y-8 text-start" dir={isRTL ? "rtl" : "ltr"}>
            {/* Header with Avatar and Basic Info */}
            <div className="flex items-start gap-5 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center shadow-lg ring-4 ring-sky-100 flex-shrink-0">
                <span className="text-white font-semibold text-xl">
                  {avatarInitials}
                </span>
              </div>
              <div className="flex-1 text-start">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {memberName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-3">
                  {member.email}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${getStatusColor(
                      status,
                    )}`}
                  >
                    {status === "active" ? t("common.active", "نشط") : t("common.inactive", "غير نشط")}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold ${getMembershipColor(
                      membershipLabel,
                    )}`}
                  >
                    {membershipLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiUser className="w-5 h-5 text-blue-600" />
                <span>{t("members.contactInformation", "معلومات الاتصال")}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="p-2 bg-white dark:bg-gray-700 rounded-lg flex-shrink-0">
                    <FiMail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="text-start">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{t("members.email", "البريد الإلكتروني")}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="p-2 bg-white dark:bg-gray-700 rounded-lg flex-shrink-0">
                    <FiPhone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="text-start">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{t("members.phone", "رقم الهاتف")}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.phone}
                    </p>
                  </div>
                </div>

                {member.address && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors md:col-span-2">
                    <div className="p-2 bg-white rounded-lg">
                      <FiMapPin className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{t("members.address")}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {member.address}
                      </p>
                    </div>
                  </div>
                )}

                {member.emergency_contact && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg">
                      <FiPhone className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{t("members.emergencyContact")}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {member.emergency_contact}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Membership Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiCalendar className="w-5 h-5 mr-2" />
                {t("members.membershipDetails")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-white rounded-lg">
                    <FiCalendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{t("members.joinDate")}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {joinDateValue
                        ? new Date(joinDateValue).toLocaleDateString()
                        : t("members.unknown")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-white rounded-lg">
                    <FiActivity className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{t("members.lastVisit")}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {lastVisitValue
                        ? new Date(lastVisitValue).toLocaleDateString()
                        : t("members.never")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-white rounded-lg">
                    <FiTrendingUp className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{t("members.membershipType")}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {membershipLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fitness Profile */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiTarget className="w-5 h-5 mr-2" />
                {t("members.fitnessProfile")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goalsList.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FiTarget className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {t("members.fitnessGoals")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {goalsList.map((goal, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {goal
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {healthConditions.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <FiHeart className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {t("members.healthConditions")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {healthConditions.map((condition, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                          >
                            {condition
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Trainer Assignment */}
            {member.trainer_id && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiUser className="w-5 h-5 mr-2" />
                  {t("members.personalTrainer")}
                </h3>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-400 to-blue-400 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">PT</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {t("members.personalTrainer")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t("members.assignedTrainerId", { id: member.trainer_id })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {member.notes && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiFileText className="w-5 h-5 mr-2" />
                  {t("common.notes")}
                </h3>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {member.notes}
                  </p>
                </div>
              </div>
            )}

          </div>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default ViewMemberProfileModal;
