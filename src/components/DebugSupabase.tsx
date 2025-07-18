import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function DebugSupabase() {
  const [status, setStatus] = useState<string[]>([]);

  useEffect(() => {
    const runTests = async () => {
      const logs: string[] = [];
      
      try {
        // Test 1: Check environment variables
        logs.push(`✓ Supabase URL: ${import.meta.env.VITE_SUPABASE_URL || 'MISSING'}`);
        logs.push(`✓ Has Supabase Key: ${!!import.meta.env.VITE_SUPABASE_ANON_KEY}`);
        
        // Test 2: Check auth status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          logs.push(`❌ Auth Error: ${authError.message}`);
        } else {
          logs.push(`✓ Auth Status: ${user ? `Logged in as ${user.id}` : 'Not logged in'}`);
        }

        // Test 3: Test basic table access
        logs.push('🔍 Testing members table access...');
        const { data, error } = await supabase
          .from('members')
          .select('id, name')
          .limit(1);
          
        if (error) {
          logs.push(`❌ Members Table Error: ${error.message}`);
          logs.push(`   Code: ${error.code}`);
          logs.push(`   Details: ${error.details}`);
          logs.push(`   Hint: ${error.hint}`);
        } else {
          logs.push(`✓ Members Table: Accessible (${data?.length || 0} records found)`);
        }

        // Test 4: Test memberships table
        logs.push('🔍 Testing memberships table access...');
        const { data: membershipData, error: membershipError } = await supabase
          .from('memberships')
          .select('tenant_id')
          .limit(1);
          
        if (membershipError) {
          logs.push(`❌ Memberships Table Error: ${membershipError.message}`);
        } else {
          logs.push(`✓ Memberships Table: Accessible (${membershipData?.length || 0} records found)`);
        }
        
      } catch (error: any) {
        logs.push(`❌ Unexpected Error: ${error.message}`);
      }
      
      setStatus(logs);
    };

    runTests();
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-md z-50">
      <h3 className="font-bold mb-2">🔧 Supabase Debug</h3>
      <div className="text-xs space-y-1">
        {status.map((line, index) => (
          <div key={index} className={`font-mono ${
            line.startsWith('❌') ? 'text-red-600' : 
            line.startsWith('✓') ? 'text-green-600' : 
            'text-gray-600'
          }`}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
} 