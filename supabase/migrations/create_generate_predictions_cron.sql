-- Migration: Create cron job for generate-predictions
-- This cron job will run the generate-predictions Edge Function every 10 minutes
-- For professional-grade real-time predictions

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing cron job if it exists (to avoid duplicates)
SELECT cron.unschedule('generate-predictions-10min') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-predictions-10min'
);

-- Schedule the generate-predictions function to run every 10 minutes
-- Format: minute hour day month weekday
-- */10 * * * * means: every 10 minutes
SELECT cron.schedule(
  'generate-predictions-10min',        -- Job name
  '*/10 * * * *',                      -- Schedule: every 10 minutes
  $$
  -- Call the Edge Function via HTTP
  SELECT net.http_post(
    url := 'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/generate-predictions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verify the cron job was created
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job 
WHERE jobname = 'generate-predictions-10min';

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Cron job "generate-predictions-10min" creado exitosamente!';
  RAISE NOTICE '📅 Se ejecutará cada 10 minutos (*/10 * * * *)';
  RAISE NOTICE '🔗 Función: generate-predictions';
  RAISE NOTICE '🎯 Sistema profesional de predicciones en tiempo real';
END $$;

