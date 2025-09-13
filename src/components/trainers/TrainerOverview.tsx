import React, { useState } from "react";
import {
  FiUsers,
  FiCalendar,
  FiStar,
  FiSearch,
  FiDownload,
  FiFilter,
} from "react-icons/fi";
import TrainerTable from "./TrainerTable";
import AddTrainerModal from "./AddTrainerModal";
import { supabase } from "../../supabaseClient";
import TrainerKPICards from "./TrainerKPICards";

interface TrainerStats {
  totalTrainers: number;
  activeTrainers: number;
  todaySessions: number;
  topRatedTrainer: {
    name: string;
    rating: number;
  } | null;
}

interface Props {
  stats: TrainerStats;
  onSelectTrainer: (trainerId: string) => void;
}

export default function TrainerOverview({ stats, onSelectTrainer }: Props) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    specialty: "",
    status: "",
    gender: "",
    rating: "",
  });

  const handleExport = async () => {
    try {
      // Fetch trainers
      const { data: trainers, error: trainersError } = await supabase
        .from("trainers")
        .select("*");

      if (trainersError) throw trainersError;

      // Try to fetch trainer schedules separately, but don't fail if table doesn&apos;t exist
      let schedules = [];
      try {
        const { data: scheduleData, error: schedulesError } = await supabase
          .from("trainer_schedule")
          .select("trainer_id");

        if (schedulesError) {
          // If trainer_schedule table doesn&apos;t exist, just use empty schedules
          if (schedulesError.message.includes("does not exist")) {
            console.log("Trainer schedule table not available yet");
            schedules = [];
          } else {
            throw schedulesError;
          }
        } else {
          schedules = scheduleData || [];
        }
      } catch (scheduleError: any) {
        // If any error occurs with trainer_schedule, just use empty schedules
        console.log("Could not fetch trainer schedule:", scheduleError.message);
        schedules = [];
      }

      // Count schedules per trainer
      const scheduleCounts = schedules.reduce((acc: any, schedule: any) => {
        acc[schedule.trainer_id] = (acc[schedule.trainer_id] || 0) + 1;
        return acc;
      }, {});

      // Convert data to CSV
      const headers = [
        "Name",
        "Email",
        "Phone",
        "Specialty",
        "Status",
        "Rating",
        "Total Sessions",
      ];
      const csvContent = [
        headers.join(","),
        ...trainers.map((trainer: any) =>
          [
            trainer.name,
            trainer.email,
            trainer.phone,
            trainer.specialties?.join(";"),
            trainer.status,
            trainer.rating,
            scheduleCounts[trainer.id] || 0,
          ].join(","),
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trainers_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting trainers:", error);
    }
  };

  return (
    <div className="w-full">
      {/* Search and Filters Bar */}
      <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
          <FiSearch className="text-blue-400" />
          <input
            type="text"
            placeholder="Search by trainer name or specialty..."
            className="bg-transparent outline-none flex-1 text-blue-900 placeholder-blue-300 border-none shadow-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <select
              className="bg-blue-50 rounded-full px-4 py-2 text-blue-900 font-semibold border border-blue-100 appearance-none pr-8 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
              value={filters.specialty}
              onChange={(e) =>
                setFilters({ ...filters, specialty: e.target.value })
              }
            >
              <option value="">All Specialties</option>
              <option value="strength">Strength</option>
              <option value="yoga">Yoga</option>
              <option value="zumba">Zumba</option>
              <option value="pt">Personal Training</option>
            </select>
            <FiFilter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-blue-400" />
          </div>
          <div className="relative">
            <select
              className="bg-blue-50 rounded-full px-4 py-2 text-blue-900 font-semibold border border-blue-100 appearance-none pr-8 focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="resigned">Resigned</option>
            </select>
            <FiFilter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-blue-400" />
          </div>
          {/* Add more filters as needed */}
          <button
            className="flex items-center gap-1 px-4 py-2 rounded-full border border-blue-100 bg-white text-blue-700 font-semibold transition hover:bg-blue-50"
            onClick={handleExport}
          >
            <FiDownload className="text-blue-500" /> Export
          </button>
        </div>
      </div>
      {/* Trainer Table */}
      <TrainerTable
        searchTerm={searchTerm}
        filters={filters}
        onSelectTrainer={onSelectTrainer}
      />
      <AddTrainerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
