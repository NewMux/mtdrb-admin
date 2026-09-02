import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiUsers,
  FiCheck,
} from "react-icons/fi";
import { UnifiedModal } from "../../ui/UnifiedModal";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";
import { supabase } from "../../../supabaseClient";
import { bookClass } from "../../../api/class";

interface WaitlistMember {
  id: string;
  memberId: string;
  name: string;
  email: string;
  joined_waitlist: string;
  attendance_score: number;
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
  const [loading, setLoading] = useState(false);
  const [waitlistMembers, setWaitlistMembers] = useState<WaitlistMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [assignmentLogic, setAssignmentLogic] = useState<
    "first-come" | "engagement" | "manual"
  >("first-come");
  const [availableSpots, setAvailableSpots] = useState(0);

  const { classData, fetchClass } = useSmartClassModal({ classId, isPro });

  const loadWaitlistData = async () => {
    const { data: waitlistRows } = await supabase
      .from("class_waitlist")
      .select("id, member_id, created_at, members(first_name, last_name, email)")
      .eq("class_id", classId)
      .order("position", { ascending: true });

    const members: WaitlistMember[] = (waitlistRows || []).map((w) => {
      const m = w.members as { first_name?: string; last_name?: string; email?: string } | null;
      return {
        id: w.id,
        memberId: w.member_id,
        name: `${m?.first_name || ""} ${m?.last_name || ""}`.trim() || "Unknown",
        email: m?.email || "",
        joined_waitlist: w.created_at,
        attendance_score: 0,
      };
    });

    const memberIds = Array.from(new Set(members.map((m) => m.memberId)));
    if (memberIds.length > 0) {
      const { data: historyRows } = await supabase
        .from("class_bookings")
        .select("member_id, check_in_time")
        .in("member_id", memberIds);

      const totals = new Map<string, { total: number; checkedIn: number }>();
      (historyRows || []).forEach((r) => {
        const entry = totals.get(r.member_id) || { total: 0, checkedIn: 0 };
        entry.total += 1;
        if (r.check_in_time) entry.checkedIn += 1;
        totals.set(r.member_id, entry);
      });

      members.forEach((m) => {
        const entry = totals.get(m.memberId);
        m.attendance_score = entry && entry.total > 0
          ? Math.round((entry.checkedIn / entry.total) * 100)
          : 0;
      });
    }

    setWaitlistMembers(members);
  };

  // Load class data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
      loadWaitlistData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        sortedMembers.sort((a, b) => b.attendance_score - a.attendance_score);
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
      const selectedWaitlistEntries = selectedMembers
        .map((id) => getMemberById(id))
        .filter((m): m is WaitlistMember => !!m);

      let processedCount = 0;
      let failedCount = 0;

      for (const entry of selectedWaitlistEntries) {
        try {
          const booking = await bookClass(classId, entry.memberId);
          if (!booking) {
            failedCount += 1;
            continue;
          }

          const { error: removeError } = await supabase
            .from("class_waitlist")
            .delete()
            .eq("id", entry.id);
          if (removeError) throw removeError;
          processedCount += 1;
        } catch (entryError) {
          console.error("Error processing waitlist entry:", entryError);
          failedCount += 1;
        }
      }

      if (failedCount > 0) {
        toast.error(
          processedCount > 0
            ? `Enrolled ${processedCount} member(s), but ${failedCount} failed`
            : "Failed to process waitlist",
        );
      } else {
        toast.success(`Enrolled ${processedCount} member(s) from waitlist`);
      }

      if (processedCount > 0) {
        onSuccess?.();
      }
      if (failedCount === 0) {
        onClose();
      } else {
        await loadWaitlistData();
        setSelectedMembers([]);
      }
    } catch (error) {
      console.error("Error processing waitlist:", error);
      toast.error("Failed to process waitlist");
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
        title="Process Waitlist"
        subtitle="Loading class data..."
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
      title="Process Waitlist"
      subtitle={`Manage waitlist for ${classData.name}`}
      maxWidth="4xl"
      slideFrom="right"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-blue-600">
              <FiUsers className="h-4 w-4" />
              <span>{selectedMembers.length} members selected</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={loading || selectedMembers.length === 0}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? "Processing..."
                : `Enroll ${selectedMembers.length} Members`}
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
                Available Spots
              </div>
              <div className="text-lg font-semibold text-dark-900 dark:text-white">
                {availableSpots}
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Logic */}
        <FormSection
          title="Assignment Logic"
          subtitle="Choose how to automatically assign waitlist members"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                Auto-assignment Logic
              </label>
              <select
                value={assignmentLogic}
                onChange={(e) => setAssignmentLogic(e.target.value as "first-come" | "engagement" | "manual")}
                className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
              >
                <option value="first-come">First Come, First Served</option>
                <option value="engagement">Engagement Score</option>
                <option value="manual">Manual Selection</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={autoAssign}
                disabled={assignmentLogic === "manual"}
                className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Auto-assign {availableSpots} Spots
              </button>
            </div>
          </div>
        </FormSection>

        {/* Waitlist Members */}
        <FormSection
          title="Waitlist Members"
          subtitle={`${waitlistMembers.length} members on waitlist`}
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
                        <h4 className="text-sm font-semibold text-dark-900 dark:text-white">
                          {member.name}
                        </h4>
                        <p className="text-xs text-light-600 dark:text-dark-400">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs">
                      <div className="text-center">
                        <div className="text-light-600 dark:text-dark-400">
                          Joined
                        </div>
                        <div className="font-medium text-dark-900 dark:text-white">
                          {new Date(
                            member.joined_waitlist,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-light-600 dark:text-dark-400">
                          Attendance
                        </div>
                        <div className="font-medium text-dark-900 dark:text-white">
                          {member.attendance_score}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {isOverLimit && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      No more spots available
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
              Selected Members ({selectedMembers.length}/{availableSpots})
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
                        {member.attendance_score}% attendance
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
              Smart Suggestions
            </h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <p>• Members with 90%+ attendance are more likely to show up</p>
              <p>
                • First-come assignment respects how long each member has waited
              </p>
            </div>
          </div>
        )}
      </div>
    </UnifiedModal>
  );
};

export default ProcessWaitlistModal;
