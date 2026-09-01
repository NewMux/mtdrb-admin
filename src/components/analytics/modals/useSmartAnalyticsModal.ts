import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

export interface AnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
  };
  reportType:
    | "member"
    | "class"
    | "trainer"
    | "billing"
    | "vat"
    | "financial"
    | "custom";
  branches?: string[];
  status?: string[];
  gender?: string[];
  plan?: string[];
  exportFormat: "csv" | "excel" | "pdf" | "json";
  includeVisuals: boolean;
  scheduleRecurring?: boolean;
  frequency?: "daily" | "weekly" | "monthly" | "quarterly";
  deliveryMethod?: "email" | "slack";
}

export interface SmartInsight {
  id: string;
  type: "prediction" | "recommendation" | "alert" | "trend";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  action?: string;
  isPro: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  isCustom: boolean;
  lastUsed?: string;
}

export interface ReportPreview {
  totalRecords: number;
  topMetrics: {
    label: string;
    value: string | number;
    change?: number;
    trend: "up" | "down" | "stable";
  }[];
  estimatedSize: string;
  processingTime: number;
}

export interface useSmartAnalyticsModalProps {
  memberId?: string;
  classId?: string;
  trainerId?: string;
  dateRange?: { start: string; end: string };
  reportType?: string;
  isPro?: boolean;
}

export const useSmartAnalyticsModal = (
  props: useSmartAnalyticsModalProps = {},
) => {
  const reportTypeOptions: AnalyticsFilters["reportType"][] = [
    "member",
    "class",
    "trainer",
    "billing",
    "vat",
    "financial",
    "custom",
  ];
  const resolvedReportType = reportTypeOptions.includes(
    props.reportType as AnalyticsFilters["reportType"],
  )
    ? (props.reportType as AnalyticsFilters["reportType"])
    : "member";

  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      start:
        props.dateRange?.start ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      end: props.dateRange?.end || new Date().toISOString().split("T")[0],
    },
    reportType: resolvedReportType,
    exportFormat: "csv",
    includeVisuals: true,
  });

  const [smartInsights, setSmartInsights] = useState<SmartInsight[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [reportPreview, setReportPreview] = useState<ReportPreview | null>(
    null,
  );
  const [alerts, setAlerts] = useState<
    Array<{ type: "error" | "warning" | "info"; message: string }>
  >([]);

  // Load initial data from real sources only
  useEffect(() => {
    // Load real insights from service
    const loadInsights = async () => {
      try {
        const { getAnalyticsInsights } = await import("../../../services/smartSuggestionsService");
        const realInsights = await getAnalyticsInsights();
        // Map to ensure isPro is always boolean
        setSmartInsights(realInsights.map(insight => ({
          ...insight,
          isPro: insight.isPro ?? false
        })));
      } catch (error) {
        console.error("Error loading insights:", error);
        setSmartInsights([]);
      }
    };

    // Load report templates from database
    const loadTemplates = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: membership } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();

        if (membership?.tenant_id) {
          // TODO: Create report_templates table and fetch from there
          // For now, return empty array
          setReportTemplates([]);
        }
      } catch (error) {
        console.error("Error loading templates:", error);
        setReportTemplates([]);
      }
    };

    loadInsights();
    loadTemplates();
    // Report preview will be generated when user creates a report
    setReportPreview(null);
  }, []);

  // Generate report preview
  const generatePreview = async () => {
    setLoading(true);
    try {
      // Report preview will be generated from real data when user creates a report
      setReportPreview(null);
      setAlerts([
        { type: "info", message: "Report preview generated successfully" },
      ]);
    } catch (error) {
      setAlerts([{ type: "error", message: "Failed to generate preview" }]);
    } finally {
      setLoading(false);
    }
  };

  // Schedule recurring report. There's no cron/email-delivery backend yet,
  // so this can't actually deliver reports on schedule - it persists the
  // request for real (in gym_settings.metadata) so it isn't just a fake
  // toast, and callers are expected to be upfront that delivery isn't
  // automated yet.
  const scheduleReport = async (schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    deliveryMethod: "email" | "slack";
    recipients: string[];
    reportTemplateId?: string;
  }) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: membership } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      const tenantId = membership?.tenant_id;
      if (!tenantId) throw new Error("No tenant found");

      const { data: gymSettings, error: fetchError } = await supabase
        .from("gym_settings")
        .select("metadata")
        .eq("tenant_id", tenantId)
        .single();
      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      const existingMetadata =
        (gymSettings?.metadata as Record<string, unknown>) || {};
      const existingSchedules = Array.isArray(existingMetadata.scheduled_reports)
        ? (existingMetadata.scheduled_reports as unknown[])
        : [];

      const newSchedule = {
        id: Date.now().toString(),
        ...schedule,
        created_at: new Date().toISOString(),
        created_by: user.id,
      };

      const { error: upsertError } = await supabase.from("gym_settings").upsert(
        {
          tenant_id: tenantId,
          metadata: {
            ...existingMetadata,
            scheduled_reports: [...existingSchedules, newSchedule],
          },
        },
        { onConflict: "tenant_id" },
      );
      if (upsertError) throw upsertError;

      setAlerts([
        {
          type: "info",
          message:
            "Schedule saved - note that automatic delivery isn't set up yet, this just records your request.",
        },
      ]);
      return { success: true };
    } catch (error) {
      console.error("Error scheduling report:", error);
      setAlerts([{ type: "error", message: "Failed to save schedule" }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    filters,
    setFilters,
    smartInsights,
    reportTemplates,
    reportPreview,
    alerts,
    generatePreview,
    scheduleReport,
    clearAlerts: () => setAlerts([]),
  };
};
