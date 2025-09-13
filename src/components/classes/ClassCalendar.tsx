import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  FiPlus, 
  FiEdit, 
  FiX, 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiUsers,
  FiBookmark,
  FiCopy,
  FiUserPlus,
  FiAlertCircle,
  FiSettings,
  FiGrid,
  FiList,
  FiTrash2,
  FiFileText
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import SmartModal from './modals/SmartModal';
import { SmartButton } from '../ui/DesignSystem';
import './FullCalendar.css';

// Enhanced mock data with more details - using current dates
const getCurrentWeekDates = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const monday = new Date(today);
  monday.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Get Monday
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const currentWeekDates = getCurrentWeekDates();

const mockClasses = [
  {
    id: '1',
    title: 'HIIT with Ahmed',
    start: `${currentWeekDates[0].toISOString().split('T')[0]}T08:00:00`,
    end: `${currentWeekDates[0].toISOString().split('T')[0]}T09:00:00`,
    backgroundColor: '#ff3b30',
    borderColor: '#ff453a',
    trainer: 'Ahmed',
    type: 'HIIT',
    capacity: 15,
    enrolled: 12,
    className: 'hiit',
    branch: 'Main Branch',
    room: 'Studio A',
    description: 'High-intensity interval training for maximum results'
  },
  {
    id: '2',
    title: 'Yoga with Lina',
    start: `${currentWeekDates[0].toISOString().split('T')[0]}T18:00:00`,
    end: `${currentWeekDates[0].toISOString().split('T')[0]}T19:00:00`,
    backgroundColor: '#34c759',
    borderColor: '#30d158',
    trainer: 'Lina',
    type: 'Yoga',
    capacity: 20,
    enrolled: 18,
    className: 'yoga',
    branch: 'Main Branch',
    room: 'Studio B',
    description: 'Relaxing yoga session for mind and body'
  },
  {
    id: '3',
    title: 'Strength Training',
    start: `${currentWeekDates[1].toISOString().split('T')[0]}T10:00:00`,
    end: `${currentWeekDates[1].toISOString().split('T')[0]}T11:00:00`,
    backgroundColor: '#007aff',
    borderColor: '#0a84ff',
    trainer: 'Mike',
    type: 'Strength',
    capacity: 12,
    enrolled: 10,
    className: 'strength',
    branch: 'Downtown',
    room: 'Weight Room',
    description: 'Build strength and muscle with proper form'
  },
  {
    id: '4',
    title: 'Pilates Core',
    start: `${currentWeekDates[2].toISOString().split('T')[0]}T14:00:00`,
    end: `${currentWeekDates[2].toISOString().split('T')[0]}T15:00:00`,
    backgroundColor: '#af52de',
    borderColor: '#bf5af2',
    trainer: 'Sarah',
    type: 'Pilates',
    capacity: 15,
    enrolled: 14,
    className: 'pilates',
    branch: 'Main Branch',
    room: 'Studio C',
    description: 'Core strengthening and flexibility training'
  },
  {
    id: '5',
    title: 'Cardio Blast',
    start: `${currentWeekDates[3].toISOString().split('T')[0]}T16:00:00`,
    end: `${currentWeekDates[3].toISOString().split('T')[0]}T17:00:00`,
    backgroundColor: '#ff9500',
    borderColor: '#ff9f0a',
    trainer: 'Mike',
    type: 'Cardio',
    capacity: 20,
    enrolled: 16,
    className: 'cardio',
    branch: 'Downtown',
    room: 'Cardio Studio',
    description: 'High-energy cardio workout'
  },
  {
    id: '6',
    title: 'Spinning Class',
    start: `${currentWeekDates[4].toISOString().split('T')[0]}T19:00:00`,
    end: `${currentWeekDates[4].toISOString().split('T')[0]}T20:00:00`,
    backgroundColor: '#5856d6',
    borderColor: '#5e5ce6',
    trainer: 'Lina',
    type: 'Spinning',
    capacity: 25,
    enrolled: 22,
    className: 'spinning',
    branch: 'Main Branch',
    room: 'Spinning Studio',
    description: 'Indoor cycling workout'
  }
];

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  trainer: string;
  type: string;
  capacity: number;
  enrolled: number;
  className: string;
  branch: string;
  room: string;
  description: string;
}

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: string;
}

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
}

