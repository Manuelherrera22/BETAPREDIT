import { useState, useEffect } from 'react';
import OddsComparisonTable from '../components/OddsComparisonTable';
import { theOddsApiService, type OddsEvent, type OddsComparison } from '../services/theOddsApiService';
import { useWebSocket } from '../hooks/useWebSocket';

export default function OddsComparison() {
  const [sports, setSports] = useState<Array<{ key: string; title: string }>>([]);
  const [selectedSport, setSelectedSport] = useState<string>('soccer_epl');
  const [events, setEvents] = useState<OddsEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [oddsComparisons, setOddsComparisons] = useState<Record<string, OddsComparison>>({});
  const [loadingComparisons, setLoadingComparisons] = useState(false);

  // WebSocket para actualizaciones en tiempo real
  const { isConnected, lastMessage, subscribe, unsubscribe } = useWebSocket({
    autoConnect: true,
    channels: [],
  });

  // Cargar deportes disponibles
  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await theOddsApiService.getSports();
        setSports(sportsData.filter(s => s.active));
        if (sportsData.length > 0 && !selectedSport) {
          const soccer = sportsData.find(s => s.key === 'soccer_epl' || s.key === 'soccer');
          setSelectedSport(soccer?.key || sportsData[0].key);
        }
      } catch (error) {
        console.error('Error loading sports:', error);
      }
    };
    loadSports();
  }, []);

  // Cargar eventos del deporte seleccionado
  useEffect(() => {
    if (!selectedSport) return;

    const loadEvents = async () => {
      setLoading(true);
      try {
        const eventsData = await theOddsApiService.getOdds(selectedSport, {
          regions: ['us', 'uk', 'eu'],
          markets: ['h2h'],
          oddsFormat: 'decimal',
        });
        setEvents(eventsData);
        if (eventsData.length > 0 && !selectedEvent) {
          setSelectedEvent(eventsData[0].id);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
    // Actualizar cada 60 segundos
    const interval = setInterval(loadEvents, 60000);
    return () => clearInterval(interval);
  }, [selectedSport]);

  // Cargar comparación de cuotas cuando se selecciona un evento
  useEffect(() => {
    if (!selectedEvent || !selectedSport) return;

    const loadComparison = async () => {
      setLoadingComparisons(true);
      try {
        const comparisonData = await theOddsApiService.compareOdds(selectedSport, selectedEvent, 'h2h');
        if (comparisonData && comparisonData.comparisons) {
          setOddsComparisons(comparisonData.comparisons);
        }
      } catch (error) {
        console.error('Error loading comparison:', error);
      } finally {
        setLoadingComparisons(false);
      }
    };

    loadComparison();
    // Actualizar cada 30 segundos (fallback si WebSocket falla)
    const interval = setInterval(loadComparison, 30000);
    return () => clearInterval(interval);
  }, [selectedEvent, selectedSport]);

  // Suscribirse a actualizaciones de cuotas cuando cambia el evento
  useEffect(() => {
    if (selectedEvent && isConnected) {
      subscribe(`odds:${selectedEvent}`);
      return () => {
        unsubscribe(`odds:${selectedEvent}`);
      };
    }
  }, [selectedEvent, isConnected, subscribe, unsubscribe]);

  // Actualizar cuotas cuando llega mensaje por WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'odds:update' && lastMessage.data.eventId === selectedEvent) {
      // Recargar comparación cuando llega actualización
      const loadComparison = async () => {
        try {
          const comparisonData = await theOddsApiService.compareOdds(selectedSport, selectedEvent, 'h2h');
          if (comparisonData && comparisonData.comparisons) {
            setOddsComparisons(comparisonData.comparisons);
          }
        } catch (error) {
          console.error('Error loading comparison:', error);
        }
      };
      loadComparison();
    }
  }, [lastMessage, selectedEvent, selectedSport]);

  // Filtrar eventos por búsqueda
  const filteredEvents = events.filter(event =>
    event.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.away_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.sport_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Convertir comparaciones a formato de tabla
  const currentEvent = events.find(e => e.id === selectedEvent);
  const oddsData = currentEvent ? (() => {
    const comparisons = oddsComparisons;
    const bookmakers = new Set<string>();
    
    // Recopilar todos los bookmakers
    Object.values(comparisons).forEach(comp => {
      comp.allOdds.forEach(odd => bookmakers.add(odd.bookmaker));
    });

    // Crear estructura de datos para la tabla
    return Array.from(bookmakers).map(bookmaker => {
      const homeComp = comparisons[currentEvent.home_team];
      const awayComp = comparisons[currentEvent.away_team];
      const drawComp = comparisons['Draw'] || comparisons['draw'];

      const homeOdd = homeComp?.allOdds.find(o => o.bookmaker === bookmaker)?.odds || null;
      const awayOdd = awayComp?.allOdds.find(o => o.bookmaker === bookmaker)?.odds || null;
      const drawOdd = drawComp?.allOdds.find(o => o.bookmaker === bookmaker)?.odds || null;

      // Calcular valor promedio (simplificado)
      const validOdds = [homeOdd, awayOdd, drawOdd].filter((odd): odd is number => odd !== null && odd !== undefined);
      const avgOdds = validOdds.length > 0 ? validOdds.reduce((sum, odd) => sum + odd, 0) / validOdds.length : 0;
      const value = homeOdd ? ((homeOdd - avgOdds) / avgOdds) * 100 : 0;

      return {
        platform: bookmaker,
        home: homeOdd || 0,
        away: awayOdd || 0,
        ...(drawOdd && { draw: drawOdd }),
        value: Math.round(value * 10) / 10,
        lastUpdated: new Date().toISOString(),
      };
    }).filter(odd => odd.home > 0 && odd.away > 0);
  })() : [];

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Comparador de Cuotas</h1>
        <p className="text-gray-400">
          Compara cuotas de múltiples plataformas y encuentra el mejor valor
        </p>
      </div>

      {/* Sport Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-400 mb-2">
          Seleccionar Deporte
        </label>
        <select
          value={selectedSport}
          onChange={(e) => {
            setSelectedSport(e.target.value);
            setSelectedEvent('');
          }}
          className="w-full md:w-auto px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        >
          {sports.map((sport) => (
            <option key={sport.key} value={sport.key}>
              {sport.title}
            </option>
          ))}
        </select>
      </div>

      {/* Search and Event Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Buscar Evento
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por equipo, liga..."
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Seleccionar Evento
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            disabled={loading || filteredEvents.length === 0}
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <option>Cargando eventos...</option>
            ) : filteredEvents.length === 0 ? (
              <option>No hay eventos disponibles</option>
            ) : (
              filteredEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.home_team} vs {event.away_team} - {event.sport_title}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loadingComparisons && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando comparación de cuotas...</span>
        </div>
      )}

      {/* WebSocket Status */}
      {!loadingComparisons && currentEvent && (
        <div className="mb-4 flex items-center gap-4 text-sm">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="relative">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="absolute top-0 left-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></span>
              </span>
              <span className="text-green-400">Conectado en tiempo real</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              <span className="text-gray-500">Desconectado (usando polling)</span>
            </div>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {currentEvent && oddsData.length > 0 ? (
        <OddsComparisonTable
          event={{
            id: currentEvent.id,
            homeTeam: currentEvent.home_team,
            awayTeam: currentEvent.away_team,
            sport: currentEvent.sport_title,
          }}
          odds={oddsData}
        />
      ) : currentEvent && !loadingComparisons ? (
        <div className="bg-dark-800 rounded-xl p-8 text-center border border-primary-500/20">
          <p className="text-gray-400">No hay cuotas disponibles para este evento</p>
        </div>
      ) : null}

      {/* Info Section */}
      <div className="mt-6 bg-primary-500/10 rounded-xl p-4 border border-primary-500/20">
        <h3 className="text-sm font-semibold text-primary-300 mb-2">💡 Consejos</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Las cuotas marcadas con ⭐ son las mejores disponibles</li>
          <li>• El valor positivo indica un value bet potencial</li>
          <li>• Compara siempre antes de apostar para maximizar ganancias</li>
          <li>• Las cuotas se actualizan automáticamente cada 30 segundos</li>
          <li>• Datos en tiempo real de múltiples casas de apuestas</li>
        </ul>
      </div>
    </div>
  );
}
