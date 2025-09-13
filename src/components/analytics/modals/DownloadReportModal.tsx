import * as React from "react";
import { motion } from "framer-motion";
import {
  FiDownload,
  FiClock,
  FiCheckCircle,
  FiArchive,
  FiFilter,
  FiSearch,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal } from "./useSmartAnalyticsModal";

interface DownloadReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

const availableDownloads = [
  {
    id: "1",
    name: "Member Overview Report",
    type: "member",
    date: "2024-01-15T10:30:00Z",
    creator: "admin@mtdrb.com",
    size: "2.3 MB",
    format: "pdf",
    status: "completed",
    downloadUrl: "/api/reports/download/1",
  },
  {
    id: "2",
    name: "Financial Summary Q4",
    type: "financial",
    date: "2024-01-10T14:20:00Z",
    creator: "manager@mtdrb.com",
    size: "1.8 MB",
    format: "excel",
    status: "completed",
    downloadUrl: "/api/reports/download/2",
  },
  {
    id: "3",
    name: "Class Performance Report",
    type: "class",
    date: "2024-01-12T09:15:00Z",
    creator: "admin@mtdrb.com",
    size: "3.1 MB",
    format: "csv",
    status: "completed",
    downloadUrl: "/api/reports/download/3",
  },
  {
    id: "4",
    name: "VAT Report Q4 2023",
    type: "vat",
    date: "2024-01-08T16:45:00Z",
    creator: "finance@mtdrb.com",
    size: "1.2 MB",
    format: "pdf",
    status: "completed",
    downloadUrl: "/api/reports/download/4",
  },
  {
    id: "5",
    name: "Custom Analytics Report",
    type: "custom",
    date: "2024-01-14T11:20:00Z",
    creator: "admin@mtdrb.com",
    size: "4.5 MB",
    format: "excel",
    status: "pending",
    downloadUrl: null,
  },
  {
    id: "6",
    name: "Trainer Performance Q4",
    type: "trainer",
    date: "2024-01-09T13:30:00Z",
    creator: "hr@mtdrb.com",
    size: "2.7 MB",
    format: "pdf",
    status: "completed",
    downloadUrl: "/api/reports/download/6",
  },
];

const reportTypes = [
  { id: "all", label: "All Types" },
  { id: "member", label: "Member Reports" },
  { id: "financial", label: "Financial Reports" },
  { id: "class", label: "Class Reports" },
  { id: "vat", label: "VAT Reports" },
  { id: "trainer", label: "Trainer Reports" },
  { id: "custom", label: "Custom Reports" },
];

const formatIcons = {
  pdf: "📄",
  excel: "📊",
  csv: "📋",
  json: "📄",
};

export default function DownloadReportModal({
  open,
  onClose,
  onSuccess,
  isPro,
}: DownloadReportModalProps) {
  const { loading, alerts, clearAlerts } = useSmartAnalyticsModal();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedType, setSelectedType] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [selectedCreator, setSelectedCreator] = React.useState("all");
  const [showArchived, setShowArchived] = React.useState(false);
  const [downloading, setDownloading] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleDownload = async (reportId: string, downloadUrl: string) => {
    setDownloading(reportId);
    try {
      // Simulate download
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // In real app, trigger actual download
      console.log("Downloading:", downloadUrl);
      onSuccess?.();
    } finally {
      setDownloading(null);
    }
  };

  const handleArchive = async (reportId: string) => {
    // Simulate archive action
    console.log("Archiving report:", reportId);
  };

  const filteredDownloads = availableDownloads.filter((report) => {
    const matchesSearch = report.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || report.type === selectedType;
    const matchesStatus =
      selectedStatus === "all" || report.status === selectedStatus;
    const matchesCreator =
      selectedCreator === "all" || report.creator === selectedCreator;

    return matchesSearch && matchesType && matchesStatus && matchesCreator;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
            <FiCheckCircle className="w-3 h-3" />
            Generated
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
            <FiClock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return null;
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
      title="Download Reports"
      subtitle="Access your generated reports and manage downloads"
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

      {/* Search and Filters */}
      <Section title="Search & Filters">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FiFilter /> Type
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {reportTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Creator</label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={selectedCreator}
                onChange={(e) => setSelectedCreator(e.target.value)}
              >
                <option value="all">All Creators</option>
                <option value="admin@mtdrb.com">Admin</option>
                <option value="manager@mtdrb.com">Manager</option>
                <option value="finance@mtdrb.com">Finance</option>
                <option value="hr@mtdrb.com">HR</option>
              </select>
            </div>
          </div>

          {/* Archive Toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Show archived reports</span>
          </label>
        </div>
      </Section>

      {/* Available Downloads */}
      <Section title="Available Downloads">
        <div className="space-y-3">
          {filteredDownloads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiDownload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No reports found matching your criteria</p>
            </div>
          ) : (
            filteredDownloads.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {formatIcons[report.format as keyof typeof formatIcons]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {report.name}
                      </h4>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Size: {report.size}</span>
                      <span>Format: {report.format.toUpperCase()}</span>
                      <span>
                        Created: {new Date(report.date).toLocaleDateString()}
                      </span>
                      <span>By: {report.creator}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report.status === "completed" && report.downloadUrl ? (
                    <button
                      onClick={() =>
                        handleDownload(report.id, report.downloadUrl!)
                      }
                      disabled={downloading === report.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                    >
                      {downloading === report.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <FiDownload />
                          Download
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      <FiClock />
                      Pending
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(report.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Archive report"
                  >
                    <FiArchive className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Section>

      {/* Archive Management */}
      {showArchived && (
        <Section title="Archived Reports">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Archived Reports</h4>
              <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                Clear All Archived
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <p>• 12 reports archived (older than 90 days)</p>
              <p>• Total archived size: 45.2 MB</p>
              <p>• Last cleaned: 2024-01-10</p>
            </div>
          </div>
        </Section>
      )}

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={() => {
              // Refresh downloads
              console.log("Refreshing downloads...");
            }}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
