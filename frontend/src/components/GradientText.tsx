interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
}

export default function GradientText({
  children,
  className = '',
  gradient = 'from-primary-400 via-blue-400 to-purple-400',
}: GradientTextProps) {
  return (
    <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

