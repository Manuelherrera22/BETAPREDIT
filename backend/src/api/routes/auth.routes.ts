import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema } from '../../validators/auth.validator';

const router = Router();

// Register new user
router.post('/register', validate(registerSchema), authController.register);

// Login
router.post('/login', validate(loginSchema), authController.login);

// Refresh token
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Verify email
router.get('/verify/:token', authController.verifyEmail);

// Request password reset
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password', authController.resetPassword);

// Sync Supabase user with our database
router.post('/supabase/sync', authController.syncSupabaseUser);

export default router;

