import * as React from "react";
import { AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiUsers,
  FiStar,
  FiClock,
  FiTarget,
  FiCheck,
} from "react-icons/fi";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { SmartButton } from "../../ui/DesignSystem";
import { Member } from "../../../types/member";
import { supabase } from "../../../supabaseClient";
import type { Database } from "../../../types/supabase";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../../hooks/useRTL";

interface AssignTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member | null;
  onSuccess: (member: Member, trainerId: string) => Promise<void>;
  loading?: boolean;
  modalRef?: React.RefObject<HTMLDivElement>;
}

interface Trainer {
  id: string;
  name: string;
  specialization: string;
  rating: number | null;
  availability: string;
  currentMembers: number;
  maxMembers: number;
  avatar: string;
}

type TrainerRow = Pick<
  Database["public"]["Tables"]["trainers"]["Row"],
  "id" | "first_name" | "last_name" | "email" | "specialties" | "rating" | "max_members"
>;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatAvailability = (
  schedule: { day_of_week: number | null; start_time: string | null; end_time: string | null }[],
): string => {
  if (schedule.length === 0) return "No schedule set";
  const byTime = new Map<string, number[]>();
  for (const slot of schedule) {
    if (slot.day_of_week === null || !slot.start_time || !slot.end_time) continue;
    const key = `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}`;
    const days = byTime.get(key) || [];
    days.push(slot.day_of_week);
    byTime.set(key, days);
  }
  if (byTime.size === 0) return "No schedule set";
  return Array.from(byTime.entries())
    .map(([time, days]) => {
      const sorted = [...days].sort((a, b) => a - b);
      const labels = sorted.map((d) => DAY_LABELS[d]).join(", ");
      return `${labels} ${time}`;
    })
    .join(" • ");
};

