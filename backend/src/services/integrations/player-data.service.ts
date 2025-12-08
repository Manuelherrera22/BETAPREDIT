/**
 * Player-Level Granular Data Service
 * Integrates with providers like ShotTracker and KINEXON
 * for granular player and ball tracking data
 * 
 * These systems use UWB (Ultra-Wideband) and RFID tags
 * generating 3+ TB of data per match
 */
import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

interface PlayerDataConfig {
  shotTrackerApiKey?: string;
  kinexonApiKey?: string;
  shotTrackerUrl?: string;
  kinexonUrl?: string;
}

interface PlayerTrackingData {
  playerId: string;
  playerName: string;
  position: {
    x: number;
    y: number;
    z?: number;
  };
  velocity: number;
  acceleration: number;
  timestamp: string;
}

interface BallTrackingData {
  position: {
    x: number;
    y: number;
    z: number;
  };
  velocity: number;
  timestamp: string;
}

interface MatchMetrics {
  eventId: string;
  playerMetrics: Map<string, PlayerMetrics>;
  teamMetrics: TeamMetrics;
  ballMetrics: BallMetrics;
  timestamp: string;
}

interface PlayerMetrics {
  playerId: string;
  distanceCovered: number;
  averageSpeed: number;
  maxSpeed: number;
  sprints: number;
  accelerations: number;
  decelerations: number;
  heatMap: Array<{ x: number; y: number; time: number }>;
  // Sport-specific metrics
  shots?: number;
  passes?: number;
  touches?: number;
}

interface TeamMetrics {
  teamId: string;
  totalDistance: number;
  averageSpeed: number;
  possession: number; // percentage
}

interface BallMetrics {
  totalDistance: number;
  averageSpeed: number;
  timeInPlay: number;
}

class PlayerDataService {
  private shotTrackerClient?: AxiosInstance;
  private kinexonClient?: AxiosInstance;
  private config: PlayerDataConfig;

