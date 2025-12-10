/**
 * Sentry Configuration for Frontend
 * Error tracking and monitoring
 */

import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    if (import.meta.env.PROD) {
      console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    // Filter sensitive data
    beforeSend(event, _hint) {
      // Filter out sensitive data from URLs
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          // Remove query params that might contain sensitive data
          url.searchParams.delete('token');
          url.searchParams.delete('apiKey');
          event.request.url = url.toString();
        } catch {
          // Invalid URL, keep as is
        }
      }
      
      // Filter out sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers['x-api-key'];
      }
      
      return event;
    },
    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      // Network errors that are expected
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      // Chrome extensions
      'chrome-extension://',
      'moz-extension://',
    ],
  });

  if (import.meta.env.DEV) {
    console.log('✅ Sentry initialized for frontend');
  }
};

export { Sentry };
