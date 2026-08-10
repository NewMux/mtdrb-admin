import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export interface RealtimeNotification {
  id: string;
  type:
    | "member_checkin"
    | "class_capacity_alert"
    | "new_assignment"
    | "urgent_task"
    | "payment_received";
  title: string;
  message: string;
  targetRoles: string[];
  targetUsers?: string[];
  priority: "low" | "medium" | "high" | "urgent";
  metadata?: any;
  created_at: string;
}

export interface ClassCapacityAlert {
  class_id: string;
  class_name: string;
  current_bookings: number;
  capacity: number;
  utilization_percent: number;
  trainer_id: string;
  start_time: string;
}

class RealtimeService {
  private subscriptions: Map<string, any> = new Map();
  private notificationCallbacks: Map<
    string,
    (notification: RealtimeNotification) => void
  > = new Map();

  // Subscribe to targeted notifications based on user role
  subscribeToNotifications(
    tenantId: string,
    userRole: string,
    userId: string,
    callback: (notification: RealtimeNotification) => void,
  ) {
    const channel = supabase
      .channel(`notifications_${tenantId}_${userRole}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const notification = payload.new as RealtimeNotification;

          // Check if notification is targeted to this user
          if (this.shouldReceiveNotification(notification, userRole, userId)) {
            callback(notification);
            this.showNotificationToast(notification);
          }
        },
      )
      .subscribe();

    this.subscriptions.set(`notifications_${tenantId}_${userRole}`, channel);
    this.notificationCallbacks.set(
      `notifications_${tenantId}_${userRole}`,
      callback,
    );
  }

  // Subscribe to class capacity alerts
  subscribeToClassCapacityAlerts(
    tenantId: string,
    userRole: string,
    callback: (alert: ClassCapacityAlert) => void,
  ) {
    const channel = supabase
      .channel(`class_capacity_${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "classes",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const updatedClass = payload.new as any;
          const utilizationPercent =
            (updatedClass.current_bookings / updatedClass.capacity) * 100;

          // Alert when class is 80% full or completely full
          if (utilizationPercent >= 80) {
            const alert: ClassCapacityAlert = {
              class_id: updatedClass.id,
              class_name: updatedClass.name,
              current_bookings: updatedClass.current_bookings,
              capacity: updatedClass.capacity,
              utilization_percent: Math.round(utilizationPercent),
              trainer_id: updatedClass.trainer_id,
              start_time: updatedClass.start_time,
            };

            // Only send to trainers, employees, and admins
            if (["admin", "employee", "trainer"].includes(userRole)) {
              callback(alert);
              this.showCapacityAlert(alert);
            }
          }
        },
      )
      .subscribe();

    this.subscriptions.set(`class_capacity_${tenantId}`, channel);
  }

