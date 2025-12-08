import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// In-memory storage for mock database
const mockData: {
  users: Map<string, any>;
  sessions: Map<string, any>;
  responsibleGaming: Map<string, any>;
} = {
  users: new Map(),
  sessions: new Map(),
  responsibleGaming: new Map(),
};

// Try to use real Prisma, fallback to simple mock if DB not available
let prisma: any;

// Check if DATABASE_URL is set and valid, otherwise use mock
const DATABASE_URL = process.env.DATABASE_URL;
const useRealDB = DATABASE_URL && 
  DATABASE_URL.includes('postgresql://') && 
  !DATABASE_URL.includes('changeme') &&
  (DATABASE_URL.includes('supabase.co') || DATABASE_URL.includes('localhost'));

// Function to create mock Prisma
function createMockPrisma() {
  return {
    $queryRaw: async () => [{ '?column?': 1 }],
    $disconnect: async () => {},
    user: {
      findUnique: async (args: any) => {
        let foundUser = null;
        if (args.where.email) {
          // Buscar por email
          for (const user of mockData.users.values()) {
            if (user.email === args.where.email) {
              foundUser = user;
              break;
            }
          }
        } else if (args.where.id) {
          // Buscar por id
          foundUser = mockData.users.get(args.where.id) || null;
        }
        
        // Si hay un select, filtrar los campos
        if (foundUser && args.select) {
          const selectedUser: any = {};
          for (const key of Object.keys(args.select)) {
            if (args.select[key] && foundUser[key as keyof typeof foundUser] !== undefined) {
              selectedUser[key] = foundUser[key as keyof typeof foundUser];
            }
          }
          return selectedUser;
        }
        
        return foundUser;
      },
      findFirst: async () => null,
      create: async (args: any) => {
        const userId = crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`;
        const fullUser: any = {
          id: userId,
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          firstName: args.data.firstName || args.data.email.split('@')[0] || null,
          lastName: args.data.lastName || null,
          role: args.data.role || 'USER',
          createdAt: new Date(),
          verified: false,
          kycStatus: 'PENDING',
        };
        mockData.users.set(userId, fullUser);
        
        // Si hay un select, filtrar los campos
        if (args.select) {
          const selectedUser: any = {};
          for (const key of Object.keys(args.select)) {
            if (args.select[key] && fullUser[key] !== undefined) {
              selectedUser[key] = fullUser[key];
            }
          }
          // Asegurar que siempre devolvemos los campos requeridos
          if (args.select.role && !selectedUser.role) {
            selectedUser.role = fullUser.role || 'USER';
          }
          return selectedUser;
        }
        
        return fullUser;
      },
      update: async (args: any) => {
        const user = mockData.users.get(args.where.id);
        if (user) {
          Object.assign(user, args.data);
          return user;
        }
        return { id: args.where.id, ...args.data };
      },
      findMany: async () => Array.from(mockData.users.values()),
    },
    event: {
      findUnique: async () => null,
      findMany: async () => [],
    },
    odds: {
      findUnique: async () => null,
      findMany: async () => [],
    },
    bet: {
      findMany: async () => [],
      findFirst: async () => null,
      create: async (args: any) => ({ id: '1', ...args.data }),
    },
    responsibleGaming: {
      findUnique: async (args: any) => {
        if (args.where.userId) {
          return mockData.responsibleGaming.get(args.where.userId) || null;
        }
        return null;
      },
      create: async (args: any) => {
        const rg = {
          id: crypto.randomUUID ? crypto.randomUUID() : `rg-${Date.now()}`,
          userId: args.data.userId,
          ...args.data,
        };
        mockData.responsibleGaming.set(args.data.userId, rg);
        return rg;
      },
      upsert: async (args: any) => {
        const userId = args.where.userId;
        const existing = mockData.responsibleGaming.get(userId);
        if (existing) {
          Object.assign(existing, args.update || args.create);
          return existing;
        } else {
          const rg = {
            id: crypto.randomUUID ? crypto.randomUUID() : `rg-${Date.now()}`,
            userId: userId,
            ...args.create,
          };
          mockData.responsibleGaming.set(userId, rg);
          return rg;
        }
      },
    },
    riskExposure: {
      findMany: async () => [],
      upsert: async (args: any) => ({ id: '1', ...args.create }),
      aggregate: async () => ({ _sum: { potentialLiability: 0 } }),
    },
    fraudAlert: {
      findMany: async () => [],
      create: async (args: any) => ({ id: '1', ...args.data }),
      count: async () => 0,
    },
    transaction: {
      findMany: async () => [],
      aggregate: async () => ({ _sum: { amount: 0 } }),
    },
    session: {
      findUnique: async (args: any) => {
        if (args.where.id) {
          for (const session of mockData.sessions.values()) {
            if (session.id === args.where.id) {
              return session;
            }
          }
        } else if (args.where.refreshToken) {
          for (const session of mockData.sessions.values()) {
            if (session.refreshToken === args.where.refreshToken) {
              return session;
            }
          }
        }
        return null;
      },
      findFirst: async (args: any) => {
        if (args.where.userId) {
          return mockData.sessions.get(args.where.userId) || null;
        }
        return null;
      },
      create: async (args: any) => {
        const session = {
          id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
          userId: args.data.userId,
          token: args.data.token,
          refreshToken: args.data.refreshToken,
          expiresAt: args.data.expiresAt,
        };
        mockData.sessions.set(args.data.userId, session);
        return session;
      },
      update: async (args: any) => {
        let session = null;
        if (args.where.id) {
          for (const s of mockData.sessions.values()) {
            if (s.id === args.where.id) {
              session = s;
              break;
            }
          }
        } else if (args.where.userId) {
          session = mockData.sessions.get(args.where.userId);
        }
        if (session) {
          Object.assign(session, args.data);
          return session;
        }
        throw new Error('Session not found');
      },
      upsert: async (args: any) => {
        const userId = args.where.userId;
        const existing = mockData.sessions.get(userId);
        if (existing) {
          // Update
          Object.assign(existing, args.update);
          return existing;
        } else {
          // Create
          const session = {
            id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
            userId: userId,
            ...args.create,
          };
          mockData.sessions.set(userId, session);
          return session;
        }
      },
      deleteMany: async (args: any) => {
        let count = 0;
        if (args.where.refreshToken) {
          for (const [key, session] of mockData.sessions.entries()) {
            if (session.refreshToken === args.where.refreshToken) {
              mockData.sessions.delete(key);
              count++;
            }
          }
        }
        return { count };
      },
    },
    oddsHistory: {
      findMany: async () => [],
    },
    $transaction: async (queries: any[]) => {
      const results = [];
      for (const query of queries) {
        results.push(await query);
      }
      return results;
    },
    $connect: async () => {},
  };
}

// Initialize Prisma - Use real database if available, otherwise use mock
if (useRealDB) {
  try {
    logger.info('Connecting to Supabase database...');
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['warn', 'error']
        : ['error'],
    });

    // Connection event handlers
    prisma.$on('error' as never, (e: Error) => {
      logger.error('Prisma error:', e);
    });

    // Graceful disconnect on process termination
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
    
    // Test connection asynchronously
    prisma.$connect()
      .then(() => {
        logger.info('✅ Connected to Supabase database successfully');
      })
      .catch((error: any) => {
        logger.warn('⚠️ Database connection failed, using mock data:', error.message);
        prisma = createMockPrisma();
      });
  } catch (error: any) {
    logger.warn('⚠️ Database not available, using mock data:', error.message);
    prisma = createMockPrisma();
  }
} else {
  logger.info('Using mock database (no valid DATABASE_URL found)');
  logger.info('To use Supabase, set DATABASE_URL in .env with format:');
  logger.info('postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres');
  prisma = createMockPrisma();
}

export { prisma };

