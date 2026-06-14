import { cn } from '../lib/cn'

export interface TableColumn<T = Record<string, unknown>> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render: (row: T) => React.ReactNode
}

interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyState?: React.ReactNode
  loading?: boolean
  className?: string
}

export function Table<T = Record<string, unknown>>({
  columns,
  data,
  getRowKey,
  onRowClick,
  emptyState,
  loading,
  className,
}: TableProps<T>) {
  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center px-4 border-b border-[#E5E7EB] dark:border-[#1F2937] bg-[#F9FAFB] dark:bg-[#0d1117] sticky top-0 z-10">
        {columns.map((col) => (
          <div
            key={col.key}
            style={{ width: col.width }}
            className={cn(
              'py-2.5 text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-[0.08em] flex-shrink-0',
              !col.width && 'flex-1',
              col.align === 'right' && 'text-right',
              col.align === 'center' && 'text-center',
            )}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">
        {loading ? null : data.length === 0 ? (
          emptyState ?? null
        ) : (
          <div className="divide-y divide-[#E5E7EB] dark:divide-[#1F2937]">
            {data.map((row) => (
              <div
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'flex items-center px-4 transition-colors duration-[120ms] group',
                  onRowClick && 'cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#0d1117]',
                )}
                style={{ minHeight: 40 }}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      'py-2.5 text-[14px] text-[#111827] dark:text-[#F9FAFB] flex-shrink-0 min-w-0',
                      !col.width && 'flex-1',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {col.render(row)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
