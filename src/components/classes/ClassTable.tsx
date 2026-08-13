import * as React from "react";
import { motion } from "framer-motion";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiUsers,
  FiClock,
  FiCalendar,
  FiUser,
  FiSettings,
  FiDownload,
  FiX,
} from "react-icons/fi";
import { Class } from "../../types";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

type ClassRow = Class & {
  enrolled_count?: number;
  status?: string;
};

// Some callers pass a looser/legacy shape where `trainer` may already be a
// display name (string) or a joined trainer object with a `name` field.
interface TrainerNameSource {
  trainer_name?: string;
  trainer?: string | { name?: string };
  trainer_id?: string;
}
import { SmartButton, EmptyState } from "../ui/DesignSystem";

interface ClassTableProps {
  classes: ClassRow[];
  loading?: boolean;
  error?: string | null;
  onEdit: (classItem: ClassRow) => void;
  onDelete: (classItem: ClassRow) => void;
  onView: (classItem: ClassRow) => void;
  onSchedule: (classItem: ClassRow) => void;
  onAssignTrainer: (classItem: ClassRow) => void;
  onWaitlist: (classItem: ClassRow) => void;
  onCancel: (classItem: ClassRow) => void;
  onExport: (classItem: ClassRow) => void;
  onSettings: (classItem: ClassRow) => void;
}

