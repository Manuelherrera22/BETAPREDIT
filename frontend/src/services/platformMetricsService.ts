/**
 * Platform Metrics Service
 * Frontend service for platform-wide statistics
 * Uses Supabase Edge Function in production, backend API in development
 */

import api from './api';

// Helper to get Supabase Functions URL
const getSupabaseFunctionsUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/functions/v1`;
};

export interface PlatformMetrics {
  valueBetsFoundToday: number;
  activeUsers: number;
  averageROI: number;
  averageAccuracy: number;
  totalValueBetsFound: number;
  totalUsers: number;
  trends: {
    valueBetsChange: string;
    usersChange: string;
    roiChange: string;
    accuracyChange: string;
  };
}

export const platformMetricsService = {
  /**
   * Get platform metrics
   */
  getMetrics: async (): Promise<PlatformMetrics> => {
    const isProduction = import.meta.env.PROD;
    const supabaseUrl = getSupabaseFunctionsUrl();

    if (isProduction && supabaseUrl) {
      // Use Supabase Edge Function
      try {
        const response = await fetch(`${supabaseUrl}/platform-metrics`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to get platform metrics');
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Error fetching platform metrics:', error);
        // Return default metrics on error
        return {
          valueBetsFoundToday: 0,
          activeUsers: 0,
          averageROI: 0,
          averageAccuracy: 0,
          totalValueBetsFound: 0,
          totalUsers: 0,
          trends: {
            valueBetsChange: '0 vs mes anterior',
            usersChange: '0 este mes',
            roiChange: '0% vs mes anterior',
            accuracyChange: '0%',
          },
        };
      }
    } else {
      // Use local backend
      try {
        const { data } = await api.get('/platform/metrics');
        return data.data as PlatformMetrics;
      } catch (error) {
        console.error('Error fetching platform metrics:', error);
        // Return default metrics on error
        return {
          valueBetsFoundToday: 0,
          activeUsers: 0,
          averageROI: 0,
          averageAccuracy: 0,
          totalValueBetsFound: 0,
          totalUsers: 0,
          trends: {
            valueBetsChange: '0 vs mes anterior',
            usersChange: '0 este mes',
            roiChange: '0% vs mes anterior',
            accuracyChange: '0%',
          },
        };
      }
    }
  },
};





