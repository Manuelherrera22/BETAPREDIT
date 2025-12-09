/**
 * Casual Dashboard Component
 * Vista simplificada para apostadores casuales
 */

import { useQuery } from '@tanstack/react-query';
import { userStatisticsService } from '../services/userStatisticsService';
import { Link } from 'react-router-dom';

export default function CasualDashboard() {

  // Obtener estadísticas reales
  const { data: stats, isLoading } = useQuery({
    queryKey: ['userStatistics', 'monthly'],
    queryFn: () => userStatisticsService.getMyStatistics('month'),
    refetchInterval: 60000, // Actualizar cada minuto
  });

  // Calcular si está ganando o perdiendo
  const isWinning = stats && stats.netProfit > 0;
  const profitLoss = stats ? stats.netProfit : 0;
  const profitLossFormatted = profitLoss >= 0 
    ? `+€${Math.abs(profitLoss).toFixed(2)}` 
    : `-€${Math.abs(profitLoss).toFixed(2)}`;

  // Consejo del día (rotativo)
  const dailyTips = [
    "💡 Tip: Compara cuotas antes de apostar. Puedes ganar más apostando en la casa correcta.",
    "💡 Tip: No apuestes más de lo que puedes permitirte perder.",
    "💡 Tip: Registra tus apuestas para ver si estás ganando o perdiendo a largo plazo.",
    "💡 Tip: Las apuestas con mejor probabilidad no siempre son las que más pagan.",
    "💡 Tip: Apuesta con cabeza, no con el corazón.",
  ];
  const todayTip = dailyTips[new Date().getDate() % dailyTips.length];

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-700 rounded mb-4"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado Principal: ¿Ganando o Perdiendo? */}
      <div className={`bg-gradient-to-br rounded-xl p-8 border-2 ${
        isWinning 
          ? 'from-green-500/20 to-green-600/20 border-green-500/40' 
          : 'from-red-500/20 to-red-600/20 border-red-500/40'
      }`}>
        <div className="text-center">
          <p className="text-sm text-gray-300 mb-2">Este mes estás</p>
          <h2 className={`text-5xl font-black mb-2 ${
            isWinning ? 'text-green-400' : 'text-red-400'
          }`}>
            {profitLossFormatted}
          </h2>
          <p className="text-gray-400 text-sm">
            {isWinning 
              ? '🎉 ¡Sigue así! Estás ganando dinero.' 
              : '⚠️ Estás perdiendo dinero. Revisa tus apuestas.'}
          </p>
        </div>
      </div>

      {/* Estadísticas Simples */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <p className="text-xs text-gray-400 mb-2">Apuestas este mes</p>
          <p className="text-3xl font-black text-white">
            {stats?.totalBets || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <p className="text-xs text-gray-400 mb-2">Ganadas</p>
          <p className="text-3xl font-black text-green-400">
            {stats?.totalWins || 0}
          </p>
        </div>
      </div>

      {/* Gráfico Visual Simple */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
        <h3 className="text-lg font-black text-white mb-4">Tu Progreso</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Ganadas</span>
              <span className="text-sm font-bold text-white">
                {stats?.totalWins || 0} de {stats?.totalBets || 0}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                style={{ 
                  width: `${stats && stats.totalBets > 0 
                    ? (stats.totalWins / stats.totalBets) * 100 
                    : 0}%` 
                }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Perdidas</span>
              <span className="text-sm font-bold text-white">
                {stats?.totalLosses || 0} de {stats?.totalBets || 0}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all"
                style={{ 
                  width: `${stats && stats.totalBets > 0 
                    ? (stats.totalLosses / stats.totalBets) * 100 
                    : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Consejo del Día */}
      <div className="bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl p-6 border border-primary-500/40">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="text-lg font-black text-white mb-2">Consejo del Día</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{todayTip}</p>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/odds-comparison"
          className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl p-6 border border-primary-500/40 hover:border-primary-400/60 transition-all"
        >
          <h3 className="text-lg font-black text-white mb-2">¿Dónde está la mejor cuota?</h3>
          <p className="text-gray-400 text-sm">Compara cuotas de múltiples casas y encuentra la mejor</p>
        </Link>
        <Link
          to="/my-bets"
          className="bg-gradient-to-br from-accent-500/20 to-accent-600/20 rounded-xl p-6 border border-accent-500/40 hover:border-accent-400/60 transition-all"
        >
          <h3 className="text-lg font-black text-white mb-2">Registrar Apuesta</h3>
          <p className="text-gray-400 text-sm">Registra tus apuestas para trackear tu progreso</p>
        </Link>
      </div>

      {/* Mensaje si no hay datos */}
      {(!stats || stats.totalBets === 0) && (
        <div className="bg-gradient-to-br from-gold-500/20 to-accent-500/20 rounded-xl p-6 border border-gold-500/40 text-center">
          <p className="text-white font-bold mb-2">¡Empieza a trackear tus apuestas!</p>
          <p className="text-gray-300 text-sm mb-4">
            Registra tus apuestas para ver si estás ganando o perdiendo dinero
          </p>
          <Link
            to="/my-bets"
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-bold hover:from-primary-600 hover:to-accent-600 transition-all"
          >
            Registrar Mi Primera Apuesta
          </Link>
        </div>
      )}
    </div>
  );
}

