export default function QuickDemo() {
  return (
    <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-primary-500/20 shadow-2xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-accent-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Paso 1 */}
        <div className="group bg-gradient-to-br from-dark-800/80 to-dark-900/80 rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-primary-500/30 hover:border-primary-400/60 transition-all hover:shadow-xl hover:shadow-primary-500/20 hover:-translate-y-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg">
              1
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">Compara Cuotas</h4>
          </div>
          <div className="bg-dark-900/70 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 border border-primary-500/20">
            <div className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Real Madrid vs Barcelona</div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Bet365:</span>
                <span className="text-primary-300 font-bold text-sm sm:text-base">2.10</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Betfair:</span>
                <span className="text-accent-300 font-bold text-sm sm:text-base">2.15</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-primary-500/20">
                <span className="text-xs text-gray-400 font-semibold">Mejor Cuota:</span>
                <span className="text-gold-400 font-black text-base sm:text-lg">2.15</span>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            Monitoreamos <strong className="text-primary-300">20+ plataformas</strong> en tiempo real para encontrar la mejor cuota
          </p>
        </div>

        {/* Paso 2 */}
        <div className="group bg-gradient-to-br from-dark-800/80 to-dark-900/80 rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-accent-500/30 hover:border-accent-400/60 transition-all hover:shadow-xl hover:shadow-accent-500/20 hover:-translate-y-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg">
              2
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">Análisis con IA</h4>
          </div>
          <div className="bg-dark-900/70 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 border border-accent-500/20">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Probabilidad Real:</span>
                <span className="text-accent-400 font-black text-base sm:text-lg">52%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Cuota Justa (IA):</span>
                <span className="text-white font-bold text-sm sm:text-base">1.92</span>
              </div>
              <div className="pt-1.5 sm:pt-2 border-t border-accent-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-semibold">Value Detectado:</span>
                  <span className="text-gold-400 font-black text-lg sm:text-xl">+12%</span>
                </div>
                <div className="mt-1.5 sm:mt-2 px-2 py-1 bg-gold-500/20 rounded text-xs text-gold-300 text-center font-semibold">
                  ✅ Value Bet Confirmado
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            <strong className="text-accent-300">IA analiza millones de datos</strong> para calcular probabilidades precisas y detectar valor
          </p>
        </div>

        {/* Paso 3 */}
        <div className="group bg-gradient-to-br from-dark-800/80 to-dark-900/80 rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-gold-500/30 hover:border-gold-400/60 transition-all hover:shadow-xl hover:shadow-gold-500/20 hover:-translate-y-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg">
              3
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">Decide y Apuesta</h4>
          </div>
          <div className="bg-dark-900/70 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 border border-gold-500/20">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="text-gold-400 text-lg sm:text-xl">✅</span>
                <span className="text-gold-400 font-black text-base sm:text-lg">Value Bet Confirmado</span>
              </div>
              <div className="space-y-1.5 sm:space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Plataforma Recomendada:</span>
                  <span className="text-white font-semibold">Betfair</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cuota:</span>
                  <span className="text-gold-300 font-bold">2.15</span>
                </div>
                <div className="pt-1.5 sm:pt-2 border-t border-gold-500/20">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-semibold">Stake Sugerido:</span>
                    <span className="text-primary-300 font-black">3% bankroll</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            Toma la decisión informada y <strong className="text-gold-300">apuesta en tu plataforma preferida</strong> con confianza
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}

