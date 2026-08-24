import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
// Removed mock data - using real data from Supabase

interface ClassConflict {
  id: string;
  start_time: string;
  end_time: string;
  trainer_id: string;
}

export interface SmartClass {
  id: string;
  name: string;
  description?: string;
  type: string;
  trainer_id?: string;
  trainer_name?: string;
  start_time: string;
  end_time: string;
  date: string;
  recurrence?: "none" | "daily" | "weekly" | "biweekly" | "monthly";
  capacity: number;
  enrolled_count: number;
  waitlist_count: number;
  location?: string;
  room_id?: string;
  status: "active" | "cancelled" | "completed" | "full";
  created_at: string;
  updated_at: string;
  price?: number;
  cost?: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface SmartTrainer {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  availability: unknown[];
}

export interface SmartRoom {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
}

export interface SmartRecommendation {
  id: string;
  type:
    | "scheduling"
    | "capacity"
    | "trainer"
    | "location"
    | "timing"
    | "engagement"
    | "revenue";
  title: string;
  description: string;
  confidence: number;
  action: string;
  priority: "high" | "medium" | "low";
}

export interface ValidationError {
  field: string;
  message: string;
}

type ModalType =
  | "add"
  | "edit"
  | "delete"
  | "view"
  | "schedule"
  | "assign"
  | "waitlist"
  | "cancel"
  | "export"
  | "settings"
  | null;

interface UseSmartClassModalProps {
  classId?: string;
  isPro?: boolean;
}

export interface UseSmartClassModalReturn {
  classData: SmartClass | null;
  trainers: SmartTrainer[];
  rooms: SmartRoom[];
  loading: boolean;
  errors: ValidationError[];
  recommendations: SmartRecommendation[];
  conflicts: ClassConflict[];
  isValid: boolean;
  activeModal: ModalType;
  selectedClass: SmartClass | null;
  deleteLoading: boolean;
  fetchClass: () => Promise<void>;
  fetchTrainers: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  createRoom: (name: string, capacity: number) => Promise<SmartRoom | null>;
  checkConflicts: (
    trainerId: string,
    startTime: string,
    endTime: string,
    date: string,
    excludeClassId?: string,
  ) => Promise<boolean>;
  validateForm: (formData: Partial<SmartClass>) => boolean;
  validateField: (field: string, value: unknown) => ValidationError | null;
  saveClass: (classData: Partial<SmartClass>) => Promise<boolean>;
  deleteClass: () => Promise<boolean>;
  generateRecommendations: (classData?: Partial<SmartClass>) => Promise<void>;
  getPopularTimeSlots: () => Promise<string[]>;
  openModal: (modalType: ModalType, classItem?: SmartClass) => void;
  closeModal: () => void;
  handleModalSuccess: () => void;
}

export const useSmartClassModal = ({
  classId,
  isPro = false,
}: UseSmartClassModalProps): UseSmartClassModalReturn => {
  const [classData, setClassData] = useState<SmartClass | null>(null);
  const [trainers, setTrainers] = useState<SmartTrainer[]>([]);
  const [rooms, setRooms] = useState<SmartRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>(
    [],
  );
  const [conflicts, setConflicts] = useState<ClassConflict[]>([]);
  const [isValid, setIsValid] = useState(false);

  // Modal state management
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedClass, setSelectedClass] = useState<SmartClass | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch class data
  const fetchClass = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    try {
      // Fetch class from Supabase
      const { data: classData, error } = await supabase
        .from("classes")
        .select(`
          *,
          trainers(first_name, last_name, email)
        `)
        .eq("id", classId)
        .single();

      if (error) throw error;
      if (!classData) throw new Error("Class not found");

      // Get booking count
      const { count: bookingCount } = await supabase
        .from("class_bookings")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classId)
        .eq("status", "booked");

      // Get waitlist count
      const { count: waitlistCount } = await supabase
        .from("class_waitlist")
        .select("*", { count: "exact", head: true })
        .eq("class_id", classId);

