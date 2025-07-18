import * as React from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2, FiFileText, FiDownload, FiShare2, FiPrinter, FiBarChart, FiDollarSign, FiUser, FiUsers, FiZap, FiSettings } from 'react-icons/fi';
import {
  GenerateReportModal,
  CreateCustomReportModal,
  ExportReportModal,
  ScheduleReportModal,
  DownloadReportModal,
  ShareReportModal,
  PrintReportModal,
  GenerateVATReportModal,
  CreateFinancialReportModal,
  GenerateMemberReportModal,
  GenerateTrainerReportModal,
  GenerateClassReportModal,
  ViewAIInsightsModal,
  ApplyRecommendationModal,
  LearnMoreInsightModal,
} from '../components/analytics/modals';

const modalCategories = [
  {
    title: 'Report Generation',
    description: 'Create and manage various types of reports',
    modals: [
      { name: 'Generate Report', component: 'generate', icon: FiBarChart2, description: 'Select report type, date range, and export options' },
      { name: 'Create Custom Report', component: 'custom', icon: FiFileText, description: 'Build custom reports with drag-and-drop sections' },
      { name: 'Export Report', component: 'export', icon: FiDownload, description: 'Export saved reports in various formats' },
      { name: 'Schedule Report', component: 'schedule', icon: FiSettings, description: 'Set up automated report delivery' },
      { name: 'Download Report', component: 'download', icon: FiDownload, description: 'Access and manage downloaded reports' },
      { name: 'Share Report', component: 'share', icon: FiShare2, description: 'Share reports with team members' },
      { name: 'Print Report', component: 'print', icon: FiPrinter, description: 'Print reports with custom layouts' },
    ],
  },
  {
    title: 'Financial Reports',
    description: 'Specialized financial and tax reporting',
    modals: [
      { name: 'Generate VAT Report', component: 'vat', icon: FiBarChart, description: 'Create VAT reports for tax compliance' },
      { name: 'Create Financial Report', component: 'financial', icon: FiDollarSign, description: 'Comprehensive financial analysis' },
    ],
  },
  {
    title: 'Specific Reports',
    description: 'Targeted reports for different entities',
    modals: [
      { name: 'Generate Member Report', component: 'member', icon: FiUser, description: 'Individual member analysis and insights' },
      { name: 'Generate Trainer Report', component: 'trainer', icon: FiUsers, description: 'Trainer performance and metrics' },
      { name: 'Generate Class Report', component: 'class', icon: FiBarChart2, description: 'Class attendance and utilization analysis' },
    ],
  },
  {
    title: 'AI Insights',
    description: 'Advanced AI-powered analytics and recommendations',
    modals: [
      { name: 'View AI Insights', component: 'ai_insights', icon: FiZap, description: 'Pro-only AI insights and predictions' },
      { name: 'Apply Recommendation', component: 'apply_recommendation', icon: FiSettings, description: 'Implement AI recommendations' },
      { name: 'Learn More Insight', component: 'learn_more', icon: FiZap, description: 'Deep dive into AI logic and data' },
    ],
  },
];

export default function AnalyticsModalsDemo() {
  const [activeModal, setActiveModal] = React.useState<string | null>(null);
  const [isPro, setIsPro] = React.useState(true);

  const handleOpenModal = (modalComponent: string) => {
    setActiveModal(modalComponent);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const handleSuccess = () => {
    console.log('Modal action completed successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics & Reporting Modals Demo
          </h1>
          <p className="text-gray-600">
            Explore all 15 smart, sliding modals for analytics and reporting actions
          </p>
          
          {/* Pro Toggle */}
          <div className="mt-4">
            <label className="flex items-center justify-center gap-2">
              <input
                type="checkbox"
                checked={isPro}
                onChange={(e) => setIsPro(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Enable Pro Features</span>
            </label>
          </div>
        </div>

        {/* Modal Categories */}
        <div className="space-y-8">
          {modalCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
                <p className="text-gray-600 mt-1">{category.description}</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.modals.map((modal) => {
                    const Icon = modal.icon;
                    return (
                      <motion.button
                        key={modal.component}
                        onClick={() => handleOpenModal(modal.component)}
                        className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-6 h-6 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {modal.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {modal.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">15</div>
              <div className="text-sm text-gray-600">Total Modals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">4</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-gray-600">AI Modals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">100%</div>
              <div className="text-sm text-gray-600">Apple-Style Design</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GenerateReportModal
        open={activeModal === 'generate'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <CreateCustomReportModal
        open={activeModal === 'custom'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <ExportReportModal
        open={activeModal === 'export'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <ScheduleReportModal
        open={activeModal === 'schedule'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <DownloadReportModal
        open={activeModal === 'download'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <ShareReportModal
        open={activeModal === 'share'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <PrintReportModal
        open={activeModal === 'print'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <GenerateVATReportModal
        open={activeModal === 'vat'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <CreateFinancialReportModal
        open={activeModal === 'financial'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <GenerateMemberReportModal
        open={activeModal === 'member'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <GenerateTrainerReportModal
        open={activeModal === 'trainer'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <GenerateClassReportModal
        open={activeModal === 'class'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <ViewAIInsightsModal
        open={activeModal === 'ai_insights'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <ApplyRecommendationModal
        open={activeModal === 'apply_recommendation'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
      
      <LearnMoreInsightModal
        open={activeModal === 'learn_more'}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        isPro={isPro}
      />
    </div>
  );
} 