import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FiUser,
  FiAlertTriangle,
} from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import { FormSection } from "./SmartFormComponents";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";
import { supabase } from "../../../supabaseClient";

interface Trainer {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  rating: number;
  current_load: number;
  max_load: number;
  hourly_rate: number;
}

interface AssignTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const AssignTrainerModal: React.FC<AssignTrainerModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  isPro = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [filterSpecialty, setFilterSpecialty] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "rating" | "availability" | "load" | "rate"
  >("rating");

  const { classData, fetchClass } = useSmartClassModal({ classId, isPro });

  const loadTrainers = useCallback(async () => {
    const { data, error } = await supabase
      .from("trainers")
      .select("id, first_name, last_name, email, specialties, rating, hourly_rate")
      .eq("status", "active");

    if (error || !data) {
      setTrainers([]);
      return;
    }

    const trainersWithLoad = await Promise.all(
      data.map(async (trainer) => {
        const { count } = await supabase
          .from("classes")
          .select("*", { count: "exact", head: true })
          .eq("trainer_id", trainer.id)
          .gte("start_time", new Date().toISOString());

        return {
          id: trainer.id,
          name: `${trainer.first_name || ""} ${trainer.last_name || ""}`.trim() || trainer.email,
          email: trainer.email,
          specialties: trainer.specialties || [],
          rating: trainer.rating || 0,
          current_load: count || 0,
          max_load: 20, // no per-trainer capacity column yet; reasonable default
          hourly_rate: trainer.hourly_rate || 0,
        };
      }),
    );

    setTrainers(trainersWithLoad);
  }, []);

  // Load class data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
      loadTrainers();
    }
  }, [isOpen, classId, fetchClass, loadTrainers]);

  const handleAssign = async () => {
    if (!selectedTrainer) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("classes")
        .update({ trainer_id: selectedTrainer })
        .eq("id", classId);

      if (error) throw error;

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error assigning trainer:", error);
      toast.error("Failed to assign trainer");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTrainers = () => {
    if (!classData) return [];

    // Only trainers under their class-load capacity; there's no per-trainer
    // weekly schedule data to check exact time-slot availability against yet.
    return trainers.filter((trainer) => trainer.current_load < trainer.max_load);
  };

  const getFilteredTrainers = () => {
    let filtered = getAvailableTrainers();

    if (filterSpecialty) {
      filtered = filtered.filter((trainer) =>
        trainer.specialties.some((specialty) =>
          specialty.toLowerCase().includes(filterSpecialty.toLowerCase()),
        ),
      );
    }

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "availability":
          return a.current_load - b.current_load;
        case "load":
          return a.current_load / a.max_load - b.current_load / b.max_load;
        case "rate":
          return a.hourly_rate - b.hourly_rate;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getTrainerById = (id: string) => trainers.find((t) => t.id === id);

  const getConflicts = () => {
    if (!classData || !selectedTrainer) return [];

    const trainer = getTrainerById(selectedTrainer);
    if (!trainer) return [];

    const conflicts = [];

    if (trainer.current_load >= trainer.max_load) {
      conflicts.push("Trainer at maximum capacity");
    }

    return conflicts;
  };

  if (!classData) {
    return (
      <SmartModal
        isOpen={isOpen}
        onClose={onClose}
        title="Assign Trainer"
        subtitle="Loading class data..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SmartModal>
    );
  }

  const availableTrainers = getFilteredTrainers();
  const selectedTrainerData = getTrainerById(selectedTrainer);
  const conflicts = getConflicts();

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Trainer"
      subtitle={`Assign trainer to ${classData.name}`}
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedTrainer && (
              <div className="flex items-center space-x-1 text-sm text-blue-600">
                <FiUser className="h-4 w-4" />
                <span>{selectedTrainerData?.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedTrainer || conflicts.length > 0}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Assigning..." : "Assign Trainer"}
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
                Current Trainer
              </div>
              <div className="text-sm font-medium text-dark-900 dark:text-white">
                {classData.trainer_name || "Not assigned"}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FormSection
          title="Filter & Sort"
          subtitle="Find the best trainer for this class"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                Filter by Specialty
              </label>
              <input
                type="text"
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                placeholder="e.g., Yoga, HIIT, Strength"
                className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "rating" | "availability" | "load" | "rate")}
                className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
              >
                <option value="rating">Highest Rating</option>
                <option value="availability">Most Available</option>
                <option value="load">Lowest Load</option>
                <option value="rate">Lowest Rate</option>
              </select>
            </div>
          </div>
        </FormSection>

        {/* Available Trainers */}
        <FormSection
          title="Available Trainers"
          subtitle={`${availableTrainers.length} trainers available for this time slot`}
        >
          <div className="space-y-3">
            {availableTrainers.map((trainer, index) => {
              const isSelected = selectedTrainer === trainer.id;
              const loadPercentage =
                (trainer.current_load / trainer.max_load) * 100;

              return (
                <motion.div
                  key={trainer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 border rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-light-200 dark:border-dark-600 bg-light-50 dark:bg-dark-700 hover:border-brand-300"
                  }`}
                  onClick={() => setSelectedTrainer(trainer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="trainer"
                        checked={isSelected}
                        onChange={() => setSelectedTrainer(trainer.id)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-semibold text-dark-900 dark:text-white">
                            {trainer.name}
                          </h4>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {trainer.rating}★
                          </span>
                        </div>
                        <p className="text-xs text-light-600 dark:text-dark-400">
                          {trainer.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {trainer.specialties.map((specialty, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs">
                      <div className="text-center">
                        <div className="text-light-600 dark:text-dark-400">
                          Load
                        </div>
                        <div className="font-medium text-dark-900 dark:text-white">
                          {trainer.current_load}/{trainer.max_load}
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                          <div
                            className={`h-1 rounded-full ${
                              loadPercentage > 80
                                ? "bg-red-500"
                                : loadPercentage > 60
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${loadPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-light-600 dark:text-dark-400">
                          Rate
                        </div>
                        <div className="font-medium text-dark-900 dark:text-white">
                          ${trainer.hourly_rate}/hr
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </FormSection>

        {/* Selected Trainer Details */}
        {selectedTrainerData && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Selected Trainer: {selectedTrainerData.name}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">
                  Specialties:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTrainerData.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">
                  Current Load:
                </span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">
                  {selectedTrainerData.current_load}/
                  {selectedTrainerData.max_load} classes
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start space-x-3">
              <FiAlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
                  Assignment Conflicts
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-200 mt-1 space-y-1">
                  {conflicts.map((conflict, idx) => (
                    <li key={idx}>• {conflict}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Smart Suggestions - computed from the real available trainers above */}
        {isPro && availableTrainers.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
              Smart Recommendations
            </h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              {(() => {
                const topRated = [...availableTrainers].sort((a, b) => b.rating - a.rating)[0];
                const leastLoaded = [...availableTrainers].sort(
                  (a, b) => a.current_load / a.max_load - b.current_load / b.max_load,
                )[0];
                return (
                  <>
                    <p>• {topRated.name} has the highest rating ({topRated.rating.toFixed(1)}★)</p>
                    {leastLoaded.id !== topRated.id && (
                      <p>• {leastLoaded.name} has the most availability ({leastLoaded.current_load}/{leastLoaded.max_load} classes)</p>
                    )}
                    <p>• Consider trainer load to ensure quality instruction</p>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </SmartModal>
  );
};

export default AssignTrainerModal;
