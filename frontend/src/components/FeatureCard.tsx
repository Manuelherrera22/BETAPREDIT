interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div
      className="group relative bg-gradient-to-br from-dark-900/80 to-dark-800/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-primary-500/20 hover:border-primary-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/20 hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary-500/30 via-accent-500/20 to-gold-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-primary-500/20">
          <div className="text-primary-300 text-xl sm:text-2xl md:text-3xl drop-shadow-lg">{icon}</div>
        </div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3 group-hover:text-primary-300 transition-colors drop-shadow-md">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}

