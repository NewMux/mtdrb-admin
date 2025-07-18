import * as React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCalendar, FiClock, FiTarget, FiSave, FiX, FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ColorfulModalUI from '../../ui/ColorfulModalUI';
import { SmartButton } from '../../ui/DesignSystem';

interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  rating: number;
  status: 'active' | 'inactive' | 'busy' | 'available';
  classes: number;
  experience: string;
  avatar: string;
}

interface AssignClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer;
  onSuccess?: () => void;
  isPro?: boolean;
}

interface ClassAssignment {
  id: string;
  name: string;
  time: string;
  day: string;
  capacity: number;
  assigned: boolean;
}

const mockClasses: ClassAssignment[] = [
  { id: '1', name: 'Morning Yoga', time: '7:00 AM', day: 'Monday', capacity: 15, assigned: false },
  { id: '2', name: 'HIIT Training', time: '8:00 AM', day: 'Tuesday', capacity: 12, assigned: true },
  { id: '3', name: 'Strength Training', time: '6:00 PM', day: 'Wednesday', capacity: 10, assigned: false },
  { id: '4', name: 'Cardio Blast', time: '7:00 PM', day: 'Thursday', capacity: 18, assigned: false },
  { id: '5', name: 'Pilates', time: '9:00 AM', day: 'Friday', capacity: 14, assigned: true },
  { id: '6', name: 'CrossFit', time: '8:00 AM', day: 'Saturday', capacity: 16, assigned: false },
];

export default function AssignClassesModal({ isOpen, onClose, trainer, onSuccess, isPro = false }: AssignClassesModalProps) {
  const [classes, setClasses] = React.useState<ClassAssignment[]>(mockClasses);
  const [loading, setLoading] = React.useState(false);
  const [selectedClasses, setSelectedClasses] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Pre-select already assigned classes
    const assignedClassIds = classes.filter(c => c.assigned).map(c => c.id);
    setSelectedClasses(assignedClassIds);
  }, [classes]);

  const handleToggleClass = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update classes assignment status
    setClasses(prev => prev.map(c => ({
      ...c,
      assigned: selectedClasses.includes(c.id)
    })));
    
    toast.success(`Classes assigned successfully to ${trainer.name}!`);
    setLoading(false);
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <ColorfulModalUI
      isOpen={isOpen}
      onClose={handleClose}
      title="Assign Classes"
      subtitle={`Assign classes to ${trainer.name}`}
    >
      <div className="space-y-6">
        {/* Trainer Info */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-rose-400 flex items-center justify-center">
            <span className="text-white font-medium text-sm">{trainer.avatar}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{trainer.name}</h3>
            <p className="text-sm text-gray-600">{trainer.specialty}</p>
            <p className="text-sm text-gray-600">Currently assigned: {classes.filter(c => c.assigned).length} classes</p>
          </div>
        </div>

        {/* Available Classes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiCalendar className="text-blue-500" />
            Available Classes
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedClasses.includes(classItem.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleToggleClass(classItem.id)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(classItem.id)}
                    onChange={() => handleToggleClass(classItem.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{classItem.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {classItem.time}
                      </span>
                      <span>{classItem.day}</span>
                      <span>Capacity: {classItem.capacity}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {classItem.assigned && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Currently Assigned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Assignment Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Selected Classes:</span>
              <span className="font-medium text-blue-900 ml-2">{selectedClasses.length}</span>
            </div>
            <div>
              <span className="text-blue-700">Total Hours:</span>
              <span className="font-medium text-blue-900 ml-2">{selectedClasses.length * 1.5}h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <SmartButton
          variant="secondary"
          size="sm"
          onClick={handleClose}
          disabled={loading}
        >
          <FiX className="h-4 w-4 mr-2" />
          Cancel
        </SmartButton>
        
        <SmartButton
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          loading={loading}
        >
          <FiSave className="h-4 w-4 mr-2" />
          {loading ? 'Assigning...' : 'Assign Classes'}
        </SmartButton>
      </div>
    </ColorfulModalUI>
  );
} 