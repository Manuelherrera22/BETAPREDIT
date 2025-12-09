-- Migration: Create auto-sync cron job
-- This cron job will run the auto-sync Edge Function every hour

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the auto-sync function to run every hour
-- Format: minute hour day month weekday
-- 0 * * * * means: at minute 0 of every hour (1:00, 2:00, 3:00, etc.)

SELECT cron.schedule(
  'auto-sync-hourly',                    -- Job name
  '0 * * * *',                          -- Schedule: every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/auto-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'auto-sync-hourly';

