import { cn } from '../lib/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({ children, className, onClick, hoverable = false, padding = 'md' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[8px] border',
        'bg-[#F9FAFB] dark:bg-[#111827]',
        'border-[#E5E7EB] dark:border-[#1F2937]',
        'shadow-[0_1px_3px_rgba(0,0,0,0.07)] dark:shadow-none',
        paddingClasses[padding],
        hoverable && [
          'cursor-pointer transition-colors duration-[120ms]',
          'hover:border-[#9CA3AF] dark:hover:border-[#374151]',
          'hover:bg-white dark:hover:bg-[#111827]',
        ],
        onClick && !hoverable && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string | number
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' }
  period?: string
  className?: string
}

export function MetricCard({ label, value, trend, period, className }: MetricCardProps) {
  const trendColor =
    trend?.direction === 'up'
      ? 'text-[#22C55E]'
      : trend?.direction === 'down'
        ? 'text-[#EF4444]'
        : 'text-[#9CA3AF] dark:text-[#6B7280]'

  const trendIcon =
    trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '→'

  return (
    <Card padding="md" className={className}>
      <p className="text-[12px] font-medium text-[#6B7280] dark:text-[#9CA3AF] tracking-[0.02em] mb-2">
        {label}
      </p>
      <p className="text-[28px] font-bold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.02em] leading-none mb-1">
        {value}
      </p>
      {(trend || period) && (
        <div className="flex items-center gap-2 mt-1.5">
          {trend && (
            <span className={cn('text-[12px] font-medium', trendColor)}>
              {trendIcon} {trend.value}
            </span>
          )}
          {period && (
            <span className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280]">{period}</span>
          )}
        </div>
      )}
    </Card>
  )
}
