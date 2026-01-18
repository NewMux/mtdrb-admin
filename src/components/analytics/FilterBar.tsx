import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFilter,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiActivity,
  FiUser,
  FiCreditCard,
  FiGlobe,
  FiTag,
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import { SmartButton } from "../ui/DesignSystem";

interface FilterState {
  dateRange: [Date | null, Date | null];
  country: string;
  region: string;
  branch: string;
  membershipStatus: string[];
  sessionType: string[];
  trainer: string[];
  paymentMethod: string[];
  source: string[];
  tags: string[];
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearAll: () => void;
}

const FilterDropdown = ({
  label,
  icon,
  options,
  selected,
  onSelect,
  multiSelect = false,
}: {
  label: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
  selected: string | string[];
  onSelect: (value: string | string[]) => void;
  multiSelect?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (multiSelect) {
      const currentSelected = Array.isArray(selected) ? selected : [];
      const newSelected = currentSelected.includes(value)
        ? currentSelected.filter((v) => v !== value)
        : [...currentSelected, value];
      onSelect(newSelected);
    } else {
      onSelect(value);
      setIsOpen(false);
    }
  };

  const displayValue = () => {
    if (multiSelect) {
      const selectedArray = Array.isArray(selected) ? selected : [];
      if (selectedArray.length === 0) return label;
      if (selectedArray.length === 1) {
        return (
          options.find((opt) => opt.value === selectedArray[0])?.label || label
        );
      }
      return `${selectedArray.length} selected`;
    }
    if (typeof selected === "string" && selected) {
      return options.find((opt) => opt.value === selected)?.label || label;
    }
    return label;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        {icon}
        <span className="text-sm font-medium text-gray-700">
          {displayValue()}
        </span>
        <FiChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <motion.div
          className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="p-2">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                  (multiSelect &&
                    Array.isArray(selected) &&
                    selected.includes(option.value)) ||
                  (!multiSelect && selected === option.value)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const DateRangePicker = ({
  dateRange,
  onDateRangeChange,
}: {
  dateRange: [Date | null, Date | null];
  onDateRangeChange: (range: [Date | null, Date | null]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDateSelect = (date: Date, isStart: boolean) => {
    if (isStart) {
      onDateRangeChange([date, dateRange[1]]);
    } else {
      onDateRangeChange([dateRange[0], date]);
    }
  };

  const quickRanges = [
    {
      label: "Last 7 days",
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    {
      label: "Last 30 days",
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
    {
      label: "This month",
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    },
    {
      label: "Last month",
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <FiCalendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {dateRange[0] && dateRange[1]
            ? `${formatDate(dateRange[0])} - ${formatDate(dateRange[1])}`
            : "Select Date Range"}
        </span>
        <FiChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <motion.div
          className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Quick Ranges</h3>
            {quickRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => {
                  onDateRangeChange([range.start, range.end]);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors"
              >
                {range.label}
              </button>
            ))}

            <div className="border-t pt-3">
              <h3 className="font-medium text-gray-900 mb-2">Custom Range</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange[0]?.toISOString().split("T")[0] || ""}
                  onChange={(e) =>
                    handleDateSelect(new Date(e.target.value), true)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={dateRange[1]?.toISOString().split("T")[0] || ""}
                  onChange={(e) =>
                    handleDateSelect(new Date(e.target.value), false)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const TagSelector = ({
  tags,
  selectedTags,
  onTagsChange,
}: {
  tags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleTagToggle = (tag: string) => {
    const newSelected = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newSelected);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...selectedTags, newTag.trim()]);
      setNewTag("");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <FiTag className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {selectedTags.length > 0
            ? `${selectedTags.length} tags`
            : "Select Tags"}
        </span>
        <FiChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <motion.div
          className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-3">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add new tag"
                className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              />
              <button
                onClick={handleAddTag}
                className="px-2 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
              >
                Add
              </button>
            </div>

            <div className="space-y-1">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default function FilterBar({
  filters,
  onFiltersChange,
  onClearAll,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (
    key: keyof FilterState,
    value: FilterState[keyof FilterState],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFiltersCount = Object.values(filters).reduce((count, value) => {
    if (Array.isArray(value)) {
      return count + value.length;
    }
    if (value && typeof value === "object" && value[0] && value[1]) {
      return count + 1;
    }
    if (value && value !== "") {
      return count + 1;
    }
    return count;
  }, 0);

  const handleClearFilters = () => {
    onClearAll();
    setIsExpanded(false);
  };

  const handleApplyFilters = () => {
    // Placeholder for actual filter application logic
    setIsExpanded(false);
  };

  const toggleFilters = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FiFilter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Analytics Filters
              </span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {activeFiltersCount} active
                </span>
              )}
            </button>
          </div>

          {isExpanded && (
            <div className="flex items-center gap-2">
              <SmartButton
                onClick={handleClearFilters}
                variant="secondary"
                size="sm"
                icon={<FiX className="w-4 h-4" />}
              >
                Clear Filters
              </SmartButton>
              <SmartButton
                onClick={handleApplyFilters}
                variant="primary"
                size="sm"
                icon={<FiFilter className="w-4 h-4" />}
              >
                Apply Filters
              </SmartButton>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-4">
                <DateRangePicker
                  dateRange={filters.dateRange}
                  onDateRangeChange={(range) =>
                    updateFilter("dateRange", range)
                  }
                />

                <FilterDropdown
                  label="Country"
                  icon={<FiMapPin className="w-4 h-4 text-gray-500" />}
                  options={[
                    { value: "bahrain", label: "Bahrain" },
                    { value: "kuwait", label: "Kuwait" },
                    { value: "uae", label: "UAE" },
                  ]}
                  selected={filters.country}
                  onSelect={(value) => updateFilter("country", value)}
                />

                <FilterDropdown
                  label="Region"
                  icon={<FiMapPin className="w-4 h-4 text-gray-500" />}
                  options={[
                    { value: "manama", label: "Manama" },
                    { value: "muharraq", label: "Muharraq" },
                    { value: "sitra", label: "Sitra" },
                  ]}
                  selected={filters.region}
                  onSelect={(value) => updateFilter("region", value)}
                />

                <FilterDropdown
                  label="Branch"
                  icon={<FiMapPin className="w-4 h-4 text-gray-500" />}
                  options={[
                    { value: "main", label: "Main Branch" },
                    { value: "west", label: "West Branch" },
                    { value: "east", label: "East Branch" },
                  ]}
                  selected={filters.branch}
                  onSelect={(value) => updateFilter("branch", value)}
                />

                <FilterDropdown
                  label="Membership Status"
                  icon={<FiUsers className="w-4 h-4 text-gray-500" />}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "expired", label: "Expired" },
                    { value: "trial", label: "Trial" },
                  ]}
                  selected={filters.membershipStatus}
                  onSelect={(value) => updateFilter("membershipStatus", value)}
                  multiSelect
                />

                <FilterDropdown
                  label="Session Type"
                  icon={<FiActivity className="w-4 h-4 text-gray-500" />}
                  options={[
                    { value: "yoga", label: "Yoga" },
                    { value: "pilates", label: "Pilates" },
                    { value: "hiit", label: "HIIT" },
                    { value: "strength", label: "Strength Training" },
                    { value: "cardio", label: "Cardio" },
                  ]}
                  selected={filters.sessionType}
                  onSelect={(value) => updateFilter("sessionType", value)}
                  multiSelect
                />

                <FilterDropdown
                  label="Trainer"
                  icon={<FiUser className="w-4 h-4 text-gray-500" />}
                  options={[
                    { value: "sarah", label: "Sarah Ahmed" },
                    { value: "mike", label: "Mike Johnson" },
                    { value: "lisa", label: "Lisa Chen" },
                    { value: "ahmed", label: "Ahmed Hassan" },
                  ]}
                  selected={filters.trainer}
                  onSelect={(value) => updateFilter("trainer", value)}
                  multiSelect
                />

                <FilterDropdown
                  label="Payment Method"
                  icon={<FiCreditCard className="w-4 h-4 text-gray-500" />}
                  options={[
                    { value: "card", label: "Credit/Debit Card" },
                    { value: "cash", label: "Cash" },
                    { value: "bank_transfer", label: "Bank Transfer" },
                    { value: "digital_wallet", label: "Digital Wallet" },
                    { value: "cheque", label: "Cheque" },
                  ]}
                  selected={filters.paymentMethod}
                  onSelect={(value) => updateFilter("paymentMethod", value)}
                  multiSelect
                />

                <FilterDropdown
                  label="Source"
                  icon={<FiGlobe className="w-4 h-4 text-gray-500" />}
                  options={[
                    { value: "website", label: "Website" },
                    { value: "social", label: "Social Media" },
                    { value: "referral", label: "Referral" },
                    { value: "walkin", label: "Walk-in" },
                    { value: "google", label: "Google Ads" },
                  ]}
                  selected={filters.source}
                  onSelect={(value) => updateFilter("source", value)}
                  multiSelect
                />

                <TagSelector
                  tags={[
                    "VIP",
                    "New Member",
                    "Premium",
                    "Student",
                    "Corporate",
                    "Family",
                  ]}
                  selectedTags={filters.tags}
                  onTagsChange={(tags) => updateFilter("tags", tags)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

