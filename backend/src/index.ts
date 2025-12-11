import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { granularRateLimiter } from './middleware/rate-limiter-granular';
import { redisClient } from './config/redis';
import { prisma } from './config/database';
import { createDirectories } from './utils/createDirectories';

// Load environment variables FIRST
dotenv.config();

// Validate environment variables
import { validateEnvironmentVariables } from './config/env-validator';
try {
  validateEnvironmentVariables();
} catch (error: any) {
  console.error('❌ Error validando variables de entorno:', error.message);
  process.exit(1);
}

// Initialize Sentry (before other imports)
import { initSentry } from './config/sentry';
initSentry();

// Initialize The Odds API service after dotenv.config()
import { initializeTheOddsAPIService } from './services/integrations/the-odds-api.service';
initializeTheOddsAPIService();

// Initialize API-Football service after dotenv.config()
import { initializeAPIFootballService } from './services/integrations/api-football.service';
initializeAPIFootballService();

// Initialize Stripe service after dotenv.config()
import { initializeStripeService } from './services/payments/stripe.service';
initializeStripeService();

// Initialize Supabase after dotenv.config()
import { initializeSupabase } from './config/supabase';
initializeSupabase();

// Initialize Google OAuth service after dotenv.config()
// Note: This will be replaced by Supabase Auth, but keeping for backward compatibility
import { initializeGoogleOAuthService } from './services/oauth/google.service';
initializeGoogleOAuthService();

// Create necessary directories
createDirectories();

// Routes
import authRoutes from './api/routes/auth.routes';
import oddsRoutes from './api/routes/odds.routes';
import betsRoutes from './api/routes/bets.routes';
import eventsRoutes from './api/routes/events.routes';
import riskRoutes from './api/routes/risk.routes';
import rgRoutes from './api/routes/responsible-gaming.routes';
import integrationsRoutes from './api/routes/integrations.routes';
import externalBetsRoutes from './api/routes/external-bets.routes';
import valueBetAlertsRoutes from './api/routes/value-bet-alerts.routes';
import notificationsRoutes from './api/routes/notifications.routes';
import userStatisticsRoutes from './api/routes/user-statistics.routes';
import kalshiRoutes from './api/routes/kalshi.routes';
import theOddsAPIRoutes from './api/routes/the-odds-api.routes';
import apiFootballRoutes from './api/routes/api-football.routes';
import paymentsRoutes from './api/routes/payments.routes';
import arbitrageRoutes from './api/routes/arbitrage.routes';
import oauthRoutes from './api/routes/oauth.routes';
import referralsRoutes from './api/routes/referrals.routes';
import twoFactorRoutes from './api/routes/2fa.routes';
import valueBetDetectionRoutes from './api/routes/value-bet-detection.routes';
import userPreferencesRoutes from './api/routes/user-preferences.routes';
import valueBetAnalyticsRoutes from './api/routes/value-bet-analytics.routes';
import userProfileRoutes from './api/routes/user-profile.routes';
import roiTrackingRoutes from './api/routes/roi-tracking.routes';
import platformMetricsRoutes from './api/routes/platform-metrics.routes';
import predictionsRoutes from './api/routes/predictions.routes';
import universalPredictionsRoutes from './api/routes/universal-predictions.routes';

// Swagger
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();
const httpServer = createServer(app);

// Request ID middleware (should be first)
import { requestIdMiddleware } from './utils/request-id';
app.use(requestIdMiddleware);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

const PORT = process.env.PORT || 3000;

// Middleware
// Helmet configuration for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
}));

// CORS configuration - more restrictive in production
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'https://betapredit.com',
      'https://www.betapredit.com',
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Use granular rate limiter for better control
// Keep basic rate limiter as fallback for routes not covered
app.use(granularRateLimiter);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'BETAPREDIT API Documentation',
}));

// Health check
app.get('/health', async (_req, res) => {
  const services: any = {};
  
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    services.database = 'connected';
  } catch (error) {
    services.database = 'disconnected (using mock)';
  }
  
  try {
    // Check Redis connection
    await redisClient.ping();
    services.redis = 'connected';
  } catch (error) {
    services.redis = 'disconnected (using mock)';
  }
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services,
  });
});

