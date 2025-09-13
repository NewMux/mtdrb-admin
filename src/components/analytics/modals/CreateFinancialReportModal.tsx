import * as React from "react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiSave,
  FiBarChart2,
  FiUsers,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal } from "./useSmartAnalyticsModal";

interface CreateFinancialReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

const financialSections = [
  {
    id: "revenue",
    label: "Revenue Analysis",
    icon: FiTrendingUp,
    description: "Income streams and growth trends",
  },
  {
    id: "expenses",
    label: "Expense Breakdown",
    icon: FiTrendingDown,
    description: "Cost analysis and optimization",
  },
  {
    id: "profit",
    label: "Profit & Loss",
    icon: FiDollarSign,
    description: "Net profit and margin analysis",
  },
  {
    id: "vat",
    label: "VAT Summary",
    icon: FiBarChart2,
    description: "Tax compliance and calculations",
  },
  {
    id: "ltv",
    label: "Member Lifetime Value",
    icon: FiUsers,
    description: "Customer value and retention metrics",
    isPro: true,
  },
];

const smartBadges = [
  {
    type: "warning",
    label: "High Refund %",
    description: "15% refund rate this month",
    icon: FiAlertTriangle,
  },
  {
    type: "success",
    label: "Low Margin",
    description: "Operating margin below target",
    icon: FiTrendingDown,
  },
  {
    type: "info",
    label: "Growth Trend",
    description: "Revenue up 12% vs last month",
    icon: FiTrendingUp,
  },
];

export default function CreateFinancialReportModal({
  open,
  onClose,
  onSuccess,
  isPro,
}: CreateFinancialReportModalProps) {
  const { loading, saveTemplate, alerts, clearAlerts } =
    useSmartAnalyticsModal();

  const [selectedSections, setSelectedSections] = React.useState<string[]>([
    "revenue",
    "expenses",
    "profit",
  ]);
  const [reportName, setReportName] = React.useState("");
  const [reportDescription, setReportDescription] = React.useState("");
  const [dateRange, setDateRange] = React.useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleAddSection = (sectionId: string) => {
    if (!selectedSections.includes(sectionId)) {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    setSelectedSections(selectedSections.filter((id) => id !== sectionId));
  };

  const handleSaveTemplate = async () => {
    if (!reportName.trim()) return;

    setSaving(true);
    try {
      const result = await saveTemplate({
        name: reportName,
        description: reportDescription,
        sections: selectedSections,
        isCustom: true,
      });

      if (result.success) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const getSectionIcon = (sectionId: string) => {
    const section = financialSections.find((s) => s.id === sectionId);
    return section?.icon || FiBarChart2;
  };

  const getSectionLabel = (sectionId: string) => {
    const section = financialSections.find((s) => s.id === sectionId);
    return section?.label || sectionId;
  };

  function Section({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {title}
        </h3>
        <div className="space-y-4">{children}</div>
      </section>
    );
  }

  return (
    <SmartAnalyticsModal
      open={open}
      onClose={onClose}
      title="Create Financial Report"
      subtitle="Build comprehensive financial reports with smart insights"
    >
      {/* Alerts */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2 ${
            alert.type === "error"
              ? "bg-red-50 text-red-700"
              : alert.type === "warning"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {alert.message}
        </div>
      ))}

      {/* Smart Badges */}
      <Section title="Financial Insights">
        <div className="space-y-3">
          {smartBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  badge.type === "warning"
                    ? "border-yellow-200 bg-yellow-50"
                    : badge.type === "success"
                      ? "border-green-200 bg-green-50"
                      : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`mt-1 ${
                      badge.type === "warning"
                        ? "text-yellow-600"
                        : badge.type === "success"
                          ? "text-green-600"
                          : "text-blue-600"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {badge.label}
                      </h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          badge.type === "warning"
                            ? "bg-yellow-100 text-yellow-700"
                            : badge.type === "success"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {badge.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Report Details */}
      <Section title="Report Details">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Report Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Q4 2023 Financial Report"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 min-h-[80px]"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Comprehensive financial analysis for Q4 2023..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FiCalendar /> Start Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FiCalendar /> End Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Financial Sections */}
      <Section title="Financial Sections">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {financialSections.map((section) => {
            const Icon = section.icon;
            const isSelected = selectedSections.includes(section.id);
            const isProOnly = section.isPro && !isPro;

            return (
              <div
                key={section.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : isProOnly
                      ? "border-gray-200 bg-gray-50 opacity-60"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
                onClick={() =>
                  !isProOnly &&
                  (isSelected
                    ? handleRemoveSection(section.id)
                    : handleAddSection(section.id))
                }
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`mt-1 ${isSelected ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {section.label}
                      </h4>
                      {isProOnly && (
                        <FiAlertTriangle
                          className="text-gray-400"
                          title="Pro feature"
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {section.description}
                    </p>
                  </div>
                  {isSelected && <FiCheckCircle className="text-blue-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Selected Sections */}
      {selectedSections.length > 0 && (
        <Section title="Selected Sections">
          <div className="space-y-3">
            {selectedSections.map((sectionId, index) => {
              const Icon = getSectionIcon(sectionId);
              return (
                <motion.div
                  key={sectionId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {getSectionLabel(sectionId)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Section {index + 1}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSection(sectionId)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </motion.div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Financial Preview */}
      <Section title="Financial Preview">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  $125,430
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-xs text-green-600 mt-1">
                  +12% vs last period
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">$45,230</div>
                <div className="text-sm text-gray-600">Total Expenses</div>
                <div className="text-xs text-red-600 mt-1">
                  +8% vs last period
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">$80,200</div>
                <div className="text-sm text-gray-600">Net Profit</div>
                <div className="text-xs text-blue-600 mt-1">64% margin</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={onClose}
            disabled={loading || saving}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleSaveTemplate}
            disabled={loading || saving || !reportName.trim()}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
