/**
 * User Profile Service
 * Frontend service for managing user profile
 * Uses Supabase Edge Function in production, backend API in development
 */

import api from './api';
import { isSupabaseConfigured } from '../config/supabase';

// Get Supabase Functions URL
const getSupabaseFunctionsUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/functions/v1`;
};

// Helper to get Supabase auth token
const getSupabaseAuthToken = async (): Promise<string | null> => {
  try {
    const { supabase } = await import('../config/supabase');
    if (!supabase) return null;
    
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      console.warn('No Supabase session found:', error?.message);
      return null;
    }
    return session.access_token;
  } catch (error) {
    console.error('Error getting Supabase auth token:', error);
    return null;
  }
};

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  avatar?: string;
  timezone?: string;
  preferredCurrency: string;
  preferredMode?: 'casual' | 'pro';
  subscriptionTier: string;
  createdAt: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  timezone?: string;
  preferredCurrency?: string;
  preferredMode?: 'casual' | 'pro';
}

export const userProfileService = {
  /**
   * Get current user profile
   * Uses Supabase Edge Function in production, backend API in development
   */
  getProfile: async (): Promise<UserProfile> => {
    // Use Supabase Edge Function in production
    const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
    const supabaseUrl = getSupabaseFunctionsUrl();
    
    if (isSupabaseConfigured() && supabaseUrl && isProduction) {
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available. Please log in.');
      }

      const url = `${supabaseUrl}/user-profile`;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
      };

      console.log('[userProfileService] Fetching profile from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to fetch profile';
        try {
          const error = await response.json();
          errorMessage = error.error?.message || error.message || errorMessage;
          console.error('[userProfileService] Error response:', error);
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          console.error('[userProfileService] Error status:', response.status, response.statusText);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch profile');
      }
      return result.data as UserProfile;
    }

    // Fallback to backend API in development
    const { data } = await api.get('/user/profile');
    return data.data as UserProfile;
  },

  /**
   * Update user profile
   * Uses Supabase Edge Function in production, backend API in development
   */
  updateProfile: async (profileData: UpdateProfileData): Promise<UserProfile> => {
    // Use Supabase Edge Function in production
    const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
    const supabaseUrl = getSupabaseFunctionsUrl();
    
    if (isSupabaseConfigured() && supabaseUrl && isProduction) {
      const token = await getSupabaseAuthToken();
      if (!token) {
        throw new Error('No authentication token available. Please log in.');
      }

      const url = `${supabaseUrl}/user-profile`;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
      };

      console.log('[userProfileService] Updating profile via:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update profile';
        try {
          const error = await response.json();
          errorMessage = error.error?.message || error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update profile');
      }
      return result.data as UserProfile;
    }

    // Fallback to backend API in development
    const { data } = await api.put('/user/profile', profileData);
    return data.data as UserProfile;
  },
};





