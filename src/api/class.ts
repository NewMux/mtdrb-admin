import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { Class, ClassBooking } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface ClassStats {
  totalClasses: number;
  totalCapacity: number;
  bookedSpots: number;
  upcomingClasses: number;
  revenue: number;
  utilization: number;
}

export interface ClassAnalyticsData {
  popularTimes: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  classTypes: {
    strength: number;
    cardio: number;
    yoga: number;
    other: number;
  };
  classRating: {
    average: number;
    totalReviews: number;
  };
  weeklyTrends: Array<{
    week: string;
    totalClasses: number;
    attendance: number;
  }>;
  capacityStats: {
    thisWeek: number;
    totalCapacity: number;
  };
  revenueGrowth: number;
}

export interface ClassWithBookings extends Class {
  bookings?: ClassBooking[];
  bookedCount?: number;
  waitlistCount?: number;
  trainer_name?: string;
}

// ============================================================================
// CORE CRUD OPERATIONS
// ============================================================================

export const getAllClasses = async (): Promise<Class[]> => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select(
        `
        *,
        trainers(first_name, last_name, email)
      `,
      )
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching classes:", error);
    toast.error("Failed to load classes");
    return [];
  }
};

export const getClassById = async (id: string): Promise<Class | null> => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select(
        `
        *,
        trainers(first_name, last_name, email)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching class:", error);
    toast.error("Failed to load class details");
    return null;
  }
};

export const createClass = async (
  classData: Omit<Class, "id" | "created_at">,
): Promise<Class | null> => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .insert(classData)
      .select()
      .single();

    if (error) throw error;
    toast.success("Class created successfully");
    return data;
  } catch (error) {
    console.error("Error creating class:", error);
    toast.error("Failed to create class");
    return null;
  }
};

export const updateClass = async (
  id: string,
  updates: Partial<Class>,
): Promise<Class | null> => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    toast.success("Class updated successfully");
    return data;
  } catch (error) {
    console.error("Error updating class:", error);
    toast.error("Failed to update class");
    return null;
  }
};

export const deleteClass = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("classes").delete().eq("id", id);

    if (error) throw error;
    toast.success("Class deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting class:", error);
    toast.error("Failed to delete class");
    return false;
  }
};

// ============================================================================
// BOOKINGS & ATTENDANCE
// ============================================================================

export const getClassBookings = async (
  classId: string,
): Promise<ClassBooking[]> => {
  try {
    const { data, error } = await supabase
      .from("class_bookings")
      .select(
        `
        *,
        members!inner(name, email, phone)
      `,
      )
      .eq("class_id", classId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching class bookings:", error);
    return [];
  }
};

export const getClassesWithBookings = async (): Promise<
  ClassWithBookings[]
> => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select(
        `
        *,
        trainers(first_name, last_name, email),
        class_bookings(count)
      `,
      )
      .order("start_time", { ascending: true });

    if (error) throw error;

    return (data || []).map((classItem) => ({
      ...classItem,
      bookedCount: classItem.class_bookings?.[0]?.count || 0,
      trainer_name: classItem.trainers 
        ? `${classItem.trainers.first_name || ''} ${classItem.trainers.last_name || ''}`.trim()
        : '',
    }));
  } catch (error) {
    console.error("Error fetching classes with bookings:", error);
    return [];
  }
};

export const bookClass = async (
  classId: string,
  memberId: string,
): Promise<ClassBooking | null> => {
  try {
    const { data, error } = await supabase
      .from("class_bookings")
      .insert({
        class_id: classId,
        member_id: memberId,
        status: "booked",
      })
      .select()
      .single();

    if (error) throw error;
    toast.success("Class booked successfully");
    return data;
  } catch (error) {
    console.error("Error booking class:", error);
    toast.error("Failed to book class");
    return null;
  }
};

export const cancelBooking = async (bookingId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("class_bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) throw error;
    toast.success("Booking cancelled successfully");
    return true;
  } catch (error) {
    console.error("Error cancelling booking:", error);
    toast.error("Failed to cancel booking");
    return false;
  }
};

export const markAttendance = async (
  bookingId: string,
  attended: boolean,
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("class_bookings")
      .update({ status: attended ? "attended" : "no-show" })
      .eq("id", bookingId);

    if (error) throw error;
    toast.success(`Attendance marked as ${attended ? "attended" : "no-show"}`);
    return true;
  } catch (error) {
    console.error("Error marking attendance:", error);
    toast.error("Failed to mark attendance");
    return false;
  }
};

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

export const getClassStats = async (): Promise<ClassStats> => {
  try {
    const { data: classes, error } = await supabase.from("classes").select("*");

    if (error) throw error;

    const now = new Date();
    const upcomingClasses =
      classes?.filter((c) => new Date(c.start_time) > now).length || 0;
    const totalClasses = classes?.length || 0;
    const totalCapacity =
      classes?.reduce((sum, c) => sum + (c.capacity || 0), 0) || 0;

    // Get booking stats
    const { data: bookings } = await supabase
      .from("class_bookings")
      .select("*")
      .eq("status", "booked");

    const bookedSpots = bookings?.length || 0;
    const utilization =
      totalCapacity > 0 ? (bookedSpots / totalCapacity) * 100 : 0;

    // Calculate revenue (assuming price field exists)
    const revenue = classes?.reduce((sum, c) => sum + (c.price || 0), 0) || 0;

    return {
      totalClasses,
      totalCapacity,
      bookedSpots,
      upcomingClasses,
      revenue,
      utilization: Math.round(utilization * 100) / 100,
    };
  } catch (error) {
    console.error("Error calculating class stats:", error);
    return {
      totalClasses: 0,
      totalCapacity: 0,
      bookedSpots: 0,
      upcomingClasses: 0,
      revenue: 0,
      utilization: 0,
    };
  }
};

export const getClassAnalytics = async (): Promise<ClassAnalyticsData> => {
  try {
    const { data: classes, error } = await supabase.from("classes").select("*");

    if (error) throw error;

    // Calculate popular times
    const popularTimes = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };

    classes?.forEach((classItem) => {
      const hour = new Date(classItem.start_time).getHours();
      if (hour >= 6 && hour < 12) popularTimes.morning++;
      else if (hour >= 12 && hour < 17) popularTimes.afternoon++;
      else if (hour >= 17 && hour < 22) popularTimes.evening++;
      else popularTimes.night++;
    });

    // Calculate class types (assuming type field exists)
    const classTypes = {
      strength:
        classes?.filter((c) => c.type?.toLowerCase().includes("strength"))
          .length || 0,
      cardio:
        classes?.filter((c) => c.type?.toLowerCase().includes("cardio"))
          .length || 0,
      yoga:
        classes?.filter((c) => c.type?.toLowerCase().includes("yoga")).length ||
        0,
      other:
        classes?.filter(
          (c) =>
            !c.type?.toLowerCase().includes("strength") &&
            !c.type?.toLowerCase().includes("cardio") &&
            !c.type?.toLowerCase().includes("yoga"),
        ).length || 0,
    };

    // Weekly trends (last 4 weeks)
    const weeklyTrends = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekClasses =
        classes?.filter((c) => {
          const classDate = new Date(c.start_time);
          return classDate >= weekStart && classDate <= weekEnd;
        }) || [];

      weeklyTrends.push({
        week: weekStart.toISOString().split("T")[0],
        totalClasses: weekClasses.length,
        attendance: weekClasses.length * 0.7, // Mock attendance rate
      });
    }

    return {
      popularTimes,
      classTypes,
      classRating: { average: 4.5, totalReviews: 120 }, // Mock data
      weeklyTrends,
      capacityStats: {
        thisWeek:
          classes?.filter((c) => {
            const classDate = new Date(c.start_time);
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return classDate >= weekStart && classDate <= weekEnd;
          }).length || 0,
        totalCapacity:
          classes?.reduce((sum, c) => sum + (c.capacity || 0), 0) || 0,
      },
      revenueGrowth: 12.5, // Mock growth percentage
    };
  } catch (error) {
    console.error("Error calculating class analytics:", error);
    return {
      popularTimes: { morning: 0, afternoon: 0, evening: 0, night: 0 },
      classTypes: { strength: 0, cardio: 0, yoga: 0, other: 0 },
      classRating: { average: 0, totalReviews: 0 },
      weeklyTrends: [],
      capacityStats: { thisWeek: 0, totalCapacity: 0 },
      revenueGrowth: 0,
    };
  }
};

// ============================================================================
// SEARCH & FILTERING
// ============================================================================

export const searchClasses = async (query: string): Promise<Class[]> => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select(
        `
        *,
        trainers(first_name, last_name, email)
      `,
      )
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching classes:", error);
    return [];
  }
};

export const getClassesByDateRange = async (
  startDate: string,
  endDate: string,
): Promise<Class[]> => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select(
        `
        *,
        trainers(first_name, last_name, email)
      `,
      )
      .gte("start_time", startDate)
      .lte("start_time", endDate)
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching classes by date range:", error);
    return [];
  }
};

export const getClassesByTrainer = async (
  trainerId: string,
): Promise<Class[]> => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select(
        `
        *,
        trainers(first_name, last_name, email)
      `,
      )
      .eq("trainer_id", trainerId)
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching classes by trainer:", error);
    return [];
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const checkClassCapacity = async (
  classId: string,
): Promise<{ available: boolean; booked: number; capacity: number }> => {
  try {
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("capacity")
      .eq("id", classId)
      .single();

    if (classError) throw classError;

    const { data: bookings, error: bookingError } = await supabase
      .from("class_bookings")
      .select("*")
      .eq("class_id", classId)
      .eq("status", "booked");

    if (bookingError) throw bookingError;

    const booked = bookings?.length || 0;
    const capacity = classData?.capacity || 0;
    const available = booked < capacity;

    return { available, booked, capacity };
  } catch (error) {
    console.error("Error checking class capacity:", error);
    return { available: false, booked: 0, capacity: 0 };
  }
};

export const getUpcomingClasses = async (
  limit: number = 10,
): Promise<Class[]> => {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("classes")
      .select(
        `
        *,
        trainers(first_name, last_name, email)
      `,
      )
      .gte("start_time", now)
      .order("start_time", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching upcoming classes:", error);
    return [];
  }
};

// ============================================================================
// CLASS REVIEWS
// ============================================================================

export interface ClassReview {
  id: string;
  class_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url?: string;
  };
}

export const createClassReview = async (
  classId: string,
  userId: string,
  rating: number,
  comment: string,
): Promise<ClassReview | null> => {
  try {
    const { data, error } = await supabase
      .from("class_reviews")
      .insert({
        class_id: classId,
        user_id: userId,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) throw error;
    toast.success("Review submitted successfully");
    return data;
  } catch (error) {
    console.error("Error creating class review:", error);
    toast.error("Failed to submit review");
    throw error;
  }
};

export const getClassReviews = async (
  classId: string,
): Promise<ClassReview[]> => {
  try {
    const { data, error } = await supabase
      .from("class_reviews")
      .select(
        `
        *,
        profiles!inner(name, avatar_url)
      `,
      )
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching class reviews:", error);
    return [];
  }
};
