import * as React from "react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiDownload,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal } from "./useSmartAnalyticsModal";

interface GenerateVATReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

const quarters = [
  {
    id: "q1_2024",
    label: "Q1 2024 (Jan-Mar)",
    start: "2024-01-01",
    end: "2024-03-31",
  },
  {
    id: "q4_2023",
    label: "Q4 2023 (Oct-Dec)",
    start: "2023-10-01",
    end: "2023-12-31",
  },
  {
    id: "q3_2023",
    label: "Q3 2023 (Jul-Sep)",
    start: "2023-07-01",
    end: "2023-09-30",
  },
  {
    id: "q2_2023",
    label: "Q2 2023 (Apr-Jun)",
    start: "2023-04-01",
    end: "2023-06-30",
  },
];

const vatRates = [
  {
    rate: 5,
    description: "Standard Rate (5%)",
    appliesTo: "Most goods and services",
  },
  {
    rate: 0,
    description: "Zero Rate (0%)",
    appliesTo: "Exports and certain supplies",
  },
  {
    rate: -1,
    description: "Exempt",
    appliesTo: "Financial services, education",
  },
];

export default function GenerateVATReportModal({
  open,
  onClose,
  onSuccess,
  isPro,
}: GenerateVATReportModalProps) {
  const { loading, generateReport, alerts, clearAlerts } =
    useSmartAnalyticsModal();

  const isProUser = isPro ?? true;

  const [selectedQuarter, setSelectedQuarter] = React.useState("q4_2023");
  const [customDateRange, setCustomDateRange] = React.useState(false);
  const [startDate, setStartDate] = React.useState("2023-10-01");
  const [endDate, setEndDate] = React.useState("2023-12-31");
  const [includeInvoices, setIncludeInvoices] = React.useState(true);
  const [includeExpenses, setIncludeExpenses] = React.useState(true);
  const [includeAdjustments, setIncludeAdjustments] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateReport();
      if (result.success) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setGenerating(false);
    }
  };

  // Mock VAT calculations
  const vatCalculations = {
    totalSales: 125000,
    totalPurchases: 45000,
    vatOnSales: 6250,
    vatOnPurchases: 2250,
    netVAT: 4000,
    dueDate: "2024-01-31",
    status: "pending",
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
      title="Generate VAT Report"
      subtitle="Create comprehensive VAT reports for tax compliance"
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
          {alert.type === "warning" && (
            <FiAlertTriangle className="text-yellow-500" />
          )}
          {alert.type === "error" && (
            <FiAlertTriangle className="text-red-500" />
          )}
          {alert.type === "info" && <FiCheckCircle className="text-blue-500" />}
          {alert.message}
        </div>
      ))}
      {!isProUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm mb-4">
          VAT reports are available on Pro plans.
        </div>
      )}

      {/* Period Selection */}
      <Section title="Report Period">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <FiCalendar /> Quarter Selection
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quarters.map((quarter) => (
                <label
                  key={quarter.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedQuarter === quarter.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="quarter"
                    value={quarter.id}
                    checked={selectedQuarter === quarter.id}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {quarter.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {quarter.start} to {quarter.end}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={customDateRange}
                onChange={(e) => setCustomDateRange(e.target.checked)}
                className="rounded"
              />
              <span className="font-medium">Use custom date range</span>
            </label>

            {customDateRange && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Section>

      {/* Content Options */}
      <Section title="Report Content">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeInvoices}
                  onChange={(e) => setIncludeInvoices(e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium">Include Sales Invoices</span>
              </label>
              <p className="text-sm text-gray-600 ml-6 mt-1">
                All customer invoices and VAT collected
              </p>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeExpenses}
                  onChange={(e) => setIncludeExpenses(e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium">Include Purchase Expenses</span>
              </label>
              <p className="text-sm text-gray-600 ml-6 mt-1">
                All supplier invoices and VAT paid
              </p>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeAdjustments}
                onChange={(e) => setIncludeAdjustments(e.target.checked)}
                className="rounded"
              />
              <span className="font-medium">Include VAT Adjustments</span>
            </label>
            <p className="text-sm text-gray-600 ml-6 mt-1">
              Corrections, refunds, and special cases
            </p>
          </div>
        </div>
      </Section>

      {/* VAT Rates */}
      <Section title="VAT Rates">
        <div className="space-y-3">
          {vatRates.map((rate, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <div className="font-semibold text-gray-900">
                  {rate.description}
                </div>
                <div className="text-sm text-gray-600">{rate.appliesTo}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {rate.rate === -1 ? "Exempt" : `${rate.rate}%`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* VAT Summary */}
      <Section title="VAT Summary">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Total Sales (VAT inclusive)
                </span>
                <span className="font-semibold">
                  ${vatCalculations.totalSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VAT on Sales (5%)</span>
                <span className="font-semibold text-red-600">
                  ${vatCalculations.vatOnSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Purchases</span>
                <span className="font-semibold">
                  ${vatCalculations.totalPurchases.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VAT on Purchases</span>
                <span className="font-semibold text-green-600">
                  ${vatCalculations.vatOnPurchases.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${vatCalculations.netVAT.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Net VAT Due</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Due Date</div>
                <div className="font-semibold text-gray-900">
                  {new Date(vatCalculations.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Smart Recommendations */}
      <Section title="Smart Recommendations">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiBarChart className="text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                VAT Compliance Tips
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Ensure all invoices are properly categorized by VAT rate
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Review expense claims for VAT recovery opportunities
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Submit VAT return by{" "}
                    {new Date(vatCalculations.dueDate).toLocaleDateString()}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>Keep supporting documents for 6 years</span>
                </li>
              </ul>
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
            disabled={loading || generating}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleGenerate}
            disabled={loading || generating || !isProUser}
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FiDownload />
                Generate VAT Report
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
