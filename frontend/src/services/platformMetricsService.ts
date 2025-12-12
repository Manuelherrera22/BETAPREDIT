/**
 * Platform Metrics Service
 * Frontend service for platform-wide statistics
 */

import api from './api';

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
  },
};




