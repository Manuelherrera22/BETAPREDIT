"""
Aplicar cron job usando SQL simplificado directamente
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def aplicar_cron():
    """Aplicar cron job directamente"""
    
    conn_string = "host=db.mdjzqxhjbisnlfpbjfgb.supabase.co port=5432 dbname=postgres user=postgres password=Herrera123Musfelcrow"
    
    print("=" * 60)
    print("APLICANDO CRON JOB")
    print("=" * 60)
    print()
    
    try:
        conn = psycopg2.connect(conn_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Conectado a PostgreSQL")
        print()
        
        # Paso 1: Habilitar extensiones
        print("📝 Habilitando extensiones...")
        cursor.execute("CREATE EXTENSION IF NOT EXISTS pg_cron;")
        cursor.execute("CREATE EXTENSION IF NOT EXISTS pg_net;")
        print("✅ Extensiones habilitadas")
        print()
        
        # Paso 2: Eliminar existente
        print("📝 Eliminando cron job existente...")
        cursor.execute("""
            SELECT cron.unschedule('update-finished-events-hourly') 
            WHERE EXISTS (
                SELECT 1 FROM cron.job WHERE jobname = 'update-finished-events-hourly'
            );
        """)
        print("✅ Limpieza completada")
        print()
        
        # Paso 3: Crear cron job
        print("📝 Creando cron job...")
        sql_cron = """
        SELECT cron.schedule(
            'update-finished-events-hourly',
            '0 * * * *',
            $CRON$
            SELECT net.http_post(
                url := 'https://mdjzqxhjbisnlfpbjfgb.supabase.co/functions/v1/update-finished-events',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer sb_secret_37NifuAx6LXLATCdDCrZmA_hW_cdMys'
                ),
                body := '{}'::jsonb
            ) AS request_id;
            $CRON$
        );
        """
        cursor.execute(sql_cron)
        result = cursor.fetchone()
        print(f"✅ Cron job creado. Job ID: {result[0] if result else 'N/A'}")
        print()
        
        # Paso 4: Verificar
        print("📝 Verificando...")
        cursor.execute("""
            SELECT jobid, jobname, schedule, active 
            FROM cron.job 
            WHERE jobname = 'update-finished-events-hourly';
        """)
        jobs = cursor.fetchall()
        if jobs:
            for job in jobs:
                print(f"✅ Job encontrado: ID={job[0]}, Schedule={job[2]}, Active={job[3]}")
        else:
            print("⚠️  Job no encontrado")
        
        cursor.close()
        conn.close()
        
        print()
        print("=" * 60)
        print("✅ CRON JOB CONFIGURADO EXITOSAMENTE")
        print("=" * 60)
        print()
        print("📅 Se ejecutará cada hora automáticamente")
        print("🔗 Función: update-finished-events")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("📋 Si hay error, ejecutar SQL_CRON_JOB_DIRECTO.sql en Dashboard")

if __name__ == "__main__":
    aplicar_cron()

