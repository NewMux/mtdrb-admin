import * as React from "react";
import {
  FiClock,
  FiMail,
  FiMessageSquare,
  FiCalendar,
  FiZap,
  FiLock,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import { SmartAnalyticsModal } from "./SmartAnalyticsModal";
import { useSmartAnalyticsModal, type AnalyticsFilters } from "./useSmartAnalyticsModal";
import { useTranslation } from "react-i18next";

interface ScheduleReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

// Real next-occurrence date for the chosen frequency/start date, since
// delivery isn't automated yet there's nothing to show but the math.
const computeNextDelivery = (
  startDate: string,
  frequency: "daily" | "weekly" | "monthly" | "quarterly",
): Date => {
  const start = new Date(startDate);
  const now = new Date();
  const next = start > now ? start : now;
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
  }
  return next;
};

export default function ScheduleReportModal({
  open,
  onClose,
  onSuccess,
  isPro,
}: ScheduleReportModalProps) {
  const { loading, scheduleReport, alerts, clearAlerts } =
    useSmartAnalyticsModal();
  const { t } = useTranslation();

  const reportTemplates = [
    {
      id: "member_overview",
      name: t("reports.memberOverview"),
      description: t("reports.memberOverviewDesc"),
      recommendedFrequency: "weekly",
    },
    {
      id: "financial_summary",
      name: t("reports.financialSummary"),
      description: t("reports.financialSummaryDesc"),
      recommendedFrequency: "monthly",
    },
    {
      id: "class_performance",
      name: t("reports.classPerformance"),
      description: t("reports.classPerformanceDesc"),
      recommendedFrequency: "weekly",
    },
    {
      id: "vat_report",
      name: t("reports.vatReport"),
      description: t("reports.vatReportDesc"),
      recommendedFrequency: "quarterly",
    },
  ];

  const frequencies = [
    {
      id: "daily",
      label: t("reports.daily"),
      description: t("reports.dailyDesc"),
      icon: FiClock,
    },
    {
      id: "weekly",
      label: t("reports.weekly"),
      description: t("reports.weeklyDesc"),
      icon: FiCalendar,
    },
    {
      id: "monthly",
      label: t("reports.monthly"),
      description: t("reports.monthlyDesc"),
      icon: FiCalendar,
    },
    {
      id: "quarterly",
      label: t("reports.quarterly"),
      description: t("reports.quarterlyDesc"),
      icon: FiCalendar,
    },
  ];

  const deliveryMethods = [
    {
      id: "email",
      label: t("common.email"),
      description: t("reports.sendToEmail"),
      icon: FiMail,
    },
    {
      id: "slack",
      label: t("reports.slack"),
      description: t("reports.sendToSlackChannel"),
      icon: FiMessageSquare,
    },
  ];

  const isProUser = isPro ?? true;

  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [frequency, setFrequency] = React.useState<
    NonNullable<AnalyticsFilters["frequency"]>
  >("weekly");
  const [deliveryMethod, setDeliveryMethod] = React.useState<
    NonNullable<AnalyticsFilters["deliveryMethod"]>
  >("email");
  const [recipients, setRecipients] = React.useState<string[]>([]);
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().split("T")[0],
  );
  const [scheduling, setScheduling] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleSchedule = async () => {
    if (!selectedTemplate) return;

    setScheduling(true);
    try {
      const result = await scheduleReport({
        frequency,
        deliveryMethod,
        recipients,
      });

      if (result.success) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setScheduling(false);
    }
  };

  const getSelectedTemplate = () =>
    reportTemplates.find((template) => template.id === selectedTemplate);

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
      title={t("analytics.scheduleReport")}
      subtitle={t("reports.scheduleReportSubtitle")}
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
          {t("reports.schedulingProFeature")}
        </div>
      )}

      {/* Report Template Selection */}
      <Section title={t("reports.selectReportTemplate")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTemplates.map((template) => (
            <label
              key={template.id}
              className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name="selectedTemplate"
                value={template.id}
                checked={selectedTemplate === template.id}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {template.name}
                  </h4>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {template.recommendedFrequency}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {template.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </Section>

      {/* Frequency Selection */}
      <Section title={t("reports.frequency")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frequencies.map((freq) => {
            const Icon = freq.icon;
            const isRecommended =
              getSelectedTemplate()?.recommendedFrequency === freq.id;

            return (
              <label
                key={freq.id}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  frequency === freq.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <input
                  type="radio"
                  name="frequency"
                  value={freq.id}
                  checked={frequency === freq.id}
                  onChange={(e) =>
                    setFrequency(
                      e.target.value as NonNullable<
                        AnalyticsFilters["frequency"]
                      >,
                    )
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={
                        frequency === freq.id
                          ? "text-blue-600"
                          : "text-gray-500"
                      }
                    />
                    <h4 className="font-semibold text-gray-900">
                      {freq.label}
                    </h4>
                    {isRecommended && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        {t("reports.recommended")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{freq.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Delivery Method */}
      <Section title={t("reports.deliveryMethod")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deliveryMethods.map((method) => {
            const Icon = method.icon;
            return (
              <label
                key={method.id}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  deliveryMethod === method.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value={method.id}
                  checked={deliveryMethod === method.id}
                  onChange={(e) =>
                    setDeliveryMethod(
                      e.target.value as NonNullable<
                        AnalyticsFilters["deliveryMethod"]
                      >,
                    )
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={
                        deliveryMethod === method.id
                          ? "text-blue-600"
                          : "text-gray-500"
                      }
                    />
                    <h4 className="font-semibold text-gray-900">
                      {method.label}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Recipients */}
      <Section title={t("reports.recipients")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("reports.emailAddresses")}
            </label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 min-h-[80px]"
              value={recipients.join(", ")}
              onChange={(e) =>
                setRecipients(e.target.value.split(",").map((r) => r.trim()))
              }
              placeholder={t("reports.emailAddressesPlaceholder")}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("reports.separateEmailsWithCommas")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("reports.startDate")}</label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* Smart Recommendations */}
      <Section title={t("reports.smartRecommendations")}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiZap className="text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {t("reports.smartSuggestions")}
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>{t("reports.optimalDeliveryTime")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>{t("reports.monthlyFrequencySuggestion")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>{t("reports.slackIntegrationSuggestion")}</span>
                  {!isPro && (
                    <FiLock className="text-gray-400" title={t("reports.proFeature")} />
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Upcoming Schedule Preview */}
      {selectedTemplate && (
        <Section title={t("reports.upcomingSchedule")}>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm mb-4">
            {t("reports.deliveryNotAutomatedWarning")}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">
                  {getSelectedTemplate()?.name}
                </h4>
                <span className="text-sm text-gray-600">
                  {t("reports.deliveryFrequency", { frequency })}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="font-medium text-gray-900">{t("reports.wouldNextOccur")}</div>
                  <div className="text-gray-600">
                    {computeNextDelivery(startDate, frequency).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="font-medium text-gray-900">
                    {t("reports.deliveryMethod")}
                  </div>
                  <div className="text-gray-600 capitalize">
                    {deliveryMethod}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="font-medium text-gray-900">{t("reports.recipients")}</div>
                  <div className="text-gray-600">
                    {t("reports.recipientsCount", { count: recipients.length })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={onClose}
            disabled={loading || scheduling}
          >
            {t("common.cancel")}
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleSchedule}
            disabled={loading || scheduling || !selectedTemplate || !isProUser}
          >
            {scheduling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("reports.schedulingButton")}
              </>
            ) : (
              <>
                <FiClock />
                {t("analytics.scheduleReport")}
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
}
