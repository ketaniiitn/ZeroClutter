import { cn } from '../lib/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-[4px] skeleton-shimmer',
        'bg-[#F3F4F6] dark:bg-[#111827]',
        className,
      )}
      aria-hidden="true"
    />
  )
}

// Preset composites

export function SkeletonText({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 && lines > 1 ? 'w-4/5' : 'w-full')} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[8px] border p-4',
        'bg-[#F9FAFB] dark:bg-[#111827]',
        'border-[#E5E7EB] dark:border-[#1F2937]',
        className,
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-8 h-8 rounded-[6px] flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-3.5 w-1/2 mb-1.5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

export function SkeletonMetricCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[8px] border p-4',
        'bg-[#F9FAFB] dark:bg-[#111827]',
        'border-[#E5E7EB] dark:border-[#1F2937]',
        className,
      )}
    >
      <Skeleton className="h-3 w-1/3 mb-3" />
      <Skeleton className="h-7 w-2/5 mb-1.5" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  )
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 px-4 py-3', className)}>
      <Skeleton className="w-4 h-4 rounded-[3px] flex-shrink-0" />
      <Skeleton className="flex-1 h-3.5" />
      <Skeleton className="w-16 h-5 rounded-full flex-shrink-0" />
      <Skeleton className="w-20 h-3.5 flex-shrink-0" />
      <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
    </div>
  )
}

export function SkeletonTableRows({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-[#E5E7EB] dark:divide-[#1F2937]">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}
