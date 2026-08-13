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
      label: t("classes.classRoster"),
      description: t("classes.classRosterDescription"),
      icon: <FiUsers className="h-5 w-5" />,
      format: "csv",
      includes: [t("classes.memberNames"), t("classes.contactInfo"), t("classes.enrollmentDate"), t("classes.status")],
    },
    {
      id: "attendance-report",
      label: t("classes.attendanceReport"),
      description: t("classes.attendanceReportDescription"),
      icon: <FiCalendar className="h-5 w-5" />,
      format: "excel",
      includes: [t("classes.attendanceRates"), t("classes.noShows"), t("classes.trends"), t("classes.analytics")],
    },
    {
      id: "financial-summary",
      label: t("classes.financialSummary"),
      description: t("classes.financialSummaryDescription"),
      icon: <FiFileText className="h-5 w-5" />,
      format: "pdf",
      includes: [t("classes.revenue"), t("classes.costs"), t("classes.profitMargins"), t("classes.perMemberMetrics")],
    },
    {
      id: "comprehensive-report",
      label: t("classes.comprehensiveReport"),
      description: t("classes.comprehensiveReportDescription"),
      icon: <FiSettings className="h-5 w-5" />,
      format: "excel",
      includes: [
        t("classes.allData"),
        t("classes.advancedAnalytics"),
        t("classes.predictions"),
        t("classes.recommendations"),
      ],
    },
  ];

  const handleExport = async () => {
    if (!selectedExport) {
      toast.error(t("classes.pleaseSelectExportOption"));
      return;
    }

    if (!tenantId) {
      toast.error(t("classes.noTenantIdFound"));
      return;
    }

    setLoading(true);
    setExportProgress(0);

    try {
      const option = exportOptions.find((opt) => opt.id === selectedExport);
      if (!option) {
        throw new Error(t("classes.invalidExportOption"));
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
          [t("classes.memberNameHeader")]: booking.member
            ? `${booking.member.first_name || ""} ${booking.member.last_name || ""}`.trim()
            : t("classes.naValue"),
          [t("classes.emailHeader")]: booking.member?.email || t("classes.naValue"),
          [t("classes.phoneHeader")]: booking.member?.phone || t("classes.naValue"),
          [t("classes.enrollmentDate")]: booking.created_at
            ? new Date(booking.created_at).toLocaleDateString()
            : t("classes.naValue"),
          [t("classes.status")]: booking.status || t("classes.naValue"),
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
          [t("classes.memberNameHeader")]: record.member
            ? `${record.member.first_name || ""} ${record.member.last_name || ""}`.trim()
            : t("classes.naValue"),
          [t("classes.classDateHeader")]: classData?.date
            ? new Date(classData.date).toLocaleDateString()
            : t("classes.naValue"),
          [t("classes.attendanceStatusHeader")]: record.attended ? t("classes.statusAttended") : t("classes.noShow"),
          [t("classes.bookingDateHeader")]: record.created_at
            ? new Date(record.created_at).toLocaleDateString()
            : t("classes.naValue"),
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
            [t("classes.className")]: classData?.name || t("classes.naValue"),
            [t("classes.totalBookingsHeader")]: bookings?.length || 0,
            [t("classes.totalRevenue")]: totalRevenue,
            [t("classes.totalCostsHeader")]: totalCost,
            [t("classes.profitHeader")]: totalRevenue - totalCost,
            [t("classes.profitMargin")]: totalRevenue > 0
              ? `${((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2)}%`
              : "0%",
            [t("classes.perMemberRevenueHeader")]: bookings?.length
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
          [t("classes.memberNameHeader")]: booking.member
            ? `${booking.member.first_name || ""} ${booking.member.last_name || ""}`.trim()
            : t("classes.naValue"),
          [t("classes.emailHeader")]: booking.member?.email || t("classes.naValue"),
          [t("classes.phoneHeader")]: booking.member?.phone || t("classes.naValue"),
          [t("classes.enrollmentDate")]: booking.created_at
            ? new Date(booking.created_at).toLocaleDateString()
            : t("classes.naValue"),
          [t("classes.status")]: booking.status || t("classes.naValue"),
          [t("classes.className")]: classData?.name || t("classes.naValue"),
          [t("classes.classDateHeader")]: classData?.date
            ? new Date(classData.date).toLocaleDateString()
            : t("classes.naValue"),
          [t("classes.startTime")]: classData?.start_time || t("classes.naValue"),
          [t("classes.endTime")]: classData?.end_time || t("classes.naValue"),
          [t("classes.priceHeader")]: booking.price || 0,
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

      toast.success(t("classes.exportCompleted"));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error(
        t("classes.failedToExportData", { message: error instanceof Error ? error.message : t("classes.unknownError") }),
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
              {t("common.cancel")}
            </SmartButton>
            <SmartButton
              variant="primary"
              onClick={handleExport}
              loading={loading}
              disabled={loading || !selectedExport}
            >
              {loading ? t("classes.exporting") : t("classes.exportData")}
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
                  {t("classes.members")}
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
            {t("classes.selectExportType")}
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
                            {t("classes.proLabel")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-light-600 dark:text-dark-400 mt-1">
                        {option.description}
                      </p>
                      <div className="mt-2">
                        <div className="text-xs text-light-600 dark:text-dark-400 mb-1">
                          {t("classes.includesLabel")}:
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
                        {t("classes.formatLabel", { format: option.format.toUpperCase() })}
                      </div>
                    </div>
                    {isSelected && (
                      <FiCheck className="h-5 w-5 text-brand-600" />
                    )}
                  </div>

                  {!isPro && isProOnly && (
                    <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                      {t("classes.upgradeToProToAccess")}
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
              {t("classes.exportOptionsTitle")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                  {t("classes.dateRange")}
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
                  <option value="all">{t("classes.allTime")}</option>
                  <option value="this-week">{t("classes.thisWeek")}</option>
                  <option value="this-month">{t("classes.thisMonth")}</option>
                  <option value="custom">{t("classes.customRange")}</option>
                </select>
              </div>

              {filters.dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                      {t("classes.startDate")}
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
                      {t("classes.endDate")}
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
                  {t("classes.includeWaitlistMembers")}
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
                  {t("classes.includeAnalyticsAndTrends")}
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
                  {t("classes.includeAttendanceHistory")}
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
                    {t("classes.includeRevenueDataPro")}
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
                  {t("classes.exportingData")}
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {t("classes.percentComplete", { percent: exportProgress })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Smart Suggestions */}
        {isPro && selectedExport && (
          <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
              {t("classes.smartSuggestionsTitle")}
            </h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <p>
                • {t("classes.includeAnalyticsForBetterInsights")}
              </p>
              <p>• {t("classes.exportAttendanceDataToIdentify")}</p>
              <p>
                • {t("classes.considerRevenueDataForAnalysis")}
              </p>
            </div>
          </div>
        )}
      </div>
    </SmartModal>
  );
};

export default ExportClassDataModal;
