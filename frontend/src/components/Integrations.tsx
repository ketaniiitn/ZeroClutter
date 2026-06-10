import { motion } from 'framer-motion'

const integrations = [
  {
    name: 'Google Meet',
    description: 'Auto-join and record',
    abbr: 'GM',
    color: 'bg-green-500/10 border-green-500/20 text-green-500 dark:text-green-400',
  },
  {
    name: 'Zoom',
    description: 'Seamless transcription',
    abbr: 'Zm',
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400',
  },
  {
    name: 'Microsoft Teams',
    description: 'Enterprise-ready sync',
    abbr: 'MT',
    color: 'bg-violet-500/10 border-violet-500/20 text-violet-500 dark:text-violet-400',
  },
  {
    name: 'Slack',
    description: 'Reminders and updates',
    abbr: 'Sl',
    color: 'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400',
  },
  {
    name: 'Jira',
    description: 'Sync tasks as issues',
    abbr: 'Ji',
    color: 'bg-blue-600/10 border-blue-600/20 text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Google Calendar',
    description: 'Schedule-aware analysis',
    abbr: 'GC',
    color: 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400',
  },
]

export function Integrations() {
  return (
    <section className="py-24 bg-white dark:bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#1F2937] bg-gray-50 dark:bg-[#111827] text-gray-600 dark:text-[#9CA3AF] text-xs font-medium mb-5">
            Integrations
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-[#F9FAFB] tracking-tight">
            Works where your team already works
          </h2>
          <p className="mt-4 text-base text-gray-500 dark:text-[#9CA3AF] max-w-md mx-auto">
            ZeroClutter connects to the tools you use every day. No new workflows required.
          </p>
        </motion.div>

        {/* Integration cards */}
        <motion.div
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto"
        >
          {integrations.map((integration) => (
            <motion.div
              key={integration.name}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] hover:border-gray-300 dark:hover:border-[#374151] hover:shadow-sm transition-all cursor-default"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs flex-shrink-0 ${integration.color}`}>
                {integration.abbr}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-[#F9FAFB] text-sm">{integration.name}</div>
                <div className="text-xs text-gray-500 dark:text-[#6B7280] mt-0.5">{integration.description}</div>
              </div>
              <div className="ml-auto">
                <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <polyline points="2,6 5,9 10,3" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-gray-400 dark:text-[#4B5563] mt-10"
        >
          More integrations available via API. Enterprise customers get custom connectors.
        </motion.p>
      </div>
    </section>
  )
}
