"""
Verificar qué se está guardando en el campo factors de las predicciones
"""
import os
import sys
from dotenv import load_dotenv
import httpx
import asyncio
import json

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "https://mdjzqxhjbisnlfpbjfgb.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0"

async def verificar_factors():
    """Verificar qué features se están guardando"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print("=" * 60)
    print("VERIFICACIÓN: Features Guardadas en Factors")
    print("=" * 60)
    print()
    
    async with httpx.AsyncClient() as client:
        # Obtener algunas predicciones recientes
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/get_predictions_for_training",
            headers=headers,
            json={
                "limit_count": 5,
                "min_confidence": 0.0
            },
            timeout=30.0
        )
        
        if response.status_code == 200:
            predictions = response.json()
            
            print(f"📊 Analizando {len(predictions)} predicciones recientes...")
            print()
            
            if len(predictions) == 0:
                print("⚠️  No hay predicciones para analizar")
                return
            
            # Analizar factors de cada predicción
            all_features = set()
            features_count = {}
            
            for i, pred in enumerate(predictions[:3], 1):
                factors = pred.get('factors', {})
                if isinstance(factors, str):
                    try:
                        factors = json.loads(factors)
                    except:
                        factors = {}
                
                print(f"📋 Predicción {i}:")
                print(f"   Evento: {pred.get('event_name', 'N/A')}")
                print(f"   Selection: {pred.get('selection', 'N/A')}")
                print(f"   Factors keys: {list(factors.keys()) if isinstance(factors, dict) else 'No es dict'}")
                
                if isinstance(factors, dict):
                    # Contar features
                    count = len(factors)
                    print(f"   Total features en factors: {count}")
                    
                    # Listar todas las keys
                    for key in factors.keys():
                        all_features.add(key)
                        features_count[key] = features_count.get(key, 0) + 1
                    
                    # Verificar si tiene features avanzadas
                    has_advanced = any(k in factors for k in ['homeForm', 'awayForm', 'h2h', 'market', 'formAdvantage'])
                    print(f"   ✅ Tiene features avanzadas: {has_advanced}")
                    
                    if 'homeForm' in factors:
                        print(f"   ✅ homeForm: {list(factors['homeForm'].keys()) if isinstance(factors['homeForm'], dict) else 'No es dict'}")
                    if 'awayForm' in factors:
                        print(f"   ✅ awayForm: {list(factors['awayForm'].keys()) if isinstance(factors['awayForm'], dict) else 'No es dict'}")
                    if 'h2h' in factors:
                        print(f"   ✅ h2h: {list(factors['h2h'].keys()) if isinstance(factors['h2h'], dict) else 'No es dict'}")
                    if 'market' in factors:
                        print(f"   ✅ market: {list(factors['market'].keys()) if isinstance(factors['market'], dict) else 'No es dict'}")
                else:
                    print(f"   ⚠️  Factors no es un dict: {type(factors)}")
                
                print()
            
            print("=" * 60)
            print("RESUMEN DE FEATURES")
            print("=" * 60)
            print()
            print(f"📊 Total features únicas encontradas: {len(all_features)}")
            print()
            print("Features encontradas:")
            for feature, count in sorted(features_count.items(), key=lambda x: -x[1]):
                print(f"   • {feature}: {count} veces")
            print()
            
            # Verificar qué falta
            expected_features = [
                'homeForm', 'awayForm', 'h2h', 'market',
                'formAdvantage', 'goalsAdvantage', 'defenseAdvantage',
                'market_consensus', 'market_efficiency', 'sharp_money_indicator',
                'home_win_rate_5', 'away_win_rate_5', 'h2h_win_rate_team1'
            ]
            
            missing = [f for f in expected_features if f not in all_features]
            if missing:
                print("⚠️  FEATURES FALTANTES:")
                for f in missing:
                    print(f"   ❌ {f}")
                print()
                print("🔧 ACCIÓN REQUERIDA:")
                print("   Las features avanzadas NO se están guardando en factors")
                print("   Necesitamos modificar auto-predictions.service.ts")
                print("   para asegurar que todas las features se guarden")
            else:
                print("✅ Todas las features esperadas están presentes")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text[:500])

if __name__ == "__main__":
    asyncio.run(verificar_factors())

