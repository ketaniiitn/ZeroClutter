import { forwardRef, useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../lib/cn'

// ─── Text Input ───────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leadingIcon, trailingIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[12px] font-medium text-[#111827] dark:text-[#F9FAFB] tracking-[0.02em]"
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#6B7280] pointer-events-none">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-9 px-3 text-[14px] rounded-[6px] transition-colors duration-[120ms]',
              'bg-white dark:bg-[#111827]',
              'border',
              error
                ? 'border-[#EF4444]'
                : 'border-[#D1D5DB] dark:border-[#374151] focus:border-[#6366F1]',
              'text-[#111827] dark:text-[#F9FAFB]',
              'placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280]',
              'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/25',
              'disabled:bg-[#F3F4F6] dark:disabled:bg-[#080c12] disabled:text-[#9CA3AF] dark:disabled:text-[#6B7280] disabled:cursor-not-allowed',
              leadingIcon && 'pl-9',
              trailingIcon && 'pr-9',
              className,
            )}
            {...props}
          />
          {trailingIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#6B7280] pointer-events-none">
              {trailingIcon}
            </span>
          )}
        </div>
        {error && <p className="text-[12px] text-[#EF4444]">{error}</p>}
        {hint && !error && <p className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[12px] font-medium text-[#111827] dark:text-[#F9FAFB] tracking-[0.02em]"
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'w-full px-3 py-2 text-[14px] rounded-[6px] transition-colors duration-[120ms] resize-y min-h-[80px]',
            'bg-white dark:bg-[#111827]',
            'border',
            error
              ? 'border-[#EF4444]'
              : 'border-[#D1D5DB] dark:border-[#374151] focus:border-[#6366F1]',
            'text-[#111827] dark:text-[#F9FAFB]',
            'placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280]',
            'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/25',
            className,
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-[#EF4444]">{error}</p>}
        {hint && !error && <p className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'

// ─── Search Input ─────────────────────────────────────────────────────────────

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className, autoFocus }: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  return (
    <div className={cn('relative', className)}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#6B7280] pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full h-8 pl-8 pr-8 text-[13px] rounded-[6px] transition-colors duration-[120ms]',
          'bg-[#F9FAFB] dark:bg-[#111827]',
          'border border-[#E5E7EB] dark:border-[#1F2937] focus:border-[#6366F1]',
          'text-[#111827] dark:text-[#F9FAFB]',
          'placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280]',
          'focus:outline-none focus:ring-2 focus:ring-[#6366F1]/25',
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] dark:text-[#6B7280] dark:hover:text-[#9CA3AF] transition-colors"
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative w-10 h-[22px] rounded-full transition-colors duration-150 flex-shrink-0 mt-0.5',
          checked ? 'bg-[#6366F1]' : 'bg-[#D1D5DB] dark:bg-[#374151]',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-150',
            checked ? 'translate-x-[21px]' : 'translate-x-[3px]',
          )}
        />
      </button>
      {(label || description) && (
        <div>
          {label && <p className="text-[14px] font-medium text-[#111827] dark:text-[#F9FAFB]">{label}</p>}
          {description && <p className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  )
}

// ─── File Input ───────────────────────────────────────────────────────────────

interface FileInputProps {
  label?: string
  accept?: string
  onChange: (file: File | null) => void
  error?: string
  hint?: string
  required?: boolean
}

export function FileInput({ label, accept, onChange, error, hint, required }: FileInputProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setFileName(file?.name ?? null)
    onChange(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12px] font-medium text-[#111827] dark:text-[#F9FAFB] tracking-[0.02em]">
          {label}
          {required && <span className="text-[#EF4444] ml-0.5">*</span>}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          'h-20 flex flex-col items-center justify-center gap-1 rounded-[6px] border-2 border-dashed cursor-pointer transition-colors duration-[120ms]',
          error
            ? 'border-[#EF4444] bg-[rgba(239,68,68,0.04)]'
            : 'border-[#D1D5DB] dark:border-[#374151] hover:border-[#6366F1] hover:bg-[rgba(99,102,241,0.04)]',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        {fileName ? (
          <>
            <span className="text-[13px] font-medium text-[#6366F1]">{fileName}</span>
            <span className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280]">Click to change file</span>
          </>
        ) : (
          <>
            <span className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Click to select file</span>
            {hint && <span className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280]">{hint}</span>}
          </>
        )}
      </div>
      {error && <p className="text-[12px] text-[#EF4444]">{error}</p>}
    </div>
  )
}
