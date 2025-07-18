import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSettings, FiUsers, FiDollarSign, FiCalendar, FiClock, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { SmartModal } from '../../ui/SmartModal';
import { FormField, SelectField, FormSection } from './SmartFormComponents';
import { useSmartClassModal } from '../../../hooks/useSmartClassModal';
import { SmartButton } from '../../ui/DesignSystem';
import { toast } from 'react-hot-toast';

interface ClassSettings {
  capacity: number;
  price: number;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  class_type: string;
  location: string;
  description: string;
  auto_waitlist: boolean;
  auto_cancel: boolean;
  min_attendance: number;
  max_waitlist: number;
  trainer_requirements: string[];
  equipment_needed: string[];
  special_instructions: string;
}

interface UpdateClassSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSuccess?: () => void;
  isPro?: boolean;
}

const UpdateClassSettingsModal: React.FC<UpdateClassSettingsModalProps> = ({
  isOpen,
  onClose,
  classId,
  onSuccess,
  isPro = false
}) => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ClassSettings>({
    capacity: 20,
    price: 25,
    duration: 60,
    difficulty: 'intermediate',
    class_type: 'Yoga',
    location: 'Studio A',
    description: '',
    auto_waitlist: true,
    auto_cancel: false,
    min_attendance: 3,
    max_waitlist: 10,
    trainer_requirements: [],
    equipment_needed: [],
    special_instructions: ''
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [hasChanges, setHasChanges] = useState(false);

  const {
    classData,
    fetchClass
  } = useSmartClassModal({ classId, isPro });

  // Load class data when modal opens
  useEffect(() => {
    if (isOpen && classId) {
      fetchClass();
      loadCurrentSettings();
    }
  }, [isOpen, classId]);

  // Load current settings from class data
  const loadCurrentSettings = () => {
    if (classData) {
      setSettings({
        capacity: classData.capacity || 20,
        price: 25, // Mock price
        duration: 60,
        difficulty: 'intermediate',
        class_type: classData.class_type || 'Yoga',
        location: 'Studio A',
        description: classData.description || '',
        auto_waitlist: true,
        auto_cancel: false,
        min_attendance: 3,
        max_waitlist: 10,
        trainer_requirements: [],
        equipment_needed: [],
        special_instructions: ''
      });
    }
  };

  const handleSettingChange = (key: keyof ClassSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Settings updated successfully');
      toast.success('Class settings updated successfully');
      setHasChanges(false);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const getValidationErrors = () => {
    const errors: string[] = [];
    
    if (settings.capacity < 1) {
      errors.push('Capacity must be at least 1');
    }
    
    if (settings.price < 0) {
      errors.push('Price cannot be negative');
    }
    
    if (settings.duration < 15) {
      errors.push('Duration must be at least 15 minutes');
    }
    
    if (settings.min_attendance > settings.capacity) {
      errors.push('Minimum attendance cannot exceed capacity');
    }
    
    return errors;
  };

  const validationErrors = getValidationErrors();

  if (!classData) {
    return (
      <SmartModal
        isOpen={isOpen}
        onClose={onClose}
        title="Update Class Settings"
        subtitle="Loading class data..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </SmartModal>
    );
  }

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Class Settings"
      subtitle={`Configure settings for ${classData.name}`}
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <div className="flex items-center space-x-1 text-sm text-orange-600">
                <FiAlertTriangle className="h-4 w-4" />
                <span>Unsaved changes</span>
              </div>
            )}
            {validationErrors.length > 0 && (
              <div className="flex items-center space-x-1 text-sm text-red-600">
                <FiAlertTriangle className="h-4 w-4" />
                <span>{validationErrors.length} validation errors</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <SmartButton
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </SmartButton>
            <SmartButton
              variant="primary"
              onClick={handleSave}
              loading={loading}
              disabled={loading || validationErrors.length > 0}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </SmartButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Class Info */}
        <div className="p-4 bg-light-50 dark:bg-dark-700 rounded-xl border border-light-200 dark:border-dark-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-dark-900 dark:text-white">
                {classData.name}
              </h3>
              <p className="text-sm text-light-600 dark:text-dark-400">
                {new Date(classData.date).toLocaleDateString()} • {classData.start_time} - {classData.end_time}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-light-600 dark:text-dark-400">
                Current Capacity
              </div>
              <div className="text-lg font-semibold text-dark-900 dark:text-white">
                {classData.capacity}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-light-200 dark:border-dark-600">
          <nav className="flex space-x-8">
            {[
              { id: 'basic', label: 'Basic Settings', icon: <FiSettings className="h-4 w-4" /> },
              { id: 'advanced', label: 'Advanced', icon: <FiUsers className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-light-600 dark:text-dark-400 hover:text-light-900 dark:hover:text-dark-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'basic' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <FormSection
                title="Basic Information"
                subtitle="Core class settings and details"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Class Type"
                    value={settings.class_type}
                    onChange={(value) => handleSettingChange('class_type', value)}
                    placeholder="e.g., Yoga, HIIT, Strength"
                  />
                  
                  <FormField
                    label="Location"
                    value={settings.location}
                    onChange={(value) => handleSettingChange('location', value)}
                    placeholder="e.g., Studio A, Gym Floor"
                  />
                  
                  <FormField
                    label="Capacity"
                    type="number"
                    value={settings.capacity.toString()}
                    onChange={(value) => handleSettingChange('capacity', parseInt(value) || 0)}
                    placeholder="Maximum number of participants"
                  />
                  
                  <FormField
                    label="Price ($)"
                    type="number"
                    value={settings.price.toString()}
                    onChange={(value) => handleSettingChange('price', parseFloat(value) || 0)}
                    placeholder="Class price per person"
                  />
                  
                  <FormField
                    label="Duration (minutes)"
                    type="number"
                    value={settings.duration.toString()}
                    onChange={(value) => handleSettingChange('duration', parseInt(value) || 0)}
                    placeholder="Class duration in minutes"
                  />
                  
                  <SelectField
                    label="Difficulty Level"
                    value={settings.difficulty}
                    onChange={(value) => handleSettingChange('difficulty', value)}
                    options={[
                      { value: 'beginner', label: 'Beginner' },
                      { value: 'intermediate', label: 'Intermediate' },
                      { value: 'advanced', label: 'Advanced' }
                    ]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => handleSettingChange('description', e.target.value)}
                    placeholder="Describe the class, what to expect, and any requirements..."
                    rows={4}
                    className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
                  />
                </div>
              </FormSection>
            </motion.div>
          )}

          {activeTab === 'advanced' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <FormSection
                title="Advanced Settings"
                subtitle="Special requirements and configurations"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Minimum Attendance"
                    type="number"
                    value={settings.min_attendance.toString()}
                    onChange={(value) => handleSettingChange('min_attendance', parseInt(value) || 0)}
                    placeholder="Minimum participants to run class"
                  />
                  
                  <FormField
                    label="Max Waitlist Size"
                    type="number"
                    value={settings.max_waitlist.toString()}
                    onChange={(value) => handleSettingChange('max_waitlist', parseInt(value) || 0)}
                    placeholder="Maximum waitlist capacity"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                    Trainer Requirements
                  </label>
                  <div className="space-y-2">
                    {['Yoga certification', 'First aid certified', 'Experience with beginners'].map((req, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`req-${idx}`}
                          checked={settings.trainer_requirements.includes(req)}
                          onChange={(e) => {
                            const newReqs = e.target.checked
                              ? [...settings.trainer_requirements, req]
                              : settings.trainer_requirements.filter(r => r !== req);
                            handleSettingChange('trainer_requirements', newReqs);
                          }}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor={`req-${idx}`} className="text-sm text-dark-900 dark:text-white">
                          {req}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                    Equipment Needed
                  </label>
                  <div className="space-y-2">
                    {['Yoga mats', 'Resistance bands', 'Water bottles'].map((equipment, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`equipment-${idx}`}
                          checked={settings.equipment_needed.includes(equipment)}
                          onChange={(e) => {
                            const newEquipment = e.target.checked
                              ? [...settings.equipment_needed, equipment]
                              : settings.equipment_needed.filter(eq => eq !== equipment);
                            handleSettingChange('equipment_needed', newEquipment);
                          }}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor={`equipment-${idx}`} className="text-sm text-dark-900 dark:text-white">
                          {equipment}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={settings.special_instructions}
                    onChange={(e) => handleSettingChange('special_instructions', e.target.value)}
                    placeholder="Any special instructions for participants or trainers..."
                    rows={3}
                    className="w-full px-4 py-3 border border-light-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 bg-light-50 dark:bg-dark-700 text-dark-900 dark:text-white"
                  />
                </div>
              </FormSection>
            </motion.div>
          )}


        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start space-x-3">
              <FiAlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
                  Validation Errors
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-200 mt-1 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Smart Suggestions */}
        {isPro && (
          <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
              AI Recommendations
            </h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <p>• Consider increasing capacity based on historical demand</p>
              <p>• Set minimum attendance to 20% of capacity for optimal experience</p>
              <p>• Enable auto-cancel to maintain class quality and trainer satisfaction</p>
            </div>
          </div>
        )}
      </div>
    </SmartModal>
  );
};

export default UpdateClassSettingsModal; 