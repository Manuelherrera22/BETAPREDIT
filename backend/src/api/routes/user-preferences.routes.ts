/**
 * User Preferences Routes
 */

import { Router } from 'express';
import { userPreferencesController } from '../controllers/user-preferences.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/user-preferences
 * @desc    Get user preferences
 * @access  Private
 */
router.get('/', userPreferencesController.getPreferences);

/**
 * @route   PUT /api/user-preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/', userPreferencesController.updatePreferences);

/**
 * @route   GET /api/user-preferences/value-bets
 * @desc    Get value bet preferences
 * @access  Private
 */
router.get('/value-bets', userPreferencesController.getValueBetPreferences);

/**
 * @route   PUT /api/user-preferences/value-bets
 * @desc    Update value bet preferences
 * @access  Private
 */
router.put('/value-bets', userPreferencesController.updateValueBetPreferences);

export default router;

