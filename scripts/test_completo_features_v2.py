"""
Test completo: Generar predicciones con features avanzadas
Usa la Edge Function de Supabase directamente
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

async def test_completo():
    """Test completo de features avanzadas"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print("=" * 60)
    print("TEST COMPLETO: FEATURES AVANZADAS")
    print("=" * 60)
    print()
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        # Paso 1: Generar predicciones
        print("📊 PASO 1: Generando predicciones...")
        print()
        
        try:
            response = await client.post(
                f"{SUPABASE_URL}/functions/v1/generate-predictions",
                headers=headers,
                json={
                    "sport_id": None,
                    "limit": 50
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                generated = data.get('generated', 0)
                updated = data.get('updated', 0)
                errors = data.get('errors', 0)
                
                print(f"   ✅ Generadas: {generated}")
                print(f"   ✅ Actualizadas: {updated}")
                print(f"   ⚠️  Errores: {errors}")
                print()
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   {response.text[:500]}")
                print()
                return
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            print()
            return
        
        # Esperar un poco para que se guarden
        print("   ⏳ Esperando 3 segundos para que se guarden...")
        await asyncio.sleep(3)
        print()
        
        # Paso 2: Verificar features guardadas
        print("📊 PASO 2: Verificando features guardadas...")
        print()
        
        try:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/get_predictions_for_training",
                headers=headers,
                json={
                    "limit_count": 10,
                    "min_confidence": 0.0
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                predictions = response.json()
                
                if len(predictions) == 0:
                    print("   ⚠️  No hay predicciones para verificar")
                    print()
                    return
                
                print(f"   ✅ Analizando {len(predictions)} predicciones recientes")
                print()
                
                total_features = 0
                predictions_with_advanced = 0
                all_features = set()
                
                for pred in predictions:
                    factors = pred.get('factors', {})
                    if isinstance(factors, str):
                        try:
                            factors = json.loads(factors)
                        except:
                            factors = {}
                    
                    if isinstance(factors, dict):
                        feature_count = len(factors)
                        total_features += feature_count
                        
                        # Agregar todas las features al set
                        for k in factors.keys():
                            all_features.add(k)
                        
                        # Verificar features avanzadas
                        has_advanced = any(k in factors for k in ['homeForm', 'awayForm', 'h2h', 'market'])
                        if has_advanced:
                            predictions_with_advanced += 1
                
                avg_features = total_features / len(predictions) if predictions else 0
                
                print(f"   📊 Features promedio por predicción: {avg_features:.1f}")
                print(f"   📊 Total features únicas: {len(all_features)}")
                print(f"   ✅ Predicciones con features avanzadas: {predictions_with_advanced}/{len(predictions)}")
                print()
                
                # Mostrar algunas features encontradas
                print("   Features encontradas:")
                features_list = list(all_features)[:15]
                for f in features_list:
                    print(f"      • {f}")
                if len(all_features) > 15:
                    print(f"      ... y {len(all_features) - 15} más")
                print()
                
                # Verificar estructura de features avanzadas
                if len(predictions) > 0:
                    sample_pred = predictions[0]
                    factors = sample_pred.get('factors', {})
                    if isinstance(factors, str):
                        try:
                            factors = json.loads(factors)
                        except:
                            factors = {}
                    
                    print("   📋 Estructura de features avanzadas (muestra):")
                    if isinstance(factors, dict):
                        if 'homeForm' in factors:
                            home_form = factors['homeForm']
                            if isinstance(home_form, dict):
                                print(f"      ✅ homeForm: {len(home_form)} campos")
                            else:
                                print(f"      ✅ homeForm: presente")
                        if 'awayForm' in factors:
                            away_form = factors['awayForm']
                            if isinstance(away_form, dict):
                                print(f"      ✅ awayForm: {len(away_form)} campos")
                            else:
                                print(f"      ✅ awayForm: presente")
                        if 'h2h' in factors:
                            h2h = factors['h2h']
                            if isinstance(h2h, dict):
                                print(f"      ✅ h2h: {len(h2h)} campos")
                            else:
                                print(f"      ✅ h2h: presente")
                        if 'market' in factors:
                            market = factors['market']
                            if isinstance(market, dict):
                                print(f"      ✅ market: {len(market)} campos")
                            else:
                                print(f"      ✅ market: presente")
                    print()
                
                # Evaluación
                print("=" * 60)
                print("EVALUACIÓN")
                print("=" * 60)
                print()
                
                if avg_features >= 50:
                    print("   ✅ EXCELENTE: 50+ features por predicción")
                elif avg_features >= 20:
                    print("   ✅ BUENO: 20+ features por predicción")
                elif avg_features >= 10:
                    print("   ⚠️  REGULAR: 10+ features por predicción")
                else:
                    print("   ❌ MALO: Menos de 10 features por predicción")
                
                if predictions_with_advanced == len(predictions):
                    print("   ✅ EXCELENTE: Todas las predicciones tienen features avanzadas")
                elif predictions_with_advanced > 0:
                    print(f"   ⚠️  PARCIAL: Solo {predictions_with_advanced}/{len(predictions)} tienen features avanzadas")
                else:
                    print("   ❌ CRÍTICO: Ninguna predicción tiene features avanzadas")
                
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   {response.text[:500]}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()
        print("=" * 60)
        print("✅ TEST COMPLETADO")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_completo())

