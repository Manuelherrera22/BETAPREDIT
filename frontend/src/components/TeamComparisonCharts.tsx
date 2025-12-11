/**
 * Team Comparison Charts Component
 * Displays comparative charts for teams using real data from API-Football
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface TeamComparisonChartsProps {
  homeTeam: string;
  awayTeam: string;
  homeStats: any;
  awayStats: any;
  homeForm: any;
  awayForm: any;
}

export default function TeamComparisonCharts({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
  homeForm,
  awayForm,
}: TeamComparisonChartsProps) {
  // Prepare data for bar chart (offensive metrics)
  const offensiveData = [
    {
      metric: 'Goles/Partido',
      home: homeForm?.goalsForAvg5 || 0,
      away: awayForm?.goalsForAvg5 || 0,
    },
    {
      metric: 'Tiros Totales',
      home: homeStats?.totalShots || 0,
      away: awayStats?.totalShots || 0,
    },
    {
      metric: 'Tiros a Puerta',
      home: homeStats?.shotsOnGoal || 0,
      away: awayStats?.shotsOnGoal || 0,
    },
    {
      metric: 'Ataques',
      home: homeStats?.attacks || 0,
      away: awayStats?.attacks || 0,
    },
    {
      metric: 'Ataques Peligrosos',
      home: homeStats?.dangerousAttacks || 0,
      away: awayStats?.dangerousAttacks || 0,
    },
  ];

  // Prepare data for bar chart (defensive metrics)
  const defensiveData = [
    {
      metric: 'Goles Recibidos',
      home: homeForm?.goalsAgainstAvg5 || 0,
      away: awayForm?.goalsAgainstAvg5 || 0,
    },
    {
      metric: 'Entradas',
      home: homeStats?.tackles || 0,
      away: awayStats?.tackles || 0,
    },
    {
      metric: 'Paradas',
      home: homeStats?.goalkeeperSaves || 0,
      away: awayStats?.goalkeeperSaves || 0,
    },
  ];

  // Prepare data for radar chart (overall comparison)
  const radarData = [
    { subject: 'Victorias', home: (homeForm?.winRate5 || 0) * 100, away: (awayForm?.winRate5 || 0) * 100, fullMark: 100 },
    { subject: 'Posesión', home: homeStats?.possession || 0, away: awayStats?.possession || 0, fullMark: 100 },
    { subject: 'Precisión Pase', home: (homeStats?.passAccuracy || 0) * 100, away: (awayStats?.passAccuracy || 0) * 100, fullMark: 100 },
    { subject: 'Tiros a Puerta', home: homeStats?.shotsOnGoal || 0, away: awayStats?.shotsOnGoal || 0, fullMark: 20 },
    { subject: 'Ataques', home: (homeStats?.attacks || 0) / 10, away: (awayStats?.attacks || 0) / 10, fullMark: 10 },
  ];

  // Prepare data for form trend (last 5 games)
  const formTrendData = [
    { game: '5', home: (homeForm?.winRate5 || 0) * 100, away: (awayForm?.winRate5 || 0) * 100 },
    { game: '4', home: (homeForm?.winRate5 || 0) * 100, away: (awayForm?.winRate5 || 0) * 100 },
    { game: '3', home: (homeForm?.winRate5 || 0) * 100, away: (awayForm?.winRate5 || 0) * 100 },
    { game: '2', home: (homeForm?.winRate5 || 0) * 100, away: (awayForm?.winRate5 || 0) * 100 },
    { game: '1', home: (homeForm?.winRate5 || 0) * 100, away: (awayForm?.winRate5 || 0) * 100 },
  ];

  if (!homeStats && !awayStats && !homeForm && !awayForm) {
    return (
      <div className="bg-dark-800/50 rounded-lg p-6 border border-primary-500/10 text-center text-gray-400">
        No hay datos disponibles para comparar
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Offensive Metrics Comparison */}
      {homeStats && awayStats && (
        <div className="bg-dark-800/50 rounded-lg p-6 border border-primary-500/10">
          <h4 className="text-lg font-semibold text-white mb-4">Métricas Ofensivas</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={offensiveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="metric" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  color: '#F3F4F6',
                }}
              />
              <Legend />
              <Bar dataKey="home" fill="#3B82F6" name={homeTeam} radius={[4, 4, 0, 0]} />
              <Bar dataKey="away" fill="#EF4444" name={awayTeam} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Defensive Metrics Comparison */}
      {homeStats && awayStats && (
        <div className="bg-dark-800/50 rounded-lg p-6 border border-primary-500/10">
          <h4 className="text-lg font-semibold text-white mb-4">Métricas Defensivas</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={defensiveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="metric" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  color: '#F3F4F6',
                }}
              />
              <Legend />
              <Bar dataKey="home" fill="#3B82F6" name={homeTeam} radius={[4, 4, 0, 0]} />
              <Bar dataKey="away" fill="#EF4444" name={awayTeam} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Overall Comparison Radar Chart */}
      {homeStats && awayStats && (
        <div className="bg-dark-800/50 rounded-lg p-6 border border-primary-500/10">
          <h4 className="text-lg font-semibold text-white mb-4">Comparación General</h4>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
              <Radar
                name={homeTeam}
                dataKey="home"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Radar
                name={awayTeam}
                dataKey="away"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.6}
              />
              <Legend />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  color: '#F3F4F6',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Form Trend Line Chart */}
      {homeForm && awayForm && (
        <div className="bg-dark-800/50 rounded-lg p-6 border border-primary-500/10">
          <h4 className="text-lg font-semibold text-white mb-4">Tendencia de Forma (Últimos 5 Partidos)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="game" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  color: '#F3F4F6',
                }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="home"
                stroke="#3B82F6"
                strokeWidth={2}
                name={homeTeam}
                dot={{ fill: '#3B82F6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="away"
                stroke="#EF4444"
                strokeWidth={2}
                name={awayTeam}
                dot={{ fill: '#EF4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Key Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {homeStats && (
          <div className="bg-dark-800/50 rounded-lg p-4 border border-primary-500/10">
            <h5 className="text-sm font-semibold text-white mb-3">{homeTeam}</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Posesión:</span>
                <span className="text-white font-semibold">{homeStats.possession?.toFixed(1) || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Precisión de Pase:</span>
                <span className="text-white font-semibold">{((homeStats.passAccuracy || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tiros Totales:</span>
                <span className="text-white font-semibold">{homeStats.totalShots || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tiros a Puerta:</span>
                <span className="text-white font-semibold">{homeStats.shotsOnGoal || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ataques:</span>
                <span className="text-white font-semibold">{homeStats.attacks || 0}</span>
              </div>
            </div>
          </div>
        )}

        {awayStats && (
          <div className="bg-dark-800/50 rounded-lg p-4 border border-primary-500/10">
            <h5 className="text-sm font-semibold text-white mb-3">{awayTeam}</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Posesión:</span>
                <span className="text-white font-semibold">{awayStats.possession?.toFixed(1) || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Precisión de Pase:</span>
                <span className="text-white font-semibold">{((awayStats.passAccuracy || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tiros Totales:</span>
                <span className="text-white font-semibold">{awayStats.totalShots || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tiros a Puerta:</span>
                <span className="text-white font-semibold">{awayStats.shotsOnGoal || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ataques:</span>
                <span className="text-white font-semibold">{awayStats.attacks || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

