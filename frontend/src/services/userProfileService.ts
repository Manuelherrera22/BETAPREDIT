/**
 * User Profile Service
 * Frontend service for managing user profile
 */

import api from './api';

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
   */
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await api.get('/user/profile');
    return data.data as UserProfile;
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData: UpdateProfileData): Promise<UserProfile> => {
    const { data } = await api.put('/user/profile', profileData);
    return data.data as UserProfile;
  },
};





