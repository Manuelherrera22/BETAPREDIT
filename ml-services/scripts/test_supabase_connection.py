"""Test Supabase connection and function"""
import os
import asyncio
import httpx
from dotenv import load_dotenv
import os

# Load .env from multiple possible locations
load_dotenv()  # Current directory
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))  # Root directory
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))  # ml-services directory

async def test_connection():
    # Try multiple env var names
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    
    # Fallback: hardcoded for testing (will be removed after migration)
    if not supabase_url:
        supabase_url = "https://mdjzqxhjbisnlfpbjfgb.supabase.co"
    if not supabase_key:
        supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanpxeGhqYmlzbmxmcGJqZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMTQ0NjQsImV4cCI6MjA4MDc5MDQ2NH0.jsuASiqKdJEm3fNa8Tpq-YnxsI8Dj2eNZX81K6e5hY0"
    
    print("=" * 60)
    print("TESTING SUPABASE CONNECTION")
    print("=" * 60)
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase Key: {'*' * 20 if supabase_key else 'NOT SET'}")
    print()
    
    if not supabase_url or not supabase_key:
        print("❌ SUPABASE_URL or SUPABASE_ANON_KEY not set in .env")
        return
    
    try:
        async with httpx.AsyncClient() as client:
            # Test 1: Check if function exists
            print("📊 Test 1: Checking if function exists...")
            response = await client.post(
                f"{supabase_url}/rest/v1/rpc/get_predictions_for_training",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                json={
                    "limit_count": 5,
                    "min_confidence": 0.0,
                    "start_date": None,
                    "end_date": None
                },
                timeout=30.0
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Function exists and returned {len(data)} samples")
                if len(data) > 0:
                    print(f"   ✅ Found {len(data)} real prediction samples!")
                    print(f"   Sample data keys: {list(data[0].keys()) if data else 'N/A'}")
                else:
                    print(f"   ⚠️ Function works but no data found (no finished events with predictions)")
            elif response.status_code == 404:
                print(f"   ❌ Function not found - migration not applied")
            else:
                print(f"   ⚠️ Error: {response.text[:200]}")
            
            # Test 2: Check predictions table directly
            print()
            print("📊 Test 2: Checking predictions table...")
            response = await client.get(
                f"{supabase_url}/rest/v1/Prediction",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                },
                params={
                    "select": "id,wasCorrect,actualResult",
                    "wasCorrect": "not.is.null",
                    "limit": 5
                },
                timeout=30.0
            )
            
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Found {len(data)} predictions with results")
                if len(data) > 0:
                    print(f"   Sample: {data[0]}")
            else:
                print(f"   ⚠️ Error: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())

