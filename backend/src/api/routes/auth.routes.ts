import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// Register new user
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Verify email
router.get('/verify/:token', authController.verifyEmail);

// Request password reset
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password', authController.resetPassword);

export default router;

