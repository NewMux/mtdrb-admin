import * as React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCalendar, FiStar, FiUsers, FiTrendingUp, FiAlertTriangle, FiZap, FiLock } from 'react-icons/fi';
import { SmartAnalyticsModal } from './SmartAnalyticsModal';
import { useSmartAnalyticsModal } from './useSmartAnalyticsModal';

interface GenerateTrainerReportModalProps {
  open: boolean;
  onClose: () => void;
  trainerId?: string;
  trainerName?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const trainerData = {
  id: '1',
  name: 'Mike Chen',
  email: 'mike.chen@mtdrb.com',
  joinDate: '2022-06-15',
  specialization: 'HIIT & Strength Training',
  sessions: {
    totalSessions: 156,
    thisMonth: 18,
    averageRating: 4.8,
    totalClients: 45,
    activeClients: 32,
  },
  performance: {
    clientRetention: 85,
    sessionCompletion: 92,
    clientSatisfaction: 4.7,
    revenueGenerated: 12500,
  },
  aiInsights: [
    {
      type: 'alert',
      title: 'Low Engagement This Month',
      description: 'Session attendance dropped 15% compared to last month',
      confidence: 78,
      recommendation: 'Consider class assignment change',
      impact: 'medium',
    },
    {
      type: 'opportunity',
      title: 'High Client Satisfaction',
      description: 'Clients rate sessions 4.8/5 on average',
      confidence: 95,
      recommendation: 'Promote to premium trainer',
      impact: 'high',
    },
  ],
};

const reportSections = [
  { id: 'sessions', label: 'Session Analytics', icon: FiCalendar },
  { id: 'clients', label: 'Client Management', icon: FiUsers },
  { id: 'ratings', label: 'Performance Ratings', icon: FiStar },
  { id: 'retention', label: 'Retention Metrics', icon: FiTrendingUp },
  { id: 'ai_insights', label: 'AI Insights', icon: FiZap, isPro: true },
];

export default function GenerateTrainerReportModal({ 
  open, 
  onClose, 
  trainerId = '1', 
  trainerName = 'Mike Chen',
  onSuccess, 
  isPro 
}: GenerateTrainerReportModalProps) {
  const { loading, generateReport, alerts, clearAlerts } = useSmartAnalyticsModal();
  
  const [selectedSections, setSelectedSections] = React.useState<string[]>(['sessions', 'clients', 'ratings']);
  const [includeCharts, setIncludeCharts] = React.useState(true);
  const [dateRange, setDateRange] = React.useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
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
    setSelectedSections(selectedSections.filter(id => id !== sectionId));
  };

  const getSectionIcon = (sectionId: string) => {
    const section = reportSections.find(s => s.id === sectionId);
    return section?.icon || FiUser;
  };

  const getSectionLabel = (sectionId: string) => {
    const section = reportSections.find(s => s.id === sectionId);
    return section?.label || sectionId;
  };

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
      title="Generate Trainer Report"
      subtitle={`Performance analysis for ${trainerName}`}
    >
      {/* Alerts */}
      {alerts.map((alert, i) => (
        <div key={i} className={`rounded-lg px-4 py-3 mb-4 text-sm font-medium flex items-center gap-2 ${
          alert.type === 'error' ? 'bg-red-50 text-red-700' : 
          alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : 
          'bg-blue-50 text-blue-700'
        }`}>
          {alert.message}
        </div>
      ))}

      {/* Trainer Overview */}
      <Section title="Trainer Overview">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-lg font-semibold">
              {trainerData.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{trainerData.name}</h3>
              <p className="text-sm text-gray-600">{trainerData.email}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>Trainer since {new Date(trainerData.joinDate).toLocaleDateString()}</span>
                <span>•</span>
                <span>{trainerData.specialization}</span>
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
                    ? 'border-blue-500 bg-blue-50' 
                    : isProOnly
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
                onClick={() => !isProOnly && (isSelected ? handleRemoveSection(section.id) : handleAddSection(section.id))}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{section.label}</h4>
                      {isProOnly && <FiLock className="text-gray-400" title="Pro feature" />}
                    </div>
                  </div>
                  {isSelected && (
                    <FiCheckCircle className="text-blue-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* AI Insights */}
      {isPro && trainerData.aiInsights.length > 0 && (
        <Section title="AI Insights">
          <div className="space-y-3">
            {trainerData.aiInsights.map((insight, index) => (
              <div key={index} className={`p-4 border rounded-lg ${
                insight.type === 'alert' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
              }`}>
                <div className="flex items-start gap-3">
                  {insight.type === 'alert' ? (
                    <FiAlertTriangle className="text-yellow-600 mt-1" />
                  ) : (
                    <FiZap className="text-green-600 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {insight.impact} impact
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
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

      {/* Date Range */}
      <Section title="Date Range">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <FiCalendar /> Start Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
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
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>
      </Section>

      {/* Trainer Performance Preview */}
      <Section title="Performance Preview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiCalendar className="text-blue-600" />
              <h4 className="font-semibold text-gray-900">Sessions</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Sessions</span>
                <span className="font-semibold">{trainerData.sessions.totalSessions}</span>
              </div>
              <div className="flex justify-between">
                <span>This Month</span>
                <span className="font-semibold">{trainerData.sessions.thisMonth}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Rating</span>
                <span className="font-semibold">{trainerData.sessions.averageRating}/5</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiUsers className="text-green-600" />
              <h4 className="font-semibold text-gray-900">Clients</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Clients</span>
                <span className="font-semibold">{trainerData.sessions.totalClients}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Clients</span>
                <span className="font-semibold">{trainerData.sessions.activeClients}</span>
              </div>
              <div className="flex justify-between">
                <span>Retention Rate</span>
                <span className="font-semibold">{trainerData.performance.clientRetention}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiStar className="text-yellow-600" />
              <h4 className="font-semibold text-gray-900">Performance</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Session Completion</span>
                <span className="font-semibold">{trainerData.performance.sessionCompletion}%</span>
              </div>
              <div className="flex justify-between">
                <span>Client Satisfaction</span>
                <span className="font-semibold">{trainerData.performance.clientSatisfaction}/5</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue Generated</span>
                <span className="font-semibold">${trainerData.performance.revenueGenerated}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <FiTrendingUp className="text-purple-600" />
              <h4 className="font-semibold text-gray-900">Trends</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monthly Growth</span>
                <span className="font-semibold text-green-600">+12%</span>
              </div>
              <div className="flex justify-between">
                <span>Client Acquisition</span>
                <span className="font-semibold text-green-600">+8</span>
              </div>
              <div className="flex justify-between">
                <span>Rating Trend</span>
                <span className="font-semibold text-green-600">↗ +0.2</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Export Options */}
      <Section title="Export Options">
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="rounded"
            />
            <span className="font-medium">Include performance charts and graphs</span>
          </label>
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