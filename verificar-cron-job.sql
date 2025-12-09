-- Script para verificar que el cron job se creó correctamente

-- Verificar que las extensiones están habilitadas
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension 
WHERE extname IN ('pg_cron', 'http');

-- Verificar el cron job
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobid as job_id
FROM cron.job 
WHERE jobname = 'auto-sync-hourly';

-- Ver historial de ejecuciones (últimas 10)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-sync-hourly')
ORDER BY start_time DESC
LIMIT 10;