  constructor(config: PlayerDataConfig) {
    this.config = config;

    if (config.shotTrackerApiKey && config.shotTrackerUrl) {
      this.shotTrackerClient = axios.create({
        baseURL: config.shotTrackerUrl,
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${config.shotTrackerApiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }

    if (config.kinexonApiKey && config.kinexonUrl) {
      this.kinexonClient = axios.create({
        baseURL: config.kinexonUrl,
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${config.kinexonApiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  /**
   * Get real-time player tracking data for an event
   * This data is crucial for ML models as team-level stats
   * don't reflect individual player performance or injuries
   */
  async getPlayerTrackingData(eventId: string): Promise<PlayerTrackingData[]> {
    try {
      // Try KINEXON first (if available)
      if (this.kinexonClient) {
        const response = await this.kinexonClient.get(`/events/${eventId}/players/tracking`, {
          params: {
            format: 'json',
            realtime: true,
          },
        });

        return response.data.players.map((p: any) => ({
          playerId: p.id,
          playerName: p.name,
          position: {
            x: p.position.x,
            y: p.position.y,
            z: p.position.z,
          },
          velocity: p.velocity,
          acceleration: p.acceleration,
          timestamp: p.timestamp,
        }));
      }

      // Fallback to ShotTracker
      if (this.shotTrackerClient) {
        const response = await this.shotTrackerClient.get(`/events/${eventId}/tracking`, {
          params: {
            format: 'json',
            realtime: true,
          },
        });

        return response.data.players || [];
      }

      logger.warn('No player tracking provider configured');
      return [];
    } catch (error) {
      logger.error(`Error fetching player tracking data for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get ball tracking data
   */
  async getBallTrackingData(eventId: string): Promise<BallTrackingData[]> {
    try {
      if (this.kinexonClient) {
        const response = await this.kinexonClient.get(`/events/${eventId}/ball/tracking`, {
          params: {
            format: 'json',
            realtime: true,
          },
        });

        return response.data.positions || [];
      }

      return [];
    } catch (error) {
      logger.error(`Error fetching ball tracking data for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get aggregated match metrics
   * Processes raw tracking data into actionable metrics
   */
  async getMatchMetrics(eventId: string): Promise<MatchMetrics> {
    try {
      const [playerData, ballData] = await Promise.all([
        this.getPlayerTrackingData(eventId),
        this.getBallTrackingData(eventId),
      ]);

      // Process player data into metrics
      const playerMetrics = new Map<string, PlayerMetrics>();

      // Group by player
      const playersMap = new Map<string, PlayerTrackingData[]>();
      playerData.forEach((data) => {
        if (!playersMap.has(data.playerId)) {
          playersMap.set(data.playerId, []);
        }
        playersMap.get(data.playerId)!.push(data);
      });

      // Calculate metrics per player
      playersMap.forEach((data, playerId) => {
        const distances = this.calculateDistances(data);
        const speeds = data.map((d) => d.velocity);
        const accelerations = data.map((d) => d.acceleration);

        playerMetrics.set(playerId, {
          playerId,
          distanceCovered: distances.total,
          averageSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
          maxSpeed: Math.max(...speeds),
          sprints: this.countSprints(speeds),
          accelerations: this.countAccelerations(accelerations),
          decelerations: this.countDecelerations(accelerations),
          heatMap: data.map((d) => ({
            x: d.position.x,
            y: d.position.y,
            time: new Date(d.timestamp).getTime(),
          })),
        });
      });

      // Calculate team metrics
      const teamMetrics: TeamMetrics = {
        teamId: 'team1', // Would be determined from event data
        totalDistance: Array.from(playerMetrics.values()).reduce(
          (sum, m) => sum + m.distanceCovered,
          0
        ),
        averageSpeed: 0, // Calculate from player metrics
        possession: 50, // Would be calculated from ball data
      };

      // Calculate ball metrics
      const ballMetrics: BallMetrics = {
        totalDistance: this.calculateBallDistance(ballData),
        averageSpeed: this.calculateBallAverageSpeed(ballData),
        timeInPlay: ballData.length * 0.1, // Assuming 0.1s intervals
      };

      return {
        eventId,
        playerMetrics,
        teamMetrics,
        ballMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error calculating match metrics for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get player-specific metrics
   * Critical for ML models as individual performance affects odds
   */
  async getPlayerMetrics(eventId: string, playerId: string): Promise<PlayerMetrics | null> {
    try {
      const metrics = await this.getMatchMetrics(eventId);
      return metrics.playerMetrics.get(playerId) || null;
    } catch (error) {
      logger.error(`Error fetching player metrics for ${playerId}:`, error);
      return null;
    }
  }

  // Helper methods
  private calculateDistances(data: PlayerTrackingData[]): { total: number; segments: number[] } {
    const segments: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      const distance = Math.sqrt(
        Math.pow(curr.position.x - prev.position.x, 2) +
          Math.pow(curr.position.y - prev.position.y, 2)
      );
      segments.push(distance);
    }
    return {
      total: segments.reduce((a, b) => a + b, 0),
      segments,
    };
  }

  private countSprints(speeds: number[]): number {
    const sprintThreshold = 7.0; // m/s (sport-specific)
    return speeds.filter((s) => s > sprintThreshold).length;
  }

  private countAccelerations(accelerations: number[]): number {
    const threshold = 2.0; // m/s²
    return accelerations.filter((a) => a > threshold).length;
  }

  private countDecelerations(accelerations: number[]): number {
    const threshold = -2.0; // m/s²
    return accelerations.filter((a) => a < threshold).length;
  }

  private calculateBallDistance(data: BallTrackingData[]): number {
    let total = 0;
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      const distance = Math.sqrt(
        Math.pow(curr.position.x - prev.position.x, 2) +
          Math.pow(curr.position.y - prev.position.y, 2) +
          Math.pow((curr.position.z || 0) - (prev.position.z || 0), 2)
      );
      total += distance;
    }
    return total;
  }

  private calculateBallAverageSpeed(data: BallTrackingData[]): number {
    if (data.length === 0) return 0;
    const speeds = data.map((d) => d.velocity);
    return speeds.reduce((a, b) => a + b, 0) / speeds.length;
  }
}

// Factory function
export function createPlayerDataService(): PlayerDataService {
  return new PlayerDataService({
    shotTrackerApiKey: process.env.SHOTTRACKER_API_KEY,
    kinexonApiKey: process.env.KINEXON_API_KEY,
    shotTrackerUrl: process.env.SHOTTRACKER_API_URL,
    kinexonUrl: process.env.KINEXON_API_URL,
  });
}

export const playerDataService = createPlayerDataService();

