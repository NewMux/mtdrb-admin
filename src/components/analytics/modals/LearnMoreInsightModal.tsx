import * as React from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2, FiTrendingUp, FiTrendingDown, FiUsers, FiCalendar, FiZap, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { SmartAnalyticsModal } from './SmartAnalyticsModal';
import { useSmartAnalyticsModal } from './useSmartAnalyticsModal';

interface LearnMoreInsightModalProps {
  open: boolean;
  onClose: () => void;
  insightId?: string;
  insightTitle?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const insightDetails = {
  id: '1',
  title: 'Member Dropout Risk Analysis',
  description: '5 members show high risk of churning in the next 30 days',
  confidence: 87,
  impact: 'high',
  category: 'retention',
  aiLogic: {
    factors: [
      'Attendance frequency dropped by 40% in last 30 days',
      'No payments made in last 45 days',
      'No class bookings in last 3 weeks',
      'Declining engagement with app notifications',
      'Negative feedback in recent surveys',
    ],
    algorithm: 'Random Forest Classifier',
    trainingData: '12 months of member behavior patterns',
    accuracy: '87% on test dataset',
  },
  supportingMetrics: [
    { label: 'Attendance Rate', value: '45%', trend: 'down', change: -40 },
    { label: 'Payment Frequency', value: '0/month', trend: 'down', change: -100 },
    { label: 'App Engagement', value: '2.3/week', trend: 'down', change: -60 },
    { label: 'Class Bookings', value: '0', trend: 'down', change: -100 },
    { label: 'Satisfaction Score', value: '3.2/5', trend: 'down', change: -25 },
  ],
  historicalTrends: [
    { month: 'Oct', retention: 92, churn: 8 },
    { month: 'Nov', retention: 89, churn: 11 },
    { month: 'Dec', retention: 85, churn: 15 },
    { month: 'Jan', retention: 78, churn: 22 },
  ],
  whyItMatters: [
    'Member churn directly impacts monthly recurring revenue',
    'Acquiring new members costs 5x more than retaining existing ones',
    'High churn rates indicate potential issues with service quality',
    'Early intervention can prevent 70% of predicted churns',
  ],
  recommendations: [
    'Send personalized re-engagement emails within 24 hours',
    'Offer 50% discount on next month\'s membership',
    'Assign personal trainer for one-on-one sessions',
    'Schedule follow-up calls within 7 days',
  ],
};

export default function LearnMoreInsightModal({ 
  open, 
  onClose, 
  insightId = '1',
  insightTitle = 'Member Dropout Risk Analysis',
  onSuccess, 
  isPro 
}: LearnMoreInsightModalProps) {
  const { loading, alerts, clearAlerts } = useSmartAnalyticsModal();
  
  const [activeTab, setActiveTab] = React.useState('logic');

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

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
      title="Learn More About This Insight"
      subtitle="Deep dive into AI logic and supporting data"
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

      {/* Insight Overview */}
      <Section title="Insight Overview">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-red-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{insightDetails.title}</h4>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  {insightDetails.impact} impact
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {insightDetails.confidence}% confidence
                </span>
              </div>
              <p className="text-gray-700">{insightDetails.description}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Tab Navigation */}
      <Section title="Analysis Details">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'logic', label: 'AI Logic', icon: FiZap },
              { id: 'metrics', label: 'Supporting Metrics', icon: FiBarChart2 },
              { id: 'trends', label: 'Historical Trends', icon: FiTrendingUp },
              { id: 'impact', label: 'Why This Matters', icon: FiInfo },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'logic' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">AI Algorithm Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Algorithm:</span>
                    <span className="font-medium">{insightDetails.aiLogic.algorithm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Training Data:</span>
                    <span className="font-medium">{insightDetails.aiLogic.trainingData}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className="font-medium">{insightDetails.aiLogic.accuracy}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Factors</h4>
                <ul className="space-y-2">
                  {insightDetails.aiLogic.factors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-2">Supporting Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightDetails.supportingMetrics.map((metric, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{metric.label}</span>
                      <span className={`text-sm ${
                        metric.trend === 'down' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {metric.trend === 'down' ? '↘' : '↗'} {Math.abs(metric.change)}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-2">Historical Trends</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {insightDetails.historicalTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{trend.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          Retention: <span className="font-semibold">{trend.retention}%</span>
                        </span>
                        <span className="text-sm text-gray-600">
                          Churn: <span className="font-semibold text-red-600">{trend.churn}%</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiTrendingDown className="text-blue-600 mt-1" />
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-1">Trend Analysis</h5>
                    <p className="text-sm text-gray-700">
                      Retention has declined by 14% over the last 4 months, indicating a systemic issue 
                      that requires immediate attention.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'impact' && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-2">Why This Matters</h4>
              <div className="space-y-3">
                {insightDetails.whyItMatters.map((reason, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiInfo className="text-blue-600 mt-1" />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiZap className="text-green-600 mt-1" />
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Recommended Actions</h5>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {insightDetails.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Data Quality */}
      <Section title="Data Quality">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-sm text-gray-600">Data Completeness</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">87%</div>
              <div className="text-sm text-gray-600">Prediction Accuracy</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">12K</div>
              <div className="text-sm text-gray-600">Data Points Analyzed</div>
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
            disabled={loading}
          >
            Close
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={() => {
              // Apply the insight
              console.log('Applying insight based on analysis');
            }}
            disabled={loading}
          >
            <FiZap />
            Apply This Insight
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
} 