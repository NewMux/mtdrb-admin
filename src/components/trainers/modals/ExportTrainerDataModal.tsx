import * as React from "react";
import {
  FiDownload,
  FiFileText,
  FiCalendar,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { exportCSV, exportPDF, exportExcel } from "../../../utils/exportData";
import ColorfulModalUI from "../../ui/ColorfulModalUI";
import { SmartButton } from "../../ui/DesignSystem";

interface ExportTrainerDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  format: "csv" | "xlsx" | "pdf";
}

// The generated Database["public"]["Tables"]["trainers"|"classes"|"class_bookings"]
// types in src/types/supabase.ts don't model every column actually queried here
// (e.g. average_rating, date, price, attended) — these describe the real shape
// returned/read by this component's queries.
interface TrainerExportRecord {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  specialties?: string[] | string;
  hourly_rate?: number;
  created_at?: string;
  average_rating?: number | string;
}

interface ClassExportRecord {
  id: string;
  status?: string;
}

interface BookingExportRecord {
  id: string;
  price?: number;
  attended?: boolean;
}

type ExportRow = Record<string, string | number>;

const exportOptions: ExportOption[] = [
  {
    id: "all-trainers",
    name: "All Trainers",
    description: "Complete list of all trainers with basic information",
    icon: FiUsers,
    format: "csv",
  },
  {
    id: "trainer-performance",
    name: "Performance Report",
    description: "Detailed performance metrics and ratings for all trainers",
    icon: FiFileText,
    format: "xlsx",
  },
  {
    id: "trainer-schedule",
    name: "Schedule Report",
    description: "Current class assignments and availability for all trainers",
    icon: FiCalendar,
    format: "csv",
  },
  {
    id: "trainer-analytics",
    name: "Analytics Report",
    description: "Comprehensive analytics and insights (Pro feature)",
    icon: FiFileText,
    format: "pdf",
  },
];

