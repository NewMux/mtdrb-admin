import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  FiBarChart, 
  FiTrendingUp, 
  FiUsers, 
  FiCalendar, 
  FiDollarSign, 
  FiSettings,
  FiDownload,
  FiEye,
  FiZap,
  FiFileText,
  FiShare,
  FiClock,
  FiPrinter,
  FiCpu,
  FiToggleRight,
  FiMapPin,
  FiFilter,
  FiTarget,
  FiActivity
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { usePageThemeContext } from '../contexts/PageThemeContext';

// UI Components
import { 
  PageLayout, 
  SmartCard, 
  SmartButton, 
  Section,
  SmartLoading
} from "../components/ui";

// Analytics Components
import MemberAnalytics from '../components/analytics/MemberAnalytics';
import RevenueOverview from '../components/analytics/RevenueOverview';
import SmartKPIHeader from '../components/analytics/SmartKPIHeader';
import AIInsights from '../components/analytics/AIInsights';

// Report Components
import SmartReportsDashboard from '../components/reports/SmartReportsDashboard';
import SmartReportAnalytics from '../components/reports/SmartReportAnalytics';
import ReportGenerator from '../components/reports/ReportGenerator';
import ScheduledReports from '../components/reports/ScheduledReports';
import SmartInsightCards from '../components/reports/SmartInsightCards';
import KPIGroup from '../components/reports/KPIGroup';
import ReportTemplates from '../components/reports/ReportTemplates';
import FilterBar from '../components/reports/FilterBar';

// Mock API
import { 
  getSmartInsights, 
  getWeeklySummary, 
  getChartMetrics,
  getKPIStats,
  getReportTemplates,
  getBranches,
  getMetricTypes,
  SmartInsight,
  ReportTemplate 
} from '../api/mockReports';

// Import all modal components
import {
  SmartAnalyticsModal,
  ExportReportModal,
  GenerateReportModal,
  ScheduleReportModal,
  DownloadReportModal,
  ShareReportModal,
  GenerateVATReportModal,
  ViewAIInsightsModal,
  CreateCustomReportModal,
  PrintReportModal
} from '../components/analytics/modals';
import ViewDetailsModal from '../components/analytics/ViewDetailsModal';

