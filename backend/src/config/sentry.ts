/**
 * Sentry Configuration
 * Error tracking and monitoring
 */

import * as Sentry from '@sentry/node';

// ProfilingIntegration is optional
let ProfilingIntegration: any;
try {
  const profilingModule = require('@sentry/profiling-node');
  ProfilingIntegration = profilingModule.nodeProfilingIntegration || profilingModule.ProfilingIntegration;
} catch (e) {
  // Profiling not available
}

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      ...(ProfilingIntegration ? [new ProfilingIntegration()] : []),
      // Http and Express integrations are now automatic in newer Sentry versions
    ],
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers.authorization;
        }
        if (event.request.cookies) {
          delete event.request.cookies;
        }
      }
      return event;
    },
  });

  console.log('✅ Sentry initialized');
};

export { Sentry };

