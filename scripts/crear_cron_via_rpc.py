"""
Crear cron job usando función RPC
"""
import os
import httpx
import asyncio

SUPABASE_URL = "https://mdjzqxhjbisnlfpbjfgb.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys"

async def crear_cron_via_rpc():
    """Crear cron job usando función RPC"""
    
    # Primero, aplicar la migración que crea la función RPC
    print("=" * 60)
    print("CREANDO CRON JOB VÍA RPC")
    print("=" * 60)
    print()
    print("Paso 1: Aplicar migración que crea función RPC")
    print("   Archivo: supabase/migrations/create_setup_cron_job_function.sql")
    print("   Ejecutar en Supabase Dashboard → SQL Editor")
    print()
    print("Paso 2: Llamar función RPC")
    print()
    
    # Intentar llamar la función RPC
    url = f"{SUPABASE_URL}/rest/v1/rpc/setup_update_finished_events_cron"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, headers=headers, json={})
            
            if response.status_code == 200:
                result = response.json()
                print("✅ ÉXITO")
                print(f"Resultado: {result}")
            elif response.status_code == 404:
                print("⚠️  Función RPC no existe aún")
                print("   Primero ejecuta: supabase/migrations/create_setup_cron_job_function.sql")
                print("   En Supabase Dashboard → SQL Editor")
            else:
                print(f"❌ Error: {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ Error: {e}")
            print()
            print("📋 SOLUCIÓN ALTERNATIVA:")
            print("   Ejecutar SQL_CRON_JOB_DIRECTO.sql en Dashboard")

if __name__ == "__main__":
    asyncio.run(crear_cron_via_rpc())

