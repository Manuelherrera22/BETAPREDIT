import { useState, useEffect } from 'react';

// Hook para simular actualizaciones de cuotas en tiempo real
export function useLiveOdds(initialOdds: number, updateInterval: number = 5000) {
  const [odds, setOdds] = useState(initialOdds);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      // Simular pequeñas variaciones en las cuotas (±0.05)
      const variation = (Math.random() - 0.5) * 0.1;
      setOdds(prev => {
        const newOdds = Math.max(1.01, Math.min(10, prev + variation));
        return Math.round(newOdds * 100) / 100;
      });
      setTimeout(() => setIsUpdating(false), 500);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return { odds, isUpdating };
}

// Hook para simular alertas automáticas
export function useMockAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const alertTemplates = [
      {
        type: 'value_bet',
        title: 'Value Bet Detectado',
        message: 'Real Madrid vs Barcelona - Cuota 2.15 con +12% de valor',
        event: 'Real Madrid vs Barcelona',
        value: 12,
      },
      {
        type: 'odds_change',
        title: 'Cambio de Cuotas',
        message: 'Lakers vs Warriors - Mejor cuota cambió de 1.85 a 1.92',
        event: 'Lakers vs Warriors',
      },
      {
        type: 'prediction',
        title: 'Nueva Predicción',
        message: 'Nadal vs Djokovic - Probabilidad actualizada: 58% para Nadal',
        event: 'Nadal vs Djokovic',
      },
      {
        type: 'value_bet',
        title: 'Value Bet Detectado',
        message: 'Manchester City vs Liverpool - Cuota 2.30 con +8% de valor',
        event: 'Manchester City vs Liverpool',
        value: 8,
      },
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% probabilidad de nueva alerta
        const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
        const newAlert = {
          ...template,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Máximo 10 alertas
      }
    }, 15000); // Cada 15 segundos

    return () => clearInterval(interval);
  }, []);

  return alerts;
}

// Hook para simular eventos en vivo con scores que cambian
export function useLiveEvents() {
  const [events, setEvents] = useState([
    {
      id: '1',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      homeScore: 2,
      awayScore: 1,
      time: '67\'',
      status: 'LIVE',
    },
    {
      id: '2',
      homeTeam: 'Lakers',
      awayTeam: 'Warriors',
      homeScore: 98,
      awayScore: 95,
      time: 'Q4 2:34',
      status: 'LIVE',
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => prev.map(event => {
        if (event.status === 'LIVE' && Math.random() > 0.85) { // 15% probabilidad de gol/punto
          if (event.homeTeam === 'Real Madrid' || event.homeTeam === 'Barcelona') {
            // Fútbol: incrementar score
            return Math.random() > 0.5
              ? { ...event, homeScore: event.homeScore + 1 }
              : { ...event, awayScore: event.awayScore + 1 };
          } else {
            // Basketball: incrementar score
            const points = Math.floor(Math.random() * 3) + 1; // 1-3 puntos
            return Math.random() > 0.5
              ? { ...event, homeScore: event.homeScore + points }
              : { ...event, awayScore: event.awayScore + points };
          }
        }
        return event;
      }));
    }, 8000); // Cada 8 segundos

    return () => clearInterval(interval);
  }, []);

  return events;
}

// Generador de datos mock más realistas
export function generateMockEvents(count: number = 10) {
  const teams = [
    { home: 'Real Madrid', away: 'Barcelona', sport: 'Fútbol' },
    { home: 'Lakers', away: 'Warriors', sport: 'Basketball' },
    { home: 'Nadal', away: 'Djokovic', sport: 'Tenis' },
    { home: 'Manchester City', away: 'Liverpool', sport: 'Fútbol' },
    { home: 'Celtics', away: 'Heat', sport: 'Basketball' },
    { home: 'Federer', away: 'Murray', sport: 'Tenis' },
    { home: 'PSG', away: 'Bayern Munich', sport: 'Fútbol' },
    { home: 'Bulls', away: 'Nets', sport: 'Basketball' },
  ];

  return Array.from({ length: count }, (_, i) => {
    const team = teams[i % teams.length];
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + Math.floor(Math.random() * 24));
    
    return {
      id: (i + 1).toString(),
      ...team,
      startTime: startTime.toISOString(),
      status: Math.random() > 0.7 ? 'LIVE' : 'UPCOMING',
    };
  });
}

