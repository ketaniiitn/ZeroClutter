import { motion } from 'framer-motion'

const ease = [0.25, 0.46, 0.45, 0.94] as const

const actionItems = [
  { id: 1, task: 'Finalize API specification', assignee: 'SK', due: 'Jun 5', status: 'overdue' as const },
  { id: 2, task: 'Update product roadmap deck', assignee: 'MT', due: 'Jun 8', status: 'pending' as const },
  { id: 3, task: 'Schedule user testing sessions', assignee: 'PM', due: 'Jun 12', status: 'pending' as const },
  { id: 4, task: 'Prepare release notes', assignee: 'AR', due: 'Jun 14', status: 'done' as const },
]

function DotIndicator({ status }: { status: typeof actionItems[0]['status'] }) {
  const colors = {
    overdue: 'bg-red-400',
    pending: 'bg-[#374151]',
    done: 'bg-green-400',
  }
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`} />
}

function AvatarDot({ initials, status }: { initials: string; status: typeof actionItems[0]['status'] }) {
  const colors = {
    overdue: 'bg-red-500/15 text-red-400',
    pending: 'bg-indigo-500/15 text-indigo-400',
    done: 'bg-green-500/15 text-green-400',
  }
  return (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-semibold flex-shrink-0 ${colors[status]}`}>
      {initials}
    </div>
  )
}

function ProductMockup() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-[#1F2937] shadow-2xl bg-[#090d13]">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#060a10] border-b border-[#1a1f2e]">
        <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
        <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        <div className="flex-1 mx-4">
          <div className="h-5 max-w-[190px] mx-auto rounded-md bg-[#1a1f2e] flex items-center justify-center gap-2 px-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 opacity-80" />
            <span className="text-[10px] text-gray-400 font-mono tracking-tight">app.zeroclutter.com</span>
          </div>
        </div>
      </div>

      {/* App navbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b0f17] border-b border-[#1a1f2e]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">Z</span>
            </div>
            <span className="text-[11px] text-white font-semibold tracking-tight">ZeroClutter</span>
          </div>
          <div className="h-3.5 w-px bg-[#1F2937]" />
          <div className="flex items-center gap-0.5">
            {['Dashboard', 'Meetings', 'Tasks', 'Analytics'].map((item, i) => (
              <button
                key={item}
                className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                  i === 1 ? 'bg-white/10 text-white' : 'text-[#6B7280] hover:text-gray-300'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
            <span className="text-[9px] text-indigo-400 font-medium">Pro</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
            <span className="text-[9px] text-white font-semibold">A</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 bg-[#0b0f17]">
        {/* Meeting header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-semibold text-white tracking-tight">Sprint Planning Q2</h3>
            <p className="text-[10px] text-[#6B7280] mt-0.5">June 2, 2026 · 47 min · 6 participants</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[9px] text-green-400 font-medium">AI Complete</span>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="rounded-lg border border-indigo-500/25 bg-indigo-500/5 p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-indigo-400 text-[11px]">✦</span>
            <span className="text-[10px] text-indigo-300 font-semibold">AI Analysis</span>
            <div className="flex-1 h-px bg-indigo-500/20" />
            <span className="text-[9px] text-[#4B5563]">2 decisions · 3 items</span>
          </div>
          <p className="text-[10px] text-[#9CA3AF] leading-[1.65]">
            Team committed to a{' '}
            <span className="text-indigo-300 font-medium">June 15 launch</span>. API endpoints finalized before UI work.{' '}
            <span className="text-indigo-300 font-medium">Sarah</span> leads QA sprint from Monday.
          </p>
        </div>

        {/* Action items */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wider">Action Items</span>
            <span className="text-[9px] text-[#4B5563]">4 total · 1 done</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                  item.status === 'overdue'
                    ? 'bg-red-500/5 border-red-500/15'
                    : item.status === 'done'
                    ? 'bg-green-500/5 border-green-500/15'
                    : 'bg-[#111827] border-[#1F2937]'
                }`}
              >
                <DotIndicator status={item.status} />
                <span
                  className={`text-[10px] flex-1 ${
                    item.status === 'done' ? 'text-[#4B5563] line-through' : 'text-[#D1D5DB]'
                  }`}
                >
                  {item.task}
                </span>
                <AvatarDot initials={item.assignee} status={item.status} />
                <span
                  className={`text-[9px] font-mono flex-shrink-0 ${
                    item.status === 'overdue' ? 'text-red-400' : item.status === 'done' ? 'text-green-400' : 'text-[#4B5563]'
                  }`}
                >
                  {item.due}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 bg-[#060a10] border-t border-[#1a1f2e] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-[9px] text-[#4B5563]">Overdue reminder sent to Sarah via Telegram</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] text-[#374151]">Live</span>
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative min-h-screen pt-32 pb-20 flex items-center bg-white dark:bg-[#0B0F17] overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#6366F1 1px, transparent 1px), linear-gradient(90deg, #6366F1 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-14 xl:gap-20 items-center">
          {/* Left — copy */}
          <div>
            <motion.div
              custom={0}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.11, ease } }),
              }}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-300/40 dark:border-indigo-500/25 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-7"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              AI Meeting Execution Platform
            </motion.div>

            <motion.h1
              custom={1}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.11, ease } }),
              }}
              initial="hidden"
              animate="visible"
              className="text-[2.75rem] lg:text-[3.25rem] xl:text-[3.75rem] font-extrabold text-gray-900 dark:text-[#F9FAFB] leading-[1.08] tracking-[-0.025em]"
            >
              Meetings create
              <br />
              decisions.{' '}
              <span className="text-indigo-500">ZeroClutter</span>
              <br />
              makes sure they happen.
            </motion.h1>

            <motion.p
              custom={2}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.11, ease } }),
              }}
              initial="hidden"
              animate="visible"
              className="mt-6 text-[1.0625rem] text-gray-500 dark:text-[#9CA3AF] leading-[1.75] max-w-[520px]"
            >
              ZeroClutter captures every discussion, extracts action items, assigns ownership, and follows up automatically — so nothing slips through the cracks.
            </motion.p>

            <motion.div
              custom={3}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.11, ease } }),
              }}
              initial="hidden"
              animate="visible"
              className="mt-8 flex items-center flex-wrap gap-3"
            >
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
              >
                Start Free Trial
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12,5 19,12 12,19" />
                </svg>
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 dark:text-[#D1D5DB] text-sm font-semibold rounded-lg border border-gray-300 dark:border-[#1F2937] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Book a Demo
              </a>
            </motion.div>

            <motion.div
              custom={4}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.11, ease } }),
              }}
              initial="hidden"
              animate="visible"
              className="mt-10 pt-8 border-t border-gray-100 dark:border-[#1F2937] grid grid-cols-3 gap-6"
            >
              {[
                { value: '47%', label: 'fewer missed deadlines' },
                { value: '3.2×', label: 'faster follow-through' },
                { value: '12k+', label: 'teams executing' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</div>
                  <div className="text-xs text-gray-500 dark:text-[#6B7280] mt-1 leading-snug">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — product mockup */}
          <motion.div
            initial={{ opacity: 0, x: 32, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.25, ease }}
            className="relative"
          >
            {/* Ambient glow behind mockup */}
            <div className="absolute -inset-6 bg-indigo-500/6 dark:bg-indigo-500/10 rounded-3xl blur-2xl pointer-events-none" />
            <ProductMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
