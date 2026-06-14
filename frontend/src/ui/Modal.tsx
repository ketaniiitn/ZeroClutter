import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/cn'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  size?: ModalSize
  children: React.ReactNode
  footer?: React.ReactNode
  preventBackdropClose?: boolean
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[960px]',
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  preventBackdropClose = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Focus trap: focus first focusable element on open
  useEffect(() => {
    if (open && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable[0]?.focus()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/60"
            onClick={preventBackdropClose ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }}
              className={cn(
                'relative w-full pointer-events-auto',
                'bg-white dark:bg-[#1a2030]',
                'border border-[#E5E7EB] dark:border-[#1F2937]',
                'rounded-[12px]',
                'shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_8px_24px_rgba(0,0,0,0.5)]',
                sizeClasses[size],
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                <h2
                  id="modal-title"
                  className="text-[18px] font-semibold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.01em]"
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#9CA3AF] dark:text-[#6B7280] hover:bg-[#F9FAFB] dark:hover:bg-[#111827] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors duration-[120ms]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-[#1F2937] flex items-center justify-end gap-2">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
