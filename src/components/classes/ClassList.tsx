import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  FiSearch,
  FiEdit2,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiUpload,
  FiChevronDown,
  FiTrash2,
} from "react-icons/fi";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import FilterButton from "../ui/FilterButton";
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useTranslation } from "react-i18next";
import { useRTL } from "../../hooks/useRTL";

interface Trainer {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  description?: string;
  trainer?: Trainer;
  starttime: string;
  endtime: string;
  capacity?: number;
  status?: string;
  bookedCount?: number;
}

interface ClassListProps {
  classes: Class[];
  onEdit: (classItem: Class) => void;
  onView: (classItem: Class) => void;
  onDelete: (classItem: Class) => void;
  refreshKey: number;
  selectedClassId?: string | null;
}

export default function ClassList({
  classes,
  onEdit,
  onView,
  onDelete,
  refreshKey,
  selectedClassId,
}: ClassListProps) {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { tenantId } = useAuth();
  const [search, setSearch] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  // Price filters - reserved for future pricing filter feature
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_minPrice, _setMinPrice] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_maxPrice, _setMaxPrice] = useState("");
  const PAGE_SIZE = 10;
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Extract unique trainers for filter dropdown
  const trainers = useMemo(() => {
    const unique = new Map();
    classes.forEach((c) => {
      if (c.trainer) unique.set(c.trainer.id, c.trainer.name);
    });
    return Array.from(unique.entries());
  }, [classes]);

  // Filtered and searched classes
  const filtered = useMemo(() => {
    return classes.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.trainer?.name?.toLowerCase().includes(search.toLowerCase()) ??
          false);
      const matchesTrainer = trainerFilter
        ? c.trainer?.id === trainerFilter
        : true;
      const matchesStatus = statusFilter ? c.status === statusFilter : true;
      const matchesDateFrom = dateFrom
        ? new Date(c.starttime) >= new Date(dateFrom)
        : true;
      const matchesDateTo = dateTo
        ? new Date(c.starttime) <= new Date(dateTo)
        : true;
      const matchesMinCapacity = minCapacity
        ? (c.capacity ?? 0) >= parseInt(minCapacity)
        : true;
      const matchesMaxCapacity = maxCapacity
        ? (c.capacity ?? 0) <= parseInt(maxCapacity)
        : true;
      const matchesMinPrice = true;
      const matchesMaxPrice = true;
      return (
        matchesSearch &&
        matchesTrainer &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesMinCapacity &&
        matchesMaxCapacity &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });
  }, [
    classes,
    search,
    trainerFilter,
    statusFilter,
    dateFrom,
    dateTo,
    minCapacity,
    maxCapacity,
  ]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, trainerFilter, statusFilter, refreshKey]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "SELECT"
      )
        return;
      const idx = rowRefs.current.findIndex(
        (ref) => ref === document.activeElement,
      );
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (idx < paged.length - 1) rowRefs.current[idx + 1]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (idx > 0) rowRefs.current[idx - 1]?.focus();
      } else if (e.key === "Enter" && idx >= 0) {
        onView(paged[idx]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paged, onView]);

  // Export as CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(
      filtered.map((c) => ({
        Name: c.name,
        Trainer: c.trainer?.name || "-",
        "Start Time": c.starttime,
        "End Time": c.endtime,
        Capacity: c.capacity ?? "∞",
        Booked: c.bookedCount ?? 0,
      })),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "classes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export as PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Classes List", 14, 16);
    const tableData = filtered.map((c) => [
      c.name,
      c.trainer?.name || "-",
      c.starttime,
      c.endtime,
      c.capacity ?? "∞",
      c.bookedCount ?? 0,
    ]);
    // jsPDF autoTable plugin type assertion needed due to missing types in jspdf-autotable
    (doc as unknown as { autoTable: (options: Record<string, unknown>) => void }).autoTable({
      head: [
        ["Name", "Trainer", "Start Time", "End Time", "Capacity", "Booked"],
      ],
      body: tableData,
      startY: 22,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save("classes.pdf");
  };

  // Handle click outside for export dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [exportOpen]);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
          <FiSearch className="text-blue-400" />
          <input
            type="text"
            className="bg-transparent outline-none flex-1 text-blue-900 placeholder-blue-300"
            placeholder="Search by class name or trainer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="bg-blue-50 rounded-lg px-3 py-2 text-blue-900"
            value={trainerFilter}
            onChange={(e) => setTrainerFilter(e.target.value)}
          >
            <option value="">{t("classes.allTrainers")}</option>
            {trainers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select
            className="bg-blue-50 rounded-lg px-3 py-2 text-blue-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
          <FilterButton
            onClick={() => setShowFilters((f) => !f)}
            className={showFilters ? "bg-blue-100 border-blue-300" : ""}
          />
          {/* Import Button */}
          <button
            className="flex items-center gap-1 px-4 py-2 rounded-full bg-white border border-blue-200 text-blue-700 font-semibold shadow-sm hover:bg-blue-50 transition"
            onClick={() => setShowImportModal(true)}
          >
            <FiUpload /> Import
          </button>
          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-white border border-blue-200 text-blue-700 font-semibold shadow-sm hover:bg-blue-50 transition"
              onClick={() => setExportOpen((e) => !e)}
            >
              <FiDownload /> {t("classes.export")} <FiChevronDown className="ml-1" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-blue-100 z-20 py-2">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-lg text-blue-900 flex items-center gap-2"
                  onClick={() => {
                    handleExportCSV();
                    setExportOpen(false);
                  }}
                >
                  <FiDownload /> {t("classes.exportAsCSV")}
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-lg text-blue-900 flex items-center gap-2"
                  onClick={() => {
                    handleExportPDF();
                    setExportOpen(false);
                  }}
                >
                  <FiDownload /> {t("classes.exportAsPDF")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div>
            <label className="block text-xs text-blue-500 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-blue-200 px-3 py-2"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-blue-500 mb-1">{t("classes.endDate")}</label>
            <input
              type="date"
              className="w-full rounded-lg border border-blue-200 px-3 py-2"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-blue-500 mb-1">
                {t("classes.minCapacity")}
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-blue-200 px-3 py-2"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                min={0}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-blue-500 mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-blue-200 px-3 py-2"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                min={0}
              />
            </div>
          </div>
        </div>
      )}
      {/* Table/List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-100">
          <thead>
            <tr className="bg-blue-50">
              <th className="px-4 py-2 text-left text-xs font-semibold text-blue-500">
                {t("classes.name") || "Name"}
              </th>
              <th className={`px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-blue-500`}>
                {t("classes.trainer")}
              </th>
              <th className={`px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-blue-500`}>
                {t("classes.dateTime")}
              </th>
              <th className={`px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-blue-500`}>
                {t("classes.capacity")}
              </th>
              <th className={`px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-blue-500`}>
                {t("classes.booked")}
              </th>
              <th className={`px-4 py-2 ${isRTL ? 'text-right' : 'text-left'} text-xs font-semibold text-blue-500`}>
                {t("classes.status")}
              </th>
              <th className={`px-4 py-2 ${isRTL ? 'text-left' : 'text-right'} text-xs font-semibold text-blue-500`}>
                {t("classes.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-blue-300"
                >
                  No classes found.
                </td>
              </tr>
            ) : (
              paged.map((classItem, i) => (
                <tr
                  key={classItem.id}
                  ref={(el) => (rowRefs.current[i] = el)}
                  tabIndex={0}
                  className={`hover:bg-blue-50 focus:bg-blue-100 transition cursor-pointer ${selectedClassId === classItem.id ? "bg-blue-100 ring-2 ring-blue-300" : ""}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    onView(classItem);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onView(classItem);
                  }}
                  aria-selected={selectedClassId === classItem.id}
                >
                  <td className="px-4 py-3 font-medium text-blue-900">
                    {classItem.name}
                  </td>
                  <td className="px-4 py-3 text-blue-700">
                    {classItem.trainer?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-blue-700">
                    {new Date(classItem.starttime).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-blue-700">
                    {classItem.capacity ?? "∞"}
                  </td>
                  <td className="px-4 py-3 text-blue-700">
                    {classItem.bookedCount ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${classItem.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {classItem.status
                        ? classItem.status.charAt(0).toUpperCase() +
                          classItem.status.slice(1)
                        : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex gap-2 justify-end">
                    <button
                      className="p-2 rounded hover:bg-blue-100 text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(classItem);
                      }}
                      title={t("classes.viewDetails")}
                    >
                      <FiEye />
                    </button>
                    <button
                      className="p-2 rounded hover:bg-blue-100 text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(classItem);
                      }}
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="p-2 rounded hover:bg-red-100 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(classItem);
                      }}
                      title={t("classes.deleteClass")}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-blue-400">
          {t("classes.page")} {page} {t("classes.of")} {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            className="p-2 rounded hover:bg-blue-100 text-blue-500 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <FiChevronLeft />
          </button>
          <button
            className="p-2 rounded hover:bg-blue-100 text-blue-500 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label={t("classes.next")}
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
      {/* Import Classes Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-blue-900/30"
            onClick={() => setShowImportModal(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Import Classes
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Upload a CSV file to bulk import classes. Required columns:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4 text-xs font-mono text-gray-700">
              name, description, trainer_name, start_time, end_time, capacity, status
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                disabled={importing}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !tenantId) return;

                  setImporting(true);
                  try {
                    Papa.parse(file, {
                      header: true,
                      complete: async (results: Papa.ParseResult<Record<string, unknown>>) => {
                        try {
                          const classesToInsert = [];
                          const errors: string[] = [];

                          for (const row of results.data as any[]) {
                            if (!row.name || !row.start_time || !row.end_time) {
                              errors.push(
                                `Row missing required fields: ${row.name || "Unknown"}`,
                              );
                              continue;
                            }

                            // Find trainer by name if provided
                            let trainerId = null;
                            if (row.trainer_name) {
                              const { data: trainers } = await supabase
                                .from("trainers")
                                .select("id")
                                .eq("tenant_id", tenantId)
                                .or(
                                  `first_name.ilike.%${row.trainer_name}%,last_name.ilike.%${row.trainer_name}%`,
                                )
                                .limit(1);

                              if (trainers && trainers.length > 0) {
                                trainerId = trainers[0].id;
                              }
                            }

                            // Parse date and time
                            const startDateTime = new Date(row.start_time as string);
                            const endDateTime = new Date(row.end_time as string);

                            classesToInsert.push({
                              tenant_id: tenantId,
                              name: row.name,
                              description: row.description || null,
                              trainer_id: trainerId,
                              start_time: startDateTime.toISOString(),
                              end_time: endDateTime.toISOString(),
                              date: startDateTime.toISOString().split("T")[0],
                              capacity: parseInt(row.capacity as string) || 20,
                              status: row.status || "scheduled",
                            });
                          }

                          if (classesToInsert.length === 0) {
                            toast.error("No valid classes to import");
                            setImporting(false);
                            return;
                          }

                          // Insert classes in batches
                          const batchSize = 50;
                          for (let i = 0; i < classesToInsert.length; i += batchSize) {
                            const batch = classesToInsert.slice(i, i + batchSize);
                            const { error: insertError } = await supabase
                              .from("classes")
                              .insert(batch);

                            if (insertError) {
                              throw insertError;
                            }
                          }

                          toast.success(
                            `Successfully imported ${classesToInsert.length} classes${errors.length > 0 ? ` (${errors.length} errors)` : ""}`,
                          );
                          if (errors.length > 0) {
                            console.warn("Import errors:", errors);
                          }
                          setShowImportModal(false);
                          // Refresh the class list
                          window.location.reload();
                        } catch (error) {
                          console.error("Import error:", error);
                          toast.error(
                            `Failed to import classes: ${error instanceof Error ? error.message : "Unknown error"}`,
                          );
                        } finally {
                          setImporting(false);
                        }
                      },
                      error: (error: Error) => {
                        console.error("CSV parse error:", error);
                        toast.error("Failed to parse CSV file");
                        setImporting(false);
                      },
                    });
                  } catch (error) {
                    console.error("Import error:", error);
                    toast.error("Failed to import classes");
                    setImporting(false);
                  }
                }}
              />
              <label
                htmlFor="csv-upload"
                className={`cursor-pointer flex flex-col items-center ${importing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <FiUpload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {importing ? "Importing..." : "Click to upload or drag and drop"}
                </span>
                <span className="text-xs text-gray-400 mt-1">CSV files only</span>
              </label>
            </div>
            <div className="flex justify-between">
              <button
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => {
                  const template = "name,description,trainer_name,start_time,end_time,capacity,status\nMorning Yoga,Relaxing yoga class,John Smith,2024-01-15 09:00,2024-01-15 10:00,20,scheduled";
                  const blob = new Blob([template], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "classes-template.csv";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }}
              >
                Download Template
              </button>
              <button
                className="px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
