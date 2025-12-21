import * as React from "react";
import { motion } from "framer-motion";
import {
  FiMoreHorizontal,
  FiEdit,
  FiTrash2,
  FiEye,
  FiUsers,
  FiClock,
  FiMapPin,
  FiCalendar,
  FiUser,
  FiSettings,
  FiDownload,
  FiX,
} from "react-icons/fi";
import { Class } from "../../types";
import { SmartButton, EmptyState } from "../ui/DesignSystem";

interface ClassTableProps {
  classes: Class[];
  loading?: boolean;
  error?: string | null;
  onEdit: (classItem: Class) => void;
  onDelete: (classItem: Class) => void;
  onView: (classItem: Class) => void;
  onSchedule: (classItem: Class) => void;
  onAssignTrainer: (classItem: Class) => void;
  onWaitlist: (classItem: Class) => void;
  onCancel: (classItem: Class) => void;
  onExport: (classItem: Class) => void;
  onSettings: (classItem: Class) => void;
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
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null);
  const [sortField, setSortField] = React.useState<
    keyof Class | "enrolled_count"
  >("start_time");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc",
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-sky-100 text-sky-800";
      case "active":
        return "bg-emerald-100 text-emerald-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Yoga":
        return "bg-purple-100 text-purple-800";
      case "Cardio":
        return "bg-rose-100 text-rose-800";
      case "Strength":
        return "bg-gold-100 text-gold-800";
      case "Pilates":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEnrollmentPercentage = (enrolled: number, capacity: number) => {
    return Math.round((enrolled / capacity) * 100);
  };

  const handleSort = (field: keyof Class | "enrolled_count") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedClasses = React.useMemo(() => {
    return [...classes].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle enrolled_count field which might not exist in the Class interface
      if (sortField === "enrolled_count") {
        aValue = (a as any).enrolled_count || 0;
        bValue = (b as any).enrolled_count || 0;
      }

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
      <div className="overflow-hidden rounded-2xl border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200">
        <div className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <FiEye className="h-8 w-8 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Classes</h3>
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
        title="No Classes Found"
        description="Get started by creating your first class"
        action={
          <SmartButton
            variant="primary"
            size="sm"
            onClick={() => onSchedule({} as Class)}
          >
            Add Your First Class
          </SmartButton>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center space-x-1">
                  <span>Class</span>
                  {sortField === "name" && (
                    <span className="text-xs">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("trainer_id")}
              >
                <div className="flex items-center space-x-1">
                  <span>Trainer</span>
                  {sortField === "trainer_id" && (
                    <span className="text-xs">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("start_time")}
              >
                <div className="flex items-center space-x-1">
                  <span>Time</span>
                  {sortField === "start_time" && (
                    <span className="text-xs">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("enrolled_count")}
              >
                <div className="flex items-center space-x-1">
                  <span>Enrollment</span>
                  {sortField === "enrolled_count" && (
                    <span className="text-xs">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {sortField === "status" && (
                    <span className="text-xs">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedClasses.map((classItem, index) => (
              <motion.tr
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`hover:bg-gray-50 transition-colors duration-200 ${
                  index % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50/50/50"
                }`}
                onMouseEnter={() => setHoveredRow(classItem.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
                      <FiUsers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {classItem.name}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(classItem.type)}`}
                        >
                          {classItem.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {classItem.description || "No description"}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {classItem.trainer_id}
                  </div>
                  <div className="text-xs text-gray-500">
                    {classItem.location}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <FiClock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {classItem.start_time}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">
                        {(classItem as any).enrolled_count || 0}/
                        {classItem.capacity}
                      </span>
                      <span className="text-gray-500">
                        {getEnrollmentPercentage(
                          (classItem as any).enrolled_count || 0,
                          classItem.capacity,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${getEnrollmentPercentage((classItem as any).enrolled_count || 0, classItem.capacity)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(classItem.status || "active")}`}
                  >
                    {(classItem.status || "active").charAt(0).toUpperCase() +
                      (classItem.status || "active").slice(1)}
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <div
                    className={`flex items-center justify-end space-x-1 transition-opacity duration-200 ${
                      hoveredRow === classItem.id ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {/* View Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => onView(classItem)}
                      title="View Details"
                      aria-label="View class details"
                    >
                      <FiEye className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Edit Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => onEdit(classItem)}
                      title="Edit Class"
                      aria-label="Edit class"
                    >
                      <FiEdit className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Schedule Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                      onClick={() => onSchedule(classItem)}
                      title="Schedule Class"
                      aria-label="Schedule class"
                    >
                      <FiCalendar className="w-4 h-4 text-blue-500" />
                    </button>

                    {/* Assign Trainer Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => onAssignTrainer(classItem)}
                      title="Assign Trainer"
                      aria-label="Assign trainer to class"
                    >
                      <FiUser className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Waitlist Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => onWaitlist(classItem)}
                      title="Manage Waitlist"
                      aria-label="Manage class waitlist"
                    >
                      <FiUsers className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Cancel Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-orange-100 transition-colors duration-200"
                      onClick={() => onCancel(classItem)}
                      title="Cancel Class"
                      aria-label="Cancel class"
                    >
                      <FiX className="w-4 h-4 text-orange-500" />
                    </button>

                    {/* Export Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-green-100 transition-colors duration-200"
                      onClick={() => onExport(classItem)}
                      title="Export Data"
                      aria-label="Export class data"
                    >
                      <FiDownload className="w-4 h-4 text-green-500" />
                    </button>

                    {/* Settings Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => onSettings(classItem)}
                      title="Class Settings"
                      aria-label="Class settings"
                    >
                      <FiSettings className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Delete Button */}
                    <button
                      className="p-2 rounded-lg hover:bg-red-100 transition-colors duration-200"
                      onClick={() => onDelete(classItem)}
                      title="Delete Class"
                      aria-label="Delete class"
                    >
                      <FiTrash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, sortedClasses.length)} of{" "}
            {sortedClasses.length} classes
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTable;
