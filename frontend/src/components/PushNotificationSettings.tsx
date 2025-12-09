/**
 * Push Notification Settings Component
 * Allows users to enable/disable browser push notifications
 */

import { usePushNotifications } from '../hooks/usePushNotifications';
import toast from 'react-hot-toast';

export default function PushNotificationSettings() {
  const { isSupported, permission, requestPermission, isGranted } = usePushNotifications();

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notificaciones activadas correctamente');
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-yellow-400 text-sm">
          ⚠️ Tu navegador no soporta notificaciones push
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-dark-800/50 rounded-lg border border-primary-500/30">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold mb-1">Notificaciones del Navegador</h3>
          <p className="text-sm text-gray-400">
            Recibe notificaciones incluso cuando la pestaña está cerrada
          </p>
        </div>
        <div className="flex items-center gap-3">
          {permission === 'granted' && (
            <span className="text-green-400 text-sm font-medium">✓ Activadas</span>
          )}
          {permission === 'denied' && (
            <span className="text-red-400 text-sm font-medium">✗ Bloqueadas</span>
          )}
          {permission === 'default' && (
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Activar
            </button>
          )}
        </div>
      </div>
      
      {permission === 'denied' && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-xs mb-2">
            Las notificaciones están bloqueadas. Para activarlas:
          </p>
          <ol className="text-gray-400 text-xs list-decimal list-inside space-y-1">
            <li>Haz clic en el ícono de candado en la barra de direcciones</li>
            <li>Busca "Notificaciones" en los permisos</li>
            <li>Cambia a "Permitir"</li>
            <li>Recarga la página</li>
          </ol>
        </div>
      )}

      {permission === 'granted' && (
        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-xs">
            ✓ Recibirás notificaciones cuando se detecten value bets o lleguen alertas importantes
          </p>
        </div>
      )}
    </div>
  );
}

