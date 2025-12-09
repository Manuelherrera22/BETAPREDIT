-- Migration: Create auto-sync cron job
-- This cron job will run the auto-sync Edge Function every hour

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- Remove existing cron job if it exists (to avoid duplicates)
SELECT cron.unschedule('auto-sync-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-sync-hourly'
);

-- Schedule the auto-sync function to run every hour
-- Format: minute hour day month weekday
-- 0 * * * * means: at minute 0 of every hour (1:00, 2:00, 3:00, etc.)
-- Note: We use a simple SQL function call since Edge Functions can be called via HTTP

SELECT cron.schedule(
  'auto-sync-hourly',                    -- Job name
  '0 * * * *',                          -- Schedule: every hour at minute 0
  $$
  -- Call the Edge Function via HTTP
  -- Note: This requires the http extension and proper configuration
  SELECT net.http_post(
    url := 'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/auto-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);

-- Alternative: If the above doesn't work, use a simpler approach
-- This creates a cron job that calls a SQL function
-- You'll need to create a function that calls the Edge Function

-- Verify the cron job was created
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job 
WHERE jobname = 'auto-sync-hourly';

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Cron job "auto-sync-hourly" creado exitosamente!';
  RAISE NOTICE '📅 Se ejecutará cada hora (0 * * * *)';
  RAISE NOTICE '🔗 Función: auto-sync';
END $$;

