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

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
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
} catch (error) {
  logger.warn('Database not available, using mock data');
  // Use simple mock if Prisma fails
  prisma = {
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
        const fullUser = {
          id: userId,
          email: args.data.email,
          passwordHash: args.data.passwordHash,
          firstName: args.data.firstName || args.data.email.split('@')[0] || null,
          lastName: args.data.lastName || null,
          role: args.data.role || 'user',
          createdAt: new Date(),
        };
        mockData.users.set(userId, fullUser);
        
        // Si hay un select, filtrar los campos
        if (args.select) {
          const selectedUser: any = {};
          for (const key of Object.keys(args.select)) {
            if (args.select[key] && fullUser[key as keyof typeof fullUser] !== undefined) {
              selectedUser[key] = fullUser[key as keyof typeof fullUser];
            }
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
        if (args.where.refreshToken) {
          for (const session of mockData.sessions.values()) {
            if (session.refreshToken === args.where.refreshToken) {
              return session;
            }
          }
        } else if (args.where.userId) {
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
        const session = mockData.sessions.get(args.where.userId);
        if (session) {
          Object.assign(session, args.data);
          return session;
        }
        return { id: '1', userId: args.where.userId, ...args.data };
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
  };
}

export { prisma };

