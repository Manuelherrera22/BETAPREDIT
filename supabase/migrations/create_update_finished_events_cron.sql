-- Migration: Create cron job for update-finished-events
-- This cron job will run the update-finished-events Edge Function every hour

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing cron job if it exists (to avoid duplicates)
SELECT cron.unschedule('update-finished-events-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-finished-events-hourly'
);

-- Schedule the update-finished-events function to run every hour
-- Format: minute hour day month weekday
-- 0 * * * * means: at minute 0 of every hour (1:00, 2:00, 3:00, etc.)
SELECT cron.schedule(
  'update-finished-events-hourly',     -- Job name
  '0 * * * *',                        -- Schedule: every hour at minute 0
  $$
  -- Call the Edge Function via HTTP using pg_net
  SELECT net.http_post(
    url := 'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/update-finished-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Alternative: If pg_net is not available, use a simpler approach
-- This requires setting the service role key as a database setting first
-- You can set it via: ALTER DATABASE postgres SET app.settings.service_role_key = 'sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys';

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
WHERE jobname = 'update-finished-events-hourly';

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Cron job "update-finished-events-hourly" creado exitosamente!';
  RAISE NOTICE '📅 Se ejecutará cada hora (0 * * * *)';
  RAISE NOTICE '🔗 Función: update-finished-events';
  RAISE NOTICE '⚠️  IMPORTANTE: Configurar service_role_key en database settings si pg_net no funciona';
END $$;
