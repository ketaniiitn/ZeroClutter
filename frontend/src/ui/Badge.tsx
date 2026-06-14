import { cn } from '../lib/cn'

export type BadgeStatus = 'completed' | 'in-progress' | 'pending' | 'overdue' | 'blocked'
export type BadgePriority = 'critical' | 'high' | 'medium' | 'low'

interface StatusBadgeProps {
  status: BadgeStatus
  className?: string
}

interface PriorityBadgeProps {
  priority: BadgePriority
  className?: string
}

const statusConfig: Record<BadgeStatus, { bg: string; text: string; dot: string; label: string }> = {
  completed: {
    bg: 'bg-[rgba(34,197,94,0.12)]',
    text: 'text-[#22C55E]',
    dot: 'bg-[#22C55E]',
    label: 'Completed',
  },
  'in-progress': {
    bg: 'bg-[rgba(99,102,241,0.12)]',
    text: 'text-[#6366F1]',
    dot: 'bg-[#6366F1]',
    label: 'In progress',
  },
  pending: {
    bg: 'bg-[#F9FAFB] dark:bg-[#111827]',
    text: 'text-[#6B7280] dark:text-[#9CA3AF]',
    dot: 'bg-[#9CA3AF] dark:bg-[#6B7280]',
    label: 'Pending',
  },
  overdue: {
    bg: 'bg-[rgba(239,68,68,0.12)]',
    text: 'text-[#EF4444]',
    dot: 'bg-[#EF4444]',
    label: 'Overdue',
  },
  blocked: {
    bg: 'bg-[rgba(245,158,11,0.12)]',
    text: 'text-[#F59E0B]',
    dot: 'bg-[#F59E0B]',
    label: 'Blocked',
  },
}

const priorityConfig: Record<BadgePriority, { color: string; dot: string; label: string }> = {
  critical: { color: 'text-[#EF4444]', dot: 'bg-[#EF4444]', label: 'Critical' },
  high: { color: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]', label: 'High' },
  medium: { color: 'text-[#6366F1]', dot: 'border-2 border-[#6366F1] bg-transparent', label: 'Medium' },
  low: { color: 'text-[#9CA3AF] dark:text-[#6B7280]', dot: 'border-2 border-[#9CA3AF] dark:border-[#6B7280] bg-transparent', label: 'Low' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusConfig[status]
  return (
    <span
      role="status"
      aria-label={cfg.label}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium',
        cfg.bg,
        cfg.text,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const cfg = priorityConfig[priority]
  return (
    <span
      role="status"
      aria-label={`Priority: ${cfg.label}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium',
        cfg.color,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}
