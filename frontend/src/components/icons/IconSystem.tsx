/**
 * Professional Icon System
 * Centralized icon mapping using lucide-react for consistent, professional design
 */

import {
  Home,
  Calendar,
  TrendingUp,
  Target,
  BarChart3,
  Zap,
  Bell,
  Users,
  Shield,
  User,
  Lock,
  Search,
  Lightbulb,
  Wallet,
  Activity,
  Clock,
  Brain,
  TrendingDown,
  AlertCircle,
  Sparkles,
  Coins,
  PieChart,
  LineChart,
  FileText,
  Settings,
  Award,
  CheckCircle2,
  XCircle,
  Info,
  ArrowRight,
  Menu,
  X,
  Rocket,
  ArrowUpRight,
  ArrowDownRight,
  List,
  Grid3x3,
  Gem,
  Flame,
  CheckCircle,
  Pause,
  X as XIcon,
  HelpCircle,
} from 'lucide-react'

export type IconName =
  | 'home'
  | 'events'
  | 'odds'
  | 'arbitrage'
  | 'statistics'
  | 'predictions'
  | 'prediction-history'
  | 'tracking'
  | 'bets'
  | 'bankroll'
  | 'alerts'
  | 'referrals'
  | 'responsible'
  | 'profile'
  | 'security'
  | 'search'
  | 'lightbulb'
  | 'wallet'
  | 'activity'
  | 'clock'
  | 'brain'
  | 'trending-up'
  | 'trending-down'
  | 'alert'
  | 'sparkles'
  | 'coins'
  | 'chart'
  | 'line-chart'
  | 'file'
  | 'settings'
  | 'award'
  | 'check'
  | 'x'
  | 'info'
  | 'arrow-right'
  | 'menu'
  | 'close'
  | 'rocket'
  | 'arrow-up-right'
  | 'arrow-down-right'
  | 'list'
  | 'grid'
  | 'gem'
  | 'zap'
  | 'flame'
  | 'check-circle'
  | 'pause'
  | 'x-icon'
  | 'help-circle'
  | 'target'

interface IconProps {
  name: IconName
  className?: string
  size?: number | string
  strokeWidth?: number
}

const iconMap: Record<IconName, React.ComponentType<any>> = {
  home: Home,
  events: Calendar,
  odds: BarChart3,
  arbitrage: Coins,
  statistics: TrendingUp,
  predictions: Target,
  'prediction-history': FileText,
  tracking: Activity,
  bets: Zap,
  bankroll: Wallet,
  alerts: Bell,
  referrals: Users,
  responsible: Shield,
  profile: User,
  security: Lock,
  search: Search,
  lightbulb: Lightbulb,
  wallet: Wallet,
  activity: Activity,
  clock: Clock,
  brain: Brain,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  alert: AlertCircle,
  sparkles: Sparkles,
  coins: Coins,
  chart: PieChart,
  'line-chart': LineChart,
  file: FileText,
  settings: Settings,
  award: Award,
  check: CheckCircle2,
  x: XCircle,
  info: Info,
  'arrow-right': ArrowRight,
  menu: Menu,
  close: X,
  rocket: Rocket,
  'arrow-up-right': ArrowUpRight,
  'arrow-down-right': ArrowDownRight,
  list: List,
  grid: Grid3x3,
  gem: Gem,
  zap: Zap,
  flame: Flame,
  'check-circle': CheckCircle,
  pause: Pause,
  'x-icon': XIcon,
  'help-circle': HelpCircle,
  target: Target,
}

export default function Icon({ name, className = '', size = 20, strokeWidth = 2 }: IconProps) {
  const IconComponent = iconMap[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <IconComponent
      className={className}
      size={typeof size === 'number' ? size : undefined}
      style={typeof size === 'string' ? { width: size, height: size } : undefined}
      strokeWidth={strokeWidth}
    />
  )
}

// Convenience exports for common icon sizes
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const

