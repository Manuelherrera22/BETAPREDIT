export default function ValueProposition() {
  return (
    <div className="bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-gold-500/10 border border-primary-500/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-12">
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-4">
        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3">
            No Somos una Casa de Apuestas
          </h3>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-3 sm:mb-4">
            <strong className="text-white">BETAPREDIT</strong> es tu sistema de análisis predictivo. 
            Te proporcionamos datos, predicciones y análisis de valor para que tomes mejores decisiones 
            en <strong className="text-primary-300">cualquier plataforma de apuestas</strong>.
          </p>
          <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
            <p className="text-accent-200 text-xs sm:text-sm font-semibold">
              💡 <strong>No apostamos por ti</strong> - Tú decides dónde y cuánto apostar. Nosotros te damos el análisis.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent-400 rounded-full flex-shrink-0"></div>
              <span className="text-gray-300 text-xs sm:text-sm">Compara cuotas de múltiples plataformas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0"></div>
              <span className="text-gray-300 text-xs sm:text-sm">Recibe predicciones con IA</span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2 md:col-span-1">
              <div className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0"></div>
              <span className="text-gray-300 text-xs sm:text-sm">Encuentra value bets automáticamente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

