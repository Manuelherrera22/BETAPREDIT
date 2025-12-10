"""
Script para verificar el estado de los datos reales en Supabase
- Eventos finalizados
- Predicciones con resultados
- Estado de sincronización
"""
import os
import sys
from dotenv import load_dotenv
import httpx
import asyncio
from datetime import datetime, timedelta

# Load env from multiple locations
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "https://mdjzqxhjbisnlfpbjfgb.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0"

async def check_data():
    """Verificar estado de datos reales"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print("=" * 60)
    print("VERIFICACIÓN DE DATOS REALES")
    print("=" * 60)
    print()
    
    async with httpx.AsyncClient() as client:
        # 1. Eventos finalizados
        print("📊 1. EVENTOS FINALIZADOS")
        print("-" * 60)
        
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()
        today = datetime.now().isoformat()
        
        # Eventos FINISHED
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/Event",
            headers=headers,
            params={
                "status": "eq.FINISHED",
                "select": "id,name,status,startTime,homeScore,awayScore,homeTeam,awayTeam,updatedAt",
                "order": "startTime.desc",
                "limit": "10"
            }
        )
        
        if response.status_code == 200:
            finished_events = response.json()
            print(f"   ✅ Total eventos FINISHED: {len(finished_events)}")
            
            if finished_events:
                print("\n   Últimos 5 eventos finalizados:")
                for event in finished_events[:5]:
                    score = f"{event.get('homeScore', '?')}-{event.get('awayScore', '?')}"
                    print(f"   • {event.get('name', 'N/A')} | {score} | {event.get('startTime', '')[:10]}")
            else:
                print("   ⚠️  No hay eventos finalizados")
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   {response.text}")
        
        print()
        
        # 2. Predicciones con resultados
        print("📊 2. PREDICCIONES CON RESULTADOS")
        print("-" * 60)
        
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/Prediction",
            headers=headers,
            params={
                "wasCorrect": "not.is.null",
                "select": "id,eventId,selection,predictedProbability,actualResult,wasCorrect,accuracy,createdAt,eventFinishedAt",
                "order": "createdAt.desc",
                "limit": "10"
            }
        )
        
        if response.status_code == 200:
            predictions = response.json()
            print(f"   ✅ Total predicciones con resultados: {len(predictions)}")
            
            if predictions:
                print("\n   Últimas 5 predicciones con resultados:")
                for pred in predictions[:5]:
                    result = "✅" if pred.get('wasCorrect') else "❌"
                    print(f"   {result} {pred.get('selection', 'N/A')} | Pred: {pred.get('predictedProbability', 0):.2f} | Actual: {pred.get('actualResult', 'N/A')} | Acc: {pred.get('accuracy', 0):.2f}")
            else:
                print("   ⚠️  No hay predicciones con resultados")
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   {response.text}")
        
        print()
        
        # 3. Eventos con predicciones pero sin resultados
        print("📊 3. EVENTOS FINALIZADOS SIN PREDICCIONES ACTUALIZADAS")
        print("-" * 60)
        
        # Primero obtener eventos FINISHED
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/Event",
            headers=headers,
            params={
                "status": "eq.FINISHED",
                "select": "id,name,status,startTime,homeScore,awayScore"
            }
        )
        
        if response.status_code == 200:
            finished_events = response.json()
            events_without_results = []
            
            for event in finished_events[:20]:  # Revisar primeros 20
                # Verificar si tiene predicciones sin resultados
                pred_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/Prediction",
                    headers=headers,
                    params={
                        "eventId": f"eq.{event['id']}",
                        "wasCorrect": "is.null",
                        "select": "id",
                        "limit": "1"
                    }
                )
                
                if pred_response.status_code == 200:
                    unresolved = pred_response.json()
                    if unresolved:
                        events_without_results.append(event)
            
            print(f"   ⚠️  Eventos finalizados con predicciones sin actualizar: {len(events_without_results)}")
            
            if events_without_results:
                print("\n   Eventos que necesitan actualización:")
                for event in events_without_results[:5]:
                    score = f"{event.get('homeScore', '?')}-{event.get('awayScore', '?')}"
                    print(f"   • {event.get('name', 'N/A')} | {score} | ID: {event.get('id', 'N/A')[:8]}...")
        else:
            print(f"   ❌ Error: {response.status_code}")
        
        print()
        
        # 4. Test función SQL
        print("📊 4. TEST FUNCIÓN get_predictions_for_training")
        print("-" * 60)
        
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/get_predictions_for_training",
            headers=headers,
            json={
                "limit_count": 10,
                "min_confidence": 0.0
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Función funciona correctamente")
            print(f"   📊 Retornó {len(data)} predicciones")
            
            if data:
                print("\n   Ejemplo de datos:")
                for pred in data[:3]:
                    print(f"   • {pred.get('event_name', 'N/A')} | {pred.get('selection', 'N/A')} | Acc: {pred.get('accuracy', 0):.2f}")
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   {response.text}")
        
        print()
        print("=" * 60)
        print("RESUMEN")
        print("=" * 60)
        print()
        print("Si hay eventos FINISHED pero 0 predicciones con resultados:")
        print("  → El proceso de actualización no está corriendo")
        print("  → Necesitas ejecutar el scheduled task o Edge Function")
        print()
        print("Si hay eventos FINISHED con predicciones sin actualizar:")
        print("  → El proceso necesita ejecutarse manualmente")
        print()

if __name__ == "__main__":
    asyncio.run(check_data())

