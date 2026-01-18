import * as React from "react";
import {
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiMail,
  FiDownload,
  FiZap,
  FiLock,
  FiCheckCircle,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal } from "./useSmartAnalyticsModal";

interface GenerateMemberReportModalProps {
  open: boolean;
  onClose: () => void;
  memberId?: string;
  memberName?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const memberData = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  joinDate: "2023-03-15",
  membershipType: "Premium",
  attendance: {
    totalSessions: 45,
    attendanceRate: 78,
    lastSession: "2024-01-15",
    favoriteClass: "HIIT Blast",
  },
  payments: {
    totalPaid: 1250,
    outstanding: 0,
    nextPayment: "2024-02-15",
    paymentMethod: "Credit Card",
  },
  progress: {
    weightLoss: 8.5,
    strengthGain: 15,
    enduranceImprovement: 25,
    goals: ["Lose 10kg", "Run 5km", "Complete 50 pushups"],
  },
  smartInsights: [
    {
      type: "prediction",
      title: "High Engagement Risk",
      description: "Attendance dropped 20% this month",
      confidence: 85,
      recommendation: "Send re-engagement campaign",
    },
    {
      type: "opportunity",
      title: "Upgrade Opportunity",
      description: "Ready for personal training sessions",
      confidence: 92,
      recommendation: "Offer PT trial session",
    },
  ],
};

const reportSections = [
  { id: "attendance", label: "Attendance History", icon: FiCalendar },
  { id: "payments", label: "Payment Records", icon: FiDollarSign },
  { id: "progress", label: "Progress Tracking", icon: FiTrendingUp },
  { id: "ai_insights", label: "Smart Insights", icon: FiZap, isPro: true },
];

export default function GenerateMemberReportModal({
  open,
  onClose,
  memberName = "Sarah Johnson",
  onSuccess,
  isPro,
}: GenerateMemberReportModalProps) {
  const { loading, generateReport, alerts, clearAlerts } =
    useSmartAnalyticsModal();

  const [selectedSections, setSelectedSections] = React.useState<string[]>([
    "attendance",
    "payments",
    "progress",
  ]);
  const [includeCharts, setIncludeCharts] = React.useState(true);
  const [sendEmail, setSendEmail] = React.useState(false);
  const [emailRecipient, setEmailRecipient] = React.useState(memberData.email);
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

  const handleAddSection = (sectionId: string) => {
    if (!selectedSections.includes(sectionId)) {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    setSelectedSections(selectedSections.filter((id) => id !== sectionId));
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
      title="Generate Member Report"
      subtitle={`Comprehensive report for ${memberName}`}
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

      {/* Member Overview */}
      <Section title="Member Overview">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-semibold">
              {memberData.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{memberData.name}</h3>
              <p className="text-sm text-gray-600">{memberData.email}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>
                  Member since{" "}
                  {new Date(memberData.joinDate).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>{memberData.membershipType} Plan</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Report Sections */}
      <Section title="Report Sections">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportSections.map((section) => {
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
                        <FiLock className="text-gray-400" title="Pro feature" />
                      )}
                    </div>
                  </div>
                  {isSelected && <FiCheckCircle className="text-blue-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Smart Insights */}
      {isPro && memberData.smartInsights.length > 0 && (
        <Section title="Smart Insights">
          <div className="space-y-3">
            {memberData.smartInsights.map((insight, index) => (
              <div
                key={index}
                className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <FiZap className="text-yellow-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {insight.title}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {insight.description}
                    </p>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      {insight.recommendation} →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Member Data Preview */}
      <Section title="Data Preview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiCalendar className="text-blue-600" />
              <h4 className="font-semibold text-gray-900">Attendance</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Sessions</span>
                <span className="font-semibold">
                  {memberData.attendance.totalSessions}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Attendance Rate</span>
                <span className="font-semibold">
                  {memberData.attendance.attendanceRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Favorite Class</span>
                <span className="font-semibold">
                  {memberData.attendance.favoriteClass}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiDollarSign className="text-green-600" />
              <h4 className="font-semibold text-gray-900">Payments</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Paid</span>
                <span className="font-semibold">
                  ${memberData.payments.totalPaid}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding</span>
                <span className="font-semibold">
                  ${memberData.payments.outstanding}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Next Payment</span>
                <span className="font-semibold">
                  {new Date(
                    memberData.payments.nextPayment,
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiTrendingUp className="text-purple-600" />
              <h4 className="font-semibold text-gray-900">Progress</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Weight Loss</span>
                <span className="font-semibold">
                  {memberData.progress.weightLoss}kg
                </span>
              </div>
              <div className="flex justify-between">
                <span>Strength Gain</span>
                <span className="font-semibold">
                  +{memberData.progress.strengthGain}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Endurance</span>
                <span className="font-semibold">
                  +{memberData.progress.enduranceImprovement}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Export Options */}
      <Section title="Export Options">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium">Include charts and graphs</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium">Send via email</span>
              </label>
            </div>
          </div>

          {sendEmail && (
            <div className="space-y-2">
              <label className="block text-sm font-medium flex items-center gap-2">
                <FiMail /> Email Recipient
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="member@email.com"
              />
            </div>
          )}
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
            disabled={loading || generating}
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FiDownload />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
