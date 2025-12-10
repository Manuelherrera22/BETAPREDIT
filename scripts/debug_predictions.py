"""
Debug: Verificar cuántas predicciones hay en la base de datos
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

async def debug_predictions():
    """Debug predicciones"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print("=" * 60)
    print("DEBUG: PREDICCIONES EN BASE DE DATOS")
    print("=" * 60)
    print()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Contar total de predicciones
        print("📊 1. Contando predicciones totales...")
        try:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/get_predictions_for_training",
                headers=headers,
                json={
                    "limit_count": 1000,
                    "min_confidence": 0.0
                }
            )
            
            if response.status_code == 200:
                predictions = response.json()
                print(f"   ✅ Total predicciones: {len(predictions)}")
                
                # Agrupar por evento
                events_dict = {}
                for pred in predictions:
                    event_id = pred.get('event_id', 'unknown')
                    if event_id not in events_dict:
                        events_dict[event_id] = []
                    events_dict[event_id].append(pred)
                
                print(f"   ✅ Eventos con predicciones: {len(events_dict)}")
                print()
                
                # Mostrar algunos eventos
                print("📋 Eventos con más predicciones:")
                sorted_events = sorted(events_dict.items(), key=lambda x: len(x[1]), reverse=True)
                for event_id, preds in sorted_events[:10]:
                    event_name = preds[0].get('event_name', 'N/A') if preds else 'N/A'
                    print(f"   • {event_name}: {len(preds)} predicciones")
                print()
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   {response.text[:500]}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()
        
        # 2. Verificar eventos próximos
        print("📊 2. Verificando eventos próximos...")
        try:
            from datetime import datetime, timedelta
            now = datetime.now()
            max_time = now + timedelta(hours=48)
            
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/Event",
                headers=headers,
                params={
                    "status": "eq.SCHEDULED",
                    "startTime": f"gte.{now.isoformat()}",
                    "startTime": f"lte.{max_time.isoformat()}",
                    "select": "id,name,homeTeam,awayTeam,startTime",
                    "limit": "100"
                }
            )
            
            if response.status_code == 200:
                events = response.json()
                print(f"   ✅ Eventos próximos (48h): {len(events)}")
                
                # Verificar cuántos tienen predicciones
                events_with_preds = 0
                for event in events[:10]:
                    event_id = event.get('id')
                    # Verificar si tiene predicciones
                    pred_response = await client.post(
                        f"{SUPABASE_URL}/rest/v1/rpc/get_predictions_for_training",
                        headers=headers,
                        json={
                            "limit_count": 10,
                            "min_confidence": 0.0
                        }
                    )
                    if pred_response.status_code == 200:
                        preds = pred_response.json()
                        event_preds = [p for p in preds if p.get('event_id') == event_id]
                        if len(event_preds) > 0:
                            events_with_preds += 1
                            print(f"   • {event.get('name', 'N/A')}: {len(event_preds)} predicciones")
                
                print(f"   ✅ Eventos con predicciones (de primeros 10): {events_with_preds}")
            else:
                print(f"   ❌ Error: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()
        print("=" * 60)
        print("✅ DEBUG COMPLETADO")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(debug_predictions())

