import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiCalendar, 
  FiUser, 
  FiTag, 
  FiClock, 
  FiZap, 
  FiLock, 
  FiInfo, 
  FiCheck, 
  FiX, 
  FiSearch,
  FiAlertTriangle,
  FiStar,
  FiTrendingUp,
  FiSettings,
  FiUsers
} from 'react-icons/fi';
import { SmartModal } from '../../ui/SmartModal';
import { FormField, SelectField, DateField, AIRecommendationCard } from '../../classes/modals/SmartFormComponents';
import { useSmartTaskModal } from './useSmartTaskModal';
import { SmartButton } from '../../ui/DesignSystem';
import { mockTrainers } from '../../../api/mockTrainerData';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPro?: boolean;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  open,
  onClose,
  onSuccess,
  isPro = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    priority: 'medium' as const,
    assignedTo: '',
    dueDate: '',
    tags: '',
    estimatedHours: 1
  });

  const [loading, setLoading] = useState(false);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [errors, setErrors] = useState<Array<{ field: string; message: string }>>([]);

  const {
    createTask,
    aiSuggestions,
    alerts,
    clearAlerts
  } = useSmartTaskModal({ isPro });

  useEffect(() => {
    const fetchRecentTasks = async () => {
      // Mock recent tasks
      const tasks = [
        { id: '1', title: 'Setup new member onboarding for Sarah', type: 'onboarding', priority: 'high' },
        { id: '2', title: 'Equipment maintenance check', type: 'maintenance', priority: 'medium' },
        { id: '3', title: 'Class setup for Yoga session', type: 'class_setup', priority: 'medium' }
      ];
      setRecentTasks(tasks);
    };
    if (open) {
      fetchRecentTasks();
    }
  }, [open]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific errors
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const validateForm = (data: typeof formData) => {
    const newErrors: Array<{ field: string; message: string }> = [];
    
    if (!data.title.trim()) {
      newErrors.push({ field: 'title', message: 'Task title is required' });
    }
    
    if (!data.type) {
      newErrors.push({ field: 'type', message: 'Task type is required' });
    }
    
    if (!data.priority) {
      newErrors.push({ field: 'priority', message: 'Priority is required' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm(formData)) {
      return;
    }
    setLoading(true);
    try {
      const result = await createTask({
        title: formData.title,
        description: formData.description,
        type: formData.type as any,
        priority: formData.priority,
        status: 'pending',
        assignedTo: formData.assignedTo || undefined,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      });
      
      if (result.success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const getError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const taskTypes = [
    { value: 'onboarding', label: 'Member Onboarding' },
    { value: 'class_setup', label: 'Class Setup' },
    { value: 'maintenance', label: 'Equipment Maintenance' },
    { value: 'cleaning', label: 'Facility Cleaning' },
    { value: 'equipment_check', label: 'Equipment Check' },
    { value: 'member_support', label: 'Member Support' },
    { value: 'admin', label: 'Administrative' },
    { value: 'custom', label: 'Custom Task' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const staffOptions = mockTrainers.map(trainer => ({
    value: trainer.id,
    label: trainer.name
  }));

  const isFormValid = formData.title && formData.type && formData.priority;

  // Auto-set priority based on task type
  useEffect(() => {
    if (formData.type) {
      let newPriority = 'medium' as const;
      if (['maintenance', 'equipment_check'].includes(formData.type)) {
        newPriority = 'high';
      } else if (['onboarding', 'member_support'].includes(formData.type)) {
        newPriority = 'medium';
      } else if (['cleaning', 'admin'].includes(formData.type)) {
        newPriority = 'low';
      }
      setFormData(prev => ({ ...prev, priority: newPriority }));
    }
  }, [formData.type]);

  return (
    <AnimatePresence>
      {open && (
        <SmartModal
          isOpen={open}
          onClose={onClose}
          title="Add New Task"
          subtitle="Create a new task with smart automation"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {errors.length > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-orange-600 dark:text-orange-400">
                    <FiAlertTriangle className="h-4 w-4" />
                    <span>{errors.length} validation errors</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <SmartButton 
                  variant="secondary" 
                  onClick={onClose} 
                  disabled={loading}
                  className="px-6 py-2.5"
                >
                  Cancel
                </SmartButton>
                <SmartButton 
                  variant="primary" 
                  onClick={handleSave} 
                  loading={loading} 
                  disabled={!isFormValid || loading}
                  className="px-6 py-2.5"
                >
                  {loading ? 'Creating...' : 'Create Task'}
                </SmartButton>
              </div>
            </div>
          }
        >
          <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
            {/* Pro-only AI Recommendations */}
            {isPro && aiSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <FiZap className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI Recommendations
                  </h3>
                  <div className="flex items-center space-x-1 bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded-full">
                    <FiStar className="h-3 w-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">PRO</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-3 bg-white/50 dark:bg-white/10 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FiCheck className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-purple-700 dark:text-purple-300">{suggestion.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Task Details Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FiSettings className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Basic information about your task</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Task Title"
                  value={formData.title}
                  onChange={(value) => handleInputChange('title', value)}
                  placeholder="e.g., Setup new yoga equipment"
                  error={getError('title')}
                  required
                />
                <SelectField
                  label="Task Type"
                  value={formData.type}
                  onChange={(value) => handleInputChange('type', value)}
                  options={taskTypes}
                  placeholder="Select task type"
                  error={getError('type')}
                  required
                />
              </div>
              <FormField
                label="Description"
                value={formData.description}
                onChange={(value) => handleInputChange('description', value)}
                placeholder="Describe the task, requirements, and expected outcomes..."
                type="textarea"
              />
            </motion.div>

            {/* Priority & Assignment Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FiUser className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Priority & Assignment</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Set priority and assign to staff member</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Priority Level"
                  value={formData.priority}
                  onChange={(value) => handleInputChange('priority', value)}
                  options={priorityOptions}
                  error={getError('priority')}
                  required
                />
                <SelectField
                  label="Assigned To"
                  value={formData.assignedTo}
                  onChange={(value) => handleInputChange('assignedTo', value)}
                  options={staffOptions}
                  placeholder="Select staff member"
                  error={getError('assignedTo')}
                />
              </div>
              {/* Priority auto-set notification */}
              {formData.type && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  <FiInfo className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Priority auto-set to {formData.priority} based on task type
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Schedule & Tags Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <FiCalendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule & Organization</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Set due date and add tags</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DateField
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={(value) => handleInputChange('dueDate', value)}
                  error={getError('dueDate')}
                  min={new Date().toISOString().split('T')[0]}
                />
                <FormField
                  label="Estimated Hours"
                  value={formData.estimatedHours.toString()}
                  onChange={(value) => handleInputChange('estimatedHours', parseInt(value) || 1)}
                  type="number"
                  error={getError('estimatedHours')}
                />
                <FormField
                  label="Tags"
                  value={formData.tags}
                  onChange={(value) => handleInputChange('tags', value)}
                  placeholder="maintenance, equipment, urgent"
                  error={getError('tags')}
                />
              </div>
            </motion.div>

            {/* Recent Similar Tasks */}
            {recentTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                    <FiTrendingUp className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Similar Tasks</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avoid creating duplicate tasks</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {recentTasks.slice(0, 3).map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FiCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{task.title}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{task.type}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </form>
        </SmartModal>
      )}
    </AnimatePresence>
  );
};

export default AddTaskModal;
export { AddTaskModal }; 