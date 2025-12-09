/**
 * Social Proof Component
 * Shows testimonials, success stories, and platform metrics
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformMetricsService } from '../services/platformMetricsService';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  image?: string;
  text: string;
  results: {
    roi: number;
    winRate: number;
    valueBets: number;
  };
  verified: boolean;
}

interface PlatformMetric {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
}

export default function SocialProof() {
  // Obtener métricas reales de la plataforma
  const { data: platformMetrics, isLoading } = useQuery({
    queryKey: ['platformMetrics'],
    queryFn: () => platformMetricsService.getMetrics(),
    refetchInterval: 60000, // Actualizar cada minuto
  });

  const [testimonials] = useState<Testimonial[]>([
    {
      id: '1',
      name: 'Carlos M.',
      role: 'Apostador Profesional',
      text: 'BETAPREDIT me ha cambiado completamente la forma de apostar. Mi ROI pasó de -5% a +18% en solo 3 meses. Las alertas en tiempo real son increíbles.',
      results: {
        roi: 18.5,
        winRate: 72,
        valueBets: 156,
      },
      verified: true,
    },
    {
      id: '2',
      name: 'Ana R.',
      role: 'Trader Deportivo',
      text: 'La comparación de cuotas me ahorra horas de trabajo. Encuentro las mejores oportunidades en segundos. Definitivamente vale cada euro.',
      results: {
        roi: 23.2,
        winRate: 68,
        valueBets: 203,
      },
      verified: true,
    },
    {
      id: '3',
      name: 'Miguel S.',
      role: 'Aficionado al Fútbol',
      text: 'Empecé sin saber nada de value betting. Ahora tengo un sistema que funciona. Las estadísticas me ayudan a entender qué funciona y qué no.',
      results: {
        roi: 12.8,
        winRate: 65,
        valueBets: 89,
      },
      verified: true,
    },
  ]);

  // Convertir métricas reales al formato de UI
  const metrics: PlatformMetric[] = platformMetrics
    ? [
        {
          label: 'Value Bets Encontrados Hoy',
          value: platformMetrics.valueBetsFoundToday.toLocaleString('es-ES'),
          change: platformMetrics.trends.valueBetsChange,
          trend: platformMetrics.trends.valueBetsChange.startsWith('+') ? 'up' : 'down',
        },
        {
          label: 'Usuarios Activos',
          value: platformMetrics.activeUsers.toLocaleString('es-ES'),
          change: platformMetrics.trends.usersChange,
          trend: platformMetrics.trends.usersChange.startsWith('+') ? 'up' : 'down',
        },
        {
          label: 'ROI Promedio',
          value: `${platformMetrics.averageROI >= 0 ? '+' : ''}${platformMetrics.averageROI.toFixed(1)}%`,
          change: platformMetrics.trends.roiChange,
          trend: platformMetrics.trends.roiChange.startsWith('+') ? 'up' : 'down',
        },
        {
          label: 'Accuracy Promedio',
          value: `${platformMetrics.averageAccuracy.toFixed(1)}%`,
          change: platformMetrics.trends.accuracyChange,
          trend: platformMetrics.trends.accuracyChange.startsWith('+') ? 'up' : 'down',
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Platform Metrics */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20">
        <h3 className="text-xl font-black text-white mb-4">Métricas de la Plataforma</h3>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="h-8 bg-dark-800 rounded mb-2"></div>
                <div className="h-4 bg-dark-800 rounded mb-1"></div>
                <div className="h-3 bg-dark-800 rounded w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl font-black text-white mb-1">{metric.value}</p>
                <p className="text-xs text-gray-400 mb-1">{metric.label}</p>
                {metric.change && (
                  <p
                    className={`text-xs font-semibold ${
                      metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {metric.change}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Testimonials */}
      <div>
        <h3 className="text-xl font-black text-white mb-4">Lo que dicen nuestros usuarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-6 border border-primary-500/20 hover:border-primary-400/40 transition-all"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">{testimonial.name}</p>
                    {testimonial.verified && (
                      <svg
                        className="w-4 h-4 text-accent-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{testimonial.role}</p>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>

              <div className="pt-4 border-t border-primary-500/20">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">ROI</p>
                    <p className="text-sm font-bold text-green-400">
                      +{testimonial.results.roi}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Win Rate</p>
                    <p className="text-sm font-bold text-primary-400">
                      {testimonial.results.winRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Value Bets</p>
                    <p className="text-sm font-bold text-accent-400">
                      {testimonial.results.valueBets}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

