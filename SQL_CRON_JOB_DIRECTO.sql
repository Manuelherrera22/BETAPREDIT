-- ============================================================
-- CRON JOB: update-finished-events-hourly
-- ============================================================
-- Ejecutar este SQL en Supabase Dashboard → SQL Editor
-- ============================================================

-- Paso 1: Configurar service role key (si no está configurado)
ALTER DATABASE postgres SET app.settings.service_role_key = 'sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys';

-- Paso 2: Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Paso 3: Eliminar cron job existente si existe
SELECT cron.unschedule('update-finished-events-hourly') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-finished-events-hourly'
);

-- Paso 4: Crear cron job
SELECT cron.schedule(
  'update-finished-events-hourly',
  '0 * * * *',  -- Cada hora
  $$
  SELECT net.http_post(
    url := 'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/update-finished-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Paso 5: Verificar
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job 
WHERE jobname = 'update-finished-events-hourly';

