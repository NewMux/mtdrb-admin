/**
 * Script to add a test member to the database
 * Run with: node scripts/add-test-member.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
  process.env.VITE_SUPABASE_URL = envVars.VITE_SUPABASE_URL;
  process.env.VITE_SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
} catch (error) {
  console.error('Could not read .env file:', error.message);
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestMember() {
  try {
    console.log('🔐 Checking authentication...');
    
    // Get current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Not authenticated. Please log in to the app first, then run this script.');
      console.error('Error:', userError?.message || 'No user found');
      console.log('\n💡 Tip: Open your app in the browser, log in, then run this script.');
      process.exit(1);
    }

    console.log('✅ Authenticated as:', user.email);

    // Get tenant ID
    let tenantId = user.user_metadata?.tenant_id;
    
    if (!tenantId) {
      console.log('🔍 Fetching tenant ID from memberships...');
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      
      if (membershipError || !membership) {
        console.error('❌ Could not find tenant ID.');
        console.error('Error:', membershipError?.message);
        process.exit(1);
      }
      
      tenantId = membership.tenant_id;
    }

    console.log('✅ Found tenant ID:', tenantId);

    // Create test member
    const testMember = {
      tenant_id: tenantId,
      first_name: 'Ahmed',
      last_name: 'Al-Mansoori',
      email: `ahmed.almansoori.${Date.now()}@example.com`,
      phone: '+973 1234 5678',
      status: 'active',
      membership_type: 'Premium',
      membership_status: 'active',
      join_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      metadata: {
        gender: 'Male',
        fitness_level: 'Intermediate',
        primary_goals: ['Muscle Gain', 'Strength Training'],
        language: 'English',
        membership_price: 199,
        weight: 75,
        target_weight: 80,
        height: 175,
        date_of_birth: '1990-05-15',
        emergency_contact: '+973 9876 5432',
        consent_signed: true,
        previous_gym_experience: true,
        workout_frequency_goal: 4,
        preferred_workout_times: ['Morning', 'Evening'],
        staff_notes: 'Test member added via script',
        tags: ['VIP', 'Athlete'],
      },
    };

    console.log('📝 Inserting test member...');
    
    // Insert member
    const { data, error } = await supabase
      .from('members')
      .insert(testMember)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to add member:', error.message);
      console.error('Details:', error);
      process.exit(1);
    }

    console.log('\n✅ Successfully added test member!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Member ID:', data.id);
    console.log('Name:', `${data.first_name} ${data.last_name}`);
    console.log('Email:', data.email);
    console.log('Phone:', data.phone);
    console.log('Membership:', data.membership_type);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

addTestMember();
