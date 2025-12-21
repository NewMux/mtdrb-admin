import { supabase } from "../supabaseClient";
import type { Database } from "../types/supabase";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type MemberRow = Database["public"]["Tables"]["members"]["Row"];
type TrainerRow = Database["public"]["Tables"]["trainers"]["Row"];
type BookingRow = Database["public"]["Tables"]["class_bookings"]["Row"];

/**
 * Smart Suggestions Service
 * Provides data-driven recommendations based on real database analysis
 */

export interface SmartRecommendation {
  id: string;
  type: "capacity" | "timing" | "trainer" | "location" | "scheduling" | "engagement" | "revenue";
  title: string;
  description: string;
  confidence: number;
  action: string;
  priority: "high" | "medium" | "low";
  data?: Record<string, unknown>;
}

export interface SmartSuggestion {
  id: string;
  type: "assignment" | "deadline" | "priority" | "automation" | "escalation";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  action: string;
  isPro?: boolean;
}

export interface SmartInsight {
  id: string;
  type: "prediction" | "recommendation" | "alert" | "trend";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  action: string;
  isPro?: boolean;
  category?: "retention" | "revenue" | "operations" | "performance";
}

/**
 * Get current tenant ID from user session
 */
async function getCurrentTenantId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
      .from("memberships")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    return membership?.tenant_id || null;
  } catch (error) {
    console.error("Error getting tenant ID:", error);
    return null;
  }
}

/**
 * Analyze class capacity and generate recommendations
 */
