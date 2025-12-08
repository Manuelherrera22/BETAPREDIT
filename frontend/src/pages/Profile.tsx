import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function Profile() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'notifications' | 'subscription'>('profile');

  const tabs = [
    { id: 'profile', name: 'Perfil' },
    { id: 'settings', name: 'Configuración' },
    { id: 'notifications', name: 'Notificaciones' },
    { id: 'subscription', name: 'Suscripción' },
  ];

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Mi Perfil</h1>
        <p className="text-gray-400">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-primary-500/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-primary-400 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl">
        {activeTab === 'profile' && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20">
            <h2 className="text-2xl font-black text-white mb-6">Información Personal</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Nombre</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Bankroll Inicial</label>
                <input
                  type="number"
                  placeholder="1000.00"
                  className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
                />
              </div>
              <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors">
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20">
            <h2 className="text-2xl font-black text-white mb-6">Configuración</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Moneda</label>
                <select className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400">
                  <option>EUR (€)</option>
                  <option>USD ($)</option>
                  <option>GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Zona Horaria</label>
                <select className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400">
                  <option>Europe/Madrid (GMT+1)</option>
                  <option>America/New_York (GMT-5)</option>
                  <option>Asia/Tokyo (GMT+9)</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded bg-dark-800 border-primary-500/30" />
                  <span className="text-gray-300">Mostrar estadísticas en tiempo real</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded bg-dark-800 border-primary-500/30" defaultChecked />
                  <span className="text-gray-300">Usar Kelly Criterion para stake sugerido</span>
                </label>
              </div>
              <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors">
                Guardar Configuración
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20">
            <h2 className="text-2xl font-black text-white mb-6">Preferencias de Notificaciones</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold mb-1">Alertas de Value Bets</h3>
                  <p className="text-sm text-gray-400">Recibe notificaciones cuando se detecten value bets</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded bg-dark-800 border-primary-500/30" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold mb-1">Cambios de Cuotas</h3>
                  <p className="text-sm text-gray-400">Notificaciones cuando cambien las cuotas significativamente</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded bg-dark-800 border-primary-500/30" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold mb-1">Nuevas Predicciones</h3>
                  <p className="text-sm text-gray-400">Alertas cuando haya nuevas predicciones para eventos seguidos</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded bg-dark-800 border-primary-500/30" />
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold mb-1">Resumen Diario</h3>
                  <p className="text-sm text-gray-400">Recibe un resumen diario de tus estadísticas</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded bg-dark-800 border-primary-500/30" />
              </div>
              <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors mt-6">
                Guardar Preferencias
              </button>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20">
            <h2 className="text-2xl font-black text-white mb-6">Suscripción</h2>
            <div className="space-y-6">
              <div className="bg-primary-500/10 rounded-xl p-6 border border-primary-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white mb-1">Plan Básico</h3>
                    <p className="text-gray-400">Gratis</p>
                  </div>
                  <span className="px-4 py-2 bg-primary-500/30 text-primary-300 rounded-lg font-semibold">
                    Activo
                  </span>
                </div>
                <p className="text-gray-300 mb-4">
                  Actualmente estás en el plan gratuito. Actualiza para desbloquear todas las funcionalidades.
                </p>
                <button className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-bold transition-colors">
                  Actualizar a Pro
                </button>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Historial de Pagos</h3>
                <div className="text-gray-400 text-sm">No hay pagos registrados</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

