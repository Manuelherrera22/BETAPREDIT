"""
Script para ejecutar el Edge Function update-finished-events
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

async def execute_update_events():
    """Ejecutar Edge Function update-finished-events"""
    url = f"{SUPABASE_URL}/functions/v1/update-finished-events"
    headers = {
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    print("=" * 60)
    print("EJECUTANDO: update-finished-events")
    print("=" * 60)
    print()
    print(f"URL: {url}")
    print()
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(url, headers=headers, json={})
            
            print(f"Status: {response.status_code}")
            print()
            
            if response.status_code == 200:
                data = response.json()
                print("✅ ÉXITO")
                print()
                print("Resultados:")
                if 'data' in data:
                    results = data['data']
                    print(f"  • Eventos revisados: {results.get('eventsChecked', 0)}")
                    print(f"  • Eventos actualizados: {results.get('eventsUpdated', 0)}")
                    print(f"  • Predicciones actualizadas: {results.get('predictionsUpdated', 0)}")
                print()
                print("Mensaje:", data.get('message', 'N/A'))
            else:
                print("❌ ERROR")
                print()
                print("Response:", response.text)
                
        except httpx.TimeoutException:
            print("❌ TIMEOUT: La función está tardando mucho")
            print("   Esto puede ser normal si hay muchos eventos que procesar")
        except Exception as e:
            print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(execute_update_events())