const AssignTrainerModal: React.FC<AssignTrainerModalProps> = ({
  isOpen,
  onClose,
  member,
  onSuccess,
  modalRef,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [selectedTrainer, setSelectedTrainer] = React.useState<string>("");
  const [isAssigning, setIsAssigning] = React.useState(false);

  // Fetch trainers from Supabase
  React.useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let tenantId = user.user_metadata?.tenant_id;
        if (!tenantId) {
          const { data: membershipData } = await supabase
            .from("memberships")
            .select("tenant_id")
            .eq("user_id", user.id)
            .single();
          tenantId = membershipData?.tenant_id;
        }

        if (tenantId) {
          const { data, error } = await supabase
            .from("trainers")
            .select("id, first_name, last_name, email, specialties, rating, max_members")
            .eq("tenant_id", tenantId)
            .eq("status", "active");

          if (error) throw error;

          // Get member counts and real weekly schedule for each trainer
          const trainersWithCounts = await Promise.all(
            (data || []).map(async (t: TrainerRow) => {
              const [{ count }, { data: schedule }] = await Promise.all([
                supabase
                  .from("members")
                  .select("*", { count: "exact", head: true })
                  .eq("trainer_id", t.id)
                  .eq("status", "active"),
                supabase
                  .from("trainer_schedule")
                  .select("day_of_week, start_time, end_time")
                  .eq("trainer_id", t.id)
                  .eq("is_available", true),
              ]);

              return {
                id: t.id,
                name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.email,
                specialization: (t.specialties || []).join(", "),
                rating: t.rating ?? null,
                availability: formatAvailability(schedule || []),
                currentMembers: count || 0,
                maxMembers: t.max_members,
                avatar: `${t.first_name?.[0] || ''}${t.last_name?.[0] || ''}`.toUpperCase() || "T",
              };
            })
          );

          setTrainers(trainersWithCounts);
        }
      } catch (error) {
        console.error("Error fetching trainers:", error);
      }
    };

    if (isOpen) {
      fetchTrainers();
    }
  }, [isOpen]);

  const [trainers, setTrainers] = React.useState<Trainer[]>([]);

  React.useEffect(() => {
    if (member?.trainer_id) {
      setSelectedTrainer(member.trainer_id);
    } else {
      setSelectedTrainer("");
    }
  }, [member]);

  const handleAssign = async () => {
    if (!selectedTrainer || !member) return;

    setIsAssigning(true);

    try {
      await onSuccess(member, selectedTrainer);
    } catch (error) {
      console.error("Failed to assign trainer:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async () => {
    setIsAssigning(true);

    try {
      await onSuccess(member!, "");
    } catch (error) {
      console.error("Failed to remove trainer:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedTrainer("");
    setIsAssigning(false);
    onClose();
  };

  if (!member) {
    return null;
  }

  const currentTrainer = trainers.find((t) => t.id === member.trainer_id);
  const isAvailable = (trainer: Trainer) =>
    trainer.currentMembers < trainer.maxMembers;

  return (
    <AnimatePresence>
      {isOpen && (
        <ColorfulModalUI
          open={isOpen}
          onClose={handleClose}
          title={t("members.assignPersonalTrainer", "تعيين مدرب شخصي")}
          subtitle={t("members.assignTrainerToMember", "تعيين مدرب لهذا العضو")}
          modalRef={modalRef}
        >
          <div className="space-y-6 text-start" dir={isRTL ? "rtl" : "ltr"}>
            {/* Current Assignment */}
            {currentTrainer && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-blue-600" />
                  <span>{t("members.currentTrainer", "المدرب الحالي")}</span>
                </h3>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm">
                        {currentTrainer.avatar}
                      </span>
                    </div>
                    <div className="flex-1 text-start">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {currentTrainer.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentTrainer.specialization}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiStar className="w-3 h-3 text-yellow-500" />
                          <span>{currentTrainer.rating ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                    <SmartButton
                      variant="danger"
                      size="sm"
                      onClick={handleRemove}
                      loading={isAssigning}
                      disabled={isAssigning}
                    >
                      {t("members.remove", "إزالة")}
                    </SmartButton>
                  </div>
                </div>
              </div>
            )}

            {/* Available Trainers */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-blue-600" />
                <span>{t("members.availableTrainers", "المدربون المتاحون")}</span>
              </h3>

              <div className="space-y-3">
                {trainers.map((trainer) => (
                  <div
                    key={trainer.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedTrainer === trainer.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    } ${!isAvailable(trainer) ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {trainer.avatar}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {trainer.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <FiStar className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {trainer.rating ?? "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {trainer.specialization}
                        </p>

                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <FiClock className="w-3 h-3" />
                            <span>{trainer.availability}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FiUsers className="w-3 h-3" />
                            <span>
                              {trainer.currentMembers}/{trainer.maxMembers}{" "}
                              members
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {selectedTrainer === trainer.id ? (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <FiCheck className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <input
                            type="radio"
                            name="trainer"
                            value={trainer.id}
                            checked={selectedTrainer === trainer.id}
                            onChange={(e) => setSelectedTrainer(e.target.value)}
                            disabled={!isAvailable(trainer)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </div>

                    {!isAvailable(trainer) && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                        Trainer is at full capacity
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Member Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FiTarget className="w-5 h-5 mr-2" />
                Member Information
              </h3>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {member.avatar}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {member.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {(() => {
                        const fitnessLevel = member.fitness_level ?? "Beginner";
                        const fitnessKey = fitnessLevel.toLowerCase();
                        const fitnessClass =
                          fitnessKey === "beginner"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : fitnessKey === "intermediate"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
                        return (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${fitnessClass}`}
                          >
                            {fitnessLevel}
                          </span>
                        );
                      })()}
                      {member.goals && member.goals.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Goals: {member.goals.slice(0, 2).join(", ")}
                          {member.goals.length > 2 && "..."}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <SmartButton
                variant="secondary"
                onClick={handleClose}
                disabled={isAssigning}
              >
                Cancel
              </SmartButton>

              <SmartButton
                onClick={handleAssign}
                loading={isAssigning}
                disabled={!selectedTrainer || isAssigning}
                icon={<FiUser className="w-4 h-4" />}
              >
                {isAssigning ? "Assigning..." : "Assign Trainer"}
              </SmartButton>
            </div>
          </div>
        </ColorfulModalUI>
      )}
    </AnimatePresence>
  );
};

export default AssignTrainerModal;
