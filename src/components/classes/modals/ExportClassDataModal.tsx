import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiDownload,
  FiFileText,
  FiUsers,
  FiCalendar,
  FiSettings,
  FiCheck,
} from "react-icons/fi";
import { SmartModal } from "../../ui/SmartModal";
import { useSmartClassModal } from "../../../hooks/useSmartClassModal";
import { SmartButton } from "../../ui/DesignSystem";
import { toast } from "react-hot-toast";
import { supabase } from "../../../supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { exportCSV, exportPDF, exportExcel } from "../../../utils/exportData";
import { useTranslation } from "react-i18next";
import type { Database } from "../../../types/supabase";

type MemberJoin = Pick<
  Database["public"]["Tables"]["members"]["Row"],
  "id" | "first_name" | "last_name" | "email" | "phone" | "status"
>;

// `attended` / `price` aren't part of the generated class_bookings Row type,
// but the live table has these columns and the queries below select them.
type BookingRow = Database["public"]["Tables"]["class_bookings"]["Row"] & {
  attended?: boolean | null;
  price?: number | null;
};

type BookingWithMember = BookingRow & { member: MemberJoin | null };

// The exported rows differ per export option but are always a flat map of
// column-label -> primitive value, matching what exportCSV/exportExcel/
// exportPDF expect.
type ExportRow = Record<string, string | number>;

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  format: "csv" | "pdf" | "excel";
  includes: string[];
}

interface ExportFilter {
  dateRange: "all" | "this-week" | "this-month" | "custom";
  customStart?: string;
  customEnd?: string;
  includeWaitlist: boolean;
  includeAnalytics: boolean;
  includeAttendance: boolean;
  includeRevenue: boolean;
}