// Test endpoint for debugging
app.post('/api/test/login', async (req, res) => {
  try {
    const { email } = req.body;
    logger.info('Test login attempt:', { email });
    
    // Simple test response
    res.json({
      success: true,
      message: 'Test endpoint working',
      data: { email, received: true },
    });
  } catch (error: any) {
    logger.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message, stack: error.stack },
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/odds', oddsRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/rg', rgRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/external-bets', externalBetsRoutes);
app.use('/api/value-bet-alerts', valueBetAlertsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/statistics', userStatisticsRoutes);
app.use('/api/kalshi', kalshiRoutes);
app.use('/api/the-odds-api', theOddsAPIRoutes);
app.use('/api/api-football', apiFootballRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/arbitrage', arbitrageRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/value-bet-detection', valueBetDetectionRoutes);
app.use('/api/value-bet-analytics', valueBetAnalyticsRoutes);
app.use('/api/user/profile', userProfileRoutes);
app.use('/api/user/preferences', userPreferencesRoutes);
app.use('/api/roi-tracking', roiTrackingRoutes);
app.use('/api/platform/metrics', platformMetricsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/universal-predictions', universalPredictionsRoutes);

// WebSocket connection handler
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Subscribe to odds updates for a specific event
  socket.on('subscribe:odds', (eventId: string) => {
    socket.join(`odds:${eventId}`);
    logger.info(`Client ${socket.id} subscribed to odds for event ${eventId}`);
  });

  // Subscribe to live events
  socket.on('subscribe:events', () => {
    socket.join('events:live');
    logger.info(`Client ${socket.id} subscribed to live events`);
  });

  // Subscribe to value bet alerts
  socket.on('subscribe:value-bets', (userId?: string) => {
    if (userId) {
      socket.join(`value-bets:${userId}`);
      logger.info(`Client ${socket.id} subscribed to value bets for user ${userId}`);
    } else {
      socket.join('value-bets:all');
      logger.info(`Client ${socket.id} subscribed to all value bets`);
    }
  });

  // Subscribe to notifications
  socket.on('subscribe:notifications', (userId: string) => {
    socket.join(`notifications:${userId}`);
    logger.info(`Client ${socket.id} subscribed to notifications for user ${userId}`);
  });

  // Subscribe to specific sport
  socket.on('subscribe:sport', (sport: string) => {
    socket.join(`sport:${sport}`);
    logger.info(`Client ${socket.id} subscribed to sport ${sport}`);
  });

  // Subscribe to arbitrage opportunities
  socket.on('subscribe:arbitrage', (options?: { sport?: string; minProfitMargin?: number }) => {
    if (options?.sport) {
      socket.join(`arbitrage:${options.sport}`);
      logger.info(`Client ${socket.id} subscribed to arbitrage for sport ${options.sport}`);
    } else {
      socket.join('arbitrage:all');
      logger.info(`Client ${socket.id} subscribed to all arbitrage opportunities`);
    }
  });

  // Subscribe to prediction updates
  socket.on('subscribe:predictions', (eventId?: string) => {
    if (eventId) {
      socket.join(`predictions:${eventId}`);
      logger.info(`Client ${socket.id} subscribed to predictions for event ${eventId}`);
    } else {
      socket.join('predictions:all');
      logger.info(`Client ${socket.id} subscribed to all prediction updates`);
    }
  });

  // Unsubscribe from a channel
  socket.on('unsubscribe', (channel: string) => {
    socket.leave(channel);
    logger.info(`Client ${socket.id} unsubscribed from ${channel}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Initialize WebSocket service
import { webSocketService } from './services/websocket.service';
webSocketService.initialize(io);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.path} not found` },
  });
});

// Error handling (must be last)
app.use(errorHandler);

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  // Stop scheduled tasks
  scheduledTasksService.stop();
  
  // Stop odds tracking
  if (process.env.ENABLE_ODDS_TRACKING !== 'false') {
    oddsTrackingService.stopTracking();
  }
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  await redisClient.quit();
  await prisma.$disconnect();
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize scheduled tasks
import { scheduledTasksService } from './services/scheduled-tasks.service';
scheduledTasksService.start();

// Initialize odds tracking service
import { oddsTrackingService } from './services/odds-tracking.service';
if (process.env.ENABLE_ODDS_TRACKING !== 'false') {
  oddsTrackingService.startTracking().catch((error) => {
    logger.error('Error starting odds tracking:', error);
  });
}

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`⏰ Scheduled tasks started`);
  if (process.env.ENABLE_ODDS_TRACKING !== 'false') {
    logger.info(`📈 Odds tracking enabled`);
  }
});

export { app, io };

