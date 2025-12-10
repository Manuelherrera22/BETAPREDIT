"""
Generar nuevas predicciones con features completas
"""
import os
import sys
from dotenv import load_dotenv
import httpx
import asyncio
import json

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "https://mdjzqxhjbisnlfpbjfgb.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0"

async def generar_predicciones():
    """Llamar a la Edge Function para generar predicciones"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print("=" * 60)
    print("GENERANDO PREDICCIONES CON FEATURES COMPLETAS")
    print("=" * 60)
    print()
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        # Llamar a la Edge Function de generación de predicciones
        print("📊 Llamando a generate-predictions Edge Function...")
        try:
            response = await client.post(
                f"{SUPABASE_URL}/functions/v1/generate-predictions",
                headers=headers,
                json={
                    "sport_id": None,  # Generar para todos los deportes
                    "limit": 50  # Limitar a 50 eventos
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Predicciones generadas exitosamente")
                print(f"   Generadas: {data.get('generated', 0)}")
                print(f"   Actualizadas: {data.get('updated', 0)}")
                print(f"   Errores: {data.get('errors', 0)}")
                print()
                
                # Verificar que las features se guardaron
                print("📊 Verificando features guardadas...")
                await verificar_features(client, headers)
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   {response.text[:500]}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")

async def verificar_features(client, headers):
    """Verificar que las features se guardaron correctamente"""
    try:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/get_predictions_for_training",
            headers=headers,
            json={
                "limit_count": 3,
                "min_confidence": 0.0
            },
            timeout=30.0
        )
        
        if response.status_code == 200:
            predictions = response.json()
            if len(predictions) > 0:
                pred = predictions[0]
                factors = pred.get('factors', {})
                if isinstance(factors, str):
                    try:
                        factors = json.loads(factors)
                    except:
                        factors = {}
                
                print(f"   ✅ Features encontradas: {len(factors)}")
                print(f"   Keys: {list(factors.keys())[:10]}")
                
                # Verificar features avanzadas
                has_advanced = any(k in factors for k in ['homeForm', 'awayForm', 'h2h', 'market'])
                if has_advanced:
                    print(f"   ✅ Features avanzadas presentes")
                    if 'homeForm' in factors:
                        print(f"      • homeForm: {list(factors['homeForm'].keys()) if isinstance(factors['homeForm'], dict) else 'OK'}")
                    if 'awayForm' in factors:
                        print(f"      • awayForm: {list(factors['awayForm'].keys()) if isinstance(factors['awayForm'], dict) else 'OK'}")
                    if 'h2h' in factors:
                        print(f"      • h2h: {list(factors['h2h'].keys()) if isinstance(factors['h2h'], dict) else 'OK'}")
                else:
                    print(f"   ⚠️  Features avanzadas NO presentes")
            else:
                print(f"   ⚠️  No hay predicciones para verificar")
    except Exception as e:
        print(f"   ⚠️  Error verificando features: {str(e)}")

if __name__ == "__main__":
    asyncio.run(generar_predicciones())

