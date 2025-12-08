import { useState, useEffect } from 'react';
import OddsComparisonTable from '../components/OddsComparisonTable';

export default function OddsComparison() {
  const [selectedEvent, setSelectedEvent] = useState<string>('1');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data mejorado - En producción vendría de la API
  const events = [
    {
      id: '1',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      sport: 'Fútbol',
      league: 'La Liga',
    },
    {
      id: '2',
      homeTeam: 'Lakers',
      awayTeam: 'Warriors',
      sport: 'Basketball',
      league: 'NBA',
    },
    {
      id: '3',
      homeTeam: 'Nadal',
      awayTeam: 'Djokovic',
      sport: 'Tenis',
      league: 'ATP Masters',
    },
    {
      id: '4',
      homeTeam: 'Manchester City',
      awayTeam: 'Liverpool',
      sport: 'Fútbol',
      league: 'Premier League',
    },
    {
      id: '5',
      homeTeam: 'Celtics',
      awayTeam: 'Heat',
      sport: 'Basketball',
      league: 'NBA',
    },
    {
      id: '6',
      homeTeam: 'PSG',
      awayTeam: 'Bayern Munich',
      sport: 'Fútbol',
      league: 'Champions League',
    },
  ];

  // Filtrar eventos por búsqueda
  const filteredEvents = events.filter(event => 
    event.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.league.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estado para cuotas dinámicas que se actualizan
  const [oddsData, setOddsData] = useState({
    '1': [
      {
        platform: 'Bet365',
        home: 2.10,
        draw: 3.50,
        away: 2.80,
        value: 5.2,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Betfair',
        home: 2.15,
        draw: 3.45,
        away: 2.75,
        value: 8.5,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'William Hill',
        home: 2.05,
        draw: 3.60,
        away: 2.90,
        value: -2.1,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Pinnacle',
        home: 2.12,
        draw: 3.48,
        away: 2.82,
        value: 6.8,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Unibet',
        home: 2.08,
        draw: 3.52,
        away: 2.78,
        value: 4.1,
        lastUpdated: new Date().toISOString(),
      },
    ],
    '2': [
      {
        platform: 'Bet365',
        home: 1.85,
        away: 1.95,
        value: 3.2,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Betfair',
        home: 1.88,
        away: 1.92,
        value: 5.1,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Pinnacle',
        home: 1.87,
        away: 1.94,
        value: 4.3,
        lastUpdated: new Date().toISOString(),
      },
    ],
    '3': [
      {
        platform: 'Bet365',
        home: 2.20,
        away: 1.70,
        value: 7.2,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Betfair',
        home: 2.25,
        away: 1.68,
        value: 9.5,
        lastUpdated: new Date().toISOString(),
      },
    ],
    '4': [
      {
        platform: 'Bet365',
        home: 2.30,
        draw: 3.40,
        away: 2.70,
        value: 6.8,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Betfair',
        home: 2.35,
        draw: 3.35,
        away: 2.65,
        value: 8.2,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Pinnacle',
        home: 2.28,
        draw: 3.38,
        away: 2.72,
        value: 5.5,
        lastUpdated: new Date().toISOString(),
      },
    ],
    '5': [
      {
        platform: 'Bet365',
        home: 1.90,
        away: 1.90,
        value: 2.1,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Betfair',
        home: 1.92,
        away: 1.88,
        value: 4.3,
        lastUpdated: new Date().toISOString(),
      },
    ],
    '6': [
      {
        platform: 'Bet365',
        home: 2.15,
        draw: 3.50,
        away: 2.85,
        value: 5.8,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Betfair',
        home: 2.18,
        draw: 3.45,
        away: 2.80,
        value: 7.2,
        lastUpdated: new Date().toISOString(),
      },
      {
        platform: 'Pinnacle',
        home: 2.12,
        draw: 3.52,
        away: 2.88,
        value: 4.5,
        lastUpdated: new Date().toISOString(),
      },
    ],
  });

  // Simular actualizaciones de cuotas cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setOddsData(prev => {
        const newData: typeof prev = { ...prev };
        Object.keys(newData).forEach(eventId => {
          const eventOdds = newData[eventId as keyof typeof newData];
          newData[eventId as keyof typeof newData] = eventOdds.map((odd: any) => {
            // Pequeñas variaciones en las cuotas (±0.03)
            const homeVariation = (Math.random() - 0.5) * 0.06;
            const awayVariation = (Math.random() - 0.5) * 0.06;
            const drawVariation = odd.draw ? (Math.random() - 0.5) * 0.06 : 0;
            
            const newHome = Math.max(1.01, Math.min(10, odd.home + homeVariation));
            const newAway = Math.max(1.01, Math.min(10, odd.away + awayVariation));
            const newDraw = odd.draw ? Math.max(1.01, Math.min(10, odd.draw + drawVariation)) : undefined;
            
            // Recalcular valor basado en nuevas cuotas
            const avgOdds = newDraw ? (newHome + newDraw + newAway) / 3 : (newHome + newAway) / 2;
            const newValue = ((newHome - avgOdds) / avgOdds) * 100;
            
            return {
              ...odd,
              home: Math.round(newHome * 100) / 100,
              away: Math.round(newAway * 100) / 100,
              ...(newDraw !== undefined && { draw: Math.round(newDraw * 100) / 100 }),
              value: Math.round(newValue * 10) / 10,
              lastUpdated: new Date().toISOString(),
            };
          }) as any;
        });
        return newData;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const currentEvent = events.find(e => e.id === selectedEvent) || events[0];
  const currentOdds = oddsData[selectedEvent as keyof typeof oddsData] || oddsData['1'];

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Comparador de Cuotas</h1>
        <p className="text-gray-400">
          Compara cuotas de múltiples plataformas y encuentra el mejor valor
        </p>
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
            className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
            {filteredEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.homeTeam} vs {event.awayTeam} - {event.league}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="relative">
          <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
          <span className="absolute top-0 left-0 w-2 h-2 bg-accent-400 rounded-full animate-ping opacity-75"></span>
        </span>
        <span className="text-gray-400">Actualizando cuotas en tiempo real</span>
      </div>

      {/* Comparison Table */}
      <OddsComparisonTable event={currentEvent} odds={currentOdds} />

      {/* Info Section */}
      <div className="mt-6 bg-primary-500/10 rounded-xl p-4 border border-primary-500/20">
        <h3 className="text-sm font-semibold text-primary-300 mb-2">💡 Consejos</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Las cuotas marcadas con ⭐ son las mejores disponibles</li>
          <li>• El valor positivo indica un value bet potencial</li>
          <li>• Compara siempre antes de apostar para maximizar ganancias</li>
          <li>• Las cuotas se actualizan en tiempo real</li>
        </ul>
      </div>
    </div>
  );
}

