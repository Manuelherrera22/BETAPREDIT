"""
Script para aplicar el cron job de update-finished-events
Usa la API REST de Supabase para ejecutar SQL
"""
import os
import sys
from dotenv import load_dotenv
import httpx
import asyncio

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "https://mdjzqxhjbisnlfpbjfgb.supabase.co"
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys"

async def apply_cron_job():
    """Aplicar cron job usando SQL"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Leer migración SQL
    migration_path = os.path.join(os.path.dirname(__file__), '../supabase/migrations/create_update_finished_events_cron.sql')
    with open(migration_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print("=" * 60)
    print("APLICANDO CRON JOB")
    print("=" * 60)
    print()
    
    # Supabase no tiene RPC exec_sql, necesitamos usar el Dashboard
    # Pero podemos intentar crear el cron job usando pg_cron directamente
    print("⚠️  Supabase requiere ejecutar SQL desde el Dashboard")
    print()
    print("📋 PASOS:")
    print("1. Ir a: https://supabase.com/dashboard/project/mdjzqxhjbisnlfpbjfgb/sql/new")
    print("2. Copiar y pegar el siguiente SQL:")
    print()
    print("-" * 60)
    print(sql)
    print("-" * 60)
    print()
    print("3. Ejecutar")
    print()
    print("O usar la OPCIÓN 2 del Dashboard (más simple):")
    print("Database → Cron Jobs → Create new")
    print("Schedule: 0 * * * *")
    print("URL: https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/update-finished-events")
    print("Headers: Authorization: Bearer sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys")

if __name__ == "__main__":
    asyncio.run(apply_cron_job())