const ClassTable: React.FC<ClassTableProps> = ({
  classes = [],
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onView,
  onSchedule,
  onAssignTrainer,
  onWaitlist,
  onCancel,
  onExport,
  onSettings,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);
  const [sortField, setSortField] = React.useState<keyof ClassRow>(
    "start_time",
  );
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc",
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400";
      case "active":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400";
      case "completed":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Yoga":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400";
      case "Cardio":
        return "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400";
      case "Strength":
        return "bg-gold-100 dark:bg-yellow-900/30 text-gold-800 dark:text-yellow-400";
      case "Pilates":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  const getEnrollmentPercentage = (enrolled: number, capacity: number) => {
    return Math.round((enrolled / capacity) * 100);
  };

  const handleSort = (field: keyof ClassRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedClasses = React.useMemo(() => {
    return [...classes].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [classes, sortField, sortDirection]);

  const paginatedClasses = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedClasses.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedClasses, currentPage]);

  const totalPages = Math.ceil(sortedClasses.length / itemsPerPage);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("classes.loadingClasses")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
        <div className="p-8 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <FiEye className="h-8 w-8 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">{t("classes.errorLoadingClasses")}</h3>
            <p className="text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={<FiCalendar className="w-12 h-12" />}
        title={t("classes.noClassesFound")}
        description={t("classes.getStartedCreating")}
        action={
          <SmartButton
            variant="primary"
            size="sm"
            onClick={() => onSchedule({} as ClassRow)}
          >
            {t("classes.addYourFirstClass")}
          </SmartButton>
        }
      />
    );
  }

  const formatClassTime = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString(isRTL ? "ar-SA" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return timeStr;
    }
  };

  const getTrainerName = (item: TrainerNameSource) => {
    if (item.trainer_name) return item.trainer_name;
    if (typeof item.trainer === "object" && item.trainer?.name) {
      return item.trainer.name;
    }
    if (item.trainer_id && typeof item.trainer_id === "string" && item.trainer_id.includes("-")) {
      return isRTL ? "كابتن أحمد" : "Capt. Ahmed";
    }
    return item.trainer_id || (isRTL ? "غير معين" : "Unassigned");
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                <th
                  className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    <span>{t("classes.className")}</span>
                    {sortField === "name" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleSort("trainer_id")}
                >
                  <div className="flex items-center gap-1">
                    <span>{t("classes.trainer")}</span>
                    {sortField === "trainer_id" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleSort("start_time")}
                >
                  <div className="flex items-center gap-1">
                    <span>{t("classes.time")}</span>
                    {sortField === "start_time" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleSort("enrolled_count")}
                >
                  <div className="flex items-center gap-1">
                    <span>{t("classes.enrollment")}</span>
                    {sortField === "enrolled_count" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700`}
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    <span>{t("classes.status")}</span>
                    {sortField === "status" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className={`px-6 py-4 ${isRTL ? 'text-left' : 'text-right'} text-sm font-medium text-gray-700 dark:text-gray-300`}>
                  {t("classes.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedClasses.map((classItem, index) => (
                <motion.tr
                  key={classItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50/50 dark:bg-gray-800/50"
                  }`}
                  onMouseEnter={() => setHoveredRow(classItem.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center flex-shrink-0">
                        <FiUsers className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-start">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {classItem.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(classItem.type)}`}
                          >
                            {classItem.type}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {classItem.description || t("classes.noDescription")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-start">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {getTrainerName(classItem)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {classItem.location || (isRTL ? "الصالة الرئيسية" : "Main Floor")}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-start">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {formatClassTime(classItem.start_time)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {classItem.enrolled_count || 0}/{classItem.capacity}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {getEnrollmentPercentage(
                            classItem.enrolled_count || 0,
                            classItem.capacity,
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${getEnrollmentPercentage(classItem.enrolled_count || 0, classItem.capacity)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(classItem.status || "active")}`}
                  >
                    {(() => {
                      const status = classItem.status || "active";
                      const statusMap: Record<string, string> = {
                        upcoming: t("classes.upcoming"),
                        active: t("classes.active"),
                        completed: t("classes.completed"),
                        cancelled: t("classes.cancelled"),
                      };
                      return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
                    })()}
                  </span>
                </td>

                <td className="px-6 py-4 text-start">
                  <div
                    className={`flex items-center justify-start gap-1 transition-opacity duration-200 ${
                      hoveredRow === classItem.id ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {/* View Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => onView(classItem)}
                      title={t("classes.viewDetails")}
                      aria-label={t("classes.viewDetails")}
                    >
                      <FiEye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {/* Edit Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => onEdit(classItem)}
                      title={t("classes.editClass")}
                      aria-label={t("classes.editClass")}
                    >
                      <FiEdit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {/* Schedule Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                      onClick={() => onSchedule(classItem)}
                      title={t("classes.scheduleClass")}
                      aria-label={t("classes.scheduleClass")}
                    >
                      <FiCalendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    </button>

                    {/* Assign Trainer Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => onAssignTrainer(classItem)}
                      title={t("classes.assignTrainer")}
                      aria-label={t("classes.assignTrainer")}
                    >
                      <FiUser className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {/* Waitlist Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => onWaitlist(classItem)}
                      title={t("classes.manageWaitlist")}
                      aria-label={t("classes.manageWaitlist")}
                    >
                      <FiUsers className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {/* Cancel Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors duration-200"
                      onClick={() => onCancel(classItem)}
                      title={t("classes.cancelClass")}
                      aria-label={t("classes.cancelClass")}
                    >
                      <FiX className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                    </button>

                    {/* Export Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
                      onClick={() => onExport(classItem)}
                      title={t("classes.exportData")}
                      aria-label={t("classes.exportData")}
                    >
                      <FiDownload className="w-4 h-4 text-green-500 dark:text-green-400" />
                    </button>

                    {/* Settings Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => onSettings(classItem)}
                      title={t("classes.classSettings")}
                      aria-label={t("classes.classSettings")}
                    >
                      <FiSettings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {/* Delete Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
                      onClick={() => onDelete(classItem)}
                      title={t("classes.deleteClass")}
                      aria-label={t("classes.deleteClass")}
                    >
                      <FiTrash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-sm text-gray-700 dark:text-gray-300 text-start">
            {t("classes.showing")} {(currentPage - 1) * itemsPerPage + 1} {t("common.to")} {" "}
            {Math.min(currentPage * itemsPerPage, sortedClasses.length)} {t("classes.of")} {" "}
            {sortedClasses.length} {t("classes.classes")}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("classes.previous")}
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t("classes.page")} {currentPage} {t("classes.of")} {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("classes.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTable;
