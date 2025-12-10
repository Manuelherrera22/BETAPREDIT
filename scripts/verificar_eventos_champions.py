"""
Verificar eventos de Champions League en la BD
"""
import os
import sys
from dotenv import load_dotenv
import httpx
import asyncio
from datetime import datetime, timedelta

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "https://mdjzqxhjbisnlfpbjfgb.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0"

async def check_champions_events():
    """Verificar eventos de Champions League"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    print("=" * 60)
    print("VERIFICACIÓN EVENTOS CHAMPIONS LEAGUE")
    print("=" * 60)
    print()
    
    async with httpx.AsyncClient() as client:
        # Buscar eventos de fútbol (Champions League)
        yesterday = (datetime.now() - timedelta(days=2)).isoformat()
        tomorrow = (datetime.now() + timedelta(days=1)).isoformat()
        
        # Eventos de fútbol en los últimos 2 días
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/Event",
            headers=headers,
            params={
                "select": "id,name,status,startTime,homeTeam,awayTeam,homeScore,awayScore,sportId,createdAt",
                "sportId": "not.is.null",
                "startTime": f"gte.{yesterday}",
                "startTime": f"lte.{tomorrow}",
                "order": "startTime.desc",
                "limit": "50"
            }
        )
        
        if response.status_code == 200:
            events = response.json()
            print(f"📊 Total eventos encontrados: {len(events)}")
            print()
            
            # Agrupar por status
            by_status = {}
            for event in events:
                status = event.get('status', 'UNKNOWN')
                if status not in by_status:
                    by_status[status] = []
                by_status[status].append(event)
            
            print("📊 Por Status:")
            for status, event_list in by_status.items():
                print(f"   {status}: {len(event_list)}")
            
            print()
            print("📊 Eventos que deberían estar FINISHED (startTime < ahora):")
            now = datetime.now()
            should_be_finished = []
            
            for event in events:
                start_time_str = event.get('startTime')
                if start_time_str:
                    try:
                        start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                        if start_time < now and event.get('status') != 'FINISHED':
                            should_be_finished.append(event)
                    except:
                        pass
            
            print(f"   ⚠️  Eventos que deberían estar FINISHED: {len(should_be_finished)}")
            
            if should_be_finished:
                print("\n   Ejemplos:")
                for event in should_be_finished[:10]:
                    start = event.get('startTime', '')[:16]
                    print(f"   • {event.get('name', 'N/A')} | {start} | Status: {event.get('status', 'N/A')}")
            
            # Verificar si tienen predicciones
            print()
            print("📊 Eventos con predicciones:")
            events_with_predictions = []
            
            for event in events[:20]:
                pred_response = await client.get(
                    f"{SUPABASE_URL}/rest/v1/Prediction",
                    headers=headers,
                    params={
                        "eventId": f"eq.{event['id']}",
                        "select": "id",
                        "limit": "1"
                    }
                )
                
                if pred_response.status_code == 200:
                    preds = pred_response.json()
                    if preds:
                        events_with_predictions.append(event)
            
            print(f"   ✅ Eventos con predicciones: {len(events_with_predictions)}")
            
            if events_with_predictions:
                print("\n   Ejemplos:")
                for event in events_with_predictions[:5]:
                    print(f"   • {event.get('name', 'N/A')} | Status: {event.get('status', 'N/A')}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    asyncio.run(check_champions_events())

