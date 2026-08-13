import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiCheck,
  FiStar,
} from "react-icons/fi";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";
import { useTranslation } from "react-i18next";

interface WaitlistMember {
  id: string;
  name: string;
  email: string;
  joined_waitlist: string;
  attendance_score: number;
  loyalty_score: number;
  is_vip: boolean;
  preferred_time?: string;
}

interface ProcessWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  children,
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm text-light-600 dark:text-dark-400 mt-1">
          {subtitle}
        </p>
      )}
    </div>
    {children}
  </div>
);

const ProcessWaitlistModal: React.FC<ProcessWaitlistModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  isPro = false,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [waitlistMembers, setWaitlistMembers] = useState<WaitlistMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [assignmentLogic, setAssignmentLogic] = useState<
    "first-come" | "engagement" | "vip" | "manual"
  >("first-come");
  const [availableSpots, setAvailableSpots] = useState(0);

  const { classData, fetchClass } = useSmartClassModal({ classId, isPro });

  // Load mock waitlist data
  const loadWaitlistData = () => {
    const mockWaitlist: WaitlistMember[] = [
      {
        id: "1",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        joined_waitlist: "2024-01-15T10:30:00Z",
        attendance_score: 95,
        loyalty_score: 8.5,
        is_vip: true,
        preferred_time: "09:00",
      },
      {
        id: "2",
        name: "Mike Chen",
        email: "mike@example.com",
        joined_waitlist: "2024-01-15T11:15:00Z",
        attendance_score: 87,
        loyalty_score: 7.2,
        is_vip: false,
        preferred_time: "09:00",
      },
      {
        id: "3",
        name: "Emma Davis",
        email: "emma@example.com",
        joined_waitlist: "2024-01-15T12:00:00Z",
        attendance_score: 92,
        loyalty_score: 9.1,
        is_vip: true,
        preferred_time: "09:00",
      },
    ];
    setWaitlistMembers(mockWaitlist);
  };

  // Load class data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
      loadWaitlistData();
    }
  }, [isOpen, classId, fetchClass]);

  // Calculate available spots
  useEffect(() => {
    if (classData) {
      const available = classData.capacity - classData.enrolled_count;
      setAvailableSpots(available);
    }
  }, [classData]);

  // Auto-assign based on logic
  const autoAssign = () => {
    const sortedMembers = [...waitlistMembers];

    switch (assignmentLogic) {
      case "first-come":
        sortedMembers.sort(
          (a, b) =>
            new Date(a.joined_waitlist).getTime() -
            new Date(b.joined_waitlist).getTime(),
        );
        break;
      case "engagement":
        sortedMembers.sort(
          (a, b) =>
            b.attendance_score +
            b.loyalty_score -
            (a.attendance_score + a.loyalty_score),
        );
        break;
      case "vip":
        sortedMembers.sort((a, b) => {
          if (a.is_vip && !b.is_vip) return -1;
          if (!a.is_vip && b.is_vip) return 1;
          return (
            new Date(a.joined_waitlist).getTime() -
            new Date(b.joined_waitlist).getTime()
          );
        });
        break;
    }

    const autoSelected = sortedMembers
      .slice(0, availableSpots)
      .map((m) => m.id);
    setSelectedMembers(autoSelected);
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const handleProcess = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error processing waitlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberById = (id: string) =>
    waitlistMembers.find((m) => m.id === id);

  if (!classData) {
    return (
      <UnifiedModal
        isOpen={isOpen}
        onClose={onClose}
        title={t("classes.processWaitlist")}
        subtitle={t("classes.loadingClassData")}
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
      title={t("classes.processWaitlist")}
      subtitle={t("classes.manageWaitlistFor", { name: classData.name })}
      maxWidth="4xl"
      slideFrom="right"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-blue-600">
              <FiUsers className="h-4 w-4" />
              <span>{t("classes.membersSelectedCount", { count: selectedMembers.length })}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleProcess}
              disabled={loading || selectedMembers.length === 0}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? t("classes.processing")
                : t("classes.enrollMembersCount", { count: selectedMembers.length })}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Class Info */}
        <div className="p-4 bg-light-50 dark:bg-dark-700 rounded-xl border border-light-200 dark:border-dark-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
                {classData.name}
              </h3>
              <p className="text-sm text-light-600 dark:text-dark-400">
                {new Date(classData.date).toLocaleDateString()} •{" "}
                {classData.start_time} - {classData.end_time}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-light-600 dark:text-dark-400">
                {t("classes.availableSpotsLabel")}
              </div>
              <div className="text-lg font-semibold text-dark-900 dark:text-white">
                {availableSpots}
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Logic */}
        <FormSection
          title={t("classes.assignmentLogic")}
          subtitle={t("classes.chooseHowToAutoAssign")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                {t("classes.autoAssignmentLogic")}
              </label>
              <select
                value={assignmentLogic}
                onChange={(e) => setAssignmentLogic(e.target.value as "first-come" | "engagement" | "vip" | "manual")}
                className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
              >
                <option value="first-come">{t("classes.firstComeFirstServed")}</option>
                <option value="engagement">{t("classes.engagementScore")}</option>
                <option value="vip">{t("classes.vipPriority")}</option>
                <option value="manual">{t("classes.manualSelection")}</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={autoAssign}
                disabled={assignmentLogic === "manual"}
                className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("classes.autoAssignSpots", { count: availableSpots })}
              </button>
            </div>
          </div>
        </FormSection>

        {/* Waitlist Members */}
        <FormSection
          title={t("classes.waitlistMembersTitle")}
          subtitle={t("classes.membersOnWaitlistCount", { count: waitlistMembers.length })}
        >
          <div className="space-y-3">
            {waitlistMembers.map((member, index) => {
              const isSelected = selectedMembers.includes(member.id);
              const isOverLimit =
                selectedMembers.length >= availableSpots && !isSelected;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 border rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : isOverLimit
                        ? "border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 opacity-50"
                        : "border-light-200 dark:border-dark-600 bg-light-50 dark:bg-dark-700 hover:border-brand-300"
                  }`}
                  onClick={() => !isOverLimit && handleMemberToggle(member.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          !isOverLimit && handleMemberToggle(member.id)
                        }
                        disabled={isOverLimit}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-semibold text-dark-900 dark:text-white">
                            {member.name}
                          </h4>
                          {member.is_vip && (
                            <FiStar className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-light-600 dark:text-dark-400">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs">
                      <div className="text-center">
                        <div className="text-light-600 dark:text-dark-400">
                          {t("classes.joined")}
                        </div>
                        <div className="font-medium text-dark-900 dark:text-white">
                          {new Date(
                            member.joined_waitlist,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-light-600 dark:text-dark-400">
                          {t("classes.attendance")}
                        </div>
                        <div className="font-medium text-dark-900 dark:text-white">
                          {member.attendance_score}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-light-600 dark:text-dark-400">
                          {t("classes.loyalty")}
                        </div>
                        <div className="font-medium text-dark-900 dark:text-white">
                          {member.loyalty_score}/10
                        </div>
                      </div>
                    </div>
                  </div>

                  {isOverLimit && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      {t("classes.noMoreSpotsAvailable")}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </FormSection>

        {/* Selection Summary */}
        {selectedMembers.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
              {t("classes.selectedMembersCount", { count: selectedMembers.length, max: availableSpots })}
            </h3>
            <div className="space-y-2">
              {selectedMembers.map((memberId) => {
                const member = getMemberById(memberId);
                if (!member) return null;

                return (
                  <div
                    key={memberId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-green-700 dark:text-green-300">
                      {member.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 dark:text-green-400">
                        {t("classes.attendancePercent", { percent: member.attendance_score })}
                      </span>
                      <FiCheck className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Smart Suggestions */}
        {isPro && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {t("classes.smartSuggestionsTitle")}
            </h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <p>• {t("classes.considerPrioritizingVIP")}</p>
              <p>• {t("classes.membersWithHighAttendance")}</p>
              <p>
                • {t("classes.balanceLoyaltyAndRecency")}
              </p>
            </div>
          </div>
        )}
      </div>
    </UnifiedModal>
  );
};

export default ProcessWaitlistModal;
