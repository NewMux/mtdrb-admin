import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';

interface Class {
  id: string;
  name: string;
  description?: string;
  type: string;
  trainer_id?: string;
  trainer_name?: string;
  start_time: string;
  end_time: string;
  date: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  capacity: number;
  enrolled_count: number;
  waitlist_count: number;
  location?: string;
  room_id?: string;
  status: 'active' | 'cancelled' | 'completed' | 'full';
  created_at: string;
  updated_at: string;
}

interface Trainer {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  availability: any[];
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
}

interface AIRecommendation {
  id: string;
  type: 'scheduling' | 'capacity' | 'trainer' | 'location' | 'timing';
  title: string;
  description: string;
  confidence: number;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

interface ValidationError {
  field: string;
  message: string;
}

type ModalType = 'add' | 'edit' | 'delete' | 'view' | 'schedule' | 'assign' | 'waitlist' | 'cancel' | 'export' | 'settings' | null;

interface UseSmartClassModalProps {
  classId?: string;
  isPro?: boolean;
}

export const useSmartClassModal = ({ classId, isPro = false }: UseSmartClassModalProps) => {
  const [classData, setClassData] = useState<Class | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isValid, setIsValid] = useState(false);
  
  // Modal state management
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch class data
  const fetchClass = async () => {
    if (!classId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          trainer:trainers(name, email, specialties),
          room:rooms(name, capacity, equipment)
        `)
        .eq('id', classId)
        .single();

      if (error) throw error;
      setClassData(data);
    } catch (error) {
      console.error('Error fetching class:', error);
      toast.error('Failed to fetch class data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch trainers
  const fetchTrainers = async () => {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      setTrainers(data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  // Check for conflicts
  const checkConflicts = async (trainerId: string, startTime: string, endTime: string, date: string, excludeClassId?: string) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('date', date)
        .neq('id', excludeClassId || '');

      if (error) throw error;
      
      // Filter for time conflicts manually since overlaps() might not be available
      const conflictingClasses = data?.filter(classItem => {
        const classStart = new Date(`2000-01-01T${classItem.start_time}`);
        const classEnd = new Date(`2000-01-01T${classItem.end_time}`);
        const newStart = new Date(`2000-01-01T${startTime}`);
        const newEnd = new Date(`2000-01-01T${endTime}`);
        
        return (newStart < classEnd && newEnd > classStart);
      }) || [];
      
      setConflicts(conflictingClasses);
      return conflictingClasses.length > 0;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return false;
    }
  };

  // Generate AI recommendations
  const generateRecommendations = async (classData?: Partial<Class>) => {
    if (!isPro) return;

    const data = classData || classData;
    if (!data) return;

    // Mock AI recommendations based on class data
    const mockRecommendations: AIRecommendation[] = [];

    // Scheduling recommendations
    if (data.capacity && data.enrolled_count && data.enrolled_count / data.capacity > 0.8) {
      mockRecommendations.push({
        id: '1',
        type: 'capacity',
        title: 'High Demand Class',
        description: 'This class is 80% full. Consider adding more sessions or increasing capacity.',
        confidence: 0.85,
        action: 'Add more sessions',
        priority: 'high'
      });
    }

    // Timing recommendations
    if (data.start_time) {
      const hour = new Date(`2000-01-01T${data.start_time}`).getHours();
      if (hour < 8 || hour > 18) {
        mockRecommendations.push({
          id: '2',
          type: 'timing',
          title: 'Off-Peak Time',
          description: 'This time slot has lower attendance. Consider moving to peak hours (9 AM - 6 PM).',
          confidence: 0.78,
          action: 'Adjust time',
          priority: 'medium'
        });
      }
    }

    // Trainer recommendations
    if (!data.trainer_id) {
      mockRecommendations.push({
        id: '3',
        type: 'trainer',
        title: 'Assign Trainer',
        description: 'This class has no trainer assigned. Consider assigning based on class type.',
        confidence: 0.92,
        action: 'Assign trainer',
        priority: 'high'
      });
    }

    // Location recommendations
    if (!data.room_id) {
      mockRecommendations.push({
        id: '4',
        type: 'location',
        title: 'Select Room',
        description: 'No room assigned. Choose an appropriate room based on class type and capacity.',
        confidence: 0.88,
        action: 'Assign room',
        priority: 'medium'
      });
    }

    setRecommendations(mockRecommendations);
  };

  // Validate individual field
  const validateField = (field: string, value: any): ValidationError | null => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return { field, message: 'Class name must be at least 2 characters' };
        }
        break;
      case 'type':
        if (!value) {
          return { field, message: 'Please select a class type' };
        }
        break;
      case 'trainer_id':
        if (!value) {
          return { field, message: 'Please select a trainer' };
        }
        break;
      case 'start_time':
        if (!value) {
          return { field, message: 'Please select a start time' };
        }
        break;
      case 'end_time':
        if (!value) {
          return { field, message: 'Please select an end time' };
        }
        break;
      case 'date':
        if (!value) {
          return { field, message: 'Please select a date' };
        }
        break;
      case 'capacity':
        if (!value || value < 1) {
          return { field, message: 'Capacity must be at least 1' };
        }
        break;
    }
    return null;
  };

  // Validate entire form
  const validateForm = (formData: Partial<Class>): boolean => {
    const newErrors: ValidationError[] = [];
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof Class]);
      if (error) {
        newErrors.push(error);
      }
    });
    
    setErrors(newErrors);
    setIsValid(newErrors.length === 0);
    return newErrors.length === 0;
  };

  // Save class
  const saveClass = async (classData: Partial<Class>): Promise<boolean> => {
    if (!validateForm(classData)) {
      return false;
    }

    setLoading(true);
    try {
      if (classId) {
        // Update existing class
        const { error } = await supabase
          .from('classes')
          .update(classData)
          .eq('id', classId);

        if (error) throw error;
        toast.success('Class updated successfully');
      } else {
        // Create new class
        const { error } = await supabase
          .from('classes')
          .insert([classData]);

        if (error) throw error;
        toast.success('Class created successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving class:', error);
      toast.error('Failed to save class');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete class
  const deleteClass = async (): Promise<boolean> => {
    if (!classId) return false;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;
      toast.success('Class deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  // Get popular time slots
  const getPopularTimeSlots = async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('start_time, enrolled_count')
        .gte('enrolled_count', 10)
        .order('enrolled_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      return data?.map(c => c.start_time) || [];
    } catch (error) {
      console.error('Error fetching popular time slots:', error);
      return [];
    }
  };

  // Modal management functions
  const openModal = (modalType: ModalType, classItem?: Class) => {
    setActiveModal(modalType);
    setSelectedClass(classItem || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedClass(null);
  };

  const handleModalSuccess = () => {
    closeModal();
    // Trigger refresh of data
    window.location.reload();
  };

  // Initialize data
  useEffect(() => {
    fetchTrainers();
    fetchRooms();
    if (classId) {
      fetchClass();
    }
  }, [classId]);

  return {
    // Existing data and functions
    classData,
    trainers,
    rooms,
    loading,
    errors,
    recommendations,
    conflicts,
    isValid,
    
    // Modal state management
    activeModal,
    selectedClass,
    deleteLoading,
    
    // Data fetching
    fetchClass,
    fetchTrainers,
    fetchRooms,
    
    // Validation and conflict checking
    checkConflicts,
    validateForm,
    validateField,
    
    // CRUD operations
    saveClass,
    deleteClass,
    
    // AI and recommendations
    generateRecommendations,
    getPopularTimeSlots,
    
    // Modal management
    openModal,
    closeModal,
    handleModalSuccess
  };
}; 