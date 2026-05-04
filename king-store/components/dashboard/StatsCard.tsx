import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'amber' | 'emerald' | 'blue' | 'rose'
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'amber',
}: StatsCardProps) {
  const colors = {
    amber: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-400',
      border: 'border-amber-500/10',
      glow: 'shadow-amber-500/5',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      icon: 'text-emerald-400',
      border: 'border-emerald-500/10',
      glow: 'shadow-emerald-500/5',
    },
    blue: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-400',
      border: 'border-blue-500/10',
      glow: 'shadow-blue-500/5',
    },
    rose: {
      bg: 'bg-rose-500/10',
      icon: 'text-rose-400',
      border: 'border-rose-500/10',
      glow: 'shadow-rose-500/5',
    },
  }

  const c = colors[color]

  return (
    <div
      className={cn(
        'bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl',
        c.glow
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', c.bg, 'border', c.border)}>
          <Icon className={cn('w-6 h-6', c.icon)} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trend.value >= 0
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            )}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
