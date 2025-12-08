/**
 * Onboarding Tour Component
 * Guided tour for new users to understand the platform
 */

import { useState } from 'react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  onComplete: () => void;
  skipOnboarding?: boolean;
}

export default function OnboardingTour({ onComplete, skipOnboarding = false }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(!skipOnboarding);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      title: '¡Bienvenido a BETAPREDIT! 🎉',
      description: 'Te guiaremos en los próximos pasos para que aproveches al máximo la plataforma.',
      position: 'center',
      action: {
        label: 'Comenzar',
        onClick: () => setCurrentStep(1),
      },
    },
    {
      id: 'value-bets',
      title: 'Encuentra Value Bets Automáticamente',
      description: 'Nuestro sistema detecta automáticamente oportunidades de valor comparando cuotas de múltiples casas de apuestas.',
      position: 'center',
      action: {
        label: 'Siguiente',
        onClick: () => setCurrentStep(2),
      },
    },
    {
      id: 'comparison',
      title: 'Compara Cuotas en Tiempo Real',
      description: 'Ve las mejores cuotas disponibles en diferentes plataformas. Encuentra la mejor oportunidad antes de apostar.',
      position: 'center',
      action: {
        label: 'Siguiente',
        onClick: () => setCurrentStep(3),
      },
    },
    {
      id: 'alerts',
      title: 'Alertas en Tiempo Real',
      description: 'Recibe notificaciones instantáneas cuando detectamos un value bet. No te pierdas ninguna oportunidad.',
      position: 'center',
      action: {
        label: 'Siguiente',
        onClick: () => setCurrentStep(4),
      },
    },
    {
      id: 'statistics',
      title: 'Trackea tus Resultados',
      description: 'Registra tus apuestas y ve estadísticas detalladas: ROI, win rate, y análisis por deporte.',
      position: 'center',
      action: {
        label: 'Siguiente',
        onClick: () => setCurrentStep(5),
      },
    },
    {
      id: 'demo-value-bet',
      title: '🎯 Encuentra tu Primer Value Bet',
      description: 'Vamos a encontrar tu primer value bet ahora mismo. Esto te tomará menos de 30 segundos.',
      position: 'center',
      action: {
        label: 'Siguiente',
        onClick: () => setCurrentStep(6),
      },
    },
    {
      id: 'complete',
      title: '¡Listo para Empezar! 🚀',
      description: 'Ya conoces lo básico. Ahora puedes explorar la plataforma y empezar a encontrar value bets reales.',
      position: 'center',
      action: {
        label: 'Finalizar',
        onClick: () => {
          setIsVisible(false);
          onComplete();
        },
      },
    },
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (currentStepData.action) {
      currentStepData.action.onClick();
    } else if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Overlay */}
      <div className="absolute inset-0" onClick={handleSkip}></div>

      {/* Tour Card */}
      <div className="relative bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl p-8 border-2 border-primary-500/40 shadow-2xl max-w-md w-full mx-4 z-10">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">
              Paso {currentStep + 1} de {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Saltar tour
            </button>
          </div>
          <div className="w-full bg-dark-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white mb-3">{currentStepData.title}</h2>
          <p className="text-gray-300 leading-relaxed">{currentStepData.description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isFirstStep && (
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-lg font-semibold transition-colors"
            >
              Atrás
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-lg font-bold transition-all shadow-lg shadow-primary-500/30 ${
              isFirstStep ? 'w-full' : ''
            }`}
          >
            {currentStepData.action?.label || (isLastStep ? 'Finalizar' : 'Siguiente')}
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-primary-400 w-6'
                  : index < currentStep
                  ? 'bg-primary-600'
                  : 'bg-dark-700'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

