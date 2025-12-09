/**
 * Value Bet Preferences Form Component
 * Allows users to configure their value bet alert preferences
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userPreferencesService, type ValueBetPreferences } from '../services/userPreferencesService';
import toast from 'react-hot-toast';

const AVAILABLE_SPORTS = [
  { value: 'soccer_epl', label: 'Premier League' },
  { value: 'soccer_usa_mls', label: 'MLS' },
  { value: 'basketball_nba', label: 'NBA' },
  { value: 'americanfootball_nfl', label: 'NFL' },
  { value: 'icehockey_nhl', label: 'NHL' },
  { value: 'baseball_mlb', label: 'MLB' },
];

const AVAILABLE_PLATFORMS = [
  'Bet365',
  'Betfair',
  'William Hill',
  'Pinnacle',
  'DraftKings',
  'FanDuel',
  'BetMGM',
  'Caesars',
];

export default function ValueBetPreferencesForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ValueBetPreferences>({
    minValue: 0.05,
    maxEvents: 20,
    sports: ['soccer_epl'],
    platforms: [],
    autoCreateAlerts: true,
    notificationThreshold: 0.10,
    minConfidence: 0.5,
    maxOdds: 10.0,
    minOdds: 1.1,
    marketTypes: ['h2h'],
  });

  // Load preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['valueBetPreferences'],
    queryFn: () => userPreferencesService.getValueBetPreferences(),
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        minValue: preferences.minValue ?? 0.05,
        maxEvents: preferences.maxEvents ?? 20,
        sports: preferences.sports ?? ['soccer_epl'],
        platforms: preferences.platforms ?? [],
        autoCreateAlerts: preferences.autoCreateAlerts ?? true,
        notificationThreshold: preferences.notificationThreshold ?? 0.10,
        minConfidence: preferences.minConfidence ?? 0.5,
        maxOdds: preferences.maxOdds ?? 10.0,
        minOdds: preferences.minOdds ?? 1.1,
        marketTypes: preferences.marketTypes ?? ['h2h'],
      });
    }
  }, [preferences]);

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<ValueBetPreferences>) =>
      userPreferencesService.updateValueBetPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valueBetPreferences'] });
      toast.success('Preferencias guardadas correctamente');
    },
    onError: () => {
      toast.error('Error al guardar preferencias');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const toggleSport = (sport: string) => {
    setFormData((prev) => ({
      ...prev,
      sports: prev.sports?.includes(sport)
        ? prev.sports.filter((s) => s !== sport)
        : [...(prev.sports || []), sport],
    }));
  };

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms?.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...(prev.platforms || []), platform],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Cargando preferencias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Minimum Value */}
      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          Valor Mínimo Requerido: {(formData.minValue || 0) * 100}%
        </label>
        <input
          type="range"
          min="0.01"
          max="0.50"
          step="0.01"
          value={formData.minValue || 0.05}
          onChange={(e) => setFormData({ ...formData, minValue: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1%</span>
          <span>50%</span>
        </div>
      </div>

      {/* Notification Threshold */}
      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          Umbral de Notificación: {(formData.notificationThreshold || 0) * 100}%
        </label>
        <input
          type="range"
          min="0.01"
          max="0.50"
          step="0.01"
          value={formData.notificationThreshold || 0.10}
          onChange={(e) => setFormData({ ...formData, notificationThreshold: parseFloat(e.target.value) })}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Solo recibirás notificaciones si el valor es mayor o igual a este umbral
        </p>
      </div>

      {/* Minimum Confidence */}
      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          Confianza Mínima del Modelo: {((formData.minConfidence || 0.5) * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={formData.minConfidence || 0.5}
          onChange={(e) => setFormData({ ...formData, minConfidence: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Odds Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Cuota Mínima</label>
          <input
            type="number"
            min="1.01"
            max="50"
            step="0.1"
            value={formData.minOdds || 1.1}
            onChange={(e) => setFormData({ ...formData, minOdds: parseFloat(e.target.value) })}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Cuota Máxima</label>
          <input
            type="number"
            min="1.1"
            max="100"
            step="0.1"
            value={formData.maxOdds || 10.0}
            onChange={(e) => setFormData({ ...formData, maxOdds: parseFloat(e.target.value) })}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400"
          />
        </div>
      </div>

      {/* Preferred Sports */}
      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-3">Deportes Preferidos</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AVAILABLE_SPORTS.map((sport) => (
            <button
              key={sport.value}
              type="button"
              onClick={() => toggleSport(sport.value)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                formData.sports?.includes(sport.value)
                  ? 'border-primary-400 bg-primary-500/20'
                  : 'border-primary-500/30 bg-dark-800/50 hover:border-primary-500/50'
              }`}
            >
              <span className="text-white font-medium">{sport.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Platforms */}
      <div>
        <label className="block text-sm font-semibold text-gray-400 mb-3">Plataformas Preferidas</label>
        <p className="text-xs text-gray-500 mb-3">
          Deja vacío para recibir alertas de todas las plataformas
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AVAILABLE_PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.platforms?.includes(platform)
                  ? 'border-primary-400 bg-primary-500/20'
                  : 'border-primary-500/30 bg-dark-800/50 hover:border-primary-500/50'
              }`}
            >
              <span className="text-white font-medium text-sm">{platform}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Auto Create Alerts */}
      <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-primary-500/30">
        <div>
          <label className="block text-sm font-semibold text-white mb-1">
            Crear Alertas Automáticamente
          </label>
          <p className="text-xs text-gray-400">
            Las alertas se crearán automáticamente cuando se detecten value bets
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, autoCreateAlerts: !formData.autoCreateAlerts })}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            formData.autoCreateAlerts ? 'bg-primary-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
              formData.autoCreateAlerts ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {updateMutation.isPending ? 'Guardando...' : 'Guardar Preferencias'}
      </button>
    </div>
  );
}

