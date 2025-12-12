/**
 * OAuth Routes
 */

import { Router } from 'express';
import { oauthController } from '../controllers/oauth.controller';

const router = Router();

// Google OAuth
router.get('/google', oauthController.initiateGoogle.bind(oauthController));
router.get('/google/callback', oauthController.googleCallback.bind(oauthController));

export default router;





