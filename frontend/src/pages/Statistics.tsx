import { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import SimpleChart from '../components/SimpleChart';
import ValueBetsHeatmap from '../components/ValueBetsHeatmap';

export default function Statistics() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  // Mock data dinámico - En producción vendría de la API
  const [monthlyData, setMonthlyData] = useState([
    { label: 'Ene', value: 12 },
    { label: 'Feb', value: 18 },
    { label: 'Mar', value: 15 },
    { label: 'Abr', value: 23 },
    { label: 'May', value: 19 },
    { label: 'Jun', value: 27 },
  ]);

  const [winRateData, setWinRateData] = useState([
    { label: 'Sem 1', value: 65 },
    { label: 'Sem 2', value: 72 },
    { label: 'Sem 3', value: 68 },
    { label: 'Sem 4', value: 75 },
  ]);

  // Heatmap data
  const heatmapData = [
    { sport: 'Fútbol', league: 'La Liga', value: 12.5, count: 45 },
    { sport: 'Fútbol', league: 'Premier League', value: 10.2, count: 38 },
    { sport: 'Fútbol', league: 'Champions League', value: 8.7, count: 22 },
    { sport: 'Basketball', league: 'NBA', value: 9.3, count: 28 },
    { sport: 'Basketball', league: 'EuroLeague', value: 7.1, count: 15 },
    { sport: 'Tenis', league: 'ATP Masters', value: 11.8, count: 18 },
    { sport: 'Tenis', league: 'WTA', value: 6.5, count: 12 },
  ];

  // Simular actualizaciones de datos
  useEffect(() => {
    const interval = setInterval(() => {
      setMonthlyData(prev => prev.map(item => ({
        ...item,
        value: item.value + (Math.random() - 0.5) * 0.5
      })));
      
      setWinRateData(prev => prev.map(item => ({
        ...item,
        value: Math.min(100, Math.max(50, item.value + (Math.random() - 0.5) * 1))
      })));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

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

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Win Rate Actual"
          value="75%"
          change="+12% vs mes anterior"
          trend="up"
          icon={
            <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatsCard
          title="ROI Mensual"
          value="+23%"
          change="+5% vs mes anterior"
          trend="up"
          icon={
            <svg className="w-6 h-6 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Value Bets Encontrados"
          value="156"
          subtitle="Este mes"
          change="+32 vs mes anterior"
          trend="up"
          icon={
            <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Bankroll Actual"
          value="€2,450"
          change="+18% este mes"
          trend="up"
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
            <h3 className="text-xl font-black text-white">ROI Mensual</h3>
            <span className="text-xs text-gray-400">Actualizado en tiempo real</span>
          </div>
          <SimpleChart data={monthlyData} color="accent" animated={true} />
        </div>
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20 hover:border-primary-400/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-white">Win Rate Semanal</h3>
            <span className="text-xs text-gray-400">Tendencia alcista</span>
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
            <div className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400 group-hover:text-white transition-colors">Fútbol</span>
                <span className="text-white font-semibold">45%</span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-500 group-hover:shadow-lg group-hover:shadow-primary-500/50" 
                  style={{ width: '45%' }}
                ></div>
              </div>
            </div>
            <div className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400 group-hover:text-white transition-colors">Basketball</span>
                <span className="text-white font-semibold">30%</span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-accent-500 to-accent-400 h-2 rounded-full transition-all duration-500 group-hover:shadow-lg group-hover:shadow-accent-500/50" 
                  style={{ width: '30%' }}
                ></div>
              </div>
            </div>
            <div className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400 group-hover:text-white transition-colors">Tenis</span>
                <span className="text-white font-semibold">25%</span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-gold-500 to-gold-400 h-2 rounded-full transition-all duration-500 group-hover:shadow-lg group-hover:shadow-gold-500/50" 
                  style={{ width: '25%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Rendimiento por Plataforma</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Bet365</span>
              <span className="text-accent-400 font-bold">+18% ROI</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Betfair</span>
              <span className="text-accent-400 font-bold">+25% ROI</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Pinnacle</span>
              <span className="text-accent-400 font-bold">+20% ROI</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Resumen del Mes</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Apuestas Totales</span>
              <span className="text-white font-semibold">234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ganadas</span>
              <span className="text-accent-400 font-semibold">176</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Perdidas</span>
              <span className="text-red-400 font-semibold">58</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-primary-500/20">
              <span className="text-gray-400">Ganancia Neta</span>
              <span className="text-gold-400 font-bold text-lg">+€563.50</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

