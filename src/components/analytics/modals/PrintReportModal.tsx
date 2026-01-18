import * as React from "react";
import { motion } from "framer-motion";
import {
  FiPrinter,
  FiFileText,
  FiGrid,
  FiList,
  FiDownload,
  FiSettings,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal } from "./useSmartAnalyticsModal";

interface PrintReportModalProps {
  open: boolean;
  onClose: () => void;
  reportId?: string;
  reportName?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const layoutOptions = [
  {
    id: "summary",
    label: "Summary",
    description: "Key metrics and highlights only",
    icon: FiFileText,
  },
  {
    id: "detailed",
    label: "Detailed",
    description: "Complete report with all data",
    icon: FiList,
  },
  {
    id: "grid",
    label: "Grid Layout",
    description: "Organized in grid format",
    icon: FiGrid,
  },
];

const printSettings = [
  {
    id: "portrait",
    label: "Portrait",
    description: "Standard vertical layout",
  },
  {
    id: "landscape",
    label: "Landscape",
    description: "Wide horizontal layout",
  },
];

export default function PrintReportModal({
  open,
  onClose,
  reportId = "1",
  reportName = "Member Overview Report",
  onSuccess,
  isPro,
}: PrintReportModalProps) {
  const { loading, alerts, clearAlerts } = useSmartAnalyticsModal();

  const isProUser = isPro ?? true;

  const [selectedLayout, setSelectedLayout] = React.useState("summary");
  const [selectedOrientation, setSelectedOrientation] =
    React.useState("portrait");
  const [includeCharts, setIncludeCharts] = React.useState(true);
  const [includeHeaders, setIncludeHeaders] = React.useState(true);
  const [pageNumbers, setPageNumbers] = React.useState(true);
  const [showPreview, setShowPreview] = React.useState(true);
  const [printing, setPrinting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      // Simulate print process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onSuccess?.();
      onClose();
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setPrinting(true);
    try {
      // Simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
      setPrinting(false);
    }
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
      title="Print Report"
      subtitle={`Print "${reportName}" (ID: ${reportId}) with custom layout options`}
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
      {!isProUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm mb-4">
          Printing reports is available on Pro plans.
        </div>
      )}

      {/* Layout Options */}
      <Section title="Layout Options">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {layoutOptions.map((layout) => {
            const Icon = layout.icon;
            return (
              <label
                key={layout.id}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedLayout === layout.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <input
                  type="radio"
                  name="layout"
                  value={layout.id}
                  checked={selectedLayout === layout.id}
                  onChange={(e) => setSelectedLayout(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={
                        selectedLayout === layout.id
                          ? "text-blue-600"
                          : "text-gray-500"
                      }
                    />
                    <h4 className="font-semibold text-gray-900">
                      {layout.label}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">{layout.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Print Settings */}
      <Section title="Print Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Orientation
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              value={selectedOrientation}
              onChange={(e) => setSelectedOrientation(e.target.value)}
            >
              {printSettings.map((setting) => (
                <option key={setting.id} value={setting.id}>
                  {setting.label} - {setting.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Content Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">
                  Include charts and graphs
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">
                  Include headers and footers
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pageNumbers}
                  onChange={(e) => setPageNumbers(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Add page numbers</span>
              </label>
            </div>
          </div>
        </div>
      </Section>

      {/* Smart Recommendations */}
      <Section title="Smart Recommendations">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiSettings className="text-yellow-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Print Advice</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Use <strong>Landscape</strong> orientation for wide tables
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Consider <strong>Summary</strong> layout for executive
                    presentations
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Split by branch if report exceeds <strong>10 pages</strong>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Enable <strong>charts</strong> for better visual impact
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Preview Toggle */}
      <Section title="Preview">
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="rounded"
            />
            <span className="font-medium">Show print preview</span>
          </label>

          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {reportName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        1,247
                      </div>
                      <div className="text-sm text-gray-600">Total Members</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        89%
                      </div>
                      <div className="text-sm text-gray-600">
                        Attendance Rate
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        $45K
                      </div>
                      <div className="text-sm text-gray-600">
                        Monthly Revenue
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Key Insights
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Member retention increased by 12% this month</li>
                      <li>• Peak attendance times: 6-8 PM on weekdays</li>
                      <li>• Most popular class: HIIT Blast (94% capacity)</li>
                    </ul>
                  </div>
                </div>

                {pageNumbers && (
                  <div className="text-center text-xs text-gray-500 mt-6">
                    Page 1 of 1
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </Section>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={onClose}
            disabled={loading || printing}
          >
            Cancel
          </button>
          <button
            className="bg-green-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-green-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleDownloadPDF}
            disabled={loading || printing || !isProUser}
          >
            {printing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FiDownload />
                Download PDF
              </>
            )}
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handlePrint}
            disabled={loading || printing || !isProUser}
          >
            {printing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <FiPrinter />
                Print Report
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