  // Subscribe to member check-ins for trainers
  subscribeToMemberCheckins(
    tenantId: string,
    trainerId: string,
    callback: (checkin: any) => void,
  ) {
    const channel = supabase
      .channel(`checkins_${tenantId}_${trainerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "class_bookings",
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          const booking = payload.new as any;

          // Only notify if status changed to 'checked_in'
          if (
            booking.status === "checked_in" &&
            payload.old.status !== "checked_in"
          ) {
            // Get class and member details
            const { data: classData } = await supabase
              .from("classes")
              .select("name, trainer_id")
              .eq("id", booking.class_id)
              .single();

            // Only notify the assigned trainer
            if (classData?.trainer_id === trainerId) {
              const { data: memberData } = await supabase
                .from("members")
                .select("first_name, last_name")
                .eq("id", booking.member_id)
                .single();

              const checkinData = {
                ...booking,
                class_name: classData.name,
                member_name: `${memberData?.first_name} ${memberData?.last_name}`,
              };

              callback(checkinData);

              toast.success(
                `${memberData?.first_name} ${memberData?.last_name} checked in to ${classData.name}`,
                { duration: 4000 },
              );
            }
          }
        },
      )
      .subscribe();

    this.subscriptions.set(`checkins_${tenantId}_${trainerId}`, channel);
  }

  // Send targeted notification
  async sendTargetedNotification(
    notification: Omit<RealtimeNotification, "id" | "created_at">,
  ) {
    try {
      const { error } = await supabase.from("notifications").insert({
        ...notification,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      // Only log in development to prevent info leakage
      if (import.meta.env.DEV) {
        console.error("Failed to send notification:", error);
      }
    }
  }

  // Send class capacity alert
  async sendClassCapacityAlert(classId: string) {
    const { data: classData } = await supabase
      .from("classes")
      .select("name, current_bookings, capacity, trainer_id, start_time")
      .eq("id", classId)
      .single();

    if (classData) {
      const utilizationPercent =
        (classData.current_bookings / classData.capacity) * 100;

      if (utilizationPercent >= 90) {
        await this.sendTargetedNotification({
          type: "class_capacity_alert",
          title: "Class Almost Full",
          message: `${classData.name} is ${Math.round(utilizationPercent)}% full (${classData.current_bookings}/${classData.capacity})`,
          targetRoles: ["admin", "employee", "trainer"],
          targetUsers: [classData.trainer_id],
          priority: utilizationPercent === 100 ? "urgent" : "high",
          metadata: {
            class_id: classId,
            utilization_percent: utilizationPercent,
            start_time: classData.start_time,
          },
        });
      }
    }
  }

  // Private helper methods
  private shouldReceiveNotification(
    notification: RealtimeNotification,
    userRole: string,
    userId: string,
  ): boolean {
    // Check role-based targeting
    if (notification.targetRoles.includes(userRole)) {
      return true;
    }

    // Check user-specific targeting
    if (notification.targetUsers?.includes(userId)) {
      return true;
    }

    return false;
  }

  private showNotificationToast(notification: RealtimeNotification) {
    const options = {
      duration: this.getToastDuration(notification.priority),
      icon: this.getNotificationIcon(notification.type),
    };

    switch (notification.priority) {
      case "urgent":
        toast.error(
          `🚨 ${notification.title}: ${notification.message}`,
          options,
        );
        break;
      case "high":
        toast.error(
          `⚡ ${notification.title}: ${notification.message}`,
          options,
        );
        break;
      case "medium":
        toast(`📢 ${notification.title}: ${notification.message}`, options);
        break;
      case "low":
        toast.success(
          `✅ ${notification.title}: ${notification.message}`,
          options,
        );
        break;
    }
  }

  private showCapacityAlert(alert: ClassCapacityAlert) {
    const message = `${alert.class_name} is ${alert.utilization_percent}% full (${alert.current_bookings}/${alert.capacity})`;

    if (alert.utilization_percent === 100) {
      toast.error(`🚫 Class Full: ${message}`, { duration: 6000 });
    } else if (alert.utilization_percent >= 90) {
      toast(`⚠️ Almost Full: ${message}`, { duration: 5000 });
    } else {
      toast(`📊 High Demand: ${message}`, { duration: 4000 });
    }
  }

  private getToastDuration(priority: string): number {
    switch (priority) {
      case "urgent":
        return 8000;
      case "high":
        return 6000;
      case "medium":
        return 4000;
      case "low":
        return 3000;
      default:
        return 4000;
    }
  }

  private getNotificationIcon(type: string): string {
    switch (type) {
      case "member_checkin":
        return "✅";
      case "class_capacity_alert":
        return "⚠️";
      case "new_assignment":
        return "📋";
      case "urgent_task":
        return "🚨";
      case "payment_received":
        return "💳";
      default:
        return "📢";
    }
  }

  // Cleanup method
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    this.notificationCallbacks.clear();
  }

  // Unsubscribe specific channel
  unsubscribe(channelKey: string) {
    const subscription = this.subscriptions.get(channelKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(channelKey);
      this.notificationCallbacks.delete(channelKey);
    }
  }

  // Get live member count
  async getLiveMemberCount(tenantId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("class_bookings")
        .select("member_id")
        .eq("tenant_id", tenantId)
        .eq("status", "checked_in")
        .gte(
          "check_in_time",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        );

      if (error) throw error;

      // Count unique members currently in gym
      const uniqueMembers = new Set(
        data?.map((booking) => booking.member_id) || [],
      );
      return uniqueMembers.size;
    } catch (error) {
      console.error("Failed to get live member count:", error);
      return 0;
    }
  }

  // Get classes in session
  async getClassesInSession(tenantId: string): Promise<number> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("classes")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "in_progress")
        .lte("start_time", now)
        .gte("end_time", now);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to get classes in session:", error);
      }
      return 0;
    }
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
