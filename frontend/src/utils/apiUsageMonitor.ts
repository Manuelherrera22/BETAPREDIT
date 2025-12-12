/**
 * API Usage Monitor
 * Tracks API calls to prevent exceeding quotas
 */

interface UsageStats {
  totalCalls: number;
  callsToday: number;
  lastResetDate: string;
  callsByEndpoint: Record<string, number>;
}

class APIUsageMonitor {
  private readonly STORAGE_KEY = 'betapredit_api_usage';
  private readonly DAILY_LIMIT = 500; // Free plan limit
  private readonly WARNING_THRESHOLD = 0.8; // Warn at 80% usage

  /**
   * Get current usage stats
   */
  getUsage(): UsageStats {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const stats: UsageStats = JSON.parse(stored);
        const today = new Date().toDateString();
        
        // Reset daily count if it's a new day
        if (stats.lastResetDate !== today) {
          stats.callsToday = 0;
          stats.lastResetDate = today;
          this.saveUsage(stats);
        }
        
        return stats;
      }
    } catch (e) {
      console.warn('Failed to read API usage stats:', e);
    }

    // Default stats
    return {
      totalCalls: 0,
      callsToday: 0,
      lastResetDate: new Date().toDateString(),
      callsByEndpoint: {},
    };
  }

  /**
   * Record an API call
   */
  recordCall(endpoint: string): void {
    const stats = this.getUsage();
    stats.totalCalls++;
    stats.callsToday++;
    stats.callsByEndpoint[endpoint] = (stats.callsByEndpoint[endpoint] || 0) + 1;
    this.saveUsage(stats);

    // Warn if approaching limit
    if (stats.callsToday >= this.DAILY_LIMIT * this.WARNING_THRESHOLD) {
      console.warn(
        `⚠️ API Usage Warning: ${stats.callsToday}/${this.DAILY_LIMIT} calls today (${Math.round((stats.callsToday / this.DAILY_LIMIT) * 100)}%)`
      );
    }

    // Block if limit exceeded
    if (stats.callsToday >= this.DAILY_LIMIT) {
      console.error(
        `❌ API Usage Limit Exceeded: ${stats.callsToday}/${this.DAILY_LIMIT} calls today`
      );
    }
  }

  /**
   * Check if we can make an API call
   */
  canMakeCall(): boolean {
    const stats = this.getUsage();
    return stats.callsToday < this.DAILY_LIMIT;
  }

  /**
   * Get usage percentage
   */
  getUsagePercentage(): number {
    const stats = this.getUsage();
    return (stats.callsToday / this.DAILY_LIMIT) * 100;
  }

  /**
   * Save usage stats
   */
  private saveUsage(stats: UsageStats): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save API usage stats:', e);
    }
  }

  /**
   * Reset usage stats (for testing or manual reset)
   */
  reset(): void {
    const stats: UsageStats = {
      totalCalls: 0,
      callsToday: 0,
      lastResetDate: new Date().toDateString(),
      callsByEndpoint: {},
    };
    this.saveUsage(stats);
  }
}

export const apiUsageMonitor = new APIUsageMonitor();
export default apiUsageMonitor;




