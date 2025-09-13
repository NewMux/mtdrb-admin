import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCalendar, FiMapPin, FiBarChart, FiFilter } from "react-icons/fi";
import { getBranches, getMetricTypes } from "../../api/mockReports";

interface FilterBarProps {
  onFiltersChange: (filters: {
    dateRange: string;
    branch: string;
    metricType: string;
  }) => void;
  isPro?: boolean;
}

export default function FilterBar({
  onFiltersChange,
  isPro = false,
}: FilterBarProps) {
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [metricTypes, setMetricTypes] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [filters, setFilters] = useState({
    dateRange: "last-30-days",
    branch: "all",
    metricType: "all",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      setLoading(true);
      const [branchesData, metricTypesData] = await Promise.all([
        getBranches(),
        getMetricTypes(),
      ]);
      setBranches(branchesData);
      setMetricTypes(metricTypesData);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const dateRangeOptions = [
    { value: "last-7-days", label: "Last 7 Days" },
    { value: "last-30-days", label: "Last 30 Days" },
    { value: "last-90-days", label: "Last 90 Days" },
    { value: "this-month", label: "This Month" },
    { value: "this-quarter", label: "This Quarter" },
    { value: "this-year", label: "This Year" },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
        <div className="animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-gray-500" />
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange("dateRange", e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2">
          <FiMapPin className="w-4 h-4 text-gray-500" />
          <select
            value={filters.branch}
            onChange={(e) => handleFilterChange("branch", e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Metric Type Filter */}
        <div className="flex items-center gap-2">
          <FiBarChart className="w-4 h-4 text-gray-500" />
          <select
            value={filters.metricType}
            onChange={(e) => handleFilterChange("metricType", e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
          >
            {metricTypes.map((metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pro Features Indicator */}
        {!isPro && (
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            Advanced filters require Pro
          </div>
        )}

        {/* Clear Filters Button */}
        <button
          onClick={() => {
            const defaultFilters = {
              dateRange: "last-30-days",
              branch: "all",
              metricType: "all",
            };
            setFilters(defaultFilters);
            onFiltersChange(defaultFilters);
          }}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Pro Upgrade Banner */}
      {!isPro && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <div className="text-sm">🔒</div>
            <span className="text-sm text-gray-700">
              Unlock advanced filtering, custom date ranges, and multi-branch
              analytics
            </span>
            <button className="ml-auto bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors">
              Upgrade
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
