import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

interface WorkoutPlan {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface WorkoutPlansContextType {
  plans: WorkoutPlan[];
  loading: boolean;
  error: string | null;
  refreshPlans: () => Promise<void>;
  getPlansById: (ids: string[]) => WorkoutPlan[];
}

const WorkoutPlansContext = createContext<WorkoutPlansContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function WorkoutPlansProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(0);

  const fetchPlans = useCallback(async (force = false) => {
    // Don't fetch if cache is still valid
    if (!force && Date.now() - lastFetch < CACHE_DURATION) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Get tenant_id from memberships table
      const { data: membershipData } = await supabase
        .from('memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!membershipData) {
        setError('No tenant found');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('tenant_id', membershipData.tenant_id)
        .order('name');

      if (fetchError) {
        console.error('Error fetching plans:', fetchError);
        setError('Unable to load workout plans');
        return;
      }

      setPlans(data || []);
      setLastFetch(Date.now());
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [lastFetch]);

  // Initial fetch
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const refreshPlans = useCallback(async () => {
    await fetchPlans(true);
  }, [fetchPlans]);

  const getPlansById = useCallback((ids: string[]) => {
    return plans.filter(plan => ids.includes(plan.id));
  }, [plans]);

  return (
    <WorkoutPlansContext.Provider value={{
      plans,
      loading,
      error,
      refreshPlans,
      getPlansById,
    }}>
      {children}
    </WorkoutPlansContext.Provider>
  );
}

export function useWorkoutPlans() {
  const context = useContext(WorkoutPlansContext);
  if (context === undefined) {
    throw new Error('useWorkoutPlans must be used within a WorkoutPlansProvider');
  }
  return context;
} 