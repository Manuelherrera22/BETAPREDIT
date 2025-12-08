import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import crypto from 'crypto';

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'changeme';
  private readonly JWT_EXPIRES_IN = '15m';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Create RG settings
    await prisma.responsibleGaming.create({
      data: {
        userId: user.id,
      },
    });

    logger.info(`User registered: ${user.email}`);

    return user;
  }

  async login(email: string, password: string) {
    // Modo DEMO: Permitir acceso con cualquier credencial
    const DEMO_MODE = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
    
    if (DEMO_MODE) {
      // Buscar o crear usuario en modo demo
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Crear usuario automáticamente en modo demo
        const passwordHash = await bcrypt.hash(password, 12);
        user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName: email.split('@')[0],
            lastName: '',
            role: 'user',
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
            passwordHash: true,
          },
        });

        // Crear RG settings si no existen
        await prisma.responsibleGaming.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });

        logger.info(`Demo user auto-created: ${user.email}`);
      }

      // En modo demo, aceptar cualquier contraseña
      // (pero aún validamos que el usuario exista)
      
      // Generate tokens
      const tokens = this.generateTokens(user);

      // Create or update session
      await prisma.session.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        update: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        ...tokens,
      };
    }

    // Modo PRODUCCIÓN: Validación normal
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokens = this.generateTokens(session.user);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({
      where: { refreshToken },
    });
  }

  async verifyEmail(token: string) {
    // In a real implementation, you'd verify the token
    // For now, we'll just mark as verified
    throw new AppError('Email verification not implemented', 501);
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // In a real implementation, store this token and send email
    logger.info(`Password reset requested for ${email}, token: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string) {
    // In a real implementation, verify token and reset password
    throw new AppError('Password reset not implemented', 501);
  }

  private generateTokens(user: { id: string; email: string; role: string }) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();

