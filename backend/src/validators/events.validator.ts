/**
 * Events Validators
 * Zod schemas for events endpoints
 */

import { z } from 'zod';

export const getEventDetailsSchema = z.object({
  params: z.object({
    eventId: z.string().uuid('Event ID must be a valid UUID'),
  }),
});

export const getLiveEventsSchema = z.object({
  query: z.object({
    sportId: z.string().optional(),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});

export const getUpcomingEventsSchema = z.object({
  query: z.object({
    sportId: z.string().optional(),
    date: z.string().datetime().optional(),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});

