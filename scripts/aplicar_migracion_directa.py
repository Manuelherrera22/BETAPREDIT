"""
Aplicar migración directamente a PostgreSQL usando psycopg2
"""
import os
import sys

# Intentar importar psycopg2
try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
except ImportError:
    print("⚠️  psycopg2 no instalado. Instalando...")
    os.system("pip install psycopg2-binary")
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def aplicar_migracion():
    """Aplicar migración directamente"""
    
    # Leer SQL
    migration_path = os.path.join(os.path.dirname(__file__), '../supabase/migrations/create_setup_cron_job_function.sql')
    with open(migration_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    # Conectar a PostgreSQL
    conn_string = "host=db.mdjzqxhjbisnlfpbjfgb.supabase.co port=5432 dbname=postgres user=postgres password=Herrera123Musfelcrow"
    
    print("=" * 60)
    print("APLICANDO MIGRACIÓN DIRECTAMENTE")
    print("=" * 60)
    print()
    
    try:
        conn = psycopg2.connect(conn_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Conectado a PostgreSQL")
        print("📝 Ejecutando SQL...")
        print()
        
        # Ejecutar SQL
        cursor.execute(sql)
        
        print("✅ Migración aplicada exitosamente")
        print()
        print("🚀 Ahora ejecutando función RPC...")
        
        cursor.close()
        conn.close()
        
        # Llamar función RPC
        import subprocess
        result = subprocess.run([sys.executable, "scripts/crear_cron_via_rpc.py"], capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("📋 SOLUCIÓN ALTERNATIVA:")
        print("   Ejecutar SQL_CRON_JOB_DIRECTO.sql en Supabase Dashboard")

if __name__ == "__main__":
    aplicar_migracion()

