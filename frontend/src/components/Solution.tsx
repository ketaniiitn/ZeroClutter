import { motion } from 'framer-motion'

const steps = [
  {
    step: '01',
    title: 'Meeting runs as usual',
    description: 'Connect ZeroClutter to Google Meet, Zoom, or Teams. No behavior change for your team.',
    accent: 'text-indigo-500 dark:text-indigo-400',
    iconBg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    step: '02',
    title: 'AI captures the discussion',
    description: 'Transcription happens in real-time. Every word, every decision, every commitment is captured.',
    accent: 'text-violet-500 dark:text-violet-400',
    iconBg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    step: '03',
    title: 'Action items extracted',
    description: 'The AI identifies tasks, decisions, and risks — each grounded in a specific transcript quote.',
    accent: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    step: '04',
    title: 'Ownership assigned',
    description: 'Every action item gets an owner, a due date, and a priority. No ambiguity.',
    accent: 'text-cyan-500 dark:text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    step: '05',
    title: 'Follow-ups automated',
    description: 'Smart reminders go out via Slack or Telegram before deadlines slip — not after.',
    accent: 'text-teal-500 dark:text-teal-400',
    iconBg: 'bg-teal-500/10 border-teal-500/20',
  },
  {
    step: '06',
    title: 'Work gets done',
    description: 'Completion dashboards give leadership full visibility. Every commitment, tracked to closure.',
    accent: 'text-green-500 dark:text-green-400',
    iconBg: 'bg-green-500/10 border-green-500/20',
  },
]

export function Solution() {
  return (
    <section id="solution" className="py-24 bg-gray-50 dark:bg-[#0d1117] border-y border-gray-100 dark:border-[#1F2937]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-500/25 bg-green-50 dark:bg-green-500/8 text-green-600 dark:text-green-400 text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            How ZeroClutter works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-[#F9FAFB] tracking-tight leading-tight">
            From meeting to completed work,
            <br className="hidden md:block" />
            without the manual effort
          </h2>
          <p className="mt-4 text-base text-gray-500 dark:text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">
            A structured execution system that runs in the background, so your team stays focused on the work itself.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
              className="relative bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-[#1F2937] p-5 hover:border-gray-300 dark:hover:border-[#374151] transition-colors group"
            >
              {/* Connector line for large screen */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                  <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className="text-gray-200 dark:text-[#1F2937]">
                    <polyline points="0,6 12,6 8,2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="12,6 8,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${step.iconBg}`}
                >
                  <span className={`text-xs font-bold ${step.accent}`}>{step.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-[#F9FAFB] text-sm mb-1.5">{step.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-[#6B7280] leading-relaxed">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom result */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Result: 47% fewer missed deadlines, 3.2× faster follow-through
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
