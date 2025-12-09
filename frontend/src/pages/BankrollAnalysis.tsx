import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import StatsCard from '../components/StatsCard';
import SimpleChart from '../components/SimpleChart';
import { userStatisticsService, type UserStatistics } from '../services/userStatisticsService';

export default function BankrollAnalysis() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  // Obtener estadísticas reales
  const { data: currentStats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStatistics', 'bankroll', timeRange],
    queryFn: () => userStatisticsService.getMyStatistics(timeRange),
    refetchInterval: 60000, // Actualizar cada minuto
  });

  // Obtener estadísticas por período para gráficos
  const { data: periodStats = [], isLoading: periodLoading } = useQuery({
    queryKey: ['userStatistics', 'byPeriod', timeRange],
    queryFn: () => userStatisticsService.getStatisticsByPeriod(timeRange),
    refetchInterval: 60000,
  });

  // Preparar datos para gráficos
  const safePeriodStats = Array.isArray(periodStats) ? periodStats : [];
  
  // Calcular bankroll history desde estadísticas
  const bankrollHistory = safePeriodStats.length > 0
    ? safePeriodStats.map((stat: UserStatistics, index: number) => {
        const currentBankroll = stat.totalStaked + stat.netProfit;
        return {
          label: timeRange === 'week' 
            ? `Sem ${index + 1}`
            : timeRange === 'month'
            ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][index] || `Mes ${index + 1}`
            : `Año ${new Date(stat.periodStart || new Date()).getFullYear()}`,
          value: currentBankroll,
        };
      })
    : [];

  const monthlyROI = safePeriodStats.length > 0
    ? safePeriodStats.map((stat: UserStatistics, index: number) => ({
        label: timeRange === 'week' 
          ? `Sem ${index + 1}`
          : timeRange === 'month'
          ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][index] || `Mes ${index + 1}`
          : `Año ${new Date(stat.periodStart || new Date()).getFullYear()}`,
        value: stat.roi || 0,
      }))
    : [];

  // Calcular valores actuales
  const currentBankroll = currentStats 
    ? currentStats.totalStaked + currentStats.netProfit 
    : 0;
  const initialBankroll = safePeriodStats.length > 0 && safePeriodStats[0]
    ? safePeriodStats[0].totalStaked
    : currentStats?.totalStaked || 0;
  const totalReturn = initialBankroll > 0 
    ? ((currentBankroll - initialBankroll) / initialBankroll) * 100 
    : 0;
  const monthlyAverage = safePeriodStats.length > 0
    ? safePeriodStats.reduce((sum: number, stat: UserStatistics) => sum + (stat.roi || 0), 0) / safePeriodStats.length
    : 0;
  
  // Calcular stake promedio
  const averageStake = currentStats && currentStats.totalBets > 0
    ? currentStats.totalStaked / currentStats.totalBets
    : 0;

  if (statsLoading || periodLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Cargando análisis de bankroll...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Análisis de Bankroll</h1>
        <p className="text-gray-400">Evolución y gestión de tu capital</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Bankroll Actual"
          value={`€${currentBankroll.toLocaleString()}`}
          change={`+${totalReturn.toFixed(1)}% total`}
          trend="up"
          icon={
            <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Ganancia Total"
          value={`+€${(currentBankroll - initialBankroll).toLocaleString()}`}
          change={`Desde €${initialBankroll}`}
          trend="up"
          icon={
            <svg className="w-6 h-6 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatsCard
          title="ROI Promedio Mensual"
          value={`+${monthlyAverage.toFixed(1)}%`}
          change="Últimos 8 meses"
          trend="up"
          icon={
            <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatsCard
          title="Stake Promedio"
          value={`€${averageStake.toFixed(2)}`}
          subtitle="Por apuesta"
          icon={
            <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTimeRange('week')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            timeRange === 'week'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-gray-400 hover:text-white'
          }`}
        >
          Semana
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            timeRange === 'month'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-gray-400 hover:text-white'
          }`}
        >
          Mes
        </button>
        <button
          onClick={() => setTimeRange('year')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            timeRange === 'year'
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-gray-400 hover:text-white'
          }`}
        >
          Año
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-xl font-black text-white mb-4">Evolución del Bankroll</h3>
          {bankrollHistory.length > 0 ? (
            <SimpleChart data={bankrollHistory} color="primary" height={250} />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              <p>No hay datos de bankroll disponibles</p>
            </div>
          )}
        </div>
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-xl font-black text-white mb-4">
            ROI {timeRange === 'week' ? 'Semanal' : timeRange === 'month' ? 'Mensual' : 'Anual'}
          </h3>
          {monthlyROI.length > 0 ? (
            <SimpleChart data={monthlyROI} color="accent" height={250} />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              <p>No hay datos de ROI disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Bankroll Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución de Stakes</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Value Bets Altos (+10%)</span>
                <span className="text-white font-semibold">35%</span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2">
                <div className="bg-gold-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Value Bets Medios (5-10%)</span>
                <span className="text-white font-semibold">45%</span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2">
                <div className="bg-accent-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Value Bets Bajos (1-5%)</span>
                <span className="text-white font-semibold">20%</span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Recomendaciones</h3>
          <div className="space-y-3">
            <div className="bg-primary-500/10 rounded-lg p-4 border border-primary-500/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <h4 className="text-white font-semibold mb-1">Stake Óptimo</h4>
                  <p className="text-gray-400 text-sm">
                    Basado en tu ROI, considera aumentar el stake en value bets de +10% a 4-5% del bankroll.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-accent-500/10 rounded-lg p-4 border border-accent-500/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div>
                  <h4 className="text-white font-semibold mb-1">Rendimiento Excelente</h4>
                  <p className="text-gray-400 text-sm">
                    Tu ROI mensual promedio del {monthlyAverage.toFixed(1)}% está por encima del promedio del mercado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

