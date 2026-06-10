import { motion } from 'framer-motion'

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 6v6l4 2" />
        <circle cx="19" cy="5" r="3" fill="currentColor" strokeWidth="0" className="text-indigo-400" />
      </svg>
    ),
    title: 'AI Meeting Intelligence',
    description: 'Every meeting is automatically transcribed and analyzed. Decisions, risks, and commitments are extracted with full citation to the source.',
    badge: 'Core',
    badgeColor: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9,11 12,14 22,4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: 'Smart Task Extraction',
    description: 'The AI identifies what needs to happen, who said it, and when it needs to be done — from natural conversation, not templates.',
    badge: 'AI',
    badgeColor: 'bg-violet-500/10 text-violet-500 dark:text-violet-400 border-violet-500/20',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Automated Follow-Ups',
    description: 'Intelligent reminders reach the right people at the right time via Slack or Telegram — before items become overdue, not after.',
    badge: 'Automation',
    badgeColor: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: 'Execution Dashboard',
    description: 'A single view of every commitment across every meeting — completion rates, blockers, overdue items, and team velocity.',
    badge: 'Visibility',
    badgeColor: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border-cyan-500/20',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M8.46 8.46a5 5 0 0 0 0 7.07" />
      </svg>
    ),
    title: 'Workspace AI Assistant',
    description: 'Ask questions across all your meetings: "What did we decide about the API design?" or "Who owns the Q3 launch plan?"',
    badge: 'Search',
    badgeColor: 'bg-teal-500/10 text-teal-500 dark:text-teal-400 border-teal-500/20',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Analytics & Insights',
    description: 'Track completion rates over time, identify recurring blockers, and understand which teams execute consistently.',
    badge: 'Analytics',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/25 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-5">
            Everything you need
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-[#F9FAFB] tracking-tight leading-tight">
            Built for teams that care about execution
          </h2>
          <p className="mt-4 text-base text-gray-500 dark:text-[#9CA3AF] leading-relaxed">
            Every feature is designed around a single goal: turning decisions made in meetings into completed work.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="group bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-xl p-6 hover:border-gray-300 dark:hover:border-[#374151] hover:shadow-sm transition-all duration-200 cursor-default"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#0B0F17] border border-gray-200 dark:border-[#1F2937] flex items-center justify-center text-gray-600 dark:text-[#9CA3AF] group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shadow-sm">
                  {feature.icon}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${feature.badgeColor}`}>
                  {feature.badge}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-[#F9FAFB] text-[15px] mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-[#6B7280] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
