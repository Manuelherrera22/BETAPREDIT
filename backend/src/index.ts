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

// Load environment variables
dotenv.config();

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
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redisClient.ping();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
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

// Error handling
app.use(errorHandler);

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

