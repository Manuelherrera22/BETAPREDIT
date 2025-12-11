/**
 * Arbitrage Controller
 * Handles API requests for arbitrage opportunities
 */

import { Request, Response, NextFunction } from 'express';
import { arbitrageService } from '../../services/arbitrage/arbitrage.service';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { AuthRequest } from '../../middleware/auth';

class ArbitrageController {
  /**
   * Get all active arbitrage opportunities
   * GET /api/arbitrage/opportunities
   */
  async getOpportunities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { minProfitMargin, sport, limit } = req.query;

      const opportunities = await arbitrageService.getActiveOpportunities({
        minProfitMargin: minProfitMargin ? parseFloat(minProfitMargin as string) : undefined,
        sport: sport as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: opportunities,
        count: opportunities.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Detect arbitrage for a specific event
   * GET /api/arbitrage/event/:eventId
   */
  async detectForEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const { marketType, minProfitMargin } = req.query;

      const opportunities = await arbitrageService.detectArbitrageForEvent(
        eventId,
        (marketType as string) || 'h2h',
        minProfitMargin ? parseFloat(minProfitMargin as string) : 0.01
      );

      res.json({
        success: true,
        data: opportunities,
        count: opportunities.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate stakes for an arbitrage opportunity
   * POST /api/arbitrage/calculate-stakes
   */
  async calculateStakes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { opportunity, totalBankroll } = req.body;

      if (!opportunity || !totalBankroll) {
        throw new AppError('Opportunity and totalBankroll are required', 400);
      }

      if (totalBankroll <= 0) {
        throw new AppError('Total bankroll must be greater than 0', 400);
      }

      const stakes = arbitrageService.calculateStakes(opportunity, totalBankroll);

      // Calculate total stake and guaranteed profit
      const totalStake = stakes.reduce((sum, s) => sum + s.stake, 0);
      const guaranteedProfit = totalStake * (1 - opportunity.totalImpliedProbability);

      res.json({
        success: true,
        data: {
          stakes,
          totalStake: Math.round(totalStake * 100) / 100,
          guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
          roi: opportunity.roi,
          profitMargin: opportunity.profitMargin * 100,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const arbitrageController = new ArbitrageController();



