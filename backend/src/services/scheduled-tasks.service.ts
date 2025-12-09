/**
 * Scheduled Tasks Service
 * Manages cron jobs and scheduled tasks
 */

import { logger } from '../utils/logger';
import { valueBetDetectionService } from './value-bet-detection.service';
import { valueBetAlertsService } from './value-bet-alerts.service';
import { webSocketService } from './websocket.service';
import { notificationsService } from './notifications.service';
import { userPreferencesService } from './user-preferences.service';
import { prisma } from '../config/database';

class ScheduledTasksService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  /**
   * Start all scheduled tasks
   */
  start() {
    if (this.isRunning) {
      logger.warn('Scheduled tasks already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting scheduled tasks...');

    // Scan for value bets every 15 minutes
    this.startValueBetScan(15 * 60 * 1000); // 15 minutes

    // Expire old alerts every hour
    this.startAlertExpiration(60 * 60 * 1000); // 1 hour

    logger.info('Scheduled tasks started');
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping scheduled tasks...');

    // Clear all intervals
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      logger.info(`Stopped scheduled task: ${name}`);
    });

    this.intervals.clear();
    logger.info('All scheduled tasks stopped');
  }

  /**
   * Start value bet scanning task
   */
  private startValueBetScan(intervalMs: number) {
    const taskName = 'value-bet-scan';

    // Run immediately on start
    this.runValueBetScan();

    // Then run on interval
    const interval = setInterval(() => {
      this.runValueBetScan();
    }, intervalMs);

    this.intervals.set(taskName, interval);
    logger.info(`Started value bet scan task (interval: ${intervalMs / 1000}s)`);
  }

  /**
   * Run value bet scan
   */
  private async runValueBetScan() {
    try {
      logger.info('Running scheduled value bet scan...');

      // Scan all sports for value bets with auto-create alerts enabled
      const valueBets = await valueBetDetectionService.scanAllSports({
        minValue: 0.05, // 5% minimum value
        maxEvents: 20, // Check up to 20 events per sport
        autoCreateAlerts: true, // Automatically create alerts
      });

      if (valueBets && valueBets.length > 0) {
        logger.info(`Detected ${valueBets.length} value bets`);

        // Notify users about high-value bets (value >= 10%)
        const highValueBets = valueBets.filter((vb: any) => vb.valuePercentage >= 10);

        if (highValueBets.length > 0) {
          logger.info(`Found ${highValueBets.length} high-value bets (>=10%)`);

          // Send WebSocket notifications to all connected users
          // Note: In production, you'd want to notify only subscribed users
          webSocketService.broadcast('value-bets:new', {
            count: highValueBets.length,
            valueBets: highValueBets.slice(0, 5), // Top 5
            timestamp: new Date().toISOString(),
          });

          // Create in-app notifications for high-value bets
          // Get all users who want notifications for value bets
          try {
            const users = await prisma.user.findMany({
              where: {
                // Only users with active subscriptions or free tier with notifications enabled
                OR: [
                  { subscriptionTier: { in: ['BASIC', 'PREMIUM', 'PRO'] } },
                  { subscriptionTier: 'FREE' }, // Free users can also get notifications
                ],
              },
              select: {
                id: true,
                email: true,
                alertPreferences: true,
              },
            });

            for (const user of users) {
              try {
                // Get user's value bet preferences
                const preferences = await userPreferencesService.getValueBetPreferences(user.id);
                
                // Check if user wants notifications for this value threshold
                const notificationThreshold = preferences.notificationThreshold || 0.10; // 10% default
                
                // Only notify if value >= user's threshold
                const relevantValueBets = highValueBets.filter(
                  (vb: any) => vb.valuePercentage >= notificationThreshold * 100
                );

                if (relevantValueBets.length > 0) {
                  // Send WebSocket notification
                  webSocketService.emitValueBetAlert(user.id, {
                    count: relevantValueBets.length,
                    valueBets: relevantValueBets.slice(0, 5), // Top 5
                    timestamp: new Date().toISOString(),
                  });

                  // Create in-app notification
                  await notificationsService.createNotification({
                    userId: user.id,
                    type: 'VALUE_BET_DETECTED',
                    title: `${relevantValueBets.length} Value Bet${relevantValueBets.length > 1 ? 's' : ''} Detectado${relevantValueBets.length > 1 ? 's' : ''}`,
                    message: `Se detectaron ${relevantValueBets.length} value bet${relevantValueBets.length > 1 ? 's' : ''} con valor >= ${notificationThreshold * 100}%`,
                    data: {
                      valueBets: relevantValueBets.slice(0, 5),
                      count: relevantValueBets.length,
                    },
                  });
                }
              } catch (error: any) {
                logger.error(`Error creating notification for user ${user.id}:`, error.message);
                continue;
              }
            }
          } catch (error: any) {
            logger.error('Error getting users for notifications:', error);
          }
        }
      } else {
        logger.info('No value bets detected in this scan');
      }
    } catch (error: any) {
      logger.error('Error running value bet scan:', error);
    }
  }

  /**
   * Start alert expiration task
   */
  private startAlertExpiration(intervalMs: number) {
    const taskName = 'alert-expiration';

    // Run immediately on start
    this.runAlertExpiration();

    // Then run on interval
    const interval = setInterval(() => {
      this.runAlertExpiration();
    }, intervalMs);

    this.intervals.set(taskName, interval);
    logger.info(`Started alert expiration task (interval: ${intervalMs / 1000}s)`);
  }

  /**
   * Run alert expiration
   */
  private async runAlertExpiration() {
    try {
      logger.info('Running scheduled alert expiration...');
      const expiredCount = await valueBetAlertsService.expireOldAlerts();
      if (expiredCount > 0) {
        logger.info(`Expired ${expiredCount} old value bet alerts`);
      }
    } catch (error: any) {
      logger.error('Error running alert expiration:', error);
    }
  }

  /**
   * Get status of scheduled tasks
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      tasks: Array.from(this.intervals.keys()),
      count: this.intervals.size,
    };
  }
}

export const scheduledTasksService = new ScheduledTasksService();

