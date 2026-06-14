/**
 * Design System Tokens
 * Single source of truth for all semantic class names.
 * No component should hardcode a color hex — reference these instead.
 */

export const t = {
  bg: {
    base: 'bg-white dark:bg-[#0B0F17]',
    surface: 'bg-[#F9FAFB] dark:bg-[#111827]',
    elevated: 'bg-white dark:bg-[#1a2030]',
    sunken: 'bg-[#F3F4F6] dark:bg-[#080c12]',
  },

  border: {
    subtle: 'border-[#E5E7EB] dark:border-[#1F2937]',
    default: 'border-[#D1D5DB] dark:border-[#374151]',
    strong: 'border-[#9CA3AF] dark:border-[#4B5563]',
    focus: 'border-[#6366F1]',
  },

  text: {
    primary: 'text-[#111827] dark:text-[#F9FAFB]',
    secondary: 'text-[#6B7280] dark:text-[#9CA3AF]',
    tertiary: 'text-[#9CA3AF] dark:text-[#6B7280]',
    link: 'text-[#4F46E5] dark:text-[#818CF8]',
  },

  radius: {
    sm: 'rounded-[4px]',
    md: 'rounded-[6px]',
    lg: 'rounded-[8px]',
    xl: 'rounded-[12px]',
    '2xl': 'rounded-[16px]',
    full: 'rounded-full',
  },

  // Semantic color values (for inline styles or non-Tailwind usage)
  color: {
    primary: '#6366F1',
    primaryHover: '#4F46E5',
    primaryMuted: 'rgba(99,102,241,0.12)',
    success: '#22C55E',
    successMuted: 'rgba(34,197,94,0.12)',
    warning: '#F59E0B',
    warningMuted: 'rgba(245,158,11,0.12)',
    danger: '#EF4444',
    dangerMuted: 'rgba(239,68,68,0.12)',
    info: '#3B82F6',
    infoMuted: 'rgba(59,130,246,0.12)',
  },

  // Motion durations from spec
  duration: {
    micro: 120,   // hover, checkbox
    short: 180,   // button press, tooltip
    standard: 220, // modal, dropdown
    page: 250,    // route transitions
  },

  ease: {
    standard: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    enter: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
    exit: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1.0)',
  },
} as const