export default function ExportTrainerDataModal({
  isOpen,
  onClose,
  onSuccess,
  isPro = false,
}: ExportTrainerDataModalProps) {
  const { tenantId } = useAuth();
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([
    "all-trainers",
  ]);
  const [dateRange, setDateRange] = React.useState("last-30-days");
  const [loading, setLoading] = React.useState(false);

  const handleToggleOption = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );
  };

  const handleSelectAll = () => {
    setSelectedOptions(exportOptions.map((opt) => opt.id));
  };

  const handleDeselectAll = () => {
    setSelectedOptions([]);
  };

  const handleExport = async () => {
    if (selectedOptions.length === 0) {
      toast.error("Please select at least one export option");
      return;
    }

    if (!tenantId) {
      toast.error("No tenant ID found");
      return;
    }

    setLoading(true);

    try {
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case "last-7-days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "last-30-days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "last-90-days":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "this-year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      // Fetch trainers
      const { data: trainers, error: trainersError } = await supabase
        .from("trainers")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (trainersError) throw trainersError;

      // Export each selected option
      for (const optionId of selectedOptions) {
        const option = exportOptions.find((opt) => opt.id === optionId);
        if (!option) continue;

        let exportData: ExportRow[] = [];
        const filename = `${option.id}-${new Date().toISOString().split("T")[0]}`;

        if (optionId === "all-trainers") {
          exportData = (trainers || []).map((trainer: TrainerExportRecord) => ({
            "First Name": trainer.first_name || "",
            "Last Name": trainer.last_name || "",
            Email: trainer.email || "",
            Phone: trainer.phone || "",
            Status: trainer.status || "active",
            "Specialties": Array.isArray(trainer.specialties)
              ? trainer.specialties.join(", ")
              : trainer.specialties || "",
            "Hourly Rate": trainer.hourly_rate || 0,
            "Join Date": trainer.created_at
              ? new Date(trainer.created_at).toLocaleDateString()
              : "N/A",
          }));
        } else if (optionId === "trainer-performance") {
          // Fetch performance data for each trainer
          const trainersWithPerformance = await Promise.all(
            (trainers || []).map(async (trainer: TrainerExportRecord) => {
              const { data: classes } = await supabase
                .from("classes")
                .select("id")
                .eq("trainer_id", trainer.id)
                .eq("tenant_id", tenantId)
                .gte("created_at", startDate.toISOString());

              const { data: bookings } = await supabase
                .from("class_bookings")
                .select("id, price")
                .in(
                  "class_id",
                  (classes || []).map((c) => c.id),
                )
                .eq("tenant_id", tenantId);

              const totalRevenue = ((bookings || []) as BookingExportRecord[]).reduce(
                (sum: number, b) => sum + (b.price || 0),
                0,
              );

              return {
                "Trainer Name": `${trainer.first_name || ""} ${trainer.last_name || ""}`.trim() || trainer.email || "",
                Email: trainer.email || "",
                "Total Classes": classes?.length || 0,
                "Total Bookings": bookings?.length || 0,
                "Total Revenue": totalRevenue,
                "Average Rating": trainer.average_rating || "N/A",
                Status: trainer.status || "active",
              };
            }),
          );

          exportData = trainersWithPerformance;
        } else if (optionId === "trainer-schedule") {
          // Fetch schedule data
          const trainersWithSchedule = await Promise.all(
            (trainers || []).map(async (trainer: TrainerExportRecord) => {
              const { data: classes } = await supabase
                .from("classes")
                .select("id, name, start_time, end_time, date, status")
                .eq("trainer_id", trainer.id)
                .eq("tenant_id", tenantId)
                .gte("date", startDate.toISOString().split("T")[0])
                .order("date", { ascending: true });

              return {
                "Trainer Name": `${trainer.first_name || ""} ${trainer.last_name || ""}`.trim() || trainer.email || "",
                Email: trainer.email || "",
                "Total Classes": classes?.length || 0,
                "Upcoming Classes": ((classes || []) as ClassExportRecord[]).filter(
                  (c) => c.status === "scheduled" || c.status === "active",
                ).length,
                "Completed Classes": ((classes || []) as ClassExportRecord[]).filter(
                  (c) => c.status === "completed",
                ).length,
                Availability: "Mon-Fri, 6AM-8PM", // TODO: Fetch from schedule table
              };
            }),
          );

          exportData = trainersWithSchedule;
        } else if (optionId === "trainer-analytics" && isPro) {
          // Comprehensive analytics (Pro only)
          const trainersWithAnalytics = await Promise.all(
            (trainers || []).map(async (trainer: TrainerExportRecord) => {
              const { data: classes } = await supabase
                .from("classes")
                .select("id, name, date, start_time, end_time")
                .eq("trainer_id", trainer.id)
                .eq("tenant_id", tenantId)
                .gte("created_at", startDate.toISOString());

              const { data: bookings } = await supabase
                .from("class_bookings")
                .select("id, price, attended")
                .in(
                  "class_id",
                  (classes || []).map((c) => c.id),
                )
                .eq("tenant_id", tenantId);

              const typedBookings = (bookings || []) as BookingExportRecord[];
              const totalRevenue = typedBookings.reduce(
                (sum: number, b) => sum + (b.price || 0),
                0,
              );
              const attendanceRate =
                typedBookings.length > 0
                  ? ((typedBookings.filter((b) => b.attended).length /
                      typedBookings.length) *
                      100).toFixed(2)
                  : "0";

              return {
                "Trainer Name": `${trainer.first_name || ""} ${trainer.last_name || ""}`.trim() || trainer.email || "",
                Email: trainer.email || "",
                "Total Classes": classes?.length || 0,
                "Total Bookings": bookings?.length || 0,
                "Total Revenue": totalRevenue,
                "Attendance Rate": `${attendanceRate}%`,
                "Average Rating": trainer.average_rating || "N/A",
                Status: trainer.status || "active",
                "Specialties": Array.isArray(trainer.specialties)
                  ? trainer.specialties.join(", ")
                  : trainer.specialties || "",
              };
            }),
          );

          exportData = trainersWithAnalytics;
        }

        // Export based on format
        if (option.format === "csv") {
          exportCSV(exportData, filename);
        } else if (option.format === "xlsx") {
          await exportExcel(exportData, filename, option.name);
        } else if (option.format === "pdf") {
          exportPDF(exportData, filename, option.name);
        }
      }

      toast.success(
        `Export completed! ${selectedOptions.length} file(s) downloaded.`,
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(
        `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
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
      title="Export Trainer Data"
      subtitle="Select the data you want to export"
    >
      <div className="space-y-6">
        {/* Date Range Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Date Range
          </h3>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="last-7-days">Last 7 days</option>
            <option value="last-30-days">Last 30 days</option>
            <option value="last-90-days">Last 90 days</option>
            <option value="this-year">This year</option>
            <option value="all-time">All time</option>
          </select>
        </div>

        {/* Export Options */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Export Options
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {exportOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedOptions.includes(option.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleToggleOption(option.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleToggleOption(option.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-3 flex-1">
                  <option.icon className="text-gray-400 w-5 h-5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{option.name}</h4>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {option.format.toUpperCase()}
                  </span>
                  {option.id === "trainer-analytics" && !isPro && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      PRO
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Summary */}
        {selectedOptions.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Export Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Selected Reports:</span>
                <span className="font-medium text-green-900 ml-2">
                  {selectedOptions.length}
                </span>
              </div>
              <div>
                <span className="text-green-700">Date Range:</span>
                <span className="font-medium text-green-900 ml-2">
                  {dateRange
                    .replace("-", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <SmartButton
          variant="secondary"
          size="sm"
          onClick={handleClose}
          disabled={loading}
        >
          <FiX className="h-4 w-4 mr-2" />
          Cancel
        </SmartButton>

        <SmartButton
          variant="primary"
          size="sm"
          onClick={handleExport}
          loading={loading}
        >
          <FiDownload className="h-4 w-4 mr-2" />
          {loading ? "Exporting..." : "Export Data"}
        </SmartButton>
      </div>
    </ColorfulModalUI>
  );
}
