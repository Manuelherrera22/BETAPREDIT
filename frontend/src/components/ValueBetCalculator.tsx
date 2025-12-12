import { useState, useMemo } from 'react';
import Icon from './icons/IconSystem';

export default function ValueBetCalculator() {
  const [bookmakerOdds, setBookmakerOdds] = useState('');
  const [trueProbability, setTrueProbability] = useState('');
  const [stake, setStake] = useState('');
  const [bankroll, setBankroll] = useState('');
  const [kellyFraction, setKellyFraction] = useState(0.5); // 50% Kelly por defecto (conservador)
  const [riskLevel, setRiskLevel] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');

  // Ajustar Kelly Fraction según nivel de riesgo
  const riskLevels = {
    conservative: 0.25, // 25% Kelly (muy conservador)
    moderate: 0.5,      // 50% Kelly (moderado)
    aggressive: 0.75,   // 75% Kelly (agresivo)
  };

  const bookmakerOddsNum = parseFloat(bookmakerOdds) || 0;
  const trueProbNum = parseFloat(trueProbability) || 0;
  const stakeNum = parseFloat(stake) || 0;
  const bankrollNum = parseFloat(bankroll) || 0;

  // Calculate value
  const impliedProbability = bookmakerOddsNum > 0 ? (1 / bookmakerOddsNum) * 100 : 0;
  const value = trueProbNum > 0 ? ((bookmakerOddsNum * trueProbNum) / 100 - 1) * 100 : 0;
  const expectedValue = stakeNum > 0 && value > 0 ? (stakeNum * value) / 100 : 0;

  // Kelly Criterion mejorado
  const kellyPercentage = useMemo(() => {
    if (bookmakerOddsNum <= 0 || trueProbNum <= 0) return 0;
    const p = trueProbNum / 100; // Probabilidad de ganar
    const q = 1 - p; // Probabilidad de perder
    const b = bookmakerOddsNum - 1; // Ganancia neta si ganas
    const kelly = (b * p - q) / b;
    return Math.max(0, kelly); // No permitir valores negativos
  }, [bookmakerOddsNum, trueProbNum]);

  // Kelly Fraction aplicado
  const adjustedKellyPercentage = kellyPercentage * kellyFraction;
  const kellyStake = bankrollNum > 0 && adjustedKellyPercentage > 0 
    ? bankrollNum * adjustedKellyPercentage 
    : 0;

  // Simulador de escenarios
  const simulationResults = useMemo(() => {
    if (!kellyStake || kellyStake <= 0 || bookmakerOddsNum <= 0) return null;
    
    const winScenario = {
      outcome: 'Ganar',
      probability: trueProbNum / 100,
      stake: kellyStake,
      return: kellyStake * bookmakerOddsNum,
      profit: kellyStake * (bookmakerOddsNum - 1),
      newBankroll: bankrollNum + kellyStake * (bookmakerOddsNum - 1),
    };
    
    const loseScenario = {
      outcome: 'Perder',
      probability: 1 - (trueProbNum / 100),
      stake: kellyStake,
      return: 0,
      profit: -kellyStake,
      newBankroll: bankrollNum - kellyStake,
    };
    
    const expectedBankroll = (winScenario.probability * winScenario.newBankroll) + 
                            (loseScenario.probability * loseScenario.newBankroll);
    
    return {
      winScenario,
      loseScenario,
      expectedBankroll,
      expectedProfit: expectedBankroll - bankrollNum,
    };
  }, [kellyStake, bookmakerOddsNum, trueProbNum, bankrollNum]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center border border-primary-500/40 shadow-lg">
          <Icon name="chart" size={20} className="text-primary-300" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white">Calculadora de Value Bets</h3>
          <p className="text-xs text-gray-400 mt-0.5">Optimiza tus stakes con Kelly Criterion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
            <div className="bg-primary-500/20 rounded-xl p-4 border border-primary-500/40 space-y-3">
              <div className="text-sm text-gray-400 mb-2">Kelly Criterion Optimizado</div>
              
              {/* Nivel de Riesgo */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Nivel de Riesgo</label>
                <div className="flex gap-2">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setRiskLevel(level);
                        setKellyFraction(riskLevels[level]);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        riskLevel === level
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                      }`}
                    >
                      {level === 'conservative' ? '🛡️ Conservador' :
                       level === 'moderate' ? '⚖️ Moderado' : '⚡ Agresivo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kelly Fraction Slider */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Kelly Fraction: {(kellyFraction * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={kellyFraction}
                  onChange={(e) => setKellyFraction(parseFloat(e.target.value))}
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Resultados Kelly */}
              <div className="pt-2 border-t border-primary-500/20">
                <div className="text-xs text-gray-400 mb-1">Kelly Full: {(kellyPercentage * 100).toFixed(2)}%</div>
                <div className="text-xl font-black text-primary-300 mb-1">
                  Stake Óptimo: {kellyStake.toFixed(2)} €
                </div>
                <div className="text-xs text-gray-400">
                  ({(adjustedKellyPercentage * 100).toFixed(1)}% del bankroll)
                </div>
                
                {kellyStake > bankrollNum * 0.05 && (
                  <div className="mt-2 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-xs text-amber-300">
                    ⚠️ Stake alto: {(kellyStake / bankrollNum * 100).toFixed(1)}% del bankroll
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Simulador de Escenarios */}
          {simulationResults && (
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl p-4 border border-emerald-500/40">
              <div className="text-sm font-bold text-emerald-300 mb-3">📊 Simulador de Escenarios</div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-dark-800/50 rounded-lg p-3 border border-emerald-500/20">
                  <div className="text-xs text-gray-400 mb-1">Si GANAS ({(simulationResults.winScenario.probability * 100).toFixed(1)}%)</div>
                  <div className="text-lg font-black text-emerald-400">
                    +{simulationResults.winScenario.profit.toFixed(2)} €
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Bankroll: {simulationResults.winScenario.newBankroll.toFixed(2)} €
                  </div>
                </div>
                
                <div className="bg-dark-800/50 rounded-lg p-3 border border-red-500/20">
                  <div className="text-xs text-gray-400 mb-1">Si PIERDES ({(simulationResults.loseScenario.probability * 100).toFixed(1)}%)</div>
                  <div className="text-lg font-black text-red-400">
                    {simulationResults.loseScenario.profit.toFixed(2)} €
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Bankroll: {simulationResults.loseScenario.newBankroll.toFixed(2)} €
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-500/20">
                <div className="text-xs text-gray-400 mb-1">Valor Esperado</div>
                <div className="text-xl font-black text-white">
                  {simulationResults.expectedProfit >= 0 ? '+' : ''}
                  {simulationResults.expectedProfit.toFixed(2)} €
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Bankroll esperado: {simulationResults.expectedBankroll.toFixed(2)} €
                </div>
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

