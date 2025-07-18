import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from './types/supabase';

// Mock Supabase client for development without backend
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {
    paid: true,
    tenant_id: 't1',
    role: 'admin',
    subscription_tier: 'premium'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
let isMockSignedIn = true;

// Mock data storage
let mockData = {
  members: [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', status: 'active', joined_at: '2024-06-01', created_at: '2024-06-01' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', status: 'active', joined_at: '2024-07-01', created_at: '2024-07-01' },
    { id: '3', name: 'Carol Davis', email: 'carol@example.com', status: 'inactive', joined_at: '2024-05-15', created_at: '2024-05-15' }
  ],
  classes: [
    { id: '1', name: 'Yoga Flow', start_time: '2024-07-05T10:00:00Z', end_time: '2024-07-05T11:00:00Z', type: 'Yoga' },
    { id: '2', name: 'Pilates Core', start_time: '2024-07-05T12:00:00Z', end_time: '2024-07-05T13:00:00Z', type: 'Pilates' },
    { id: '3', name: 'HIIT Training', start_time: '2024-07-04T14:00:00Z', end_time: '2024-07-04T15:00:00Z', type: 'Cardio' }
  ],
  memberships: [
    { id: 'm1', user_id: 'user-1', tenant_id: 't1', role: 'admin', created_at: '2024-01-01' }
  ],
  profiles: [
    { id: 'p1', user_id: 'user-1', tenant_id: 't1', first_name: 'Test', last_name: 'User', email: 'test@example.com', created_at: '2024-01-01' }
  ],
  invites: [
    { id: 'inv1', email: 'test@example.com', tenant_id: 't1', accepted_at: null, created_at: '2024-01-01' }
  ],
  invoices: [
    { id: '1', member_id: '1', amount: 99.99, status: 'paid', date: '2024-07-01' },
    { id: '2', member_id: '2', amount: 149.99, status: 'pending', date: '2024-07-02' }
  ],
  tenants: [
    { id: 't1', name: 'MTDRB Gym', has_plans: true, has_trainers: true, has_classes: true }
  ]
};

