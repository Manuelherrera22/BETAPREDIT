import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AnimatedBackground from '../components/AnimatedBackground';
import FeatureCard from '../components/FeatureCard';
import GradientText from '../components/GradientText';
import SportPattern from '../components/SportPattern';
import StatBadge from '../components/StatBadge';
import SportIcon from '../components/SportIcon';
import Logo from '../components/Logo';
import ValueProposition from '../components/ValueProposition';
import ResultsComparison from '../components/ResultsComparison';
import QuickDemo from '../components/QuickDemo';
import TestimonialCard from '../components/TestimonialCard';
import SEO from '../components/SEO';

export default function Landing() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <SEO
        title="BETAPREDIT - Análisis Predictivo de Apuestas Deportivas"
        description="Plataforma profesional de análisis predictivo para apuestas deportivas. Predicciones basadas en IA, value bets, arbitraje y estadísticas avanzadas."
        keywords={['apuestas deportivas', 'predicciones', 'value bets', 'arbitraje', 'análisis predictivo', 'IA']}
      />
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-slate-950 relative overflow-hidden">
      <SportPattern />
      <AnimatedBackground />
      
      {/* Navigation */}
      <nav className="bg-navy-950/95 backdrop-blur-xl border-b border-primary-800/30 sticky top-0 z-50 shadow-2xl shadow-primary-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Logo size="md" />
            <div className="flex items-center gap-2 sm:gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-3 py-1.5 sm:px-6 sm:py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 text-sm sm:text-base font-medium"
                >
                  <span className="hidden sm:inline">Ir al Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 sm:px-6 sm:py-2.5 text-gray-300 hover:text-white transition-colors text-sm sm:text-base font-medium"
                  >
                    <span className="hidden sm:inline">Iniciar Sesión</span>
                    <span className="sm:hidden">Entrar</span>
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 sm:px-6 sm:py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 text-sm sm:text-base font-medium"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 sm:pt-28 md:pt-32 pb-20 sm:pb-32 md:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-gold-500/10 border border-primary-500/20 rounded-full backdrop-blur-xl shadow-xl">
              <div className="relative">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-accent-400 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-accent-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-primary-300 text-xs sm:text-sm font-semibold tracking-wider uppercase">
                <span className="hidden sm:inline">Sistema de Análisis Predictivo</span>
                <span className="sm:hidden">Análisis Predictivo</span>
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 sm:mb-8 leading-[1.1] tracking-tight px-2">
              <span className="block drop-shadow-2xl">Aumenta tu Win Rate</span>
              <GradientText gradient="from-primary-300 via-accent-400 to-gold-300" className="block mt-2 sm:mt-3 drop-shadow-2xl">
                con Análisis Predictivo
              </GradientText>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-4">
              Encuentra <span className="text-gold-400 font-semibold drop-shadow-lg">value bets que otros no ven</span>,{' '}
              <span className="text-accent-400 font-semibold drop-shadow-lg">aumenta tu ROI hasta +23%</span> y{' '}
              <span className="text-primary-300 font-semibold drop-shadow-lg">toma decisiones informadas</span> en cualquier plataforma de apuestas.
            </p>
            <div className="mb-12 sm:mb-16 max-w-3xl mx-auto px-4">
              <div className="bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-gold-500/10 border border-primary-500/20 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl">
                <div className="text-center mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-gray-300 font-semibold uppercase tracking-wider">Resultados Reales de Usuarios</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8">
                  <div className="text-center w-full sm:w-auto">
                    <div className="text-3xl sm:text-4xl font-black text-white mb-1">+67%</div>
                    <div className="text-xs sm:text-sm text-gray-300">Mejora en Win Rate</div>
                    <div className="text-xs text-gray-500 mt-1">45% → 75%</div>
                  </div>
                  <div className="hidden sm:block w-px h-12 bg-primary-500/30"></div>
                  <div className="w-full sm:w-auto h-px sm:h-auto sm:w-px bg-primary-500/30 sm:bg-transparent"></div>
                  <div className="text-center w-full sm:w-auto">
                    <div className="text-3xl sm:text-4xl font-black text-gold-500 mb-1">+23%</div>
                    <div className="text-xs sm:text-sm text-gray-300">ROI Mensual</div>
                    <div className="text-xs text-gray-500 mt-1">vs -8% promedio</div>
                  </div>
                  <div className="hidden sm:block w-px h-12 bg-primary-500/30"></div>
                  <div className="w-full sm:w-auto h-px sm:h-auto sm:w-px bg-primary-500/30 sm:bg-transparent"></div>
                  <div className="text-center w-full sm:w-auto">
                    <div className="text-3xl sm:text-4xl font-black text-accent-400 mb-1">150+</div>
                    <div className="text-xs sm:text-sm text-gray-300">Value Bets/Mes</div>
                    <div className="text-xs text-gray-500 mt-1">Detectados automáticamente</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 max-w-4xl mx-auto px-4">
              <StatBadge
                value="&lt;100ms"
                label="Latencia"
                icon={<span className="text-xl sm:text-2xl">⚡</span>}
              />
              <StatBadge
                value="20+"
                label="Plataformas"
                icon={<span className="text-xl sm:text-2xl">🔗</span>}
              />
              <StatBadge
                value="75%"
                label="Win Rate"
                icon={<span className="text-xl sm:text-2xl">📈</span>}
              />
              <StatBadge
                value="24/7"
                label="Monitoreo"
                icon={<span className="text-xl sm:text-2xl">🤖</span>}
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 px-4">
              {!isAuthenticated && (
                <>
                  <Link
                    to="/register"
                    className="group relative w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white rounded-2xl hover:from-primary-600 hover:via-primary-700 hover:to-accent-600 transition-all duration-300 text-base sm:text-lg font-black shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/60 hover:scale-105 overflow-hidden border border-primary-400/20 text-center"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      Ver Demo Gratis
                      <span className="inline-block ml-3 text-lg sm:text-xl group-hover:translate-x-2 transition-transform">→</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-primary-600/20 to-accent-600/20 backdrop-blur-md border-2 border-primary-500/50 text-white rounded-2xl hover:from-primary-600/30 hover:to-accent-600/30 hover:border-primary-400/70 transition-all duration-300 text-base sm:text-lg font-bold shadow-lg shadow-primary-500/20 text-center"
                  >
                    Iniciar Sesión
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Enhanced Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Large gradient orbs */}
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-primary-600/15 via-primary-500/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-gradient-to-tl from-accent-600/15 via-accent-500/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-gold-600/10 via-primary-600/5 to-accent-600/10 rounded-full blur-3xl"></div>
          
          {/* Animated rings */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 border border-primary-500/10 rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 border border-accent-500/10 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-12 sm:py-16 bg-dark-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ValueProposition />
        </div>
      </section>

      {/* Results Comparison */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-dark-950 to-dark-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ResultsComparison />
        </div>
      </section>

      {/* Quick Demo - Enhanced */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 px-4">
              Ejemplo Real: <GradientText gradient="from-primary-300 via-accent-400 to-gold-300">Cómo Funciona</GradientText>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Ve cómo nuestro sistema detecta un value bet en tiempo real
            </p>
          </div>
          <QuickDemo />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-dark-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 px-4">
              Lo Que Dicen Nuestros <GradientText gradient="from-primary-300 via-accent-400 to-gold-300">Usuarios</GradientText>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Miles de apostadores profesionales confían en BETAPREDIT
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <TestimonialCard
              name="Carlos M."
              role="Apostador Profesional"
              content="En 3 meses pasé de perder dinero a tener un ROI positivo del 18%. El sistema de detección de value bets es increíble. Ahora solo apuesto cuando hay valor real."
              stats={{ label: "ROI desde que usa BETAPREDIT", value: "+18%" }}
            />
            <TestimonialCard
              name="Ana R."
              role="Trader de Apuestas"
              content="La comparación de cuotas en tiempo real me ahorra horas de trabajo. Encuentro las mejores oportunidades antes que nadie. Mi win rate subió del 48% al 72%."
              stats={{ label: "Win Rate Mejorado", value: "+24%" }}
            />
            <TestimonialCard
              name="Miguel S."
              role="Analista Deportivo"
              content="Las predicciones de IA son muy precisas. El análisis de datos granulares me da una ventaja que no tenía antes. Es como tener un equipo de analistas trabajando 24/7."
              stats={{ label: "Value Bets Encontrados", value: "180/mes" }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 relative">
        <div className="absolute inset-0 bg-mesh-gradient opacity-30"></div>
        <div className="absolute inset-0 bg-field-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <SportIcon sport="all" className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
              <span className="text-primary-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">Ventajas Competitivas</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 drop-shadow-2xl px-4">
              Tu Sistema de{' '}
              <GradientText gradient="from-primary-300 via-accent-400 to-gold-300">
                Análisis Inteligente
              </GradientText>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto font-medium px-4">
              No apostamos por ti. Te damos el poder del análisis predictivo para que tomes mejores decisiones en cualquier plataforma
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon={
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-lg"></div>
                  <svg className="w-7 h-7 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              }
              title="Datos en Tiempo Real"
              description="Monitorea cuotas de múltiples plataformas con latencia &lt;100ms. Compara oportunidades y encuentra el mejor valor antes de apostar en cualquier casa."
              delay={0}
            />

            <FeatureCard
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }
              title="Predicciones con IA"
              description="Modelos de Machine Learning que analizan millones de datos para predecir resultados. Obtén probabilidades precisas y recomendaciones de valor antes de apostar."
              delay={100}
            />

            <FeatureCard
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Análisis de Valor"
              description="Identifica oportunidades donde las cuotas de las casas no reflejan las probabilidades reales. Encuentra value bets en cualquier plataforma."
              delay={200}
            />

            <FeatureCard
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Bet Sizing Inteligente"
              description="Recomendaciones de cuánto apostar basadas en probabilidades calculadas. Optimiza tu bankroll y maximiza tus ganancias a largo plazo."
              delay={300}
            />

            <FeatureCard
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Datos Granulares"
              description="Análisis a nivel de jugador con datos de tracking avanzado. Nuestros modelos consideran lesiones, rendimiento individual y estadísticas detalladas."
              delay={400}
            />

            <FeatureCard
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Conecta con Cualquier Plataforma"
              description="Nuestro sistema se integra con todas las principales casas de apuestas. Analiza, compara y decide dónde apostar con datos precisos."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* How It Works - Enhanced Visual Flow */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 relative">
        <div className="absolute inset-0 bg-mesh-gradient opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 px-4">
              Tu Flujo de Trabajo <GradientText gradient="from-primary-300 via-accent-400 to-gold-300">Simplificado</GradientText>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              De análisis a acción en minutos, no horas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary-500/50 via-accent-500/50 to-gold-500/50"></div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl p-6 sm:p-8 border-2 border-primary-500/40 hover:border-primary-400/80 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/30">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-2xl sm:text-3xl font-black text-white shadow-xl">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4 text-center">
                  Conecta tus Plataformas
                </h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed text-center mb-4">
                  Integra tus cuentas de apuestas favoritas. Monitoreamos 20+ casas automáticamente.
                </p>
                <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2">
                  <span className="px-2 sm:px-3 py-1 bg-primary-500/20 text-primary-300 text-xs rounded-full border border-primary-500/30">Bet365</span>
                  <span className="px-2 sm:px-3 py-1 bg-primary-500/20 text-primary-300 text-xs rounded-full border border-primary-500/30">Betfair</span>
                  <span className="px-2 sm:px-3 py-1 bg-primary-500/20 text-primary-300 text-xs rounded-full border border-primary-500/30">+18 más</span>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl p-6 sm:p-8 border-2 border-accent-500/40 hover:border-accent-400/80 transition-all duration-300 hover:shadow-2xl hover:shadow-accent-500/30">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-accent-500 to-accent-700 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-2xl sm:text-3xl font-black text-white shadow-xl">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4 text-center">
                  Recibe Análisis en Tiempo Real
                </h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed text-center mb-4">
                  IA analiza millones de datos y te muestra probabilidades precisas, value bets y recomendaciones de stake.
                </p>
                <div className="mt-4 sm:mt-6 bg-accent-500/10 rounded-xl p-3 sm:p-4 border border-accent-500/20">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400">Value Detectado:</span>
                    <span className="text-accent-400 font-black text-base sm:text-lg">+12%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold-500 via-gold-600 to-gold-700 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl p-6 sm:p-8 border-2 border-gold-500/40 hover:border-gold-400/80 transition-all duration-300 hover:shadow-2xl hover:shadow-gold-500/30">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gold-500 to-gold-700 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-2xl sm:text-3xl font-black text-white shadow-xl">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4 text-center">
                  Apuesta con Confianza
                </h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed text-center mb-4">
                  Toma decisiones informadas y apuesta en tu plataforma preferida con datos precisos.
                </p>
                <div className="mt-4 sm:mt-6 bg-gold-500/10 rounded-xl p-3 sm:p-4 border border-gold-500/20">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-gray-400">ROI Mejorado:</span>
                    <span className="text-gold-400 font-black text-base sm:text-lg">+23%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack - Enhanced */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-mesh-gradient opacity-20"></div>
        <div className="absolute inset-0 bg-field-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <SportIcon sport="all" className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
              <span className="text-primary-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">Stack Tecnológico</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 drop-shadow-2xl px-4">
              Tecnología de{' '}
              <GradientText gradient="from-primary-300 via-accent-400 to-gold-300">
                Vanguardia
              </GradientText>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto font-medium px-4">
              Integramos las mejores tecnologías y fuentes de datos del mercado para darte análisis precisos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {[
              {
                title: 'Datos en Tiempo Real',
                description: 'APIs de baja latencia para cuotas y eventos con actualización &lt;100ms',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                color: 'from-primary-500 to-primary-700',
                bgColor: 'bg-primary-500/10',
                borderColor: 'border-primary-500/30',
              },
              {
                title: 'Tracking Avanzado',
                description: 'Sistemas UWB y RFID para datos granulares a nivel de jugador',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                color: 'from-accent-500 to-accent-700',
                bgColor: 'bg-accent-500/10',
                borderColor: 'border-accent-500/30',
              },
              {
                title: 'Machine Learning',
                description: 'Algoritmos predictivos avanzados con millones de datos analizados',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                color: 'from-gold-500 to-gold-700',
                bgColor: 'bg-gold-500/10',
                borderColor: 'border-gold-500/30',
              },
              {
                title: 'Infraestructura B2B',
                description: 'Plataformas certificadas y escalables para máxima confiabilidad',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                color: 'from-primary-500 to-accent-500',
                bgColor: 'bg-primary-500/10',
                borderColor: 'border-primary-500/30',
              },
            ].map((tech, index) => (
              <div
                key={index}
                className={`group relative bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl p-4 sm:p-6 border-2 ${tech.borderColor} hover:border-opacity-60 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/20 hover:-translate-y-1 ${tech.bgColor}`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${tech.color} flex items-center justify-center mb-3 sm:mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <div className="w-6 h-6 sm:w-8 sm:h-8">
                    {tech.icon}
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3">
                  {tech.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {tech.description}
                </p>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </div>
            ))}
          </div>

          {/* Integrations Section */}
          <div className="mt-10 sm:mt-12 md:mt-16 text-center">
            <p className="text-gray-300 mb-4 sm:mb-6 text-base sm:text-lg font-semibold px-4">
              Incluyendo integraciones con líderes de la industria
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 px-4">
              <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-primary-500/20 to-primary-600/20 border border-primary-500/40 rounded-xl text-primary-300 text-sm sm:text-base font-semibold hover:from-primary-500/30 hover:to-primary-600/30 transition-all cursor-pointer">
                Datos Deportivos
              </div>
              <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-accent-500/20 to-accent-600/20 border border-accent-500/40 rounded-xl text-accent-300 text-sm sm:text-base font-semibold hover:from-accent-500/30 hover:to-accent-600/30 transition-all cursor-pointer">
                Sistemas de Tracking
              </div>
              <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/40 rounded-xl text-gold-300 text-sm sm:text-base font-semibold hover:from-gold-500/30 hover:to-gold-600/30 transition-all cursor-pointer">
                Plataformas B2B
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Events Preview */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 relative overflow-hidden">
        {/* Enhanced background effects */}
        <div className="absolute inset-0 bg-mesh-gradient opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 via-transparent to-accent-900/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.1),transparent_50%)]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-accent-500/20 to-accent-600/20 border border-accent-400/30 rounded-full backdrop-blur-sm shadow-lg">
              <div className="relative">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-accent-400 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-accent-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-accent-300 text-xs sm:text-sm font-black uppercase tracking-widest">Análisis en Vivo</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 px-4">
              <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] block">
                Análisis en
              </span>
              <span className="block mt-2 sm:mt-3 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                Tiempo Real
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto font-semibold leading-relaxed drop-shadow-lg px-4">
              Monitorea eventos de múltiples plataformas, compara cuotas y recibe predicciones instantáneas para tomar mejores decisiones
            </p>
          </div>
          
          {/* Enhanced Live Events Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { 
                sport: 'Fútbol', 
                league: 'La Liga', 
                home: 'Real Madrid', 
                away: 'Barcelona', 
                score: '2-1', 
                time: '67\'', 
                homeOdds: '2.10',
                drawOdds: '3.50',
                awayOdds: '2.80',
              },
              { 
                sport: 'Basketball', 
                league: 'NBA', 
                home: 'Lakers', 
                away: 'Warriors', 
                score: '98-95', 
                time: 'Q4 2:34', 
                homeOdds: '1.85',
                awayOdds: '1.95',
              },
              { 
                sport: 'Tenis', 
                league: 'ATP Masters', 
                home: 'Nadal', 
                away: 'Djokovic', 
                score: '6-4, 3-2', 
                time: 'Set 2', 
                homeOdds: '2.20',
                awayOdds: '1.70',
              },
            ].map((event, idx) => (
              <div
                key={idx}
                className="group relative bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-primary-500/40 hover:border-primary-400/80 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-2 sm:hover:-translate-y-3 overflow-hidden"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/15 via-accent-500/10 to-gold-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Live badge */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-accent-500/40 to-accent-600/40 border-2 border-accent-400/50 rounded-full backdrop-blur-md shadow-xl z-20">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="relative">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-accent-300 rounded-full animate-pulse"></div>
                      <div className="absolute top-0 left-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-accent-300 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-accent-200 text-xs font-black uppercase tracking-widest drop-shadow-lg">LIVE</span>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Sport info */}
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{event.sport}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-semibold">{event.league}</span>
                  </div>

                  {/* Teams and Score */}
                  <div className="mb-4 sm:mb-6">
                    <div className="text-white font-bold text-base sm:text-lg mb-2 sm:mb-3 drop-shadow-md truncate">{event.home}</div>
                    <div className="flex items-center justify-center gap-4 mb-2 sm:mb-3">
                      <div className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-primary-300 via-accent-300 to-gold-300 bg-clip-text text-transparent drop-shadow-2xl">
                        {event.score}
                      </div>
                    </div>
                    <div className="text-white font-bold text-base sm:text-lg drop-shadow-md truncate">{event.away}</div>
                  </div>

                  {/* Quick Odds */}
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-dark-900/50 rounded-xl sm:rounded-2xl border border-primary-500/20">
                    <div className="text-xs text-gray-400 mb-2 sm:mb-3 font-semibold uppercase tracking-wider">Cuotas Rápidas</div>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      <div className="text-center p-1.5 sm:p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                        <div className="text-xs text-gray-400 mb-1">1</div>
                        <div className="text-primary-300 font-black text-base sm:text-lg">{event.homeOdds}</div>
                      </div>
                      {event.drawOdds && (
                        <div className="text-center p-1.5 sm:p-2 bg-dark-800/50 rounded-lg border border-gray-700/30">
                          <div className="text-xs text-gray-400 mb-1">X</div>
                          <div className="text-gray-300 font-black text-base sm:text-lg">{event.drawOdds}</div>
                        </div>
                      )}
                      <div className="text-center p-1.5 sm:p-2 bg-accent-500/10 rounded-lg border border-accent-500/20">
                        <div className="text-xs text-gray-400 mb-1">{event.drawOdds ? '2' : '2'}</div>
                        <div className="text-accent-300 font-black text-base sm:text-lg">{event.awayOdds}</div>
                      </div>
                    </div>
                  </div>

                  {/* Time and CTA */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 border-t border-primary-500/20">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-300 font-bold text-xs sm:text-sm">{event.time}</span>
                    </div>
                    <button className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg sm:rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all duration-300 font-bold text-xs sm:text-sm shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 text-center">
                      Ver Análisis →
                    </button>
                  </div>
                </div>

                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            ))}
          </div>

          {/* CTA to see more */}
          <div className="text-center mt-10 sm:mt-12 md:mt-16">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-500/20 to-accent-500/20 border-2 border-primary-500/40 text-white rounded-xl sm:rounded-2xl hover:border-primary-400/60 hover:from-primary-500/30 hover:to-accent-500/30 transition-all duration-300 text-sm sm:text-base font-bold backdrop-blur-sm shadow-xl"
            >
              Ver Todos los Análisis
              <span className="text-lg sm:text-xl group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-sport-gradient-premium relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-6 sm:mb-8">
            <SportIcon sport="all" className="w-12 h-12 sm:w-16 sm:h-16 text-white/20 mx-auto mb-4 sm:mb-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 sm:mb-6 tracking-tight px-2">
            <span className="block text-white mb-1 sm:mb-2" style={{ 
              textShadow: '0 0 30px rgba(0,0,0,0.8), 0 4px 15px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,1)'
            }}>
              ¿Listo para
            </span>
            <span className="block text-white" style={{ 
              textShadow: '0 0 30px rgba(0,0,0,0.8), 0 4px 15px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,1)'
            }}>
              Mejorar tus Apuestas?
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto font-bold leading-relaxed px-4" style={{ 
            textShadow: '0 0 20px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,1)'
          }}>
            Únete a miles de usuarios que usan BETAPREDIT para tomar mejores decisiones en cualquier plataforma de apuestas
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
              <Link
                to="/register"
                className="group relative w-full sm:w-auto px-8 sm:px-12 md:px-14 py-4 sm:py-5 md:py-6 bg-white text-primary-700 rounded-2xl sm:rounded-3xl hover:bg-gray-50 transition-all duration-300 text-base sm:text-lg md:text-xl font-black shadow-2xl hover:scale-105 overflow-hidden border-2 border-white/20 text-center"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="hidden sm:inline">Ver Demo Gratis - Sin Tarjeta</span>
                  <span className="sm:hidden">Ver Demo Gratis</span>
                  <span className="inline-block ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform text-lg sm:text-xl md:text-2xl">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 sm:px-12 md:px-14 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-primary-600/20 to-accent-600/20 backdrop-blur-lg border-2 border-primary-500/50 text-white rounded-2xl sm:rounded-3xl hover:from-primary-600/30 hover:to-accent-600/30 hover:border-primary-400/70 transition-all duration-300 text-base sm:text-lg md:text-xl font-black shadow-xl shadow-primary-500/20 text-center"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-950 border-t border-primary-800/30 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">BETAPREDIT</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">
                Sistema de análisis predictivo para apuestas deportivas. Te ayudamos a tomar mejores decisiones con datos precisos e IA avanzada.
              </p>
              <p className="text-xs sm:text-sm text-gray-500 italic">
                No somos una casa de apuestas. Somos tu herramienta de análisis.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Producto</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><Link to="/pricing" className="hover:text-white transition-colors">Precios</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Legal</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li>Juego Responsable</li>
                <li>Términos y Condiciones</li>
                <li>Privacidad</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Soporte</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li>Documentación</li>
                <li>Contacto</li>
                <li>FAQ</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-800 text-center text-gray-400">
            <p className="text-sm sm:text-base">&copy; 2024 BETAPREDIT. Todos los derechos reservados.</p>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 px-4">
              Sistema de análisis predictivo. Apuesta responsablemente en las plataformas de tu elección.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}

