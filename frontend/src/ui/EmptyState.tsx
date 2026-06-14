import { cn } from '../lib/cn'
import { Button } from './Button'

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-4' : 'py-20 px-4',
        className,
      )}
    >
      {/* Icon container */}
      <div className="w-14 h-14 rounded-[12px] bg-[rgba(99,102,241,0.08)] flex items-center justify-center mb-5 text-[#6366F1]">
        {icon}
      </div>

      {/* Text */}
      <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.01em] mb-2">
        {title}
      </h3>
      <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] max-w-[320px] leading-[1.6]">
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
          {action && (
            <Button variant={action.variant ?? 'primary'} size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant={secondaryAction.variant ?? 'ghost'} size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
