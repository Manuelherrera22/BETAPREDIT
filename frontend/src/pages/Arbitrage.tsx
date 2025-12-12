/**
 * Arbitrage Opportunities Page
 * Displays real-time arbitrage opportunities with stake calculator
 */

import { useState, useEffect } from 'react';
import { arbitrageService, type ArbitrageOpportunity, type StakeCalculation } from '../services/arbitrageService';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDebounce } from '../hooks/useDebounce';
import Icon from '../components/icons/IconSystem';

export default function Arbitrage() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [stakes, setStakes] = useState<StakeCalculation[] | null>(null);
  const [bankroll, setBankroll] = useState<number>(100);
  const [filters, setFilters] = useState({
    minProfitMargin: 0.001, // Default to 0.1% instead of 1% to find more opportunities
    sport: '',
  });
  const [isOnline, setIsOnline] = useState(false);

  const { socket, connected } = useWebSocket();

  // Debounce filters to avoid multiple API calls
  const debouncedFilters = useDebounce(filters, 500);

  // Fetch opportunities on mount and when debounced filters change
  useEffect(() => {
    fetchOpportunities();
  }, [debouncedFilters]);

  // Subscribe to arbitrage WebSocket updates
  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit('subscribe:arbitrage', { sport: filters.sport || undefined });

    const handleArbitrageOpportunity = (opportunity: ArbitrageOpportunity) => {
      // Validate opportunity structure
      if (!opportunity || !opportunity.id || !opportunity.selections || !Array.isArray(opportunity.selections)) {
        console.warn('Invalid arbitrage opportunity received:', opportunity);
        return;
      }

      setOpportunities((prev) => {
        // Ensure prev is always an array
        const safePrev = Array.isArray(prev) ? prev : [];
        // Check if opportunity already exists
        const exists = safePrev.find((o) => o.id === opportunity.id);
        if (exists) {
          // Update existing
          return safePrev.map((o) => (o.id === opportunity.id ? opportunity : o));
        }
        // Add new at the beginning - NUEVA OPORTUNIDAD DETECTADA
        // Mostrar notificación visual
        if (opportunity.profitMargin >= 0.02) { // Solo notificar si es >2%
          // Crear notificación visual temporal
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-pulse border-2 border-emerald-400';
          notification.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="text-2xl">🎯</div>
              <div>
                <div class="font-black text-lg">Nueva Oportunidad de Arbitraje!</div>
                <div class="text-sm opacity-90">ROI: ${(opportunity.profitMargin * 100).toFixed(2)}% garantizado</div>
              </div>
            </div>
          `;
          document.body.appendChild(notification);
          setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
          }, 5000);
        }
        return [opportunity, ...safePrev].slice(0, 50); // Keep max 50
      });
    };

    socket.on('arbitrage:opportunity', handleArbitrageOpportunity);

    return () => {
      socket.off('arbitrage:opportunity', handleArbitrageOpportunity);
      socket.emit('unsubscribe', 'arbitrage:all');
    };
  }, [socket, connected, filters.sport]);

  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await arbitrageService.getOpportunities({
        minProfitMargin: debouncedFilters.minProfitMargin,
        sport: debouncedFilters.sport && debouncedFilters.sport.trim() !== '' ? debouncedFilters.sport : undefined,
        limit: 50,
      });
      // Ensure data is always an array
      const opportunitiesArray = Array.isArray(data) ? data : [];
      setOpportunities(opportunitiesArray);
      // Set online status if we got a response (even if empty)
      setIsOnline(true);
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      setError('Error al cargar oportunidades de arbitraje');
      setOpportunities([]); // Set empty array on error
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateStakes = async (opportunity: ArbitrageOpportunity) => {
    if (bankroll <= 0) {
      alert('El bankroll debe ser mayor a 0');
      return;
    }

    try {
      const result = await arbitrageService.calculateStakes(opportunity, bankroll);
      setStakes(result.stakes);
      setSelectedOpportunity(opportunity);
    } catch (err: any) {
      console.error('Error calculating stakes:', err);
      alert('Error al calcular los stakes');
    }
  };

  const formatProfitMargin = (margin: number) => {
    return (margin * 100).toFixed(2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 z-10">
        {/* Header - Mejorado */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 via-green-500/30 to-accent-500/30 flex items-center justify-center shadow-md border border-emerald-500/40">
                  <Icon name="arbitrage" size={20} className="text-emerald-300" strokeWidth={2} />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">
                  Arbitraje
                </h1>
                <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 rounded-full text-xs font-black border-2 border-emerald-500/40 shadow-lg">
                  💰 GARANTIZADO
                </span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg font-medium max-w-2xl ml-0 sm:ml-13">
                Oportunidades de ganancia garantizada comparando cuotas de múltiples casas de apuestas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${(connected || isOnline) ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-400 font-semibold">
                {(connected || isOnline) ? 'En línea' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Filters - Mejorado */}
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border-2 border-slate-700/50 shadow-xl mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Icon name="settings" size={16} className="text-emerald-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">Filtros de Búsqueda</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Margen de Ganancia Mínimo (%)
              </label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={filters.minProfitMargin * 100}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minProfitMargin: parseFloat(e.target.value) / 100,
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Deporte
              </label>
              <select
                value={filters.sport}
                onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                <option value="">Todos</option>
                <option value="soccer">Fútbol</option>
                <option value="basketball">Baloncesto</option>
                <option value="americanfootball">Fútbol Americano</option>
                <option value="baseball">Béisbol</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchOpportunities}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg font-black transition-all shadow-lg shadow-emerald-500/30 hover:scale-105 flex items-center justify-center gap-2"
              >
                <Icon name="refresh-cw" size={18} />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Stats - Mejorado con mejor diseño */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl p-4 border-2 border-primary-500/30 shadow-lg hover:shadow-primary-500/20 transition-all">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Oportunidades</div>
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">
              {Array.isArray(opportunities) ? opportunities.length : 0}
            </div>
            <div className="text-xs text-primary-300">Activas ahora</div>
          </div>
          <div className="bg-gradient-to-br from-accent-500/20 to-accent-600/20 rounded-xl p-4 border-2 border-accent-500/30 shadow-lg hover:shadow-accent-500/20 transition-all">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Margen Promedio</div>
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">
              {Array.isArray(opportunities) && opportunities.length > 0
                ? formatProfitMargin(
                    opportunities.reduce((sum, o) => sum + (o?.profitMargin || 0), 0) / opportunities.length
                  )
                : '0.00'}
              <span className="text-lg">%</span>
            </div>
            <div className="text-xs text-accent-300">ROI garantizado</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl p-4 border-2 border-emerald-500/30 shadow-lg hover:shadow-emerald-500/20 transition-all">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Mejor Oportunidad</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 mb-1">
              {Array.isArray(opportunities) && opportunities.length > 0 && opportunities[0]?.profitMargin
                ? formatProfitMargin(opportunities[0].profitMargin)
                : '0.00'}
              <span className="text-lg">%</span>
            </div>
            <div className="text-xs text-emerald-300">Premium</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border-2 border-purple-500/30 shadow-lg">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Estado</div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3 h-3 rounded-full ${(connected || isOnline) ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-red-400'}`}></div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {(connected || isOnline) ? 'En línea' : 'Offline'}
              </div>
            </div>
            {(connected || isOnline) && (
              <div className="text-xs text-green-400 font-semibold">
                {connected ? 'Actualización en tiempo real' : 'Sistema operativo'}
              </div>
            )}
          </div>
        </div>

        {/* Opportunities List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando oportunidades...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : !Array.isArray(opportunities) || opportunities.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No se encontraron oportunidades de arbitraje con los filtros seleccionados
          </div>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opportunity, idx) => (
              <div
                key={opportunity.id}
                className={`bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border-2 ${
                  opportunity.profitMargin >= 0.03 
                    ? 'border-emerald-500/50 hover:border-emerald-500/70 shadow-xl shadow-emerald-500/20' 
                    : opportunity.profitMargin >= 0.02
                    ? 'border-green-500/40 hover:border-green-500/60 shadow-lg shadow-green-500/10'
                    : 'border-primary-500/30 hover:border-primary-500/50 shadow-lg'
                } transition-all duration-300 hover:scale-[1.01]`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-sm font-semibold">
                        {opportunity.event.sport.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(opportunity.event.startTime)}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">
                      {opportunity.event.homeTeam} vs {opportunity.event.awayTeam}
                    </h3>
                    <div className="text-sm text-gray-400 mb-3">
                      {opportunity.market.name}
                    </div>

                    {/* Selections - Mejorado */}
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(opportunity.selections) && opportunity.selections.length > 0
                        ? opportunity.selections.map((sel, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-2 bg-slate-900/60 border border-primary-500/30 rounded-lg text-sm hover:border-primary-500/50 transition-all backdrop-blur-sm"
                            >
                              <span className="text-white font-semibold">{sel?.selection || 'N/A'}</span>
                              <span className="text-gray-400 mx-2">@</span>
                              <span className="text-accent-400 font-bold">
                                {sel?.odds ? sel.odds.toFixed(2) : 'N/A'}
                              </span>
                              <span className="text-gray-500 text-xs ml-2">({sel?.bookmaker || 'N/A'})</span>
                            </div>
                          ))
                        : <span className="text-gray-400 text-sm">No hay selecciones disponibles</span>}
                    </div>
                  </div>

                  {/* Profit Info - Mejorado */}
                  <div className="flex flex-col items-end gap-3 min-w-[200px]">
                    <div className={`text-right p-4 rounded-xl border-2 ${
                      opportunity.profitMargin >= 0.03 
                        ? 'bg-gradient-to-br from-emerald-500/30 to-green-600/30 border-emerald-500/50' 
                        : opportunity.profitMargin >= 0.02
                        ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/40'
                        : 'bg-gradient-to-br from-primary-500/20 to-primary-600/20 border-primary-500/40'
                    }`}>
                      <div className="text-xs text-gray-300 mb-1">ROI Garantizado</div>
                      <div className={`text-4xl font-black ${
                        opportunity.profitMargin >= 0.03 ? 'text-emerald-300' :
                        opportunity.profitMargin >= 0.02 ? 'text-green-300' : 'text-primary-300'
                      }`}>
                        {opportunity.roi.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Margen: {formatProfitMargin(opportunity.profitMargin)}%
                      </div>
                      {opportunity.profitMargin >= 0.03 && (
                        <div className="mt-2 px-2 py-1 bg-emerald-500/40 rounded text-xs font-bold text-white">
                          ⭐ Oportunidad Premium
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCalculateStakes(opportunity)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-lg font-black transition-all shadow-lg shadow-accent-500/30 hover:scale-105"
                    >
                      💰 Calcular Stakes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stake Calculator Modal */}
        {selectedOpportunity && stakes && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl p-8 border border-primary-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white">Calculadora de Stakes</h2>
                <button
                  onClick={() => {
                    setSelectedOpportunity(null);
                    setStakes(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Bankroll Total (€)
                </label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={bankroll}
                  onChange={(e) => setBankroll(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-4 mb-6">
                {Array.isArray(stakes) && stakes.length > 0
                  ? stakes.map((stake, idx) => (
                      <div
                        key={idx}
                        className="bg-dark-800 rounded-lg p-4 border border-primary-500/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{stake?.selection || 'N/A'}</div>
                            <div className="text-sm text-gray-400">
                              {stake?.bookmaker || 'N/A'} @ {stake?.odds ? stake.odds.toFixed(2) : 'N/A'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-accent-400">
                              {formatCurrency(stake?.stake || 0)}
                            </div>
                            <div className="text-sm text-gray-400">
                              Retorno: {formatCurrency(stake?.potentialReturn || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  : <div className="text-center text-gray-400 py-4">No hay stakes calculados</div>}
              </div>

              {Array.isArray(stakes) && stakes.length > 0 && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Stake Total</div>
                      <div className="text-xl font-bold text-white">
                        {formatCurrency(
                          stakes.reduce((sum, s) => sum + (s?.stake || 0), 0)
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">Ganancia Garantizada</div>
                      <div className="text-xl font-bold text-green-400">
                        {formatCurrency(
                          stakes.reduce((sum, s) => sum + (s?.potentialReturn || 0), 0) -
                            stakes.reduce((sum, s) => sum + (s?.stake || 0), 0)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedOpportunity(null);
                  setStakes(null);
                }}
                className="w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

