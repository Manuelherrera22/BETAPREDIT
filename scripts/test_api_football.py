"""
Test API-Football connection and functionality
"""
import os
import sys
from dotenv import load_dotenv
import httpx
import asyncio

load_dotenv()

API_KEY = os.getenv("API_FOOTBALL_KEY") or "6be68f1a664b8a52112852b808446726"
BASE_URL = os.getenv("API_FOOTBALL_BASE_URL") or "https://v3.football.api-sports.io"

async def test_api_football():
    """Test API-Football connection"""
    headers = {
        "x-apisports-key": API_KEY
    }
    
    print("=" * 60)
    print("TEST: API-Football Connection")
    print("=" * 60)
    print()
    print(f"API Key: {API_KEY[:10]}...")
    print(f"Base URL: {BASE_URL}")
    print()
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test 1: Get status
        print("📊 Test 1: API Status")
        try:
            response = await client.get(
                f"{BASE_URL}/status",
                headers=headers
            )
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ API Status: OK")
                if 'response' in data:
                    print(f"   Account: {data['response'].get('account', {}).get('email', 'N/A')}")
                    print(f"   Requests: {data['response'].get('requests', {}).get('current', 'N/A')}")
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   {response.text[:200]}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()
        
        # Test 2: Search teams
        print("📊 Test 2: Search Teams (Barcelona)")
        try:
            response = await client.get(
                f"{BASE_URL}/teams",
                headers=headers,
                params={"search": "Barcelona"}
            )
            if response.status_code == 200:
                data = response.json()
                teams = data.get('response', [])
                if teams:
                    print(f"   ✅ Found {len(teams)} teams")
                    for team in teams[:3]:
                        print(f"   • {team.get('team', {}).get('name')} (ID: {team.get('team', {}).get('id')})")
                else:
                    print(f"   ⚠️  No teams found")
            else:
                print(f"   ❌ Error: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()
        
        # Test 3: Get fixtures (today)
        print("📊 Test 3: Get Today's Fixtures")
        try:
            from datetime import datetime
            today = datetime.now().strftime("%Y-%m-%d")
            response = await client.get(
                f"{BASE_URL}/fixtures",
                headers=headers,
                params={"date": today}
            )
            if response.status_code == 200:
                data = response.json()
                fixtures = data.get('response', [])
                print(f"   ✅ Found {len(fixtures)} fixtures for today")
                if fixtures:
                    for fixture in fixtures[:3]:
                        home = fixture.get('teams', {}).get('home', {}).get('name', 'N/A')
                        away = fixture.get('teams', {}).get('away', {}).get('name', 'N/A')
                        print(f"   • {home} vs {away}")
            else:
                print(f"   ❌ Error: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print()
        print("=" * 60)
        print("✅ Tests completed")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_api_football())

