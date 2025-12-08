export default function ResultsComparison() {
  return (
    <div className="bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-primary-500/20 shadow-2xl">
      <div className="text-center mb-8 sm:mb-10 md:mb-12">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4 px-4">
          Resultados Reales de Usuarios
        </h3>
        <p className="text-base sm:text-lg md:text-xl text-gray-300 px-4">
          Usuarios que usan BETAPREDIT vs. apostadores tradicionales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        {/* Sin BETAPREDIT */}
        <div className="bg-dark-950/50 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-red-500/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
            <h4 className="text-lg sm:text-xl font-bold text-gray-300">Sin Análisis</h4>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base text-gray-400">Win Rate Promedio</span>
              <span className="text-red-400 font-bold text-lg sm:text-xl">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base text-gray-400">ROI Mensual</span>
              <span className="text-red-400 font-bold text-lg sm:text-xl">-8%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base text-gray-400">Value Bets Encontrados</span>
              <span className="text-gray-500 font-bold text-lg sm:text-xl">Manual</span>
            </div>
          </div>
        </div>

        {/* Con BETAPREDIT */}
        <div className="bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 border-primary-400/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-accent-400 rounded-full animate-pulse"></div>
              <h4 className="text-lg sm:text-xl font-bold text-white">Con BETAPREDIT</h4>
              <span className="ml-auto px-2 sm:px-3 py-1 bg-accent-500/30 text-accent-300 text-xs font-bold rounded-full">
                +67%
              </span>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-300">Win Rate Promedio</span>
                <span className="text-accent-400 font-black text-xl sm:text-2xl">75%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-300">ROI Mensual</span>
                <span className="text-gold-400 font-black text-xl sm:text-2xl">+23%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-300">Value Bets Encontrados</span>
                <span className="text-primary-300 font-black text-lg sm:text-xl">150+/mes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center pt-4 sm:pt-6 border-t border-primary-500/20">
        <p className="text-gray-400 text-xs sm:text-sm px-4">
          *Datos basados en análisis de usuarios activos durante los últimos 6 meses
        </p>
      </div>
    </div>
  );
}

