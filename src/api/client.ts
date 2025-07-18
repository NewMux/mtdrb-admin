import { supabase } from '../supabaseClient';
import type { Member, Class, Invoice, ClassBooking, ApiResponse, Branch, UserProfile, Trainer, TrainerPerformance, TrainerSchedule, TrainerAvailability, AnalyticsOverview, MemberMetrics, TrainerMetrics, ClassMetrics, FinancialMetrics, AutomationWorkflow, AutomationSettings, Task } from '../types';
import { mockClasses, mockBookings } from './mockClassData';
const isDev = import.meta.env.MODE === 'development';

export const api = {
  auth: {
    signUp: async (email: string, password: string, name: string) => {
      return supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
    },
    signIn: async (email: string, password: string) => {
      return supabase.auth.signInWithPassword({ email, password });
    },
    signOut: async () => {
      return supabase.auth.signOut();
    },
    getUser: async () => {
      return supabase.auth.getUser();
    },
    getSession: async () => {
      return supabase.auth.getSession();
    },
  },
  
  members: {
    getAll: async (): Promise<ApiResponse<Member[]>> => {
      return supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
    },
    getById: async (id: string): Promise<ApiResponse<Member>> => {
      return supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();
    },
    create: async (data: Omit<Member, 'id' | 'created_at'>): Promise<ApiResponse<Member>> => {
      return supabase
        .from('members')
        .insert(data)
        .select()
        .single();
    },
    update: async (id: string, data: Partial<Member>): Promise<ApiResponse<Member>> => {
      return supabase
        .from('members')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase
        .from('members')
        .delete()
        .eq('id', id);
    },
    search: async (query: string): Promise<ApiResponse<Member[]>> => {
      return supabase
        .from('members')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name', { ascending: true });
    },
  },

  classes: {
    getAll: async (): Promise<ApiResponse<Class[]>> => {
      if (isDev) return { data: mockClasses, error: null };
      return supabase
        .from('classes')
        .select('*')
        .order('start_time', { ascending: true });
    },
    getById: async (id: string): Promise<ApiResponse<Class>> => {
      if (isDev) return { data: mockClasses.find(c => c.id === id) || null, error: null };
      return supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single();
    },
    create: async (data: Omit<Class, 'id' | 'created_at'>): Promise<ApiResponse<Class>> => {
      if (isDev) return { data: { ...data, id: `mock-${Date.now()}`, created_at: new Date().toISOString() } as Class, error: null };
      return supabase
        .from('classes')
        .insert(data)
        .select()
        .single();
    },
    update: async (id: string, data: Partial<Class>): Promise<ApiResponse<Class>> => {
      if (isDev) return { data: { ...(mockClasses.find(c => c.id === id) || {}), ...data } as Class, error: null };
      return supabase
        .from('classes')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      if (isDev) return { data: null, error: null };
      return supabase
        .from('classes')
        .delete()
        .eq('id', id);
    },
    getByDateRange: async (start: string, end: string): Promise<ApiResponse<Class[]>> => {
      if (isDev) return { data: mockClasses.filter(c => c.start_time >= start && c.end_time <= end), error: null };
      return supabase
        .from('classes')
        .select('*')
        .gte('start_time', start)
        .lte('end_time', end)
        .order('start_time', { ascending: true });
    },
  },

  invoices: {
    getAll: async (): Promise<ApiResponse<Invoice[]>> => {
      return supabase
        .from('invoices')
        .select('*')
        .order('date', { ascending: false });
    },
    getById: async (id: string): Promise<ApiResponse<Invoice>> => {
      return supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
    },
    create: async (data: Omit<Invoice, 'id' | 'created_at'>): Promise<ApiResponse<Invoice>> => {
      return supabase
        .from('invoices')
        .insert(data)
        .select()
        .single();
    },
    update: async (id: string, data: Partial<Invoice>): Promise<ApiResponse<Invoice>> => {
      return supabase
        .from('invoices')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase
        .from('invoices')
        .delete()
        .eq('id', id);
    },
  },

  bookings: {
    getAll: async (): Promise<ApiResponse<ClassBooking[]>> => {
      if (isDev) return { data: mockBookings, error: null };
      return supabase
        .from('class_bookings')
        .select('*')
        .order('created_at', { ascending: false });
    },
    getByClassId: async (classId: string): Promise<ApiResponse<ClassBooking[]>> => {
      if (isDev) return { data: mockBookings.filter(b => b.class_id === classId), error: null };
      return supabase
        .from('class_bookings')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: true });
    },
    create: async (data: Omit<ClassBooking, 'id' | 'created_at'>): Promise<ApiResponse<ClassBooking>> => {
      if (isDev) return { data: { ...data, id: `mock-booking-${Date.now()}`, created_at: new Date().toISOString(), status: 'booked' } as ClassBooking, error: null };
      return supabase
        .from('class_bookings')
        .insert(data)
        .select()
        .single();
    },
    update: async (id: string, data: Partial<ClassBooking>): Promise<ApiResponse<ClassBooking>> => {
      if (isDev) return { data: { ...(mockBookings.find(b => b.id === id) || {}), ...data } as ClassBooking, error: null };
      return supabase
        .from('class_bookings')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      if (isDev) return { data: null, error: null };
      return supabase
        .from('class_bookings')
        .delete()
        .eq('id', id);
    },
  },

  // Branch API functions
  fetchBranches: async (): Promise<Branch[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        const { data: membershipData } = await supabase
          .from('memberships')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        
        if (membershipData) {
          tenantId = membershipData.tenant_id;
        }
      }

      if (!tenantId) throw new Error('No tenant ID found');

      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching branches:', error);
      return [];
    }
  },

  // User Profile API functions
  fetchUserProfile: async (): Promise<UserProfile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return data || {
        user_id: user.id,
        first_name: user.user_metadata?.name?.split(' ')[0] || '',
        last_name: user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
        phone: '',
        avatar_url: '',
        preferences: {}
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  updateUserProfile: async (profile: Partial<UserProfile>): Promise<UserProfile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  },

  // Switch branch function
  switchBranch: async (branchId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update user metadata with selected branch
      const { error } = await supabase.auth.updateUser({
        data: { 
          ...user.user_metadata,
          selected_branch_id: branchId 
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error switching branch:', error);
      return false;
    }
  },

  trainers: {
    getAll: async (): Promise<ApiResponse<Trainer[]>> => {
      return supabase
        .from('trainers')
        .select(`
          *,
          classes (
            id,
            name,
            start_time,
            end_time,
            status
          ),
          trainer_performance (
            total_classes,
            total_revenue,
            average_rating,
            attendance_rate
          )
        `)
        .order('created_at', { ascending: false });
    },
    getById: async (id: string): Promise<ApiResponse<Trainer>> => {
      return supabase
        .from('trainers')
        .select(`
          *,
          classes (
            id,
            name,
            start_time,
            end_time,
            status
          ),
          trainer_performance (
            total_classes,
            total_revenue,
            average_rating,
            attendance_rate
          )
        `)
        .eq('id', id)
        .single();
    },
    create: async (data: Omit<Trainer, 'id' | 'created_at'>): Promise<ApiResponse<Trainer>> => {
      return supabase
        .from('trainers')
        .insert(data)
        .select()
        .single();
    },
    update: async (id: string, data: Partial<Trainer>): Promise<ApiResponse<Trainer>> => {
      return supabase
        .from('trainers')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase
        .from('trainers')
        .delete()
        .eq('id', id);
    },
    getPerformance: async (id: string, period: 'week' | 'month' | 'year'): Promise<ApiResponse<TrainerPerformance[]>> => {
      return supabase
        .from('trainer_performance')
        .select('*')
        .eq('trainer_id', id)
        .order('month', { ascending: false });
    },
    getSchedule: async (id: string, startDate: string, endDate: string): Promise<ApiResponse<TrainerSchedule[]>> => {
      return supabase
        .from('trainer_schedule')
        .select('*')
        .eq('trainer_id', id)
        .gte('start_time', startDate)
        .lte('end_time', endDate)
        .order('start_time', { ascending: true });
    },
    updateAvailability: async (id: string, availability: TrainerAvailability[]): Promise<ApiResponse<null>> => {
      return supabase
        .from('trainer_schedule')
        .upsert(availability.map(slot => ({
          trainer_id: id,
          ...slot
        })));
    }
  },

  analytics: {
    getOverview: async (): Promise<ApiResponse<AnalyticsOverview>> => {
      return supabase.rpc('get_analytics_overview');
    },
    getMemberMetrics: async (period: string): Promise<ApiResponse<MemberMetrics>> => {
      return supabase.rpc('get_member_metrics', { p_period: period });
    },
    getTrainerMetrics: async (period: string): Promise<ApiResponse<TrainerMetrics>> => {
      return supabase.rpc('get_trainer_metrics', { p_period: period });
    },
    getClassMetrics: async (period: string): Promise<ApiResponse<ClassMetrics>> => {
      return supabase.rpc('get_class_metrics', { p_period: period });
    },
    getFinancialMetrics: async (period: string): Promise<ApiResponse<FinancialMetrics>> => {
      return supabase.rpc('get_financial_metrics', { p_period: period });
    }
  },

  automation: {
    getWorkflows: async (): Promise<ApiResponse<AutomationWorkflow[]>> => {
      return supabase
        .from('automation_workflows')
        .select('*')
        .order('created_at', { ascending: false });
    },
    createWorkflow: async (data: Omit<AutomationWorkflow, 'id' | 'created_at'>): Promise<ApiResponse<AutomationWorkflow>> => {
      return supabase
        .from('automation_workflows')
        .insert(data)
        .select()
        .single();
    },
    updateWorkflow: async (id: string, data: Partial<AutomationWorkflow>): Promise<ApiResponse<AutomationWorkflow>> => {
      return supabase
        .from('automation_workflows')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    },
    deleteWorkflow: async (id: string): Promise<ApiResponse<null>> => {
      return supabase
        .from('automation_workflows')
        .delete()
        .eq('id', id);
    },
    getSettings: async (): Promise<ApiResponse<AutomationSettings>> => {
      return supabase
        .from('automation_settings')
        .select('*')
        .single();
    },
    updateSettings: async (data: Partial<AutomationSettings>): Promise<ApiResponse<AutomationSettings>> => {
      return supabase
        .from('automation_settings')
        .upsert(data)
        .select()
        .single();
    }
  },

  tasks: {
    getAll: async (): Promise<ApiResponse<Task[]>> => {
      return supabase
        .from('member_tasks')
        .select('*')
        .order('due_date', { ascending: true });
    },
    create: async (data: Omit<Task, 'id' | 'created_at'>): Promise<ApiResponse<Task>> => {
      return supabase
        .from('member_tasks')
        .insert(data)
        .select()
        .single();
    },
    update: async (id: string, data: Partial<Task>): Promise<ApiResponse<Task>> => {
      return supabase
        .from('member_tasks')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    },
    delete: async (id: string): Promise<ApiResponse<null>> => {
      return supabase
        .from('member_tasks')
        .delete()
        .eq('id', id);
    },
    getByMember: async (memberId: string): Promise<ApiResponse<Task[]>> => {
      return supabase
        .from('member_tasks')
        .select('*')
        .eq('member_id', memberId)
        .order('due_date', { ascending: true });
    },
    getByAssignee: async (assigneeId: string): Promise<ApiResponse<Task[]>> => {
      return supabase
        .from('member_tasks')
        .select('*')
        .eq('assigned_to', assigneeId)
        .order('due_date', { ascending: true });
    }
  }
}; 