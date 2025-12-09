/**
 * User Profile Routes
 */

import { Router } from 'express';
import { userProfileController } from '../controllers/user-profile.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/user/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/', userProfileController.getProfile.bind(userProfileController));

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/', userProfileController.updateProfile.bind(userProfileController));

export default router;

