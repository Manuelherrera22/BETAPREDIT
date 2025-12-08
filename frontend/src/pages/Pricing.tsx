import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import GradientText from '../components/GradientText';
import { paymentsService } from '../services/paymentsService';

export default function Pricing() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  // Stripe Price IDs - Estos los obtienes de tu dashboard de Stripe
  // Por ahora usamos placeholders que debes reemplazar con los reales
  const priceIds: Record<string, string> = {
    BASIC: process.env.VITE_STRIPE_PRICE_ID_BASIC || 'price_basic_placeholder',
    PRO: process.env.VITE_STRIPE_PRICE_ID_PRO || 'price_pro_placeholder',
    PREMIUM: process.env.VITE_STRIPE_PRICE_ID_PREMIUM || 'price_premium_placeholder',
  };

  const handleSubscribe = async (planName: string, priceId?: string) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    if (planName === 'Básico' || !priceId) {
      // Free plan - just redirect to dashboard
      navigate('/dashboard');
      return;
    }

    setLoading(planName);
    try {
      const session = await paymentsService.createCheckoutSession(priceId);
      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert('Error al iniciar el pago. Por favor intenta de nuevo.');
      setLoading(null);
    }
  };
  const plans = [
    {
      name: 'Básico',
      price: 'Gratis',
      period: '',
      description: 'Perfecto para empezar',
      features: [
        'Hasta 10 comparaciones de cuotas/día',
        'Predicciones básicas con IA',
        'Alertas de value bets limitadas',
        'Acceso a calculadora de value bets',
        'Soporte por email',
      ],
      cta: 'Comenzar Gratis',
      popular: false,
      color: 'primary',
    },
    {
      name: 'Pro',
      price: '€29',
      period: '/mes',
      description: 'Para apostadores serios',
      features: [
        'Comparaciones ilimitadas',
        'Predicciones avanzadas con IA',
        'Alertas ilimitadas en tiempo real',
        'Análisis de bankroll detallado',
        'Historial completo de predicciones',
        'Estadísticas avanzadas',
        'Soporte prioritario',
        'API access (1000 req/día)',
      ],
      cta: 'Comenzar Prueba',
      popular: true,
      color: 'accent',
    },
    {
      name: 'Premium',
      price: '€79',
      period: '/mes',
      description: 'Para profesionales',
      features: [
        'Todo lo de Pro',
        'Datos granulares a nivel de jugador',
        'Trading algorítmico 24/7',
        'Análisis de arbitraje',
        'API ilimitada',
        'Soporte dedicado 24/7',
        'Consultoría personalizada',
        'Acceso beta a nuevas features',
      ],
      cta: 'Contactar Ventas',
      popular: false,
      color: 'gold',
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return {
          border: 'border-primary-500/40',
          bg: 'bg-primary-500/10',
          button: 'bg-primary-500 hover:bg-primary-600',
          badge: 'bg-primary-500/20 text-primary-300',
        };
      case 'accent':
        return {
          border: 'border-accent-500/60',
          bg: 'bg-accent-500/20',
          button: 'bg-accent-500 hover:bg-accent-600',
          badge: 'bg-accent-500/30 text-accent-300',
        };
      case 'gold':
        return {
          border: 'border-gold-500/40',
          bg: 'bg-gold-500/10',
          button: 'bg-gold-500 hover:bg-gold-600',
          badge: 'bg-gold-500/20 text-gold-300',
        };
      default:
        return {
          border: 'border-primary-500/40',
          bg: 'bg-primary-500/10',
          button: 'bg-primary-500 hover:bg-primary-600',
          badge: 'bg-primary-500/20 text-primary-300',
        };
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-white mb-4">
          Planes y <GradientText gradient="from-primary-300 via-accent-400 to-gold-300">Precios</GradientText>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades. Todos incluyen análisis predictivo con IA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
        {plans.map((plan) => {
          const colors = getColorClasses(plan.color);
          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 border-2 ${
                plan.popular ? colors.border : 'border-primary-500/20'
              } ${plan.popular ? colors.bg : 'bg-dark-900/50'} transition-all hover:shadow-2xl hover:scale-105`}
            >
              {plan.popular && (
                <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 ${colors.badge} rounded-full text-xs font-black uppercase`}>
                  Más Popular
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-400 ml-2">{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-accent-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (plan.name === 'Pro') {
                    handleSubscribe(plan.name, priceIds.PRO);
                  } else if (plan.name === 'Premium') {
                    handleSubscribe(plan.name, priceIds.PREMIUM);
                  } else {
                    handleSubscribe(plan.name);
                  }
                }}
                disabled={loading === plan.name}
                className={`block w-full text-center py-3 rounded-lg font-bold text-white transition-colors ${colors.button} ${
                  loading === plan.name ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading === plan.name ? 'Procesando...' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto bg-dark-900/50 rounded-2xl p-8 border border-primary-500/20">
        <h2 className="text-2xl font-black text-white mb-6 text-center">Preguntas Frecuentes</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
            <p className="text-gray-400">Sí, puedes actualizar o cancelar tu plan en cualquier momento desde tu perfil.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">¿Hay período de prueba?</h3>
            <p className="text-gray-400">El plan Pro incluye 7 días de prueba gratuita. No se requiere tarjeta de crédito.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">¿Los datos se actualizan en tiempo real?</h3>
            <p className="text-gray-400">Sí, todas las cuotas y predicciones se actualizan en tiempo real con latencia &lt;100ms.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

