/**
 * Supabase Configuration (Frontend)
 * Client for Supabase services
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log configuration status (ALWAYS, not just in dev)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase not configured!');
  console.error('Missing variables:', {
    VITE_SUPABASE_URL: !supabaseUrl ? 'MISSING' : 'OK',
    VITE_SUPABASE_ANON_KEY: !supabaseAnonKey ? 'MISSING' : 'OK',
  });
  console.error('Current env values:', {
    url: supabaseUrl || 'undefined',
    key: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'undefined',
  });
} else {
  console.log('✅ Supabase configured:', {
    url: supabaseUrl.substring(0, 30) + '...',
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey.length,
  });
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const isSupabaseConfigured = () => {
  const configured = !!(supabaseUrl && supabaseAnonKey);
  if (!configured && import.meta.env.DEV) {
    console.warn('Supabase not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
  return configured;
};

