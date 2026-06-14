import { forwardRef } from 'react'
import { cn } from '../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-[#6366F1] text-white',
    'hover:bg-[#4F46E5]',
    'active:scale-[0.98]',
    'disabled:opacity-40 disabled:pointer-events-none',
    'focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2',
  ].join(' '),

  secondary: [
    'bg-transparent text-[#111827] dark:text-[#F9FAFB]',
    'border border-[#D1D5DB] dark:border-[#374151]',
    'hover:bg-[#F9FAFB] dark:hover:bg-[#111827]',
    'active:scale-[0.98]',
    'disabled:opacity-40 disabled:pointer-events-none',
    'focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2',
  ].join(' '),

  ghost: [
    'bg-transparent text-[#6B7280] dark:text-[#9CA3AF]',
    'hover:bg-[#F9FAFB] dark:hover:bg-[#111827]',
    'hover:text-[#111827] dark:hover:text-[#F9FAFB]',
    'hover:border hover:border-[#E5E7EB] dark:hover:border-[#1F2937]',
    'border border-transparent',
    'active:scale-[0.98]',
    'disabled:opacity-40 disabled:pointer-events-none',
    'focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2',
  ].join(' '),

  danger: [
    'bg-[#EF4444] text-white',
    'hover:bg-[#DC2626]',
    'active:scale-[0.98]',
    'disabled:opacity-40 disabled:pointer-events-none',
    'focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2',
  ].join(' '),

  link: [
    'bg-transparent text-[#4F46E5] dark:text-[#818CF8]',
    'hover:underline',
    'disabled:opacity-40 disabled:pointer-events-none',
    'p-0 h-auto',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-[11px] rounded-[4px]',
  sm: 'h-[30px] px-3 text-[12px] rounded-[6px]',
  md: 'h-9 px-4 text-[14px] rounded-[6px]',
  lg: 'h-11 px-5 text-[15px] rounded-[6px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isLink = variant === 'link'
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-[120ms] cursor-pointer select-none whitespace-nowrap',
          !isLink && sizeClasses[size],
          variantClasses[variant],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner size={size} />
            {children}
          </span>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span aria-hidden="true">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span aria-hidden="true">{icon}</span>}
          </>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

function Spinner({ size }: { size: ButtonSize }) {
  const sz = size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'lg' ? 16 : 14
  return (
    <svg
      width={sz}
      height={sz}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="animate-spin"
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
