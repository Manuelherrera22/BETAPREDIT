/**
 * Supabase Configuration
 * Client for Supabase services (Auth, Database, Storage, etc.)
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Client with service role (for admin operations)
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

// Client with anon key (for user operations)
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const initializeSupabase = () => {
  if (!supabaseUrl) {
    logger.warn('⚠️  SUPABASE_URL not configured. Supabase features disabled.');
    return;
  }

  // Initialize admin client (service role - full access)
  if (supabaseServiceRoleKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    logger.info('✅ Supabase Admin client initialized');
  } else {
    logger.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not configured. Admin operations disabled.');
  }

  // Initialize client (anon key - user operations)
  if (supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    logger.info('✅ Supabase Client initialized');
  } else {
    logger.warn('⚠️  SUPABASE_ANON_KEY not configured. Client operations disabled.');
  }
};

// Get admin client (for server-side admin operations)
export const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return supabaseAdmin;
};

// Get client (for user operations)
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new Error('Supabase Client not initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
};

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey));
};

// Initialize on import
initializeSupabase();