interface CalendarFilters {
  classType: string[];
  trainer: string[];
  branch: string[];
  timeOfDay: string[];
  search: string;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    trainer: '',
    type: '',
    startTime: selectedTime || '09:00',
    endTime: '10:00',
    capacity: 20,
    room: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    toast.success('Class created successfully!');
    onClose();
  };

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Class"
      subtitle="Schedule a new class for your members"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Class Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiCalendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Class Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Basic class details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter class title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Type</option>
                <option value="HIIT">HIIT</option>
                <option value="Yoga">Yoga</option>
                <option value="Strength">Strength</option>
                <option value="Pilates">Pilates</option>
                <option value="Cardio">Cardio</option>
                <option value="Spinning">Spinning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trainer *
              </label>
              <select
                value={formData.trainer}
                onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Trainer</option>
                <option value="Ahmed">Ahmed</option>
                <option value="Lina">Lina</option>
                <option value="Mike">Mike</option>
                <option value="Sarah">Sarah</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Studio A"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiClock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Schedule
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Class timing and location
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Capacity *
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FiFileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Description
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Additional class details
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Describe the class..."
            />
          </div>
        </div>
      </form>

      <div className="flex justify-end space-x-3 mt-6">
        <SmartButton variant="secondary" onClick={onClose}>
          Cancel
        </SmartButton>
        <SmartButton variant="primary" onClick={handleSubmit}>
          Create Class
        </SmartButton>
      </div>
    </SmartModal>
  );
};

const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    trainer: event?.trainer || '',
    type: event?.type || '',
    startTime: event ? new Date(event.start).toTimeString().slice(0, 5) : '09:00',
    endTime: event ? new Date(event.end).toTimeString().slice(0, 5) : '10:00',
    capacity: event?.capacity || 20,
    room: event?.room || '',
    description: event?.description || ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        trainer: event.trainer,
        type: event.type,
        startTime: new Date(event.start).toTimeString().slice(0, 5),
        endTime: new Date(event.end).toTimeString().slice(0, 5),
        capacity: event.capacity,
        room: event.room,
        description: event.description
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    toast.success('Class updated successfully!');
    onClose();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'duplicate':
        toast.success('Class duplicated!');
        break;
      case 'delete':
        toast.success('Class deleted!');
        onClose();
        break;
      case 'cancel':
        toast.success('Class cancelled!');
        break;
    }
  };

  if (!event) return null;

  return (
    <SmartModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Class"
      subtitle={`Modify ${event.title} details`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Class Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiCalendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Class Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Basic class details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Type</option>
                <option value="HIIT">HIIT</option>
                <option value="Yoga">Yoga</option>
                <option value="Strength">Strength</option>
                <option value="Pilates">Pilates</option>
                <option value="Cardio">Cardio</option>
                <option value="Spinning">Spinning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trainer *
              </label>
              <select
                value={formData.trainer}
                onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Trainer</option>
                <option value="Ahmed">Ahmed</option>
                <option value="Lina">Lina</option>
                <option value="Mike">Mike</option>
                <option value="Sarah">Sarah</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Studio A"
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiClock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Schedule
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Class timing and location
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Capacity *
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FiFileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Description
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Additional class details
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Describe the class..."
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FiSettings className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Common class operations
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <SmartButton
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAction('duplicate')}
            >
              <FiCopy className="w-4 h-4 mr-2" />
              Duplicate
            </SmartButton>
            <SmartButton
              variant="warning"
              size="sm"
              onClick={() => handleQuickAction('cancel')}
            >
              <FiX className="w-4 h-4 mr-2" />
              Cancel Class
            </SmartButton>
            <SmartButton
              variant="danger"
              size="sm"
              onClick={() => handleQuickAction('delete')}
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Delete
            </SmartButton>
          </div>
        </div>
      </form>

      <div className="flex justify-end space-x-3 mt-6">
        <SmartButton variant="secondary" onClick={onClose}>
          Cancel
        </SmartButton>
        <SmartButton variant="primary" onClick={handleSubmit}>
          Update Class
        </SmartButton>
      </div>
    </SmartModal>
  );
};

const ClassCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(mockClasses);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [view, setView] = useState<'timeGridWeek' | 'timeGridDay' | 'dayGridMonth'>('timeGridWeek');
  const [filters, setFilters] = useState<CalendarFilters>({
    classType: [],
    trainer: [],
    branch: [],
    timeOfDay: [],
    search: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef<any>(null);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !event.trainer.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Class type filter
      if (filters.classType.length > 0 && !filters.classType.includes(event.type.toLowerCase())) {
        return false;
      }

      // Trainer filter - match by lowercase
      if (filters.trainer.length > 0 && !filters.trainer.includes(event.trainer.toLowerCase())) {
        return false;
      }

      // Branch filter
      if (filters.branch.length > 0 && !filters.branch.includes(event.branch)) {
        return false;
      }

      // Time of day filter
      if (filters.timeOfDay.length > 0) {
        const hour = new Date(event.start).getHours();
        const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
        if (!filters.timeOfDay.includes(timeOfDay)) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters]);

  // Event handlers
  const handleEventClick = useCallback((info: any) => {
    const event = events.find(e => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsEditModalOpen(true);
    }
  }, [events]);

  const handleDateClick = useCallback((info: any) => {
    setSelectedDate(info.date);
    setSelectedTime(info.dateStr.split('T')[1].slice(0, 5));
    setIsCreateModalOpen(true);
  }, []);

  const handleEventDrop = useCallback((info: any) => {
    const { event } = info;
    const updatedEvents = events.map(e => 
      e.id === event.id 
        ? { ...e, start: event.startStr, end: event.endStr }
        : e
    );
    setEvents(updatedEvents);
    toast.success('Class rescheduled successfully!');
  }, [events]);

  const handleEventResize = useCallback((info: any) => {
    const { event } = info;
    const updatedEvents = events.map(e => 
      e.id === event.id 
        ? { ...e, start: event.startStr, end: event.endStr }
        : e
    );
    setEvents(updatedEvents);
    toast.success('Class duration updated!');
  }, [events]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading state simulation
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
        <div className="text-xs text-gray-400 p-2">Debug: ClassCalendar component rendered</div>
        {/* Google Calendar Style Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation and View Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => calendarRef.current?.getApi().prev()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                              <button
                onClick={() => {
                  calendarRef.current?.getApi().today();
                  // Update the displayed date
                  const today = new Date();
                  const monthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  // You could add state to track the current month/year if needed
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Today
              </button>
                <button
                  onClick={() => calendarRef.current?.getApi().next()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              <span className="text-xl font-semibold text-gray-900 dark:text-white">July 2025</span>
            </div>

            {/* Right side - View Toggle and Create Button */}
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => {
                    setView('timeGridDay');
                    calendarRef.current?.getApi().changeView('timeGridDay');
                  }}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    view === 'timeGridDay' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => {
                    setView('timeGridWeek');
                    calendarRef.current?.getApi().changeView('timeGridWeek');
                  }}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    view === 'timeGridWeek' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => {
                    setView('dayGridMonth');
                    calendarRef.current?.getApi().changeView('dayGridMonth');
                  }}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    view === 'dayGridMonth' 
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Month
                </button>
              </div>


            </div>
          </div>

          {/* Filters Bar */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <select
                value={filters.classType.join(',')}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  classType: e.target.value ? e.target.value.split(',') : [] 
                }))}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="hiit">HIIT</option>
                <option value="yoga">Yoga</option>
                <option value="pilates">Pilates</option>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="spinning">Spinning</option>
              </select>
              
              <select
                value={filters.trainer.join(',')}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  trainer: e.target.value ? e.target.value.split(',') : [] 
                }))}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Trainers</option>
                <option value="ahmed">Ahmed</option>
                <option value="lina">Lina</option>
                <option value="mike">Mike</option>
                <option value="sarah">Sarah</option>
              </select>
              
              <input
                type="text"
                placeholder="Search classes..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center">
              <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No classes scheduled
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Click on any time slot to add a new class
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
              >
                Add Your First Class
              </button>
            </div>
                    ) : (
            <div className="h-full w-full">
              <div className="text-sm text-gray-500 mb-2">Debug: {filteredEvents.length} events loaded</div>
              <div className="h-full">
                <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView={view}
              editable={true}
              selectable={true}
              events={filteredEvents}
              headerToolbar={false}
              height="100%"
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
              eventDisplay="block"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              eventClassNames="rounded-lg border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              dayCellClassNames="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              nowIndicator={false}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                startTime: '06:00',
                endTime: '22:00',
              }}
              businessHoursClassNames="bg-gray-50 dark:bg-gray-800"
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              slotLabelClassNames="text-gray-600 dark:text-gray-400 font-medium"
              dayHeaderClassNames="text-gray-900 dark:text-white font-semibold"
              titleFormat={{
                month: 'long',
                year: 'numeric',
              }}
              titleClassNames="text-gray-900 dark:text-white font-bold text-lg"
              buttonText={{
                today: 'Today',
                week: 'Week',
                day: 'Day',
              }}
              buttonClassNames="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm font-medium transition-colors"
              buttonActiveClassNames="bg-blue-500 text-white border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        selectedDate={selectedDate || undefined}
        selectedTime={selectedTime}
      />

      <EditClassModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        event={selectedEvent}
      />
    </>
  );
};

export default ClassCalendar;
