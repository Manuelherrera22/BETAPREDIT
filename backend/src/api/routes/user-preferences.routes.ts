/**
 * User Preferences Routes
 */

import { Router } from 'express';
import { userPreferencesController } from '../controllers/user-preferences.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  updateUserPreferencesSchema,
  updateValueBetPreferencesSchema,
} from '../../validators/user-preferences.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/user/preferences
 * @desc    Get user preferences
 * @access  Private
 */
router.get('/', userPreferencesController.getPreferences.bind(userPreferencesController));

/**
 * @route   PUT /api/user/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/', validate(updateUserPreferencesSchema), userPreferencesController.updatePreferences.bind(userPreferencesController));

/**
 * @route   GET /api/user/preferences/value-bets
 * @desc    Get value bet preferences only
 * @access  Private
 */
router.get('/value-bets', userPreferencesController.getValueBetPreferences.bind(userPreferencesController));

/**
 * @route   PUT /api/user/preferences/value-bets
 * @desc    Update value bet preferences only
 * @access  Private
 */
router.put('/value-bets', validate(updateValueBetPreferencesSchema), userPreferencesController.updateValueBetPreferences.bind(userPreferencesController));

export default router;
