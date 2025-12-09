/**
 * Arbitrage Opportunities Page
 * Displays real-time arbitrage opportunities with stake calculator
 */

import { useState, useEffect } from 'react';
import { arbitrageService, type ArbitrageOpportunity, type StakeCalculation } from '../services/arbitrageService';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDebounce } from '../hooks/useDebounce';
import GradientText from '../components/GradientText';

export default function Arbitrage() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [stakes, setStakes] = useState<StakeCalculation[] | null>(null);
  const [bankroll, setBankroll] = useState<number>(100);
  const [filters, setFilters] = useState({
    minProfitMargin: 0.01,
    sport: '',
  });

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
        // Add new at the beginning
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
        sport: debouncedFilters.sport || undefined,
        limit: 50,
      });
      // Ensure data is always an array
      setOpportunities(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      setError('Error al cargar oportunidades de arbitraje');
      setOpportunities([]); // Set empty array on error
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
    <div className="px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <GradientText className="text-4xl font-black mb-2">
            Oportunidades de Arbitraje
          </GradientText>
          <p className="text-gray-400">
            Encuentra oportunidades garantizadas de ganancia comparando cuotas de múltiples casas
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="w-full px-4 py-2 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Deporte
              </label>
              <select
                value={filters.sport}
                onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-500"
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
                className="w-full px-6 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-bold transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl p-4 border border-primary-500/30">
            <div className="text-sm text-gray-400 mb-1">Oportunidades</div>
            <div className="text-2xl font-black text-white">
              {Array.isArray(opportunities) ? opportunities.length : 0}
            </div>
          </div>
          <div className="bg-gradient-to-br from-accent-500/20 to-accent-600/20 rounded-xl p-4 border border-accent-500/30">
            <div className="text-sm text-gray-400 mb-1">Margen Promedio</div>
            <div className="text-2xl font-black text-white">
              {Array.isArray(opportunities) && opportunities.length > 0
                ? formatProfitMargin(
                    opportunities.reduce((sum, o) => sum + (o?.profitMargin || 0), 0) / opportunities.length
                  )
                : '0.00'}
              %
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/30">
            <div className="text-sm text-gray-400 mb-1">Mejor Oportunidad</div>
            <div className="text-2xl font-black text-white">
              {Array.isArray(opportunities) && opportunities.length > 0 && opportunities[0]?.profitMargin
                ? formatProfitMargin(opportunities[0].profitMargin)
                : '0.00'}%
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-500/30">
            <div className="text-sm text-gray-400 mb-1">Estado</div>
            <div className="text-2xl font-black text-white">
              {connected ? '🟢 En Vivo' : '🔴 Offline'}
            </div>
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
            {opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20 hover:border-accent-500/50 transition-all"
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

                    {/* Selections */}
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(opportunity.selections) && opportunity.selections.length > 0
                        ? opportunity.selections.map((sel, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-1 bg-dark-800 border border-primary-500/30 rounded-lg text-sm"
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

                  {/* Profit Info */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">Margen de Ganancia</div>
                      <div className="text-3xl font-black text-green-400">
                        {formatProfitMargin(opportunity.profitMargin)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">ROI</div>
                      <div className="text-xl font-bold text-accent-400">
                        {opportunity.roi.toFixed(2)}%
                      </div>
                    </div>
                    <button
                      onClick={() => handleCalculateStakes(opportunity)}
                      className="px-6 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-bold transition-colors mt-2"
                    >
                      Calcular Stakes
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

