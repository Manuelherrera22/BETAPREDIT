"""
Crear cron job directamente usando SQL vía Supabase REST API
"""
import os
import httpx
import asyncio

SUPABASE_URL = "https://mdjzqxhjbisnlfpbjfgb.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys"

async def crear_cron_job():
    """Crear cron job usando SQL directo"""
    
    # SQL simplificado que funciona mejor
    sql_commands = [
        # 1. Habilitar extensiones
        "CREATE EXTENSION IF NOT EXISTS pg_cron;",
        "CREATE EXTENSION IF NOT EXISTS pg_net;",
        
        # 2. Eliminar existente
        """SELECT cron.unschedule('update-finished-events-hourly') 
           WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-finished-events-hourly');""",
        
        # 3. Crear nuevo
        """SELECT cron.schedule(
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
        );""",
        
        # 4. Verificar
        "SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'update-finished-events-hourly';"
    ]
    
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    print("=" * 60)
    print("CREANDO CRON JOB")
    print("=" * 60)
    print()
    
    # Supabase no permite ejecutar SQL arbitrario vía REST API por seguridad
    # Necesitamos usar el Dashboard o crear una función RPC
    print("⚠️  Supabase requiere ejecutar SQL desde el Dashboard por seguridad")
    print()
    print("📋 SOLUCIÓN RÁPIDA:")
    print("   1. Ir a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/sql/new")
    print("   2. Copiar y ejecutar el SQL de: SQL_CRON_JOB_DIRECTO.sql")
    print()
    print("O usar Dashboard → Database → Cron Jobs (más simple)")
    print()
    print("SQL a ejecutar:")
    print("-" * 60)
    with open("SQL_CRON_JOB_DIRECTO.sql", "r", encoding="utf-8") as f:
        print(f.read())
    print("-" * 60)

if __name__ == "__main__":
    asyncio.run(crear_cron_job())

