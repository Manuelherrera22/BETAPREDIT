/**
 * Daily Tip Component
 * Muestra un consejo del día para educar a los usuarios
 */

import { useState, useEffect } from 'react';

interface Tip {
  id: string;
  emoji: string;
  title: string;
  content: string;
  category: 'basic' | 'advanced' | 'bankroll' | 'strategy';
}

const tips: Tip[] = [
  {
    id: '1',
    emoji: '💡',
    title: 'Compara Cuotas',
    content: 'Siempre compara cuotas antes de apostar. La misma apuesta puede pagar diferente en cada casa. Ahorrar unos puntos puede hacer la diferencia a largo plazo.',
    category: 'basic',
  },
  {
    id: '2',
    emoji: '💰',
    title: 'Gestiona tu Bankroll',
    content: 'No apuestes más de lo que puedes permitirte perder. Una buena regla es no apostar más del 1-5% de tu bankroll en una sola apuesta.',
    category: 'bankroll',
  },
  {
    id: '3',
    emoji: '📊',
    title: 'Trackea tus Apuestas',
    content: 'Registra todas tus apuestas para saber si realmente estás ganando o perdiendo. Muchos apostadores piensan que ganan, pero en realidad pierden a largo plazo.',
    category: 'basic',
  },
  {
    id: '4',
    emoji: '🎯',
    title: 'Busca Valor, no Solo Ganar',
    content: 'Una apuesta puede ganar pero no ser buena. Busca apuestas donde la probabilidad real sea mayor que lo que la casa te paga. Esto se llama "value bet".',
    category: 'strategy',
  },
  {
    id: '5',
    emoji: '🧠',
    title: 'Apuesta con Cabeza',
    content: 'No dejes que las emociones guíen tus apuestas. Apuesta basándote en datos y análisis, no en lo que "sientes" que va a pasar.',
    category: 'strategy',
  },
  {
    id: '6',
    emoji: '⏰',
    title: 'Timing Importa',
    content: 'Las cuotas cambian constantemente. Si encuentras una buena oportunidad, actúa rápido antes de que la cuota baje.',
    category: 'advanced',
  },
  {
    id: '7',
    emoji: '📈',
    title: 'Piensa a Largo Plazo',
    content: 'Una apuesta puede perder, pero si siempre buscas valor, ganarás a largo plazo. No te desanimes por pérdidas individuales.',
    category: 'strategy',
  },
  {
    id: '8',
    emoji: '🔍',
    title: 'Investiga Antes de Apostar',
    content: 'No apuestes solo porque "te gusta" un equipo. Investiga: forma reciente, lesiones, motivación, historial entre equipos.',
    category: 'basic',
  },
];

export default function DailyTip() {
  const [todayTip, setTodayTip] = useState<Tip>(tips[0]);

  useEffect(() => {
    // Seleccionar tip basado en el día del año (0-365)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const tipIndex = dayOfYear % tips.length;
    setTodayTip(tips[tipIndex]);
  }, []);

  return (
    <div className="bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl p-6 border border-primary-500/40">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{todayTip.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-black text-white">Consejo del Día</h3>
            <span className="px-2 py-1 bg-primary-500/30 text-primary-300 rounded-full text-xs font-bold">
              {todayTip.category === 'basic' ? 'Básico' :
               todayTip.category === 'bankroll' ? 'Bankroll' :
               todayTip.category === 'strategy' ? 'Estrategia' : 'Avanzado'}
            </span>
          </div>
          <h4 className="text-base font-bold text-white mb-2">{todayTip.title}</h4>
          <p className="text-sm text-gray-300 leading-relaxed">{todayTip.content}</p>
        </div>
      </div>
    </div>
  );
}

