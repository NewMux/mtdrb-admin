import * as React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiSave, FiEye, FiZap, FiLock, FiBarChart2, FiUsers, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { SmartAnalyticsModal } from './SmartAnalyticsModal';
import { useSmartAnalyticsModal } from './useSmartAnalyticsModal';

interface CreateCustomReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

const availableSections = [
  { id: 'attendance', label: 'Attendance %', icon: FiUsers, description: 'Member attendance rates and trends' },
  { id: 'payment', label: 'Payment Analytics', icon: FiDollarSign, description: 'Revenue, payments, and billing data' },
  { id: 'trainer_feedback', label: 'Trainer Feedback', icon: FiUsers, description: 'Trainer ratings and member feedback' },
  { id: 'retention', label: 'Retention Score', icon: FiTrendingUp, description: 'Member retention and churn analysis', isPro: true },
  { id: 'engagement', label: 'Engagement Metrics', icon: FiBarChart2, description: 'Member engagement and activity levels' },
  { id: 'financial', label: 'Financial Summary', icon: FiDollarSign, description: 'Revenue, expenses, and profit analysis' },
];

export default function CreateCustomReportModal({ open, onClose, onSuccess, isPro }: CreateCustomReportModalProps) {
  const { loading, saveTemplate, alerts, clearAlerts } = useSmartAnalyticsModal();
  
  const [selectedSections, setSelectedSections] = React.useState<string[]>(['attendance', 'payment']);
  const [reportName, setReportName] = React.useState('');
  const [reportDescription, setReportDescription] = React.useState('');
  const [showPreview, setShowPreview] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      clearAlerts();
    }
  }, [open, clearAlerts]);

  const handleAddSection = (sectionId: string) => {
    if (!selectedSections.includes(sectionId)) {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    setSelectedSections(selectedSections.filter(id => id !== sectionId));
  };

  const handleSaveTemplate = async () => {
    if (!reportName.trim()) {
      return;
    }

    setSaving(true);
    try {
      const result = await saveTemplate({
        name: reportName,
        description: reportDescription,
        sections: selectedSections,
        isCustom: true,
      });

      if (result.success) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const getSectionIcon = (sectionId: string) => {
    const section = availableSections.find(s => s.id === sectionId);
    return section?.icon || FiBarChart2;
  };

  const getSectionLabel = (sectionId: string) => {
    const section = availableSections.find(s => s.id === sectionId);
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
      title="Create Custom Report"
      subtitle="Build your own report with drag-and-drop sections and AI recommendations"
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

      {/* Report Details */}
      <Section title="Report Details">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Report Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="My Custom Report"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 min-h-[80px]"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Describe what this report will show..."
            />
          </div>
        </div>
      </Section>

      {/* Available Sections */}
      <Section title="Available Sections">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableSections.map((section) => {
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
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                  {isSelected && (
                    <FiPlus className="text-blue-600 transform rotate-45" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Selected Sections */}
      {selectedSections.length > 0 && (
        <Section title="Selected Sections">
          <div className="space-y-3">
            {selectedSections.map((sectionId, index) => {
              const Icon = getSectionIcon(sectionId);
              return (
                <motion.div
                  key={sectionId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">{getSectionLabel(sectionId)}</div>
                      <div className="text-sm text-gray-600">Section {index + 1}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSection(sectionId)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </Section>
      )}

      {/* AI Recommendations */}
      <Section title="AI Recommendations">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FiZap className="text-yellow-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Smart Suggestions</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                {!selectedSections.includes('retention') && (
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    <span>Add <strong>Retention Score</strong> for better member analysis</span>
                    {!isPro && <FiLock className="text-gray-400" title="Pro feature" />}
                  </li>
                )}
                {selectedSections.length < 3 && (
                  <li className="flex items-center gap-2">
                    <span>•</span>
                    <span>Consider adding <strong>Engagement Metrics</strong> for comprehensive view</span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span>•</span>
                  <span>This combination will provide excellent insights for member management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Preview Toggle */}
      <Section title="Preview">
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="rounded"
            />
            <span className="font-medium">Show live preview</span>
          </label>
          
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSections.map((sectionId) => (
                  <div key={sectionId} className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-3">
                      {React.createElement(getSectionIcon(sectionId), { className: "text-blue-600" })}
                      <h4 className="font-semibold text-gray-900">{getSectionLabel(sectionId)}</h4>
                    </div>
                    <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
                      Chart placeholder for {getSectionLabel(sectionId)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </Section>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-8">
        <div className="flex gap-3 justify-end">
          <button
            className="bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            onClick={onClose}
            disabled={loading || saving}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
            onClick={handleSaveTemplate}
            disabled={loading || saving || !reportName.trim()}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </SmartAnalyticsModal>
  );
} 