      // Transform to match expected SmartClass interface
      const transformedClass: SmartClass = {
        id: classData.id,
        name: classData.name,
        type: classData.metadata?.type || "",
        trainer_name: classData.trainers
          ? `${classData.trainers.first_name || ''} ${classData.trainers.last_name || ''}`.trim()
          : "",
        start_time: new Date(classData.start_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        end_time: new Date(classData.end_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        date: new Date(classData.start_time).toISOString().split('T')[0],
        capacity: classData.capacity,
        enrolled_count: bookingCount || 0,
        waitlist_count: waitlistCount || 0,
        status: classData.status as "active" | "cancelled" | "completed" | "full",
        created_at: classData.created_at,
        updated_at: classData.updated_at || classData.created_at,
        description: classData.description || "",
        location: classData.room || "",
        room_id: classData.room || "",
        trainer_id: classData.trainer_id,
        recurrence: classData.metadata?.recurrence_rule || "none",
        price: classData.price || 0,
        cost: classData.metadata?.cost || 0,
        color: classData.metadata?.color,
        metadata: classData.metadata || {},
      };

      setClassData(transformedClass);
    } catch (error) {
      console.error("Error fetching class:", error);
      toast.error("Failed to fetch class data");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  // Fetch trainers
  const fetchTrainers = useCallback(async () => {
    try {
      // Fetch trainers from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();
        tenantId = membershipData?.tenant_id;
      }

      if (tenantId) {
        const { data, error } = await supabase
          .from("trainers")
          .select("id, first_name, last_name, email, specialties")
          .eq("tenant_id", tenantId)
          .eq("status", "active");

        if (error) throw error;

        const trainers: SmartTrainer[] = (data || []).map((t) => ({
          id: t.id,
          name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.email,
          email: t.email,
          specialties: t.specialties || [],
          availability: []
        }));
        
        setTrainers(trainers);
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
    }
  }, []);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();
        tenantId = membershipData?.tenant_id;
      }

      if (!tenantId) {
        setRooms([]);
        return;
      }

      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, capacity, equipment")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;

      setRooms(
        (data || []).map((room) => ({
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          equipment: room.equipment || [],
        })),
      );
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
    }
  }, []);

  // Create a room (admin-only per RLS; callers should surface the resulting
  // error to non-admins rather than assume this always succeeds)
  const createRoom = useCallback(
    async (name: string, capacity: number): Promise<SmartRoom | null> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        let tenantId = user.user_metadata?.tenant_id;
        if (!tenantId) {
          const { data: membershipData } = await supabase
            .from("memberships")
            .select("tenant_id")
            .eq("user_id", user.id)
            .single();
          tenantId = membershipData?.tenant_id;
        }
        if (!tenantId) return null;

        const { data, error } = await supabase
          .from("rooms")
          .insert({ tenant_id: tenantId, name, capacity })
          .select("id, name, capacity, equipment")
          .single();

        if (error) throw error;

        const room: SmartRoom = {
          id: data.id,
          name: data.name,
          capacity: data.capacity,
          equipment: data.equipment || [],
        };
        setRooms((prev) => [...prev, room].sort((a, b) => a.name.localeCompare(b.name)));
        return room;
      } catch (error) {
        console.error("Error creating room:", error);
        toast.error("Failed to create room");
        return null;
      }
    },
    [],
  );

  // Check for conflicts
  const checkConflicts = useCallback(async (
    trainerId: string,
    startTime: string,
    endTime: string,
    date: string,
    excludeClassId?: string,
  ) => {
    try {
      // Fetch conflicting classes from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      let tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();
        tenantId = membershipData?.tenant_id;
      }

      if (!tenantId) return false;

      const classDateStart = new Date(`${date}T00:00:00`);
      const classDateEnd = new Date(`${date}T23:59:59`);

      const { data: classes, error } = await supabase
        .from("classes")
        .select("id, start_time, end_time, trainer_id")
        .eq("tenant_id", tenantId)
        .eq("trainer_id", trainerId)
        .gte("start_time", classDateStart.toISOString())
        .lte("start_time", classDateEnd.toISOString())
        .neq("status", "cancelled");

      if (error) throw error;

      const conflictingClasses = (classes || []).filter((classItem) => {
        if (excludeClassId && classItem.id === excludeClassId) return false;
        
        const classStart = new Date(classItem.start_time);
        const classEnd = new Date(classItem.end_time);
        const newStart = new Date(`${date}T${startTime}`);
        const newEnd = new Date(`${date}T${endTime}`);

        return newStart < classEnd && newEnd > classStart;
      });

      setConflicts(conflictingClasses);
      return conflictingClasses.length > 0;
    } catch (error) {
      console.error("Error checking conflicts:", error);
      return false;
    }
  }, []);

  // Generate Smart recommendations using real data
  const generateRecommendations = useCallback(async (classData?: Partial<SmartClass>) => {
    if (!isPro) return;

    try {
      // Get tenant ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!membership?.tenant_id) return;

      // Get real recommendations from service
      const { getClassRecommendations } = await import("../services/smartSuggestionsService");
      const realRecommendations = await getClassRecommendations(
        classData?.id,
        membership.tenant_id
      );

      // If we have class data, also check for basic validations
      if (classData) {
        // Add basic rule-based recommendations if not already covered
        const hasCapacityRec = realRecommendations.some((r) => r.type === "capacity");
        const hasTrainerRec = realRecommendations.some((r) => r.type === "trainer");
        const hasLocationRec = realRecommendations.some((r) => r.type === "location");

        if (
          !hasCapacityRec &&
          classData.capacity &&
          classData.enrolled_count &&
          classData.enrolled_count / classData.capacity > 0.8
        ) {
          realRecommendations.push({
            id: `capacity-${classData.id || "new"}`,
            type: "capacity",
            title: "High Demand Class",
            description:
              "This class is 80% full. Consider adding more sessions or increasing capacity.",
            confidence: 0.85,
            action: "Add more sessions",
            priority: "high",
          });
        }

        if (!hasTrainerRec && !classData.trainer_id) {
          realRecommendations.push({
            id: `trainer-${classData.id || "new"}`,
            type: "trainer",
            title: "Assign Trainer",
            description:
              "This class has no trainer assigned. Consider assigning based on class type.",
            confidence: 0.92,
            action: "Assign trainer",
            priority: "high",
          });
        }

        if (!hasLocationRec && !classData.room_id) {
          realRecommendations.push({
            id: `location-${classData.id || "new"}`,
            type: "location",
            title: "Select Room",
            description:
              "No room assigned. Choose an appropriate room based on class type and capacity.",
            confidence: 0.88,
            action: "Assign room",
            priority: "medium",
          });
        }
      }

      setRecommendations(realRecommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      // Fallback to empty array on error
      setRecommendations([]);
    }
  }, [isPro]);

  // Validate individual field
  const validateField = useCallback((field: string, value: unknown): ValidationError | null => {
    switch (field) {
      case "name":
        if (!value || (typeof value === "string" && value.trim().length < 2)) {
          return { field, message: "Class name must be at least 2 characters" };
        }
        break;
      case "type":
        if (!value) {
          return { field, message: "Please select a class type" };
        }
        break;
      case "trainer_id":
        if (!value) {
          return { field, message: "Please select a trainer" };
        }
        break;
      case "start_time":
        if (!value) {
          return { field, message: "Please select a start time" };
        }
        break;
      case "end_time":
        if (!value) {
          return { field, message: "Please select an end time" };
        }
        break;
      case "date":
        if (!value) {
          return { field, message: "Please select a date" };
        }
        break;
      case "capacity":
        if (!value || (typeof value === "number" && value < 1)) {
          return { field, message: "Capacity must be at least 1" };
        }
        break;
    }
    return null;
  }, []);

  // Validate entire form
  const validateForm = useCallback((formData: Partial<SmartClass>): boolean => {
    const newErrors: ValidationError[] = [];

    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field as keyof SmartClass]);
      if (error) {
        newErrors.push(error);
      }
    });

    setErrors(newErrors);
    setIsValid(newErrors.length === 0);
    return newErrors.length === 0;
  }, [validateField]);

  // Save class
  const saveClass = useCallback(async (classData: Partial<SmartClass>): Promise<boolean> => {
    if (!validateForm(classData)) {
      return false;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return false;
      }

      let tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();
        tenantId = membershipData?.tenant_id;
      }

      if (!tenantId) {
        toast.error("No workspace found. Please complete onboarding.");
        return false;
      }

      const dateVal = classData.date;
      const startVal = classData.start_time;
      const endVal = classData.end_time;

      const startIso = new Date(`${dateVal}T${startVal}:00`).toISOString();
      const endIso = new Date(`${dateVal}T${endVal}:00`).toISOString();

      // type/recurrence/color aren't real columns on `classes` - nest under
      // metadata, merging with whatever's already there (e.g. `cost`, the
      // Advanced Settings tab's fields) so we don't clobber it on save.
      let existingMetadata: Record<string, unknown> = {};
      if (classId) {
        const { data: existingRow } = await supabase
          .from("classes")
          .select("metadata")
          .eq("id", classId)
          .single();
        existingMetadata = (existingRow?.metadata as Record<string, unknown>) || {};
      }

      const dbPayload = {
        tenant_id: tenantId,
        name: classData.name,
        description: classData.description || "",
        trainer_id: classData.trainer_id,
        start_time: startIso,
        end_time: endIso,
        capacity: classData.capacity,
        status: classData.status || "active",
        room: classData.room_id || null,
        metadata: {
          ...existingMetadata,
          type: classData.type,
          recurrence_rule: classData.recurrence || "none",
          color: classData.color || "#0071E3",
        },
      };

      if (classId) {
        // Update existing class
        const { error } = await supabase
          .from("classes")
          .update(dbPayload)
          .eq("id", classId);
        if (error) throw error;
        toast.success("Class updated successfully");
      } else {
        // Create new class
        const { error } = await supabase
          .from("classes")
          .insert(dbPayload);
        if (error) throw error;
        toast.success("Class created successfully");
      }

      return true;
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error("Failed to save class");
      return false;
    } finally {
      setLoading(false);
    }
  }, [classId, validateForm]);

  // Delete class
  const deleteClass = useCallback(async (): Promise<boolean> => {
    if (!classId) return false;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);
      if (error) throw error;
      toast.success("Class deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
      return false;
    } finally {
      setDeleteLoading(false);
    }
  }, [classId]);

  // Get popular time slots
  const getPopularTimeSlots = useCallback(async (): Promise<string[]> => {
    try {
      // Fetch popular time slots from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("tenant_id")
          .eq("user_id", user.id)
          .single();
        tenantId = membershipData?.tenant_id;
      }

      if (!tenantId) return [];

      const { data: classes, error } = await supabase
        .from("classes")
        .select("start_time")
        .eq("tenant_id", tenantId)
        .order("start_time", { ascending: true })
        .limit(10);

      if (error) throw error;

      const popularSlots = (classes || [])
        .map(c => new Date(c.start_time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }))
        .filter((slot, index, arr) => arr.indexOf(slot) === index) // Remove duplicates
        .slice(0, 5);
      
      return popularSlots;
    } catch (error) {
      console.error("Error fetching popular time slots:", error);
      return [];
    }
  }, []);

  // Modal management functions
  const openModal = useCallback((modalType: ModalType, classItem?: SmartClass) => {
    setActiveModal(modalType);
    setSelectedClass(classItem || null);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedClass(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    closeModal();
    // Trigger refresh of data
    window.location.reload();
  }, [closeModal]);

  // Initialize data
  useEffect(() => {
    fetchTrainers();
    fetchRooms();
    if (classId) {
      fetchClass();
    }
  }, [classId, fetchTrainers, fetchRooms, fetchClass]);

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
    createRoom,

    // Validation and conflict checking
    checkConflicts,
    validateForm,
    validateField,

    // CRUD operations
    saveClass,
    deleteClass,

    // Smart and recommendations
    generateRecommendations,
    getPopularTimeSlots,

    // Modal management
    openModal,
    closeModal,
    handleModalSuccess,
  };
};
