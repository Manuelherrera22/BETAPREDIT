import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import SubscriptionTab from '../components/SubscriptionTab';
import { userProfileService } from '../services/userProfileService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'notifications' | 'subscription'>('profile');
  const queryClient = useQueryClient();
  
  // Obtener perfil completo
  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userProfileService.getProfile(),
    enabled: !!user,
  });
  
  // Mutation para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userProfileService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      // Actualizar user en store
      if (user) {
        setUser({ ...user, ...updatedProfile });
      }
      // Actualizar formData con los datos actualizados
      setFormData({
        firstName: updatedProfile.firstName || '',
        lastName: updatedProfile.lastName || '',
        phone: updatedProfile.phone || '',
        timezone: updatedProfile.timezone || 'UTC',
        preferredCurrency: updatedProfile.preferredCurrency || 'EUR',
        preferredMode: updatedProfile.preferredMode || 'pro',
      });
      // Invalidar queries para actualizar dashboard
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      // Mostrar mensaje de éxito
      if (updatedProfile.preferredMode) {
        toast.success(`Modo cambiado a ${updatedProfile.preferredMode === 'casual' ? 'Casual' : 'Pro'}. El dashboard se actualizará automáticamente.`, {
          duration: 3000,
          icon: '✅',
        });
      } else {
        toast.success('Perfil actualizado correctamente', {
          duration: 2000,
          icon: '✅',
        });
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Error al actualizar perfil', {
        duration: 3000,
        icon: '❌',
      });
    },
  });
  
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    phone: profile?.phone || '',
    timezone: profile?.timezone || 'UTC',
    preferredCurrency: profile?.preferredCurrency || 'EUR',
    preferredMode: profile?.preferredMode || 'pro',
  });
  
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        timezone: profile.timezone || 'UTC',
        preferredCurrency: profile.preferredCurrency || 'EUR',
        preferredMode: profile.preferredMode || 'pro',
      });
    }
  }, [profile]);
  
  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

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
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Apellido</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Tu apellido"
                  className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                  className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20">
            <h2 className="text-2xl font-black text-white mb-6">Configuración</h2>
            <div className="space-y-6">
              {/* Modo de Uso */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Modo de Uso</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      const newMode = 'casual';
                      setFormData({ ...formData, preferredMode: newMode });
                      // Guardar automáticamente
                      updateProfileMutation.mutate({ ...formData, preferredMode: newMode });
                    }}
                    disabled={updateProfileMutation.isPending}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.preferredMode === 'casual'
                        ? 'border-primary-400 bg-primary-500/20 scale-105'
                        : 'border-primary-500/30 bg-dark-800/50 hover:border-primary-500/50'
                    } ${updateProfileMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎮</div>
                      <h3 className="font-bold text-white mb-1">Modo Casual</h3>
                      <p className="text-xs text-gray-400">Vista simplificada para principiantes</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      const newMode = 'pro';
                      setFormData({ ...formData, preferredMode: newMode });
                      // Guardar automáticamente
                      updateProfileMutation.mutate({ ...formData, preferredMode: newMode });
                    }}
                    disabled={updateProfileMutation.isPending}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.preferredMode === 'pro'
                        ? 'border-primary-400 bg-primary-500/20 scale-105'
                        : 'border-primary-500/30 bg-dark-800/50 hover:border-primary-500/50'
                    } ${updateProfileMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">⚡</div>
                      <h3 className="font-bold text-white mb-1">Modo Pro</h3>
                      <p className="text-xs text-gray-400">Vista completa con todas las métricas</p>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.preferredMode === 'casual'
                    ? 'Verás una vista simplificada con lenguaje fácil de entender'
                    : 'Verás todas las métricas avanzadas y herramientas profesionales'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Moneda</label>
                <select
                  value={formData.preferredCurrency}
                  onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Zona Horaria</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
                >
                  <option value="UTC">UTC</option>
                  <option value="Europe/Madrid">Europe/Madrid (GMT+1)</option>
                  <option value="America/New_York">America/New_York (GMT-5)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                </select>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Configuración
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                💡 El modo de uso se guarda automáticamente al seleccionarlo. Los demás cambios requieren guardar manualmente.
              </p>
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
          <SubscriptionTab />
        )}
      </div>
    </div>
  );
}