export async function getClassCapacityRecommendations(
  classId?: string,
  tenantId?: string
): Promise<SmartRecommendation[]> {
  const recommendations: SmartRecommendation[] = [];
  const tId = tenantId || await getCurrentTenantId();
  if (!tId) return recommendations;

  try {
    let query = supabase
      .from("classes")
      .select("*")
      .eq("tenant_id", tId)
      .eq("status", "scheduled")
      .gte("start_time", new Date().toISOString());

    if (classId) {
      query = query.eq("id", classId);
    }

    const { data: classes, error } = await query;

    if (error) {
      console.error("Error fetching classes:", error);
      return recommendations;
    }

    if (!classes || classes.length === 0) return recommendations;

    // Get booking counts for each class
    const classIds = classes.map((c) => c.id);
    const { data: bookings } = await supabase
      .from("class_bookings")
      .select("class_id")
      .in("class_id", classIds)
      .eq("status", "booked");

    const bookingCounts = new Map<string, number>();
    bookings?.forEach((booking) => {
      const count = bookingCounts.get(booking.class_id) || 0;
      bookingCounts.set(booking.class_id, count + 1);
    });

    for (const classItem of classes) {
      const bookings = bookingCounts.get(classItem.id) || classItem.current_bookings || 0;
      
      const utilizationRate = classItem.capacity > 0 
        ? bookings / classItem.capacity 
        : 0;

      // High demand recommendation
      if (utilizationRate > 0.8) {
        recommendations.push({
          id: `capacity-${classItem.id}`,
          type: "capacity",
          title: "High Demand Class",
          description: `${classItem.name} is ${Math.round(utilizationRate * 100)}% full. Consider adding more sessions or increasing capacity.`,
          confidence: Math.min(0.95, 0.7 + utilizationRate * 0.25),
          action: "Add more sessions",
          priority: utilizationRate > 0.95 ? "high" : "medium",
          data: {
            classId: classItem.id,
            className: classItem.name,
            utilizationRate,
            bookings,
            capacity: classItem.capacity,
          },
        });
      }

      // Low attendance recommendation
      if (utilizationRate < 0.3 && classItem.capacity > 5) {
        const startTime = new Date(classItem.start_time);
        const hour = startTime.getHours();
        
        recommendations.push({
          id: `timing-${classItem.id}`,
          type: "timing",
          title: "Low Attendance",
          description: `${classItem.name} has only ${Math.round(utilizationRate * 100)}% attendance. Consider adjusting time slot (current: ${hour}:00).`,
          confidence: 0.75,
          action: "Adjust time",
          priority: "medium",
          data: {
            classId: classItem.id,
            className: classItem.name,
            utilizationRate,
            currentHour: hour,
          },
        });
      }

      // Missing trainer recommendation
      if (!classItem.trainer_id) {
        recommendations.push({
          id: `trainer-${classItem.id}`,
          type: "trainer",
          title: "Assign Trainer",
          description: `${classItem.name} has no trainer assigned. Assign a trainer based on class type.`,
          confidence: 0.92,
          action: "Assign trainer",
          priority: "high",
          data: {
            classId: classItem.id,
            className: classItem.name,
          },
        });
      }

      // Missing room recommendation
      if (!classItem.room) {
        recommendations.push({
          id: `location-${classItem.id}`,
          type: "location",
          title: "Select Room",
          description: `${classItem.name} has no room assigned. Choose an appropriate room based on class type and capacity.`,
          confidence: 0.88,
          action: "Assign room",
          priority: "medium",
          data: {
            classId: classItem.id,
            className: classItem.name,
            capacity: classItem.capacity,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error analyzing class capacity:", error);
  }

  return recommendations;
}

/**
 * Analyze trainer availability and workload
 */
export async function getTrainerRecommendations(
  tenantId?: string
): Promise<SmartRecommendation[]> {
  const recommendations: SmartRecommendation[] = [];
  const tId = tenantId || await getCurrentTenantId();
  if (!tId) return recommendations;

  try {
    // Get active trainers
    const { data: trainers, error: trainersError } = await supabase
      .from("trainers")
      .select("id, first_name, last_name, status, specialties")
      .eq("tenant_id", tId)
      .eq("status", "active");

    if (trainersError || !trainers || trainers.length === 0) {
      return recommendations;
    }

    // Get upcoming classes for each trainer
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: classes, error: classesError } = await supabase
      .from("classes")
      .select("trainer_id, start_time")
      .eq("tenant_id", tId)
      .eq("status", "scheduled")
      .gte("start_time", now.toISOString())
      .lte("start_time", nextWeek.toISOString());

    if (classesError) {
      console.error("Error fetching classes:", classesError);
      return recommendations;
    }

    // Count classes per trainer
    const trainerClassCounts = new Map<string, number>();
    classes?.forEach((cls) => {
      const count = trainerClassCounts.get(cls.trainer_id) || 0;
      trainerClassCounts.set(cls.trainer_id, count + 1);
    });

    // Find underutilized trainers
    trainers.forEach((trainer) => {
      const classCount = trainerClassCounts.get(trainer.id) || 0;
      const trainerName = `${trainer.first_name} ${trainer.last_name}`;

      if (classCount === 0) {
        recommendations.push({
          id: `trainer-availability-${trainer.id}`,
          type: "trainer",
          title: "Underutilized Trainer",
          description: `${trainerName} has no classes scheduled this week. Consider assigning classes.`,
          confidence: 0.85,
          action: "Assign classes",
          priority: "medium",
          data: {
            trainerId: trainer.id,
            trainerName,
            specialties: trainer.specialties,
          },
        });
      }
    });
  } catch (error) {
    console.error("Error analyzing trainer availability:", error);
  }

  return recommendations;
}

/**
 * Analyze member engagement patterns
 */
export async function getMemberEngagementInsights(
  tenantId?: string
): Promise<SmartInsight[]> {
  const insights: SmartInsight[] = [];
  const tId = tenantId || await getCurrentTenantId();
  if (!tId) return insights;

  try {
    // Get active members
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, created_at, tenant_id, first_name, last_name, email, phone, status, join_date, expiry_date, membership_type")
      .eq("tenant_id", tId)
      .eq("status", "active");

    if (membersError || !members) return insights;

    // Get recent bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentBookings, error: bookingsError } = await supabase
      .from("class_bookings")
      .select("member_id, status, created_at")
      .eq("tenant_id", tId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return insights;
    }

    // Count bookings per member
    const memberBookingCounts = new Map<string, number>();
    recentBookings?.forEach((booking) => {
      if (booking.status !== "cancelled" && booking.status !== "no_show") {
        const count = memberBookingCounts.get(booking.member_id) || 0;
        memberBookingCounts.set(booking.member_id, count + 1);
      }
    });

    // Find inactive members (no bookings in 30 days)
    const inactiveMembers: MemberRow[] = [];
    members.forEach((member) => {
      const bookingCount = memberBookingCounts.get(member.id) || 0;
      if (bookingCount === 0) {
        inactiveMembers.push(member);
      }
    });

    if (inactiveMembers.length > 0) {
      const inactivePercentage = (inactiveMembers.length / members.length) * 100;
      
      insights.push({
        id: "member-engagement-low",
        type: "alert",
        title: "Member Engagement Alert",
        description: `${inactiveMembers.length} members (${Math.round(inactivePercentage)}%) haven't booked any classes in the last 30 days.`,
        confidence: 0.88,
        impact: inactivePercentage > 20 ? "high" : "medium",
        action: "Send re-engagement campaign",
        isPro: true,
        category: "retention",
      });
    }

    // Check for expiring memberships
    const expiringSoon: MemberRow[] = [];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    members.forEach((member) => {
      if (member.expiry_date) {
        const expiryDate = new Date(member.expiry_date);
        if (expiryDate <= nextWeek && expiryDate >= new Date()) {
          expiringSoon.push(member);
        }
      }
    });

    if (expiringSoon.length > 0) {
      insights.push({
        id: "membership-renewal",
        type: "recommendation",
        title: "Membership Renewals Due",
        description: `${expiringSoon.length} memberships are expiring in the next 7 days. Reach out to encourage renewal.`,
        confidence: 0.92,
        impact: "high",
        action: "Send renewal reminders",
        isPro: false,
        category: "revenue",
      });
    }
  } catch (error) {
    console.error("Error analyzing member engagement:", error);
  }

  return insights;
}

/**
 * Analyze class attendance patterns and peak times
 */
export async function getClassTimingRecommendations(
  tenantId?: string
): Promise<SmartRecommendation[]> {
  const recommendations: SmartRecommendation[] = [];
  const tId = tenantId || await getCurrentTenantId();
  if (!tId) return recommendations;

  try {
    // Get completed classes with bookings from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: classes, error } = await supabase
      .from("classes")
      .select("id, name, start_time, capacity, current_bookings")
      .eq("tenant_id", tId)
      .eq("status", "completed")
      .gte("start_time", thirtyDaysAgo.toISOString());

    if (error || !classes || classes.length === 0) return recommendations;

    // Analyze attendance by hour
    const attendanceByHour = new Map<number, { total: number; avgUtilization: number; count: number }>();

    classes.forEach((cls) => {
      const startTime = new Date(cls.start_time);
      const hour = startTime.getHours();
      const utilization = cls.capacity > 0 ? cls.current_bookings / cls.capacity : 0;

      const existing = attendanceByHour.get(hour) || { total: 0, avgUtilization: 0, count: 0 };
      const newCount = existing.count + 1;
      attendanceByHour.set(hour, {
        total: existing.total + 1,
        avgUtilization: (existing.avgUtilization * existing.count + utilization) / newCount,
        count: newCount,
      });
    });

    // Find off-peak hours (low average utilization)
    attendanceByHour.forEach((stats, hour) => {
      if (stats.avgUtilization < 0.4 && stats.total >= 3) {
        recommendations.push({
          id: `timing-offpeak-${hour}`,
          type: "timing",
          title: "Off-Peak Time Slot",
          description: `Classes at ${hour}:00 have average ${Math.round(stats.avgUtilization * 100)}% attendance. Consider moving to peak hours (9 AM - 6 PM).`,
          confidence: 0.78,
          action: "Adjust time",
          priority: "medium",
          data: {
            hour,
            avgUtilization: stats.avgUtilization,
            sampleSize: stats.total,
          },
        });
      }
    });
  } catch (error) {
    console.error("Error analyzing class timing:", error);
  }

  return recommendations;
}

/**
 * Get comprehensive smart recommendations for classes
 */
export async function getClassRecommendations(
  classId?: string,
  tenantId?: string
): Promise<SmartRecommendation[]> {
  const recommendations: SmartRecommendation[] = [];

  // Get all types of recommendations
  const [
    capacityRecs,
    trainerRecs,
    timingRecs,
  ] = await Promise.all([
    getClassCapacityRecommendations(classId, tenantId),
    getTrainerRecommendations(tenantId),
    getClassTimingRecommendations(tenantId),
  ]);

  recommendations.push(...capacityRecs, ...trainerRecs, ...timingRecs);

  // Remove duplicates and sort by priority
  const uniqueRecs = Array.from(
    new Map(recommendations.map((rec) => [rec.id, rec])).values()
  );

  return uniqueRecs.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Get smart insights for analytics dashboard
 */
export async function getAnalyticsInsights(
  tenantId?: string
): Promise<SmartInsight[]> {
  const insights: SmartInsight[] = [];

  // Get member engagement insights
  const memberInsights = await getMemberEngagementInsights(tenantId);
  insights.push(...memberInsights);

  // Get revenue insights
  try {
    const tId = tenantId || await getCurrentTenantId();
    if (tId) {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("amount, status, created_at")
        .eq("tenant_id", tId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (!error && invoices && invoices.length > 0) {
        const paidInvoices = invoices.filter((inv) => inv.status === "paid");
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
        const avgRevenue = totalRevenue / paidInvoices.length;

        if (avgRevenue > 0) {
          insights.push({
            id: "revenue-trend",
            type: "trend",
            title: "Revenue Analysis",
            description: `Average invoice value is ${avgRevenue.toFixed(2)}. ${paidInvoices.length} invoices paid in last 30 days.`,
            confidence: 0.85,
            impact: "medium",
            action: "View detailed report",
            isPro: true,
            category: "revenue",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error analyzing revenue:", error);
  }

  return insights;
}

