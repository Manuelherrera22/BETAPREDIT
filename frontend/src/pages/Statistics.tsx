import { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import SimpleChart from '../components/SimpleChart';
import ValueBetsHeatmap from '../components/ValueBetsHeatmap';
import PerformanceHeatmap from '../components/PerformanceHeatmap';
import TrendAnalysis from '../components/TrendAnalysis';
import BenchmarkComparison from '../components/BenchmarkComparison';
import ROITrackingDashboard from '../components/ROITrackingDashboard';
import { userStatisticsService, type UserStatistics } from '../services/userStatisticsService';
import { exportToCSV } from '../utils/csvExport';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import SkeletonLoader from '../components/SkeletonLoader';

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
        setStatistics(currentStats || null);

        // Cargar estadísticas por período para gráficos
        try {
          const periodStats = await userStatisticsService.getStatisticsByPeriod(timeRange);
          setStatsByPeriod(Array.isArray(periodStats) ? periodStats : []);
        } catch (err) {
          console.error('Error loading period stats:', err);
          setStatsByPeriod([]);
        }

        // Cargar breakdowns
        try {
          const sportStats = await userStatisticsService.getStatisticsBySport(timeRange);
          setStatsBySport(sportStats && typeof sportStats === 'object' ? sportStats : {});
        } catch (err) {
          console.error('Error loading sport stats:', err);
          setStatsBySport({});
        }

        try {
          const platformStats = await userStatisticsService.getStatisticsByPlatform(timeRange);
          setStatsByPlatform(platformStats && typeof platformStats === 'object' ? platformStats : {});
        } catch (err) {
          console.error('Error loading platform stats:', err);
          setStatsByPlatform({});
        }
      } catch (error: any) {
        console.error('Error loading statistics:', error);
        toast.error(`Error al cargar estadísticas: ${error.message || 'Error desconocido'}`);
        // Set defaults to prevent crashes
        setStatistics(null);
        setStatsByPeriod([]);
        setStatsBySport({});
        setStatsByPlatform({});
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
        <div className="mb-6">
          <SkeletonLoader type="text" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SkeletonLoader type="card" count={4} />
        </div>
        <SkeletonLoader type="card" count={2} />
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

  // Exportar estadísticas a CSV
  const handleExportStatistics = () => {
    try {
      // Preparar datos de estadísticas principales
      const statsData = [{
        periodo: timeRange === 'week' ? 'Semana' : timeRange === 'month' ? 'Mes' : 'Año',
        win_rate: `${currentStats.winRate.toFixed(2)}%`,
        roi: `${currentStats.roi >= 0 ? '+' : ''}${currentStats.roi.toFixed(2)}%`,
        value_bets_encontrados: currentStats.valueBetsFound || 0,
        apuestas_totales: currentStats.totalBets || 0,
        apuestas_ganadas: currentStats.totalWins || 0,
        apuestas_perdidas: currentStats.totalLosses || 0,
        ganancia_neta: `${currentStats.netProfit >= 0 ? '+' : ''}€${currentStats.netProfit.toFixed(2)}`,
        total_apostado: `€${currentStats.totalStaked.toFixed(2)}`,
        fecha_exportacion: format(new Date(), 'dd/MM/yyyy HH:mm'),
      }]

      // Preparar datos por período si existen
      const periodData = safeStatsByPeriod.length > 0
        ? safeStatsByPeriod.map((stat, index) => ({
            periodo_numero: index + 1,
            periodo_fecha: stat.periodStart 
              ? format(new Date(stat.periodStart), 'dd/MM/yyyy')
              : `Período ${index + 1}`,
            win_rate: `${stat.winRate.toFixed(2)}%`,
            roi: `${stat.roi >= 0 ? '+' : ''}${stat.roi.toFixed(2)}%`,
            apuestas_totales: stat.totalBets || 0,
            apuestas_ganadas: stat.totalWins || 0,
            ganancia_neta: `${stat.netProfit >= 0 ? '+' : ''}€${stat.netProfit.toFixed(2)}`,
            total_apostado: `€${stat.totalStaked.toFixed(2)}`,
          }))
        : []

      // Exportar estadísticas principales
      exportToCSV(
        statsData,
        [
          { key: 'periodo', label: 'Período' },
          { key: 'win_rate', label: 'Win Rate' },
          { key: 'roi', label: 'ROI' },
          { key: 'value_bets_encontrados', label: 'Value Bets Encontrados' },
          { key: 'apuestas_totales', label: 'Apuestas Totales' },
          { key: 'apuestas_ganadas', label: 'Apuestas Ganadas' },
          { key: 'apuestas_perdidas', label: 'Apuestas Perdidas' },
          { key: 'ganancia_neta', label: 'Ganancia Neta' },
          { key: 'total_apostado', label: 'Total Apostado' },
          { key: 'fecha_exportacion', label: 'Fecha Exportación' },
        ],
        `estadisticas_${timeRange}_${format(new Date(), 'yyyy-MM-dd')}.csv`
      )

      // Si hay datos por período, exportar también
      if (periodData.length > 0) {
        setTimeout(() => {
          exportToCSV(
            periodData,
            [
              { key: 'periodo_numero', label: 'Período Número' },
              { key: 'periodo_fecha', label: 'Fecha' },
              { key: 'win_rate', label: 'Win Rate' },
              { key: 'roi', label: 'ROI' },
              { key: 'apuestas_totales', label: 'Apuestas Totales' },
              { key: 'apuestas_ganadas', label: 'Apuestas Ganadas' },
              { key: 'ganancia_neta', label: 'Ganancia Neta' },
              { key: 'total_apostado', label: 'Total Apostado' },
            ],
            `estadisticas_por_periodo_${timeRange}_${format(new Date(), 'yyyy-MM-dd')}.csv`
          )
        }, 500)
      }

      toast.success('Estadísticas exportadas a CSV')
    } catch (error) {
      console.error('Error exportando estadísticas:', error)
      toast.error('Error al exportar estadísticas')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2">Mis Estadísticas</h1>
            <p className="text-sm sm:text-base text-gray-400">Análisis detallado de tu rendimiento</p>
          </div>
          <div className="flex flex-wrap gap-2">
          {(['week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
          <button
            onClick={handleExportStatistics}
            className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all bg-accent-500 text-white hover:bg-accent-400 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* ROI Tracking Dashboard */}
      <div className="mb-8">
        <ROITrackingDashboard />
      </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <StatsCard
          title="Win Rate Actual"
          value={`${currentStats.winRate.toFixed(1)}%`}
          change={statistics ? "Datos en tiempo real" : "Sin datos disponibles"}
          trend={currentStats.winRate > 50 ? "up" : "down"}
          icon="trending-up"
          gradient="from-emerald-500/20 to-green-500/20"
        />
        <StatsCard
          title="ROI Mensual"
          value={`${currentStats.roi >= 0 ? '+' : ''}${currentStats.roi.toFixed(1)}%`}
          change={statistics ? "Datos en tiempo real" : "Sin datos disponibles"}
          trend={currentStats.roi > 0 ? "up" : "down"}
          icon="wallet"
          gradient="from-primary-500/20 to-accent-500/20"
        />
        <StatsCard
          title="Value Bets Encontrados"
          value={currentStats.valueBetsFound?.toString() || "0"}
          subtitle={timeRange === 'week' ? 'Esta semana' : timeRange === 'month' ? 'Este mes' : 'Este año'}
          change={statistics ? "Datos en tiempo real" : "Sin datos disponibles"}
          trend="up"
          icon="zap"
          gradient="from-gold-500/20 to-amber-500/20"
        />
        <StatsCard
          title="Bankroll Actual"
          value={`€${(currentStats.totalStaked + currentStats.netProfit).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
          change={currentStats.netProfit >= 0 ? `+${currentStats.netProfit.toFixed(2)}` : currentStats.netProfit.toFixed(2)}
          trend={currentStats.netProfit > 0 ? "up" : "down"}
          icon="wallet"
          gradient="from-blue-500/20 to-cyan-500/20"
        />
      </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl p-4 sm:p-6 border-2 border-slate-700/50 hover:border-primary-400/40 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="text-base sm:text-lg md:text-xl font-black text-white">ROI {timeRange === 'week' ? 'Semanal' : timeRange === 'month' ? 'Mensual' : 'Anual'}</h3>
            <span className="text-xs text-gray-400">
              {statistics ? 'Actualizado en tiempo real' : 'Datos de ejemplo'}
            </span>
          </div>
          <SimpleChart data={monthlyData} color="accent" animated={true} />
        </div>
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl p-4 sm:p-6 border-2 border-slate-700/50 hover:border-primary-400/40 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="text-base sm:text-lg md:text-xl font-black text-white">Win Rate {timeRange === 'week' ? 'Semanal' : 'Mensual'}</h3>
            <span className="text-xs text-gray-400">
              {statistics ? 'Datos reales' : 'Datos de ejemplo'}
            </span>
          </div>
          <SimpleChart data={winRateData} color="primary" animated={true} />
        </div>
      </div>

        {/* Heatmap Section */}
        <div className="mb-6 sm:mb-8">
          <ValueBetsHeatmap data={heatmapData} />
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
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

          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Rendimiento por Plataforma</h3>
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

          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Resumen del {timeRange === 'week' ? 'Período' : timeRange === 'month' ? 'Mes' : 'Año'}</h3>
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

        {/* Benchmark Comparison - Solo mostrar si hay datos suficientes */}
        {currentStats.totalBets > 0 && (
          <BenchmarkComparison
            data={[
              {
                metric: 'ROI',
                userValue: currentStats.roi,
                averageValue: null, // Platform average - pendiente de implementar API
                top10Value: null, // Top 10% - pendiente de implementar API
                unit: '%',
              },
              {
                metric: 'Win Rate',
                userValue: currentStats.winRate,
                averageValue: null, // Platform average - pendiente de implementar API
                top10Value: null, // Top 10% - pendiente de implementar API
                unit: '%',
              },
              {
                metric: 'Value Bets Encontrados',
                userValue: currentStats.valueBetsFound || 0,
                averageValue: null, // Platform average - pendiente de implementar API
                top10Value: null, // Top 10% - pendiente de implementar API
              },
            ]}
          />
        )}

        {/* Performance Heatmap - Generar desde datos reales por deporte */}
        {Object.keys(statsBySport).length > 0 && (
          <PerformanceHeatmap
            data={Object.entries(statsBySport).flatMap(([sport, data]: [string, any]) => {
              // Generar datos de ejemplo basados en estadísticas reales
              // Nota: Esto es una aproximación hasta que tengamos datos de tiempo real
              const baseRoi = data?.roi || 0;
              const baseWinRate = data?.winRate || 0;
              const betCount = data?.bets || 0;
              
              // Si hay suficientes datos, mostrar
              if (betCount < 5) return [];
              
              return [
                {
                  sport,
                  timeOfDay: '12-18',
                  dayOfWeek: 'Sáb',
                  roi: baseRoi * 0.9, // Aproximación
                  winRate: baseWinRate,
                  betCount: Math.floor(betCount * 0.3),
                },
                {
                  sport,
                  timeOfDay: '18-24',
                  dayOfWeek: 'Dom',
                  roi: baseRoi * 1.1, // Aproximación
                  winRate: baseWinRate,
                  betCount: Math.floor(betCount * 0.4),
                },
              ];
            })}
          />
        )}
      </div>
    </div>
  );
}
