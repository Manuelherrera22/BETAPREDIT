/**
 * Supabase Configuration (Frontend)
 * Client for Supabase services
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log configuration status (only in development or if missing)
if (import.meta.env.DEV) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase not configured. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required.');
    console.warn('Current env:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing',
    });
  } else {
    console.log('✅ Supabase configured:', {
      url: supabaseUrl.substring(0, 30) + '...',
      hasKey: !!supabaseAnonKey,
    });
  }
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