const createMockSupabaseClient = (): SupabaseClient<Database> => {
  const mockClient = {
    auth: {
      getUser: async () => ({ data: { user: isMockSignedIn ? mockUser : null }, error: null }),
      signIn: async () => {
        isMockSignedIn = true;
        return { data: { user: mockUser, session: { access_token: 'mock', refresh_token: 'mock' } }, error: null };
      },
      signOut: async () => {
        isMockSignedIn = false;
        return { error: null };
      },
      onAuthStateChange: (callback: any) => {
        console.log('🔧 Mock client - onAuthStateChange called');
        // Immediately trigger the callback with current auth state
        setTimeout(() => {
          if (isMockSignedIn) {
            callback('SIGNED_IN', { user: mockUser, session: { access_token: 'mock', refresh_token: 'mock' } });
          } else {
            callback('SIGNED_OUT', { user: null, session: null });
          }
        }, 100);
        
        return { 
          data: { 
            subscription: { 
              unsubscribe: () => {
                console.log('🔧 Mock client - auth subscription unsubscribed');
              } 
            } 
          } 
        };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        isMockSignedIn = true;
        return { data: { user: mockUser, session: { access_token: 'mock', refresh_token: 'mock' } }, error: null };
      },
      updateUser: async (payload: any) => {
        // Support both { data: { paid: true } } and { user_metadata: { paid: true } }
        if (payload.data && typeof payload.data === 'object') {
          mockUser.user_metadata = {
            ...mockUser.user_metadata,
            ...payload.data,
          };
        }
        if (payload.user_metadata) {
          mockUser.user_metadata = {
            ...mockUser.user_metadata,
            ...payload.user_metadata,
          };
        }
        Object.assign(mockUser, payload);
        return { data: { user: mockUser }, error: null };
      },
    },
    from: (table: string) => ({
      select: (columns?: string) => {
        console.log(`🔧 Mock client - select called on table: ${table}`);
        // Get the base data for this table
        const baseData = mockData[table as keyof typeof mockData] || [];
        console.log(`🔧 Mock client - base data for ${table}:`, baseData);
        
        // Create a query chain that can be executed
        const queryChain = {
          filters: [],
          limitCount: null,
          orderBy: null,
          
          eq: function (column: string, value: any) { 
            console.log(`🔧 Mock client - eq called: ${column} = ${value}`);
            this.filters.push({ column, value, operator: 'eq' });
            return this;
          },
          limit: function (count: number) { 
            console.log(`🔧 Mock client - limit called: ${count}`);
            this.limitCount = count;
            return this;
          },
          order: function (column: string, options?: any) { 
            this.orderBy = { column, options };
            return this;
          },
          gte: function (column: string, value: any) { 
            this.filters.push({ column, value, operator: 'gte' });
            return this;
          },
          lt: function (column: string, value: any) { 
            this.filters.push({ column, value, operator: 'lt' });
            return this;
          },
          is: function (column: string, value: any) {
            this.filters.push({ column, value, operator: 'is' });
            return this;
          },
          single: function () { 
            console.log(`🔧 Mock client - single called on ${table}`);
            // Apply filters to base data
            let filteredData = baseData;
            if (this.filters.length > 0) {
              console.log(`🔧 Mock client - applying ${this.filters.length} filters`);
              filteredData = baseData.filter(item => {
                return this.filters.every(filter => {
                  if (filter.operator === 'eq') {
                    return item[filter.column] === filter.value;
                  } else if (filter.operator === 'gte') {
                    return item[filter.column] >= filter.value;
                  } else if (filter.operator === 'lt') {
                    return item[filter.column] < filter.value;
                  } else if (filter.operator === 'is') {
                    return item[filter.column] === filter.value;
                  }
                  return true;
                });
              });
            }
            
            // Return first item or null
            const result = filteredData[0] || null;
            console.log(`🔧 Mock client - single result:`, result);
            return Promise.resolve({ data: result, error: result ? null : { code: 'PGRST116', message: 'No rows returned' } });
          },
          then: function (callback?: any) { 
            console.log(`🔧 Mock client - then called on ${table}`);
            // Apply filters to base data
            let filteredData = baseData;
            if (this.filters.length > 0) {
              console.log(`🔧 Mock client - applying ${this.filters.length} filters`);
              filteredData = baseData.filter(item => {
                return this.filters.every(filter => {
                  if (filter.operator === 'eq') {
                    return item[filter.column] === filter.value;
                  } else if (filter.operator === 'gte') {
                    return item[filter.column] >= filter.value;
                  } else if (filter.operator === 'lt') {
                    return item[filter.column] < filter.value;
                  } else if (filter.operator === 'is') {
                    return item[filter.column] === filter.value;
                  }
                  return true;
                });
              });
            }
            
            // Apply limit if specified
            if (this.limitCount) {
              console.log(`🔧 Mock client - applying limit: ${this.limitCount}`);
              filteredData = filteredData.slice(0, this.limitCount);
            }
            
            console.log(`🔧 Mock client - then result:`, filteredData);
            
            // Create a proper Promise that resolves immediately
            const result = { data: filteredData, error: null };
            console.log(`🔧 Mock client - resolving Promise with:`, result);
            
            // Return a proper Promise object
            return new Promise((resolve) => {
              resolve(result);
            });
          }
        };
        return queryChain;
      },
      insert: (data: any) => {
        const insertChain = {
          select: function(columns?: string) {
            // Add the data to the mock storage
            const tableData = mockData[table as keyof typeof mockData] || [];
            const newId = `${table}_${Date.now()}`;
            const newRecord = { ...data, id: newId };
            tableData.push(newRecord);
            mockData[table as keyof typeof mockData] = tableData;
            
            return Promise.resolve({ data: newRecord, error: null });
          },
          then: async (callback: any) => {
            // Add the data to the mock storage
            const tableData = mockData[table as keyof typeof mockData] || [];
            const newId = `${table}_${Date.now()}`;
            const newRecord = { ...data, id: newId };
            tableData.push(newRecord);
            mockData[table as keyof typeof mockData] = tableData;
            
            return { data: newRecord, error: null };
          }
        };
        return insertChain;
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          then: async (callback: any) => ({ data: data, error: null })
        })
      }),
      upsert: (data: any, options?: any) => ({
        then: async (callback: any) => ({ data: data, error: null })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: async (callback: any) => ({ data: null, error: null })
        })
      })
    }),
    channel: (name: string) => {
      const channel = {
        on: (event: string, callback: any) => {
          // Return the channel object to allow chaining
          return channel;
        },
        subscribe: (callback?: any) => ({
          unsubscribe: () => {}
        })
      };
      return channel;
    },
    rpc: (functionName: string, params?: any) => ({
      then: async (callback: any) => ({ data: null, error: null })
    }),
  } as any;

  return mockClient;
};

// Use mock client in development, real client in production
export const supabase = import.meta.env.DEV 
  ? createMockSupabaseClient()
  : createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co',
      import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key',
      {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            'x-application-name': 'mtdrb-admin',
          },
        },
      }
    );

// Mock health check function
export const checkSupabaseHealth = async (): Promise<boolean> => {
  if (import.meta.env.DEV) {
    console.log('🔧 Mock Supabase health check passed');
    return true;
  }
  
  try {
    const { data, error } = await supabase.from('tenants').select('id').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return false;
  }
};

// Mock auth helper
export const getCurrentUser = async (): Promise<{
  user: User | null;
  error: Error | null;
}> => {
  if (import.meta.env.DEV) {
    return { user: isMockSignedIn ? mockUser : null, error: null };
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

// Debug mode helper
if (import.meta.env.DEV) {
  (window as any).supabase = supabase;
  console.log('🔧 Mock Supabase client configured for development mode');
} 