interface ExportClassDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const ExportClassDataModal: React.FC<ExportClassDataModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  isPro = false,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedExport, setSelectedExport] = useState<string>("");
  const [filters, setFilters] = useState<ExportFilter>({
    dateRange: "all",
    includeWaitlist: true,
    includeAnalytics: true,
    includeAttendance: true,
    includeRevenue: false,
  });
  const [exportProgress, setExportProgress] = useState(0);

  const { classData, fetchClass } = useSmartClassModal({
    classId: classId || "",
    isPro,
  });
  const { tenantId } = useAuth();

  // Load class data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, classId]);

  const exportOptions: ExportOption[] = [
    {
      id: "class-roster",
      label: "Class Roster",
      description: "Complete list of enrolled members with contact details",
      icon: <FiUsers className="h-5 w-5" />,
      format: "csv",
      includes: ["Member names", "Contact info", "Enrollment date", "Status"],
    },
    {
      id: "attendance-report",
      label: "Attendance Report",
      description: "Detailed attendance tracking and analytics",
      icon: <FiCalendar className="h-5 w-5" />,
      format: "excel",
      includes: ["Attendance rates", "No-shows", "Trends", "Analytics"],
    },
    {
      id: "financial-summary",
      label: "Financial Summary",
      description: "Revenue, costs, and profit analysis",
      icon: <FiFileText className="h-5 w-5" />,
      format: "pdf",
      includes: ["Revenue", "Costs", "Profit margins", "Per-member metrics"],
    },
    {
      id: "comprehensive-report",
      label: "Comprehensive Report",
      description: "Complete class data with all analytics (Pro only)",
      icon: <FiSettings className="h-5 w-5" />,
      format: "excel",
      includes: [
        "All data",
        "Advanced analytics",
        "Predictions",
        "Recommendations",
      ],
    },
  ];

  const handleExport = async () => {
    if (!selectedExport) {
      toast.error("Please select an export option");
      return;
    }

    if (!tenantId) {
      toast.error("No tenant ID found");
      return;
    }

    setLoading(true);
    setExportProgress(0);

    try {
      const option = exportOptions.find((opt) => opt.id === selectedExport);
      if (!option) {
        throw new Error("Invalid export option");
      }

      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      let exportData: ExportRow[] = [];
      let filename = `class-export-${new Date().toISOString().split("T")[0]}`;

      // Fetch data based on export type
      if (selectedExport === "class-roster" && classId) {
        // Fetch class roster with member details
        const { data: bookings, error: bookingsError } = await supabase
          .from("class_bookings")
          .select(
            `
            *,
            member:members(id, first_name, last_name, email, phone, status)
          `,
          )
          .eq("class_id", classId)
          .eq("tenant_id", tenantId);

        if (bookingsError) throw bookingsError;

        exportData = ((bookings as BookingWithMember[] | null) || []).map((booking) => ({
          "Member Name": booking.member
            ? `${booking.member.first_name || ""} ${booking.member.last_name || ""}`.trim()
            : "N/A",
          Email: booking.member?.email || "N/A",
          Phone: booking.member?.phone || "N/A",
          "Enrollment Date": booking.created_at
            ? new Date(booking.created_at).toLocaleDateString()
            : "N/A",
          Status: booking.status || "N/A",
        }));

        filename = `class-roster-${classId}`;
      } else if (selectedExport === "attendance-report" && classId) {
        // Fetch attendance data
        const { data: attendance, error: attendanceError } = await supabase
          .from("class_bookings")
          .select(
            `
            *,
            member:members(id, first_name, last_name)
          `,
          )
          .eq("class_id", classId)
          .eq("tenant_id", tenantId);

        if (attendanceError) throw attendanceError;

        exportData = ((attendance as BookingWithMember[] | null) || []).map((record) => ({
          "Member Name": record.member
            ? `${record.member.first_name || ""} ${record.member.last_name || ""}`.trim()
            : "N/A",
          "Class Date": classData?.date
            ? new Date(classData.date).toLocaleDateString()
            : "N/A",
          "Attendance Status": record.attended ? "Attended" : "No Show",
          "Booking Date": record.created_at
            ? new Date(record.created_at).toLocaleDateString()
            : "N/A",
        }));

        filename = `attendance-report-${classId}`;
      } else if (selectedExport === "financial-summary" && classId) {
        // Fetch financial data
        const { data: bookings, error: bookingsError } = await supabase
          .from("class_bookings")
          .select("*")
          .eq("class_id", classId)
          .eq("tenant_id", tenantId);

        if (bookingsError) throw bookingsError;

        const totalRevenue = ((bookings as BookingRow[] | null) || []).reduce(
          (sum, b) => sum + (b.price || 0),
          0,
        );
        const totalCost = (classData?.cost || 0) * (bookings?.length || 0);

        exportData = [
          {
            "Class Name": classData?.name || "N/A",
            "Total Bookings": bookings?.length || 0,
            "Total Revenue": totalRevenue,
            "Total Costs": totalCost,
            "Profit": totalRevenue - totalCost,
            "Profit Margin": totalRevenue > 0
              ? `${((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2)}%`
              : "0%",
            "Per Member Revenue": bookings?.length
              ? (totalRevenue / bookings.length).toFixed(2)
              : "0",
          },
        ];

        filename = `financial-summary-${classId}`;
      } else if (selectedExport === "comprehensive-report" && classId) {
        // Comprehensive report with all data
        const [bookingsResult] = await Promise.all([
          supabase
            .from("class_bookings")
            .select(
              `
              *,
              member:members(id, first_name, last_name, email, phone, status)
            `,
            )
            .eq("class_id", classId)
            .eq("tenant_id", tenantId),
          supabase
            .from("class_bookings")
            .select("*")
            .eq("class_id", classId)
            .eq("tenant_id", tenantId),
        ]);

        if (bookingsResult.error) throw bookingsResult.error;

        exportData = ((bookingsResult.data as BookingWithMember[] | null) || []).map((booking) => ({
          "Member Name": booking.member
            ? `${booking.member.first_name || ""} ${booking.member.last_name || ""}`.trim()
            : "N/A",
          Email: booking.member?.email || "N/A",
          Phone: booking.member?.phone || "N/A",
          "Enrollment Date": booking.created_at
            ? new Date(booking.created_at).toLocaleDateString()
            : "N/A",
          Status: booking.status || "N/A",
          "Class Name": classData?.name || "N/A",
          "Class Date": classData?.date
            ? new Date(classData.date).toLocaleDateString()
            : "N/A",
          "Start Time": classData?.start_time || "N/A",
          "End Time": classData?.end_time || "N/A",
          Price: booking.price || 0,
        }));

        filename = `comprehensive-report-${classId}`;
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      // Export based on format
      if (option.format === "csv") {
        exportCSV(exportData, filename);
      } else if (option.format === "pdf") {
        exportPDF(exportData, filename, option.label);
      } else if (option.format === "excel") {
        await exportExcel(exportData, filename, option.label);
      }

      toast.success("Data exported successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error(
        `Failed to export data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
      setExportProgress(0);
    }
  };

  const getSelectedExportOption = () => {
    return exportOptions.find((option) => option.id === selectedExport);
  };

  const isProFeature = (optionId: string) => {
    return optionId === "comprehensive-report";
  };

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("classes.exportClassData")}
      subtitle={t("classes.exportClassInformation")}
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {selectedExport && (
              <div className="flex items-center space-x-1 text-sm text-blue-600">
                <FiDownload className="h-4 w-4" />
                <span>{getSelectedExportOption()?.label}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <SmartButton
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </SmartButton>
            <SmartButton
              variant="primary"
              onClick={handleExport}
              loading={loading}
              disabled={loading || !selectedExport}
            >
              {loading ? "Exporting..." : "Export Data"}
            </SmartButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Class Info */}
        {classData && (
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
                  Members
                </div>
                <div className="text-lg font-semibold text-dark-900 dark:text-white">
                  {classData.enrolled_count}/{classData.capacity}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
            Select Export Type
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportOptions.map((option, index) => {
              const isSelected = selectedExport === option.id;
              const isProOnly = isProFeature(option.id);

              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 border rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-light-200 dark:border-dark-600 bg-light-50 dark:bg-dark-700 hover:border-brand-300"
                  } ${!isPro && isProOnly ? "opacity-50" : ""}`}
                  onClick={() =>
                    !isProOnly || isPro ? setSelectedExport(option.id) : null
                  }
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? "bg-brand-100 dark:bg-brand-900/40"
                          : "bg-light-100 dark:bg-dark-600"
                      }`}
                    >
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-dark-900 dark:text-white">
                          {option.label}
                        </h4>
                        {isProOnly && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Pro
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                        {option.description}
                      </p>
                      <div className="mt-2">
                        <div className="text-xs text-light-600 dark:text-dark-400 mb-1">
                          Includes:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {option.includes.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-light-600 dark:text-dark-400">
                        Format: {option.format.toUpperCase()}
                      </div>
                    </div>
                    {isSelected && (
                      <FiCheck className="h-5 w-5 text-brand-600" />
                    )}
                  </div>

                  {!isPro && isProOnly && (
                    <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                      Upgrade to Pro to access this feature
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Export Filters */}
        {selectedExport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
              Export Options
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: e.target.value as ExportFilter["dateRange"],
                    }))
                  }
                  className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
                >
                  <option value="all">All Time</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filters.dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.customStart || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customStart: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.customEnd || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customEnd: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                <input
                  type="checkbox"
                  id="include-waitlist"
                  checked={filters.includeWaitlist}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      includeWaitlist: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="include-waitlist"
                  className="text-sm text-blue-900 dark:text-blue-100"
                >
                  Include waitlist members
                </label>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <input
                  type="checkbox"
                  id="include-analytics"
                  checked={filters.includeAnalytics}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      includeAnalytics: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label
                  htmlFor="include-analytics"
                  className="text-sm text-green-900 dark:text-green-100"
                >
                  Include analytics and trends
                </label>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <input
                  type="checkbox"
                  id="include-attendance"
                  checked={filters.includeAttendance}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      includeAttendance: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <label
                  htmlFor="include-attendance"
                  className="text-sm text-yellow-900 dark:text-yellow-100"
                >
                  Include attendance history
                </label>
              </div>

              {isPro && (
                <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <input
                    type="checkbox"
                    id="include-revenue"
                    checked={filters.includeRevenue}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        includeRevenue: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label
                    htmlFor="include-revenue"
                    className="text-sm text-purple-900 dark:text-purple-100"
                  >
                    Include revenue data (Pro feature)
                  </label>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Export Progress */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Exporting data...
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {exportProgress}% complete
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Smart Suggestions */}
        {isPro && selectedExport && (
          <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
              Smart Suggestions
            </h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <p>
                • Include analytics for better insights into class performance
              </p>
              <p>• Export attendance data to identify patterns and trends</p>
              <p>
                • Consider revenue data for financial analysis and optimization
              </p>
            </div>
          </div>
        )}
      </div>
    </SmartModal>
  );
};

export default ExportClassDataModal;