export default function Analytics() {
  const { theme } = usePageThemeContext();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeView, setActiveView] = useState<'overview' | 'members' | 'revenue' | 'classes' | 'insights' | 'reports' | 'generator' | 'scheduled'>('overview');
  const [weeklySummary, setWeeklySummary] = useState<string>('');
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [filters, setFilters] = useState({
    dateRange: 'last-30-days',
    branch: 'all',
    metricType: 'all'
  });
  const [modalState, setModalState] = useState({
    settings: false,
    export: false,
    generateReport: false,
    scheduleReport: false,
    downloadReport: false,
    shareReport: false,
    vatReport: false,
    aiInsights: false,
    customReport: false,
    printReport: false,
    askAI: false,
    viewDetails: false
  });
  const [viewDetailsData, setViewDetailsData] = useState({
    section: '',
    data: null
  });
  const navigate = useNavigate();

  const isPro = user?.user_metadata?.subscription === 'pro';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate('/login');
      } else if (!data.user.user_metadata || !data.user.user_metadata.paid) {
        navigate('/subscribe');
      } else {
        setUser(data.user);
        fetchInitialData();
      }
      setLoading(false);
    });
  }, [navigate]);

  // Handle URL parameters for tab selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'members', 'revenue', 'classes', 'insights', 'reports', 'generator', 'scheduled'].includes(tabParam)) {
      setActiveView(tabParam as any);
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      const [summaryData, insightsData] = await Promise.all([
        getWeeklySummary(),
        getSmartInsights()
      ]);
      setWeeklySummary(summaryData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load some data');
    }
  };

  const handleInsightAction = (insight: SmartInsight) => {
    switch (insight.action) {
      case 'Create Task':
        toast.success('Opening task creation...');
        break;
      case 'Create Campaign':
        toast.success('Opening campaign creation...');
        break;
      case 'Schedule Class':
        toast.success('Opening class scheduling...');
        break;
      case 'Create Package':
        toast.success('Opening package creation...');
        break;
      default:
        toast.info(`Action: ${insight.action}`);
    }
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setActiveView('generator');
    toast.success(`Selected ${template.name} template`);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    toast.success('Filters updated');
  };

  const toggleAiInsights = () => {
    setAiInsightsEnabled(!aiInsightsEnabled);
    localStorage.setItem('ai-insights-enabled', (!aiInsightsEnabled).toString());
    toast.success(`AI Insights ${!aiInsightsEnabled ? 'enabled' : 'disabled'}`);
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    toast[type](message);
  };

  const simulateApiCall = async (action: string, delay: number = 1000) => {
    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      return true;
    } catch (error) {
      throw new Error(`Failed to ${action}`);
    }
  };

  const handlers = {
    openModal: (modalName: keyof typeof modalState) => {
      setModalState(prev => ({ ...prev, [modalName]: true }));
    },
    closeModal: (modalName: keyof typeof modalState) => {
      setModalState(prev => ({ ...prev, [modalName]: false }));
    },
    closeAllModals: () => {
      setModalState({
        settings: false,
        export: false,
        generateReport: false,
        scheduleReport: false,
        downloadReport: false,
        shareReport: false,
        vatReport: false,
        aiInsights: false,
        customReport: false,
        printReport: false,
        askAI: false,
        viewDetails: false
      });
    },

    handleExport: async () => {
      try {
        await simulateApiCall('export data', 1500);
        showToast('success', 'Analytics data exported successfully!');
        handlers.openModal('export');
      } catch (error) {
        showToast('error', 'Failed to export data. Please try again.');
      }
    },

    handleViewDetails: async (section: string) => {
      try {
        await simulateApiCall('load detailed view', 800);
        const details = {
          revenue: { title: 'Revenue Details', data: { revenue: 45280, growth: 12.5 } },
          members: { title: 'Member Details', data: { members: 1247, growth: 8.2 } },
          classes: { title: 'Class Details', data: { classes: 156, attendance: '85%', rating: 4.8 } }
        };

        const sectionData = details[section as keyof typeof details];
        if (sectionData) {
          setViewDetailsData({
            section,
            data: sectionData.data
          });
          handlers.openModal('viewDetails');
        }
      } catch (error) {
        showToast('error', 'Failed to load details. Please try again.');
      }
    },

    handleGenerateReport: async (type?: string) => {
      try {
        await simulateApiCall('generate report', 2000);
        const reportType = type || 'custom';
        showToast('success', `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`);
        handlers.openModal('generateReport');
      } catch (error) {
        showToast('error', 'Failed to generate report. Please try again.');
      }
    },

    handleAIAction: async (id: string, action: string) => {
      try {
        await simulateApiCall('process AI action', 1000);
        const actions = {
          'apply': 'Recommendation applied successfully!',
          'dismiss': 'Insight dismissed',
          'learn-more': 'Opening detailed explanation...',
          'schedule': 'Action scheduled for later'
        };
        const message = actions[action as keyof typeof actions] || 'Action completed successfully!';
        showToast('success', message);
      } catch (error) {
        showToast('error', 'Failed to process action. Please try again.');
      }
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('ai-insights-enabled');
    if (saved !== null) {
      setAiInsightsEnabled(saved === 'true');
    }
  }, []);

  if (loading) {
    return <SmartLoading message="Loading Smart Analytics..." />;
  }

  const analyticsTabs = [
    { id: 'overview', name: 'Overview', icon: FiBarChart },
    { id: 'members', name: 'Members', icon: FiUsers },
    { id: 'revenue', name: 'Revenue', icon: FiDollarSign },
    { id: 'classes', name: 'Classes', icon: FiCalendar },
    { id: 'insights', name: 'AI Insights', icon: FiTrendingUp },
    { id: 'reports', name: 'Reports', icon: FiFileText },
  ];

  const dateRanges = [
    { id: '7d', name: 'Last 7 days' },
    { id: '30d', name: 'Last 30 days' },
    { id: '90d', name: 'Last 90 days' },
    { id: '1y', name: 'Last year' },
  ];

  return (
    <PageLayout
      title="Smart Analytics & Reports"
      subtitle="AI-powered business intelligence and comprehensive reporting"
      actions={
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
            <span className="text-sm text-gray-600">🧠 AI Insights:</span>
            <button
              onClick={toggleAiInsights}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                aiInsightsEnabled
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              <FiToggleRight className={`w-3 h-3 ${aiInsightsEnabled ? 'rotate-180' : ''}`} />
              {aiInsightsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <SmartButton
            variant="primary"
            size="sm"
            icon={<FiDownload className="h-4 w-4" />}
            onClick={handlers.handleExport}
          >
            Export
          </SmartButton>
          <SmartButton
            variant="secondary"
            size="sm"
            icon={<FiFileText className="h-4 w-4" />}
            onClick={() => setActiveView('generator')}
          >
            Generate Report
          </SmartButton>
        </div>
      }
    >
      {/* Header Section - Dynamic Weekly Summary */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{weeklySummary}</h1>
            <p className="text-blue-100 text-lg">Your gym analytics at a glance</p>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-sm text-blue-200">Real-time data</div>
          </div>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <FilterBar onFiltersChange={handleFiltersChange} isPro={isPro} />
      </motion.div>

      {/* KPI Group */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <KPIGroup isPro={isPro} />
      </motion.div>

      {/* Smart Insight Cards */}
      {aiInsightsEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Section title="AI Insights" subtitle="Smart recommendations to optimize your gym operations">
            <SmartInsightCards 
              insights={insights} 
              onActionClick={handleInsightAction}
              isPro={isPro}
            />
          </Section>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-2">
          <div className="flex space-x-1 overflow-x-auto">
            {analyticsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                                 <button
                   key={tab.id}
                   onClick={() => {
                     setActiveView(tab.id as any);
                     // Update URL without page reload
                     const url = new URL(window.location);
                     url.searchParams.set('tab', tab.id);
                     window.history.pushState({}, '', url);
                   }}
                   className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                     activeView === tab.id
                       ? 'bg-blue-600 text-white shadow-md'
                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                   }`}
                 >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Date Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Time Period:</span>
              <div className="flex space-x-2">
                {dateRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setDateRange(range.id)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                      dateRange === range.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {range.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Live data
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active View Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === 'overview' && (
            <div className="space-y-8">
              <SmartKPIHeader />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RevenueOverview />
                <MemberAnalytics />
              </div>
            </div>
          )}
          {activeView === 'members' && <MemberAnalytics />}
          {activeView === 'revenue' && <RevenueOverview />}
          {activeView === 'classes' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Class Analytics</h3>
              <p className="text-gray-600">Class performance and attendance analytics coming soon...</p>
            </div>
          )}
          {activeView === 'insights' && <AIInsights />}
          {activeView === 'reports' && (
            <div className="space-y-8">
              <ReportTemplates onTemplateSelect={handleTemplateSelect} isPro={isPro} />
              <SmartReportsDashboard />
            </div>
          )}
          {activeView === 'generator' && <ReportGenerator isPro={isPro} />}
          {activeView === 'scheduled' && <ScheduledReports />}
        </motion.div>
      </AnimatePresence>

      {/* Footer CTA */}
      {!isPro && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlock Pro Analytics</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Get advanced analytics, unlimited reports, AI insights, multi-branch support, 
              predictive analytics, and priority customer support.
            </p>
            <div className="flex items-center justify-center gap-4">
              <SmartButton
                variant="primary"
                size="lg"
                onClick={() => navigate('/subscribe')}
              >
                Upgrade to Pro
              </SmartButton>
              <SmartButton
                variant="ghost"
                size="lg"
                onClick={() => toast.info('Demo mode - Pro features would be available here')}
              >
                View Demo
              </SmartButton>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <ExportReportModal
        open={modalState.export}
        onClose={() => handlers.closeModal('export')}
        onSuccess={handlers.handleExport}
        isPro={isPro}
      />
      <GenerateReportModal
        open={modalState.generateReport}
        onClose={() => handlers.closeModal('generateReport')}
        onSuccess={handlers.handleGenerateReport}
        isPro={isPro}
      />
      <ScheduleReportModal
        open={modalState.scheduleReport}
        onClose={() => handlers.closeModal('scheduleReport')}
        onSuccess={handlers.handleScheduleReport}
        isPro={isPro}
      />
      <DownloadReportModal
        open={modalState.downloadReport}
        onClose={() => handlers.closeModal('downloadReport')}
        onSuccess={handlers.handleDownloadSuccess}
        isPro={isPro}
      />
      <ShareReportModal
        open={modalState.shareReport}
        onClose={() => handlers.closeModal('shareReport')}
        onSuccess={handlers.handleShareSuccess}
        isPro={isPro}
      />
      <GenerateVATReportModal
        open={modalState.vatReport}
        onClose={() => handlers.closeModal('vatReport')}
        onSuccess={handlers.handleVATSuccess}
        isPro={isPro}
      />
      <ViewAIInsightsModal
        open={modalState.aiInsights}
        onClose={() => handlers.closeModal('aiInsights')}
        onSuccess={handlers.handleAIAction}
        isPro={isPro}
      />
      <CreateCustomReportModal
        open={modalState.customReport}
        onClose={() => handlers.closeModal('customReport')}
        onSuccess={handlers.handleCustomReportSuccess}
        isPro={isPro}
      />
      <PrintReportModal
        open={modalState.printReport}
        onClose={() => handlers.closeModal('printReport')}
        onSuccess={handlers.handlePrintSuccess}
        isPro={isPro}
      />
      <ViewDetailsModal
        open={modalState.viewDetails}
        onClose={() => handlers.closeModal('viewDetails')}
        data={viewDetailsData}
        isPro={isPro}
      />
    </PageLayout>
  );
}
