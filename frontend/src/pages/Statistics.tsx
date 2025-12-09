import { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import SimpleChart from '../components/SimpleChart';
import ValueBetsHeatmap from '../components/ValueBetsHeatmap';
import PerformanceHeatmap from '../components/PerformanceHeatmap';
import TrendAnalysis from '../components/TrendAnalysis';
import BenchmarkComparison from '../components/BenchmarkComparison';
import ROITrackingDashboard from '../components/ROITrackingDashboard';
import { userStatisticsService, type UserStatistics } from '../services/userStatisticsService';

export default function Statistics() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [statsByPeriod, setStatsByPeriod] = useState<UserStatistics[]>([]);
  const [statsBySport, setStatsBySport] = useState<any>({});
  const [statsByPlatform, setStatsByPlatform] = useState<any>({});

  // Cargar estadísticas
  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true);
      try {
        // Cargar estadísticas actuales
        const currentStats = await userStatisticsService.getMyStatistics(timeRange);
        setStatistics(currentStats);

        // Cargar estadísticas por período para gráficos
        const periodStats = await userStatisticsService.getStatisticsByPeriod(timeRange);
        setStatsByPeriod(periodStats);

        // Cargar breakdowns
        const sportStats = await userStatisticsService.getStatisticsBySport(timeRange);
        setStatsBySport(sportStats || {});

        const platformStats = await userStatisticsService.getStatisticsByPlatform(timeRange);
        setStatsByPlatform(platformStats || {});
      } catch (error) {
        console.error('Error loading statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
    // Actualizar cada 60 segundos
    const interval = setInterval(loadStatistics, 60000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Preparar datos para gráficos (con validación defensiva)
  const safeStatsByPeriod = Array.isArray(statsByPeriod) ? statsByPeriod : [];
  const monthlyData = safeStatsByPeriod.length > 0
    ? safeStatsByPeriod.map((stat, index) => ({
        label: timeRange === 'week' 
          ? `Sem ${index + 1}`
          : timeRange === 'month'
          ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][index] || `Mes ${index + 1}`
          : `Año ${new Date(stat.periodStart || new Date()).getFullYear()}`,
        value: stat.roi || 0,
      }))
    : []; // Sin datos mock, mostrar vacío si no hay datos

  const winRateData = safeStatsByPeriod.length > 0
    ? safeStatsByPeriod.map((stat, index) => ({
        label: timeRange === 'week' ? `Sem ${index + 1}` : `Período ${index + 1}`,
        value: stat.winRate || 0,
      }))
    : []; // Sin datos mock, mostrar vacío si no hay datos

  // Preparar heatmap data desde statsBySport (con validación defensiva)
  const safeStatsBySport = statsBySport && typeof statsBySport === 'object' ? statsBySport : {};
  const heatmapData = Object.entries(safeStatsBySport).length > 0
    ? Object.entries(safeStatsBySport).map(([sport, data]: [string, any]) => ({
        sport,
        league: data?.league || sport,
        value: data?.averageValue || data?.roi || 0,
        count: data?.totalBets || 0,
      }))
    : []; // Sin datos mock, mostrar vacío si no hay datos

  // Calcular porcentajes por deporte (con validación defensiva)
  const totalBetsBySport = Object.values(safeStatsBySport).reduce(
    (sum: number, data: any) => sum + (data?.totalBets || 0),
    0
  );

  const sportPercentages = Object.entries(safeStatsBySport).map(([sport, data]: [string, any]) => ({
    sport,
    percentage: totalBetsBySport > 0 ? ((data?.totalBets || 0) / totalBetsBySport) * 100 : 0,
  }));

  if (loading && !statistics) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Cargando estadísticas...</div>
        </div>
      </div>
    );
  }

  const currentStats = statistics || {
    winRate: 0,
    roi: 0,
    valueBetsFound: 0,
    totalBets: 0,
    totalWins: 0,
    totalLosses: 0,
    netProfit: 0,
    totalStaked: 0,
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Mis Estadísticas</h1>
          <p className="text-gray-400">Análisis detallado de tu rendimiento</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
              }`}
            >
              {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>
      </div>

      {/* ROI Tracking Dashboard */}
      <div className="mb-8">
        <ROITrackingDashboard />
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Win Rate Actual"
          value={`${currentStats.winRate.toFixed(1)}%`}
          change={statistics ? "Datos en tiempo real" : "Sin datos disponibles"}
          trend={currentStats.winRate > 50 ? "up" : "down"}
          icon={
            <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatsCard
          title="ROI Mensual"
          value={`${currentStats.roi >= 0 ? '+' : ''}${currentStats.roi.toFixed(1)}%`}
          change={statistics ? "Datos en tiempo real" : "Sin datos disponibles"}
          trend={currentStats.roi > 0 ? "up" : "down"}
          icon={
            <svg className="w-6 h-6 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Value Bets Encontrados"
          value={currentStats.valueBetsFound?.toString() || "0"}
          subtitle={timeRange === 'week' ? 'Esta semana' : timeRange === 'month' ? 'Este mes' : 'Este año'}
          change={statistics ? "Datos en tiempo real" : "Sin datos disponibles"}
          trend="up"
          icon={
            <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Bankroll Actual"
          value={`€${(currentStats.totalStaked + currentStats.netProfit).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
          change={currentStats.netProfit >= 0 ? `+${currentStats.netProfit.toFixed(2)}` : currentStats.netProfit.toFixed(2)}
          trend={currentStats.netProfit > 0 ? "up" : "down"}
          icon={
            <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20 hover:border-primary-400/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-white">ROI {timeRange === 'week' ? 'Semanal' : timeRange === 'month' ? 'Mensual' : 'Anual'}</h3>
            <span className="text-xs text-gray-400">
              {statistics ? 'Actualizado en tiempo real' : 'Datos de ejemplo'}
            </span>
          </div>
          <SimpleChart data={monthlyData} color="accent" animated={true} />
        </div>
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20 hover:border-primary-400/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-white">Win Rate {timeRange === 'week' ? 'Semanal' : 'Mensual'}</h3>
            <span className="text-xs text-gray-400">
              {statistics ? 'Datos reales' : 'Datos de ejemplo'}
            </span>
          </div>
          <SimpleChart data={winRateData} color="primary" animated={true} />
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="mb-8">
        <ValueBetsHeatmap data={heatmapData} />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución por Deporte</h3>
          <div className="space-y-3">
            {sportPercentages.length > 0 ? (
              sportPercentages.slice(0, 3).map(({ sport, percentage }) => (
                <div key={sport} className="group">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 group-hover:text-white transition-colors">{sport}</span>
                    <span className="text-white font-semibold">{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-500 group-hover:shadow-lg group-hover:shadow-primary-500/50"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No hay datos disponibles</p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Rendimiento por Plataforma</h3>
          <div className="space-y-3">
            {statsByPlatform && typeof statsByPlatform === 'object' && Object.entries(statsByPlatform).length > 0 ? (
              Object.entries(statsByPlatform).slice(0, 3).map(([platform, data]: [string, any]) => (
                <div key={platform} className="flex justify-between items-center">
                  <span className="text-gray-400">{platform}</span>
                  <span className={`font-bold ${(data?.roi || 0) > 0 ? 'text-accent-400' : 'text-red-400'}`}>
                    {(data?.roi || 0) >= 0 ? '+' : ''}{(data?.roi || 0).toFixed(1)}% ROI
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No hay datos disponibles</p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Resumen del {timeRange === 'week' ? 'Período' : timeRange === 'month' ? 'Mes' : 'Año'}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Apuestas Totales</span>
              <span className="text-white font-semibold">{currentStats.totalBets || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ganadas</span>
              <span className="text-accent-400 font-semibold">{currentStats.totalWins || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Perdidas</span>
              <span className="text-red-400 font-semibold">{currentStats.totalLosses || 0}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-primary-500/20">
              <span className="text-gray-400">Ganancia Neta</span>
              <span className={`font-bold text-lg ${currentStats.netProfit >= 0 ? 'text-gold-400' : 'text-red-400'}`}>
                {currentStats.netProfit >= 0 ? '+' : ''}€{currentStats.netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Section */}
      <div className="mt-8 space-y-6">
        {/* Trend Analysis */}
        <TrendAnalysis
          data={safeStatsByPeriod.length > 0 ? safeStatsByPeriod.map((stat, index) => ({
            period: timeRange === 'week' 
              ? `Sem ${index + 1}`
              : timeRange === 'month'
              ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][index] || `Mes ${index + 1}`
              : `Año ${new Date(stat.periodStart || new Date()).getFullYear()}`,
            roi: stat.roi || 0,
            winRate: stat.winRate || 0,
            betCount: stat.totalBets || 0,
            trend: 'stable' as const,
          })) : []}
          currentRoi={currentStats.roi}
          currentWinRate={currentStats.winRate}
        />

        {/* Benchmark Comparison */}
        <BenchmarkComparison
          data={[
            {
              metric: 'ROI',
              userValue: currentStats.roi,
              averageValue: 5.2, // Platform average (mock data - should come from API)
              top10Value: 18.5,
              unit: '%',
            },
            {
              metric: 'Win Rate',
              userValue: currentStats.winRate,
              averageValue: 52.3,
              top10Value: 68.7,
              unit: '%',
            },
            {
              metric: 'Value Bets Encontrados',
              userValue: currentStats.valueBetsFound || 0,
              averageValue: 12,
              top10Value: 45,
            },
          ]}
        />

        {/* Performance Heatmap (mock data for now) */}
        <PerformanceHeatmap
          data={[
            { sport: 'Fútbol', timeOfDay: '12-18', dayOfWeek: 'Sáb', roi: 12.5, winRate: 65, betCount: 15 },
            { sport: 'Fútbol', timeOfDay: '18-24', dayOfWeek: 'Dom', roi: 15.2, winRate: 70, betCount: 20 },
            { sport: 'Basketball', timeOfDay: '18-24', dayOfWeek: 'Jue', roi: 8.3, winRate: 58, betCount: 12 },
            { sport: 'Tennis', timeOfDay: '12-18', dayOfWeek: 'Mar', roi: 10.1, winRate: 62, betCount: 8 },
          ]}
        />
      </div>
    </div>
  );
}
