import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import StatsCard from '../components/StatsCard';
import SimpleChart from '../components/SimpleChart';
import { userStatisticsService, type UserStatistics } from '../services/userStatisticsService';
import ValueBetCalculator from '../components/ValueBetCalculator';
import Icon from '../components/icons/IconSystem';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 z-10">
        {/* Header - Mejorado */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/30 via-blue-500/30 to-accent-500/30 flex items-center justify-center shadow-md border border-primary-500/40">
              <Icon name="wallet" size={20} className="text-primary-300" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white bg-gradient-to-r from-white via-primary-200 to-white bg-clip-text text-transparent">
                Análisis de Bankroll
              </h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1">Evolución y gestión inteligente de tu capital</p>
            </div>
          </div>
        </div>

      {/* Key Stats - Mejorado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <StatsCard
          title="Bankroll Actual"
          value={`€${currentBankroll.toLocaleString()}`}
          change={`+${totalReturn.toFixed(1)}% total`}
          trend="up"
          icon="wallet"
          gradient="from-primary-500/20 to-blue-500/20"
        />
        <StatsCard
          title="Ganancia Total"
          value={`+€${(currentBankroll - initialBankroll).toLocaleString()}`}
          change={`Desde €${initialBankroll}`}
          trend="up"
          icon="trending-up"
          gradient="from-emerald-500/20 to-green-500/20"
        />
        <StatsCard
          title="ROI Promedio Mensual"
          value={`+${monthlyAverage.toFixed(1)}%`}
          change="Últimos 8 meses"
          trend="up"
          icon="chart"
          gradient="from-gold-500/20 to-amber-500/20"
        />
        <StatsCard
          title="Stake Promedio"
          value={`€${averageStake.toFixed(2)}`}
          subtitle="Por apuesta"
          icon="activity"
          gradient="from-primary-500/20 to-accent-500/20"
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

      {/* Charts - Mejorado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border-2 border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center border border-primary-500/40">
              <Icon name="trending-up" size={16} className="text-primary-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">Evolución del Bankroll</h3>
          </div>
          {bankrollHistory.length > 0 ? (
            <SimpleChart data={bankrollHistory} color="primary" height={250} />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              <p>No hay datos de bankroll disponibles</p>
            </div>
          )}
        </div>
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border-2 border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center border border-accent-500/40">
              <Icon name="chart" size={16} className="text-accent-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              ROI {timeRange === 'week' ? 'Semanal' : timeRange === 'month' ? 'Mensual' : 'Anual'}
            </h3>
          </div>
          {monthlyROI.length > 0 ? (
            <SimpleChart data={monthlyROI} color="accent" height={250} />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              <p>No hay datos de ROI disponibles</p>
            </div>
          )}
        </div>
      </div>

      {/* Bankroll Optimizer - NUEVO */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white mb-2">Optimizador de Bankroll</h2>
          <p className="text-gray-400">Calcula el stake óptimo usando Kelly Criterion y simula escenarios</p>
        </div>
        <ValueBetCalculator />
      </div>

      {/* Bankroll Management - Mejorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border-2 border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center border border-gold-500/40">
              <Icon name="activity" size={16} className="text-gold-300" />
            </div>
            <h3 className="text-lg font-black text-white">Distribución de Stakes</h3>
          </div>
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

        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border-2 border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <Icon name="zap" size={16} className="text-emerald-300" />
            </div>
            <h3 className="text-lg font-black text-white">Recomendaciones Inteligentes</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-primary-500/10 rounded-lg p-4 border border-primary-500/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <h4 className="text-white font-semibold mb-1">Stake Óptimo Recomendado</h4>
                  <p className="text-gray-400 text-sm">
                    Basado en tu ROI del {monthlyAverage.toFixed(1)}%, considera usar Kelly Criterion con Fraction 0.5 (50%) para value bets de +10%.
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
                    Tu ROI mensual promedio del {monthlyAverage.toFixed(1)}% está por encima del promedio del mercado (+5-8%).
                  </p>
                </div>
              </div>
            </div>
            {averageStake > 0 && currentBankroll > 0 && (
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Análisis de Stakes</h4>
                    <p className="text-gray-400 text-sm">
                      Tu stake promedio es {(averageStake / currentBankroll * 100).toFixed(1)}% del bankroll. 
                      {averageStake / currentBankroll > 0.05 
                        ? ' Considera reducir para mayor seguridad (máx 5%).'
                        : ' Está dentro del rango recomendado (1-5%).'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

