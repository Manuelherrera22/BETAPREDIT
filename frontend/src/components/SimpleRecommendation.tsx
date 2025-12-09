/**
 * Simple Recommendation Component
 * Muestra recomendaciones en lenguaje simple para apostadores casuales
 */

interface SimpleRecommendationProps {
  event: string;
  selection: string;
  bookmaker: string;
  odds: number;
  valuePercentage: number;
  confidence: number;
  explanation?: string;
}

export default function SimpleRecommendation({
  event,
  selection,
  bookmaker,
  odds,
  valuePercentage,
  confidence,
  explanation,
}: SimpleRecommendationProps) {
  // Determinar si es "Buena" o "Mala" apuesta
  const isGoodBet = valuePercentage > 5 && confidence > 0.6;
  const rating = isGoodBet ? 'Buena' : valuePercentage > 0 ? 'Regular' : 'Mala';
  const ratingColor = isGoodBet ? 'green' : valuePercentage > 0 ? 'yellow' : 'red';
  const ratingEmoji = isGoodBet ? '🟢' : valuePercentage > 0 ? '🟡' : '🔴';

  // Explicación simple automática si no se proporciona
  const simpleExplanation = explanation || (
    isGoodBet
      ? `Esta apuesta tiene ${(confidence * 100).toFixed(0)}% de probabilidad de ganar, pero la casa te paga como si fuera ${((1 / odds) * 100).toFixed(0)}%. Esto significa que estás obteniendo más de lo que deberías.`
      : valuePercentage > 0
      ? `Esta apuesta tiene ${(confidence * 100).toFixed(0)}% de probabilidad de ganar. La cuota es justa, pero no hay valor extra.`
      : `Esta apuesta tiene ${(confidence * 100).toFixed(0)}% de probabilidad de ganar, pero la casa te paga menos de lo que debería. No es una buena oportunidad.`
  );

  // Calcular ganancia potencial
  const potentialWin = (odds - 1) * 100; // Porcentaje de ganancia

  return (
    <div className={`bg-gradient-to-br rounded-xl p-6 border-2 ${
      ratingColor === 'green'
        ? 'from-green-500/20 to-green-600/20 border-green-500/40'
        : ratingColor === 'yellow'
        ? 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/40'
        : 'from-red-500/20 to-red-600/20 border-red-500/40'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{ratingEmoji}</span>
          <div>
            <h3 className="text-xl font-black text-white">
              {rating} Apuesta
            </h3>
            <p className="text-sm text-gray-400">{event}</p>
          </div>
        </div>
        {isGoodBet && (
          <span className="px-3 py-1 bg-green-500/30 text-green-300 rounded-full text-xs font-bold">
            +{valuePercentage.toFixed(1)}% Valor
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Información de la apuesta */}
        <div className="bg-dark-900/50 rounded-lg p-4 border border-primary-500/20">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Selección</p>
              <p className="text-sm font-bold text-white">{selection}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Casa de Apuestas</p>
              <p className="text-sm font-bold text-accent-400">{bookmaker}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-primary-500/20">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Cuota</span>
              <span className="text-2xl font-black text-gold-400">{odds.toFixed(2)}</span>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Si apuestas €10, podrías ganar €{(odds * 10 - 10).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Explicación simple */}
        <div className="bg-primary-500/10 rounded-lg p-4 border border-primary-500/20">
          <p className="text-sm text-gray-300 leading-relaxed">
            {simpleExplanation}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          <button className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-bold hover:from-primary-600 hover:to-accent-600 transition-all">
            Ver Más Detalles
          </button>
          {isGoodBet && (
            <button className="px-4 py-3 bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg font-semibold hover:bg-green-500/30 transition-all">
              Registrar Apuesta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

