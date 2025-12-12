/**
 * Swagger Configuration
 * API documentation setup
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BETAPREDIT API',
      version: '1.0.0',
      description: 'API para plataforma de an?lisis predictivo de apuestas deportivas',
      contact: {
        name: 'BETAPREDIT Support',
        email: 'support@betapredit.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.betapredit.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Error message',
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Autenticaci?n y autorizaci?n',
      },
      {
        name: 'Bets',
        description: 'Gesti?n de apuestas',
      },
      {
        name: 'Events',
        description: 'Eventos deportivos',
      },
      {
        name: 'Odds',
        description: 'Cuotas y comparaci?n',
      },
      {
        name: 'Referrals',
        description: 'Sistema de referidos',
      },
      {
        name: 'Arbitrage',
        description: 'Detecci?n de arbitraje',
      },
      {
        name: 'Statistics',
        description: 'Estad?sticas de usuario',
      },
      {
        name: 'Predictions',
        description: 'Predicciones y an?lisis predictivo',
      },
      {
        name: 'Value Bets',
        description: 'Detecci?n de value bets y alertas',
      },
      {
        name: 'External Bets',
        description: 'Registro de apuestas externas',
      },
      {
        name: 'Payments',
        description: 'Pagos y suscripciones',
      },
      {
        name: 'User Profile',
        description: 'Perfil de usuario',
      },
      {
        name: 'User Preferences',
        description: 'Preferencias de usuario',
      },
      {
        name: 'Notifications',
        description: 'Notificaciones',
      },
      {
        name: 'ROI Tracking',
        description: 'Tracking de ROI',
      },
      {
        name: 'Platform Metrics',
        description: 'M?tricas de plataforma',
      },
    ],
  },
  apis: [
    './src/api/routes/*.ts', 
    './src/api/controllers/*.ts',
    './src/api/routes/swagger-docs/*.ts',
    './src/api/routes/swagger-docs/**/*.ts',
  ],
};

// Add common response schemas
const commonResponses = {
  UnauthorizedError: {
    description: 'No autorizado - Token inv?lido o expirado',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
        example: {
          success: false,
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
          },
        },
      },
    },
  },
  ServerError: {
    description: 'Error del servidor',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
        example: {
          success: false,
          error: {
            message: 'Internal server error',
            code: 'SERVER_ERROR',
          },
        },
      },
    },
  },
  ValidationError: {
    description: 'Error de validaci?n',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
        example: {
          success: false,
          error: {
            message: 'Error de validaci?n',
            code: 'VALIDATION_ERROR',
            details: [
              {
                field: 'email',
                message: 'Email inv?lido',
              },
            ],
          },
        },
      },
    },
  },
};

// Merge common responses into swagger spec
if (swaggerSpec.components) {
  swaggerSpec.components.responses = commonResponses;
}

export const swaggerSpec = swaggerJsdoc(options);

