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
import { redisClient } from './config/redis';
import { prisma } from './config/database';
import { createDirectories } from './utils/createDirectories';

// Load environment variables FIRST
dotenv.config();

// Initialize The Odds API service after dotenv.config()
import { initializeTheOddsAPIService } from './services/integrations/the-odds-api.service';
initializeTheOddsAPIService();

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

const app = express();
const httpServer = createServer(app);
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
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

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
    const { email, password } = req.body;
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

// WebSocket connection handler
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe:odds', (eventId: string) => {
    socket.join(`odds:${eventId}`);
    logger.info(`Client ${socket.id} subscribed to odds for event ${eventId}`);
  });

  socket.on('subscribe:events', () => {
    socket.join('events:live');
    logger.info(`Client ${socket.id} subscribed to live events`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// 404 handler
app.use((req, res, next) => {
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
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  await redisClient.quit();
  await prisma.$disconnect();
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, io };

