-- Crear función RPC para configurar el cron job
-- Esta función puede ser llamada vía API REST

CREATE OR REPLACE FUNCTION setup_update_finished_events_cron()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  job_id bigint;
BEGIN
  -- Habilitar extensiones
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  CREATE EXTENSION IF NOT EXISTS pg_net;
  
  -- Eliminar existente
  PERFORM cron.unschedule('update-finished-events-hourly') 
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'update-finished-events-hourly'
  );
  
  -- Crear nuevo cron job
  SELECT cron.schedule(
    'update-finished-events-hourly',
    '0 * * * *',
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
  ) INTO job_id;
  
  -- Retornar resultado
  SELECT jsonb_build_object(
    'success', true,
    'job_id', job_id,
    'message', 'Cron job creado exitosamente'
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION setup_update_finished_events_cron TO anon, authenticated;

