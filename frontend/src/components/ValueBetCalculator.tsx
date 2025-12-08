import { useState } from 'react';

export default function ValueBetCalculator() {
  const [bookmakerOdds, setBookmakerOdds] = useState('');
  const [trueProbability, setTrueProbability] = useState('');
  const [stake, setStake] = useState('');
  const [bankroll, setBankroll] = useState('');

  const bookmakerOddsNum = parseFloat(bookmakerOdds) || 0;
  const trueProbNum = parseFloat(trueProbability) || 0;
  const stakeNum = parseFloat(stake) || 0;
  const bankrollNum = parseFloat(bankroll) || 0;

  // Calculate value
  const impliedProbability = bookmakerOddsNum > 0 ? (1 / bookmakerOddsNum) * 100 : 0;
  const value = trueProbNum > 0 ? ((bookmakerOddsNum * trueProbNum) / 100 - 1) * 100 : 0;
  const expectedValue = stakeNum > 0 && value > 0 ? (stakeNum * value) / 100 : 0;

  // Kelly Criterion
  const kellyPercentage =
    bookmakerOddsNum > 0 && trueProbNum > 0
      ? ((bookmakerOddsNum * trueProbNum) / 100 - 1) / (bookmakerOddsNum - 1)
      : 0;
  const kellyStake = bankrollNum > 0 && kellyPercentage > 0 ? bankrollNum * kellyPercentage : 0;

  return (
    <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl p-6 border border-primary-500/20 shadow-xl">
      <h3 className="text-2xl font-black text-white mb-6">Calculadora de Value Bets</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Cuota de la Casa de Apuestas
            </label>
            <input
              type="number"
              step="0.01"
              value={bookmakerOdds}
              onChange={(e) => setBookmakerOdds(e.target.value)}
              placeholder="2.50"
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Probabilidad Real (IA) (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={trueProbability}
              onChange={(e) => setTrueProbability(e.target.value)}
              placeholder="45.0"
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Stake (Opcional)
            </label>
            <input
              type="number"
              step="0.01"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="100.00"
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Bankroll Total (Para Kelly)
            </label>
            <input
              type="number"
              step="0.01"
              value={bankroll}
              onChange={(e) => setBankroll(e.target.value)}
              placeholder="1000.00"
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="bg-dark-800/50 rounded-xl p-4 border border-primary-500/20">
            <div className="text-sm text-gray-400 mb-2">Probabilidad Implícita (Casa)</div>
            <div className="text-2xl font-black text-gray-300">{impliedProbability.toFixed(2)}%</div>
          </div>

          <div
            className={`rounded-xl p-4 border ${
              value > 0
                ? 'bg-accent-500/20 border-accent-500/40'
                : value < 0
                ? 'bg-red-500/20 border-red-500/40'
                : 'bg-dark-800/50 border-primary-500/20'
            }`}
          >
            <div className="text-sm text-gray-400 mb-2">Value Detectado</div>
            <div
              className={`text-3xl font-black ${
                value > 0 ? 'text-accent-400' : value < 0 ? 'text-red-400' : 'text-gray-300'
              }`}
            >
              {value > 0 ? '+' : ''}
              {value.toFixed(2)}%
            </div>
            {value > 0 && (
              <div className="mt-2 text-sm text-accent-300 font-semibold">
                ✅ Value Bet Confirmado
              </div>
            )}
            {value < 0 && (
              <div className="mt-2 text-sm text-red-300 font-semibold">
                ❌ Sin Valor - No Recomendado
              </div>
            )}
          </div>

          {stakeNum > 0 && value > 0 && (
            <div className="bg-gold-500/20 rounded-xl p-4 border border-gold-500/40">
              <div className="text-sm text-gray-400 mb-2">Valor Esperado</div>
              <div className="text-2xl font-black text-gold-400">
                +{expectedValue.toFixed(2)} €
              </div>
            </div>
          )}

          {bankrollNum > 0 && kellyPercentage > 0 && (
            <div className="bg-primary-500/20 rounded-xl p-4 border border-primary-500/40">
              <div className="text-sm text-gray-400 mb-2">Kelly Criterion</div>
              <div className="text-xl font-black text-primary-300 mb-2">
                {(kellyPercentage * 100).toFixed(2)}% del bankroll
              </div>
              <div className="text-lg font-bold text-white">
                Stake Sugerido: {kellyStake.toFixed(2)} €
              </div>
              <div className="mt-2 text-xs text-gray-400">
                ⚠️ Usa Kelly Fraction (25-50%) para mayor seguridad
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-primary-500/20">
        <div className="bg-primary-500/10 rounded-lg p-4 border border-primary-500/20">
          <h4 className="text-sm font-semibold text-primary-300 mb-2">💡 Cómo Funciona</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Value = (Cuota × Probabilidad Real) - 1</li>
            <li>• Si Value &gt; 0, es un value bet recomendado</li>
            <li>• Kelly Criterion calcula el stake óptimo basado en tu ventaja</li>
            <li>• Usa Kelly Fraction (25-50%) para reducir riesgo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

