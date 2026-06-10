import { motion } from 'framer-motion'

const steps = [
  {
    icon: '📅',
    title: 'Meeting happens',
    description: 'Teams gather, ideas flow, decisions seem clear. Everyone leaves with a vague sense of what needs to happen.',
    color: 'border-gray-200 dark:border-[#1F2937]',
    bg: 'bg-white dark:bg-[#111827]',
  },
  {
    icon: '📝',
    title: 'Notes get forgotten',
    description: 'Scattered in Google Docs, Notion pages, Slack threads. There\'s no single source of truth for what was decided.',
    color: 'border-amber-200 dark:border-amber-500/25',
    bg: 'bg-amber-50 dark:bg-amber-500/5',
  },
  {
    icon: '🚫',
    title: 'No clear ownership',
    description: 'Action items are remembered differently by everyone. Without explicit ownership, nobody takes responsibility.',
    color: 'border-orange-200 dark:border-orange-500/25',
    bg: 'bg-orange-50 dark:bg-orange-500/5',
  },
  {
    icon: '⏱',
    title: 'Deadlines slip',
    description: 'Weeks later, the same topics resurface. Teams realise nothing was done. The cycle repeats itself endlessly.',
    color: 'border-red-200 dark:border-red-500/25',
    bg: 'bg-red-50 dark:bg-red-500/5',
  },
]

function ArrowDown() {
  return (
    <div className="flex justify-center my-1">
      <svg width="20" height="28" viewBox="0 0 20 28" fill="none" className="text-gray-300 dark:text-[#1F2937]">
        <line x1="10" y1="0" x2="10" y2="20" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
        <polyline points="4,16 10,24 16,16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function Problem() {
  return (
    <section className="py-24 bg-white dark:bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-500/25 bg-red-50 dark:bg-red-500/8 text-red-600 dark:text-red-400 text-xs font-medium mb-5">
              The meeting execution gap
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-[#F9FAFB] tracking-tight leading-tight">
              Most meetings produce talk, not action
            </h2>
            <p className="mt-4 text-base text-gray-500 dark:text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">
              Without a system, critical decisions and commitments evaporate the moment the call ends.
            </p>
          </motion.div>

          {/* Step flow */}
          <div>
            {steps.map((step, index) => (
              <div key={step.title}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className={`rounded-xl border p-5 flex items-start gap-4 ${step.bg} ${step.color}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#0B0F17] border border-gray-100 dark:border-[#1F2937] flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-gray-900 dark:text-[#F9FAFB] text-[15px]">{step.title}</h3>
                      <span className="text-xs text-gray-400 dark:text-[#4B5563] font-mono flex-shrink-0">
                        Step {index + 1}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-[#9CA3AF] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
                {index < steps.length - 1 && <ArrowDown />}
              </div>
            ))}
          </div>

          {/* Outcome callout */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-5 text-center"
          >
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              The average company wastes 31 hours per employee per month in unproductive meetings.
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/60 mt-1">Source: Atlassian State of Teams Report, 2024</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
