import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const faqs: FAQItem[] = [
    {
      category: 'general',
      question: '¿Qué es BETAPREDIT?',
      answer: 'BETAPREDIT es un sistema de análisis predictivo para apuestas deportivas. No somos una casa de apuestas, sino una herramienta que te ayuda a tomar mejores decisiones analizando cuotas de múltiples plataformas y proporcionando predicciones con IA.',
    },
    {
      category: 'general',
      question: '¿Cómo funciona el análisis predictivo?',
      answer: 'Nuestros modelos de Machine Learning analizan millones de datos históricos, estadísticas de jugadores, lesiones, rendimiento reciente y otros factores para calcular probabilidades precisas. Luego comparamos estas probabilidades con las cuotas de las casas de apuestas para identificar value bets.',
    },
    {
      category: 'features',
      question: '¿Qué es un value bet?',
      answer: 'Un value bet es una apuesta donde la cuota ofrecida por la casa de apuestas es mayor que la probabilidad real calculada por nuestra IA. Por ejemplo, si nuestra IA calcula que un equipo tiene 50% de probabilidad de ganar (cuota justa 2.00), pero la casa ofrece 2.20, hay un value bet del +10%.',
    },
    {
      category: 'features',
      question: '¿Cuántas plataformas monitorean?',
      answer: 'Actualmente monitoreamos más de 20 plataformas de apuestas principales, incluyendo Bet365, Betfair, Pinnacle, William Hill y muchas más. Las cuotas se actualizan en tiempo real con latencia menor a 100ms.',
    },
    {
      category: 'pricing',
      question: '¿Hay un plan gratuito?',
      answer: 'Sí, ofrecemos un plan Básico completamente gratuito que incluye hasta 10 comparaciones de cuotas por día, predicciones básicas y acceso a la calculadora de value bets. Es perfecto para empezar.',
    },
    {
      category: 'pricing',
      question: '¿Puedo cancelar en cualquier momento?',
      answer: 'Sí, puedes cancelar tu suscripción en cualquier momento desde tu perfil. No hay penalizaciones ni cargos ocultos. Tu acceso continuará hasta el final del período pagado.',
    },
    {
      category: 'technical',
      question: '¿Los datos son precisos?',
      answer: 'Sí, utilizamos múltiples fuentes de datos verificadas y nuestros modelos de IA se entrenan constantemente. Sin embargo, las apuestas siempre conllevan riesgo y no garantizamos resultados. Nuestro sistema te ayuda a tomar decisiones informadas, pero la responsabilidad final es tuya.',
    },
    {
      category: 'technical',
      question: '¿Ofrecen API?',
      answer: 'Sí, los planes Pro y Premium incluyen acceso a nuestra API. El plan Pro incluye 1000 requests por día, mientras que Premium tiene acceso ilimitado. Consulta nuestra documentación de API para más detalles.',
    },
    {
      category: 'general',
      question: '¿Necesito tener cuenta en las casas de apuestas?',
      answer: 'No necesitas tener cuenta en las casas de apuestas para usar BETAPREDIT. Nosotros solo te proporcionamos el análisis y comparación de cuotas. Tú decides dónde y cuánto apostar en las plataformas de tu elección.',
    },
    {
      category: 'features',
      question: '¿Cómo funcionan las alertas?',
      answer: 'Puedes configurar alertas personalizadas para recibir notificaciones cuando se detecten value bets, cambien las cuotas significativamente, o haya nuevas predicciones para eventos que sigues. Las alertas se envían por email y también aparecen en tu dashboard.',
    },
  ];

  const categories = [
    { id: 'all', name: 'Todas' },
    { id: 'general', name: 'General' },
    { id: 'features', name: 'Funcionalidades' },
    { id: 'pricing', name: 'Precios' },
    { id: 'technical', name: 'Técnico' },
  ];

  const filteredFAQs =
    selectedCategory === 'all'
      ? faqs
      : faqs.filter(faq => faq.category === selectedCategory);

  const toggleItem = (index: string) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenItems(newOpen);
  };

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-white mb-4">Preguntas Frecuentes</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Encuentra respuestas a las preguntas más comunes sobre BETAPREDIT
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="max-w-4xl mx-auto space-y-4">
        {filteredFAQs.map((faq, index) => {
          const itemKey = `${faq.category}-${index}`;
          const isOpen = openItems.has(itemKey);
          return (
            <div
              key={itemKey}
              className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl border border-primary-500/20 overflow-hidden"
            >
              <button
                onClick={() => toggleItem(itemKey)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-dark-800/50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                <svg
                  className={`w-5 h-5 text-primary-400 flex-shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isOpen && (
                <div className="px-6 py-4 border-t border-primary-500/20">
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact CTA */}
      <div className="max-w-4xl mx-auto mt-12 text-center">
        <div className="bg-primary-500/10 rounded-xl p-8 border border-primary-500/20">
          <h3 className="text-2xl font-black text-white mb-2">¿No encuentras tu respuesta?</h3>
          <p className="text-gray-400 mb-6">Estamos aquí para ayudarte</p>
          <button className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors">
            Contactar Soporte
          </button>
        </div>
      </div>
    </div>
  );
}

