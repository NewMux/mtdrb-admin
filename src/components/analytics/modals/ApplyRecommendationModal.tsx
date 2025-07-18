import * as React from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiCheckCircle, FiSettings, FiPlay, FiAlertTriangle, FiUsers, FiMail, FiCalendar } from 'react-icons/fi';
import { SmartAnalyticsModal } from './SmartAnalyticsModal';
import { useSmartAnalyticsModal } from './useSmartAnalyticsModal';

interface ApplyRecommendationModalProps {
  open: boolean;
  onClose: () => void;
  insightId?: string;
  insightTitle?: string;
  insightDescription?: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const sampleInsight = {
  id: '1',
  title: 'Member Dropout Risk',
  description: '5 members show high risk of churning in the next 30 days',
  confidence: 87,
  impact: 'high',
  category: 'retention',
  recommendedAction: 'send_reengagement',
  actionDetails: {
    type: 'email_campaign',
    target: 'at_risk_members',
    template: 're_engagement_v1',
    schedule: 'immediate',
    estimatedImpact: '15% retention improvement',
  },
};

const actionOptions = [
  {
    id: 'auto_apply',
    label: 'Auto-Apply Recommendation',
    description: 'Apply the AI recommendation automatically with default settings',
    icon: FiPlay,
    color: 'green',
  },
  {
    id: 'customize',
    label: 'Customize Action',
    description: 'Modify the recommendation before applying',
    icon: FiSettings,
    color: 'blue',
  },
  {
    id: 'schedule',
    label: 'Schedule for Later',
    description: 'Apply the recommendation at a specific time',
    icon: FiCalendar,
    color: 'purple',
  },
];

export default function ApplyRecommendationModal({ 
  open, 
  onClose, 
  insightId = '1',
  insightTitle = 'Member Dropout Risk',
  insightDescription = '5 members show high risk of churning in the next 30 days',
  onSuccess, 
  isPro 
}: ApplyRecommendationModalProps) {
  const { loading, alerts, clearAlerts } = useSmartAnalyticsModal();
  
  const [selectedAction, setSelectedAction] = React.useState('auto_apply');
  const [customSettings, setCustomSettings] = React.useState({
    emailTemplate: 're_engagement_v1',
    sendImmediately: true,
    includeIncentive: true,
    followUpDays: 7,
  });
  const [scheduledDate, setScheduledDate] = React.useState('');
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleApply = async () => {
    setApplying(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Applying recommendation:', selectedAction, customSettings);
      onSuccess?.();
      onClose();
    } finally {
      setApplying(false);
    }
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
      title="Apply Recommendation"
      subtitle="Implement AI-powered insights to optimize your operations"
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

      {/* Selected Insight */}
      <Section title="Selected Insight">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-red-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{sampleInsight.title}</h4>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  {sampleInsight.impact} impact
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {sampleInsight.confidence}% confidence
                </span>
              </div>
              <p className="text-gray-700 mb-2">{sampleInsight.description}</p>
              <div className="text-sm text-gray-600">
                <strong>Recommended Action:</strong> {sampleInsight.actionDetails.type.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Action Options */}
      <Section title="Application Method">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actionOptions.map((option) => {
            const Icon = option.icon;
            return (
              <label key={option.id} className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedAction === option.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}>
                <input
                  type="radio"
                  name="actionMethod"
                  value={option.id}
                  checked={selectedAction === option.id}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`${selectedAction === option.id ? 'text-blue-600' : 'text-gray-500'}`} />
                    <h4 className="font-semibold text-gray-900">{option.label}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Custom Settings */}
      {selectedAction === 'customize' && (
        <Section title="Customize Settings">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Template</label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={customSettings.emailTemplate}
                onChange={(e) => setCustomSettings({ ...customSettings, emailTemplate: e.target.value })}
              >
                <option value="re_engagement_v1">Re-engagement Campaign v1</option>
                <option value="re_engagement_v2">Re-engagement Campaign v2</option>
                <option value="personalized_offer">Personalized Offer</option>
                <option value="class_invitation">Class Invitation</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={customSettings.sendImmediately}
                    onChange={(e) => setCustomSettings({ ...customSettings, sendImmediately: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Send immediately</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={customSettings.includeIncentive}
                    onChange={(e) => setCustomSettings({ ...customSettings, includeIncentive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Include incentive offer</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Follow-up Days</label>
              <input
                type="number"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={customSettings.followUpDays}
                onChange={(e) => setCustomSettings({ ...customSettings, followUpDays: parseInt(e.target.value) })}
                min="1"
                max="30"
              />
            </div>
          </div>
        </Section>
      )}

      {/* Schedule Settings */}
      {selectedAction === 'schedule' && (
        <Section title="Schedule Settings">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FiCalendar /> Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FiCalendar className="text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Smart Scheduling</h4>
                  <p className="text-sm text-gray-600">
                    Recommended time: <strong>9:00 AM</strong> (highest engagement rate)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Action Preview */}
      <Section title="Action Preview">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Action Type</span>
              <span className="text-gray-600 capitalize">
                {selectedAction === 'auto_apply' ? 'Auto-apply' : 
                 selectedAction === 'customize' ? 'Customized' : 'Scheduled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Target Audience</span>
              <span className="text-gray-600">5 at-risk members</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Estimated Impact</span>
              <span className="text-green-600 font-semibold">15% retention improvement</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Confidence Level</span>
              <span className="text-gray-600">{sampleInsight.confidence}%</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Smart Recommendations */}
      <Section title="Smart Recommendations">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiZap className="text-yellow-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">AI Suggestions</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>Send personalized offers to increase engagement</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>Follow up with phone calls for high-value members</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>Schedule follow-up actions in 7 days</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>Monitor response rates and adjust strategy</span>
                </li>
              </ul>
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
            disabled={loading || applying}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleApply}
            disabled={loading || applying || (selectedAction === 'schedule' && !scheduledDate)}
          >
            {applying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <FiPlay />
                Apply Recommendation
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
} 