interface TestimonialCardProps {
  name: string;
  role: string;
  image?: string;
  content: string;
  stats: {
    label: string;
    value: string;
  };
}

export default function TestimonialCard({ name, role, content, stats }: TestimonialCardProps) {
  return (
    <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-primary-500/20 hover:border-primary-400/40 transition-all">
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
          {name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-bold text-sm sm:text-base">{name}</h4>
          <p className="text-gray-400 text-xs sm:text-sm">{role}</p>
        </div>
      </div>
      <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4 leading-relaxed">"{content}"</p>
      <div className="pt-3 sm:pt-4 border-t border-primary-500/20">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-xs sm:text-sm">{stats.label}</span>
          <span className="text-accent-400 font-black text-base sm:text-lg">{stats.value}</span>
        </div>
      </div>
    </div>
  );
}

