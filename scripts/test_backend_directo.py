"""
Test directo al backend local
"""
import httpx
import asyncio
import json

BACKEND_URL = "http://localhost:5000"

async def test_backend():
    """Test directo al backend"""
    print("=" * 60)
    print("TEST: Backend Directo")
    print("=" * 60)
    print()
    
    # Primero verificar que el backend está corriendo
    print("📊 Verificando conexión al backend...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{BACKEND_URL}/health")
            if response.status_code == 200:
                print("   ✅ Backend está corriendo")
            else:
                print(f"   ⚠️  Backend responde con código: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Backend no disponible: {str(e)}")
        print()
        print("   💡 Inicia el backend con: cd backend && npm run dev")
        return
    
    print()
    
    # Intentar generar predicciones (requiere autenticación)
    print("📊 Intentando generar predicciones...")
    print("   ⚠️  Nota: Requiere autenticación")
    print()
    
    # Verificar si hay un token de test
    # Por ahora solo mostramos cómo hacerlo
    print("=" * 60)
    print("INSTRUCCIONES")
    print("=" * 60)
    print()
    print("Para ejecutar el test completo:")
    print()
    print("1. Asegúrate de que el backend esté corriendo:")
    print("   cd backend")
    print("   npm run dev")
    print()
    print("2. Obtén un token de autenticación (login)")
    print()
    print("3. Llama al endpoint:")
    print("   POST http://localhost:5000/api/predictions/generate")
    print("   Headers:")
    print("     Authorization: Bearer YOUR_TOKEN")
    print()
    print("4. O usa la Edge Function de Supabase con service_role key")
    print()

if __name__ == "__main__":
    asyncio.run(test_backend())

