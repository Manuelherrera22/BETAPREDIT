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
      description: 'API para plataforma de análisis predictivo de apuestas deportivas',
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
        description: 'Autenticación y autorización',
      },
      {
        name: 'Bets',
        description: 'Gestión de apuestas',
      },
      {
        name: 'Events',
        description: 'Eventos deportivos',
      },
      {
        name: 'Odds',
        description: 'Cuotas y comparación',
      },
      {
        name: 'Referrals',
        description: 'Sistema de referidos',
      },
      {
        name: 'Arbitrage',
        description: 'Detección de arbitraje',
      },
      {
        name: 'Statistics',
        description: 'Estadísticas de usuario',
      },
      {
        name: 'Predictions',
        description: 'Predicciones y análisis predictivo',
      },
      {
        name: 'Value Bets',
        description: 'Detección de value bets y alertas',
      },
    ],
  },
  apis: ['./src/api/routes/*.ts', './src/api/controllers/*.ts'],
};

// Add common response schemas
const commonResponses = {
  UnauthorizedError: {
    description: 'No autorizado - Token inválido o expirado',
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
    description: 'Error de validación',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
        example: {
          success: false,
          error: {
            message: 'Error de validación',
            code: 'VALIDATION_ERROR',
            details: [
              {
                field: 'email',
                message: 'Email inválido',
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

