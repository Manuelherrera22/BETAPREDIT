/**
 * User Preferences Controller
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { userPreferencesService } from '../../services/user-preferences.service';

class UserPreferencesController {
  /**
   * Get user preferences
   * GET /api/user-preferences
   */
  async getPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const preferences = await userPreferencesService.getUserPreferences(userId);
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user preferences
   * PUT /api/user-preferences
   */
  async updatePreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const preferences = await userPreferencesService.updateUserPreferences(
        userId,
        req.body
      );
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get value bet preferences
   * GET /api/user-preferences/value-bets
   */
  async getValueBetPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const preferences = await userPreferencesService.getValueBetPreferences(userId);
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update value bet preferences
   * PUT /api/user-preferences/value-bets
   */
  async updateValueBetPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const preferences = await userPreferencesService.updateValueBetPreferences(
        userId,
        req.body
      );
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }
}

export const userPreferencesController = new UserPreferencesController();

