import { useState, useEffect } from 'react';

export interface AnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
  };
  reportType: 'member' | 'class' | 'trainer' | 'billing' | 'vat' | 'financial' | 'custom';
  branches?: string[];
  status?: string[];
  gender?: string[];
  plan?: string[];
  exportFormat: 'csv' | 'excel' | 'pdf' | 'json';
  includeVisuals: boolean;
  scheduleRecurring?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  deliveryMethod?: 'email' | 'slack';
}

export interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
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
    trend: 'up' | 'down' | 'stable';
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

export const useSmartAnalyticsModal = (props: useSmartAnalyticsModalProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      start: props.dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: props.dateRange?.end || new Date().toISOString().split('T')[0],
    },
    reportType: (props.reportType as any) || 'member',
    exportFormat: 'csv',
    includeVisuals: true,
  });

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [reportPreview, setReportPreview] = useState<ReportPreview | null>(null);
  const [alerts, setAlerts] = useState<Array<{ type: 'error' | 'warning' | 'info'; message: string }>>([]);

  // Mock data for development
  const mockAiInsights: AIInsight[] = [
    {
      id: '1',
      type: 'prediction',
      title: 'Member Churn Risk',
      description: '5 members show signs of potential churn in the next 30 days',
      confidence: 85,
      impact: 'high',
      action: 'Send re-engagement campaign',
      isPro: true,
    },
    {
      id: '2',
      type: 'recommendation',
      title: 'Revenue Optimization',
      description: 'Adding 2 evening classes could increase revenue by 15%',
      confidence: 92,
      impact: 'high',
      action: 'Schedule new classes',
      isPro: true,
    },
    {
      id: '3',
      type: 'alert',
      title: 'Low Class Attendance',
      description: 'Yoga classes have 30% lower attendance this month',
      confidence: 78,
      impact: 'medium',
      action: 'Review class timing',
      isPro: false,
    },
  ];

  const mockReportTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'Member Overview',
      description: 'Comprehensive member activity and engagement metrics',
      sections: ['Attendance', 'Payments', 'Progress', 'Engagement'],
      isCustom: false,
      lastUsed: '2024-01-15',
    },
    {
      id: '2',
      name: 'Financial Summary',
      description: 'Revenue, expenses, and profit analysis',
      sections: ['Revenue', 'Expenses', 'Profit', 'VAT'],
      isCustom: false,
      lastUsed: '2024-01-10',
    },
    {
      id: '3',
      name: 'Custom Report',
      description: 'Your custom report template',
      sections: ['Attendance', 'Payment', 'Trainer Feedback'],
      isCustom: true,
      lastUsed: '2024-01-12',
    },
  ];

  const mockReportPreview: ReportPreview = {
    totalRecords: 1247,
    topMetrics: [
      { label: 'Total Members', value: 1247, change: 12, trend: 'up' },
      { label: 'Active Classes', value: 89, change: -3, trend: 'down' },
      { label: 'Revenue', value: '$45,230', change: 8, trend: 'up' },
      { label: 'Attendance Rate', value: '78%', change: 2, trend: 'up' },
    ],
    estimatedSize: '2.3 MB',
    processingTime: 3,
  };

  // Load initial data
  useEffect(() => {
    setAiInsights(mockAiInsights);
    setReportTemplates(mockReportTemplates);
    setReportPreview(mockReportPreview);
  }, []);

  // Generate report preview
  const generatePreview = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReportPreview(mockReportPreview);
      setAlerts([{ type: 'info', message: 'Report preview generated successfully' }]);
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Failed to generate preview' }]);
    } finally {
      setLoading(false);
    }
  };

  // Generate and export report
  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAlerts([{ type: 'info', message: 'Report generated and exported successfully' }]);
      return { success: true, downloadUrl: '/api/reports/download/123' };
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Failed to generate report' }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Schedule recurring report
  const scheduleReport = async (schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    deliveryMethod: 'email' | 'slack';
    recipients: string[];
  }) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAlerts([{ type: 'info', message: 'Report scheduled successfully' }]);
      return { success: true };
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Failed to schedule report' }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Save custom template
  const saveTemplate = async (template: Omit<ReportTemplate, 'id'>) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const newTemplate = { ...template, id: Date.now().toString() };
      setReportTemplates(prev => [...prev, newTemplate]);
      setAlerts([{ type: 'info', message: 'Template saved successfully' }]);
      return { success: true };
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Failed to save template' }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Apply AI recommendation
  const applyRecommendation = async (insightId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAlerts([{ type: 'info', message: 'Recommendation applied successfully' }]);
      return { success: true };
    } catch (error) {
      setAlerts([{ type: 'error', message: 'Failed to apply recommendation' }]);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    filters,
    setFilters,
    aiInsights,
    reportTemplates,
    reportPreview,
    alerts,
    generatePreview,
    generateReport,
    scheduleReport,
    saveTemplate,
    applyRecommendation,
    clearAlerts: () => setAlerts([]),
  };
}; 