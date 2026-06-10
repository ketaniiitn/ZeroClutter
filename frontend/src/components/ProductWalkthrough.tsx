import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = ['Meeting Intelligence', 'Task Management', 'Execution Dashboard'] as const
type Tab = typeof tabs[number]

function MeetingIntelligenceMock() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1F2937] bg-[#090d13] shadow-2xl">
      {/* Chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#060a10] border-b border-[#1a1f2e]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <div className="flex-1 mx-3">
          <div className="h-4.5 max-w-[160px] mx-auto rounded bg-[#1a1f2e] flex items-center justify-center px-3">
            <span className="text-[9px] text-gray-500 font-mono">Meeting Intelligence</span>
          </div>
        </div>
      </div>

      <div className="flex bg-[#0b0f17]" style={{ minHeight: '360px' }}>
        {/* Transcript sidebar */}
        <div className="w-52 border-r border-[#1F2937] p-3 flex flex-col gap-2">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider font-medium mb-1">Transcript</div>
          {[
            { speaker: 'Alex R.', time: '00:02', text: 'Let\'s align on the Q2 launch target.', color: 'text-blue-400' },
            { speaker: 'Sarah K.', time: '00:05', text: 'I\'d say June 15 is realistic if we freeze scope now.', color: 'text-violet-400' },
            { speaker: 'Mike T.', time: '00:08', text: 'Agreed. I\'ll update the roadmap deck by Friday.', color: 'text-cyan-400' },
            { speaker: 'Priya M.', time: '00:12', text: 'I\'ll schedule user testing for the week of June 10.', color: 'text-teal-400' },
            { speaker: 'Alex R.', time: '00:15', text: 'Great. Sarah, can you own the QA process?', color: 'text-blue-400' },
            { speaker: 'Sarah K.', time: '00:17', text: 'Yes, I\'ll kick off Monday morning.', color: 'text-violet-400' },
          ].map((entry, i) => (
            <div key={i} className="flex gap-1.5">
              <span className="text-[8px] text-gray-600 font-mono mt-0.5 flex-shrink-0">{entry.time}</span>
              <div>
                <span className={`text-[8px] font-medium ${entry.color}`}>{entry.speaker}</span>
                <p className="text-[9px] text-gray-500 leading-[1.5] mt-0.5">{entry.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis panel */}
        <div className="flex-1 p-4 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-indigo-400 text-sm">✦</span>
              <span className="text-[11px] text-white font-semibold">AI Analysis — Sprint Planning Q2</span>
              <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[9px] text-green-400 font-medium">Analyzed</span>
              </div>
            </div>

            {/* Decisions */}
            <div className="mb-3">
              <div className="text-[9px] text-gray-500 uppercase tracking-wider font-medium mb-2">Key Decisions</div>
              {[
                { text: 'Q2 launch target set to June 15', cite: '00:05 Sarah K.' },
                { text: 'Scope freeze enacted immediately', cite: '00:05 Sarah K.' },
              ].map((d, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-[#111827] border border-[#1F2937]">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-300">{d.text}</p>
                    <p className="text-[8px] text-indigo-400/70 mt-0.5">↗ {d.cite}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Items */}
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider font-medium mb-2">Extracted Action Items</div>
              {[
                { task: 'Update roadmap deck', owner: 'Mike T.', due: 'Friday', cite: '00:08' },
                { task: 'Schedule user testing', owner: 'Priya M.', due: 'Jun 10', cite: '00:12' },
                { task: 'Lead QA sprint', owner: 'Sarah K.', due: 'Monday', cite: '00:17' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span className="text-[10px] text-gray-300 flex-1">{a.task}</span>
                  <span className="text-[9px] text-indigo-300/70">{a.owner}</span>
                  <span className="text-[8px] text-gray-600 font-mono">{a.cite}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskManagementMock() {
  const tasks = [
    { task: 'Finalize API spec', owner: 'Sarah K.', due: 'Jun 5', priority: 'High', status: 'overdue', meeting: 'Sprint Planning' },
    { task: 'Update roadmap deck', owner: 'Mike T.', due: 'Jun 8', priority: 'High', status: 'in-progress', meeting: 'Sprint Planning' },
    { task: 'Schedule user testing', owner: 'Priya M.', due: 'Jun 12', priority: 'Medium', status: 'pending', meeting: 'Sprint Planning' },
    { task: 'Prepare release notes', owner: 'Alex R.', due: 'Jun 14', priority: 'Low', status: 'done', meeting: 'Sprint Planning' },
    { task: 'Review GDPR checklist', owner: 'Fiona W.', due: 'Jun 16', priority: 'High', status: 'pending', meeting: 'Compliance Review' },
    { task: 'Sync with design on onboarding', owner: 'Mike T.', due: 'Jun 18', priority: 'Medium', status: 'pending', meeting: 'Design Sync' },
  ]

  const statusConfig = {
    overdue: { label: 'Overdue', dot: 'bg-red-400', row: 'border-red-500/15 bg-red-500/5' },
    'in-progress': { label: 'In Progress', dot: 'bg-amber-400', row: 'border-[#1F2937] bg-[#111827]' },
    pending: { label: 'Pending', dot: 'bg-gray-500', row: 'border-[#1F2937] bg-[#111827]' },
    done: { label: 'Done', dot: 'bg-green-400', row: 'border-green-500/15 bg-green-500/5' },
  }

  const priorityConfig = {
    High: 'text-red-400',
    Medium: 'text-amber-400',
    Low: 'text-gray-500',
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#1F2937] bg-[#090d13] shadow-2xl">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#060a10] border-b border-[#1a1f2e]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <div className="flex-1 mx-3 text-center">
          <span className="text-[9px] text-gray-500 font-mono">Action Items · All Meetings</span>
        </div>
      </div>

      <div className="p-4 bg-[#0b0f17]" style={{ minHeight: '360px' }}>
        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <span className="text-[9px] text-indigo-400 font-medium">All status</span>
            <span className="text-[9px] text-indigo-400">▾</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111827] border border-[#1F2937]">
            <span className="text-[9px] text-gray-500">All owners</span>
            <span className="text-[9px] text-gray-600">▾</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111827] border border-[#1F2937]">
            <span className="text-[9px] text-gray-500">This week</span>
            <span className="text-[9px] text-gray-600">▾</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[9px] text-red-400 font-medium">1 overdue</span>
            <div className="w-px h-3 bg-[#1F2937]" />
            <span className="text-[9px] text-gray-500">6 total</span>
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-3 mb-2">
          <span className="col-span-5 text-[8px] text-gray-600 uppercase tracking-wider">Task</span>
          <span className="col-span-2 text-[8px] text-gray-600 uppercase tracking-wider">Owner</span>
          <span className="col-span-2 text-[8px] text-gray-600 uppercase tracking-wider">Due</span>
          <span className="col-span-1 text-[8px] text-gray-600 uppercase tracking-wider">Pri</span>
          <span className="col-span-2 text-[8px] text-gray-600 uppercase tracking-wider">Status</span>
        </div>

        {/* Task rows */}
        <div className="flex flex-col gap-1.5">
          {tasks.map((task, i) => {
            const sc = statusConfig[task.status as keyof typeof statusConfig]
            const pc = priorityConfig[task.priority as keyof typeof priorityConfig]
            return (
              <div key={i} className={`grid grid-cols-12 gap-2 items-center px-3 py-2 rounded-lg border ${sc.row}`}>
                <div className="col-span-5 flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                  <span className={`text-[10px] truncate ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                    {task.task}
                  </span>
                </div>
                <span className="col-span-2 text-[9px] text-indigo-400 truncate">{task.owner.split(' ')[0]}</span>
                <span className={`col-span-2 text-[9px] font-mono ${task.status === 'overdue' ? 'text-red-400' : task.status === 'done' ? 'text-green-400' : 'text-gray-500'}`}>
                  {task.due}
                </span>
                <span className={`col-span-1 text-[9px] font-medium ${pc}`}>{task.priority[0]}</span>
                <div className="col-span-2">
                  <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded ${
                    task.status === 'overdue' ? 'bg-red-500/15 text-red-400' :
                    task.status === 'done' ? 'bg-green-500/15 text-green-400' :
                    task.status === 'in-progress' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-gray-500/15 text-gray-500'
                  }`}>
                    {sc.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ExecutionDashboardMock() {
  const metrics = [
    { label: 'Completion Rate', value: '78%', delta: '+12%', deltaUp: true },
    { label: 'Avg Turnaround', value: '3.4d', delta: '-0.8d', deltaUp: true },
    { label: 'Open Items', value: '24', delta: '+3', deltaUp: false },
    { label: 'Overdue', value: '3', delta: '-2', deltaUp: true },
  ]

  const teamData = [
    { name: 'Engineering', done: 14, pending: 4, overdue: 1, pct: 78 },
    { name: 'Product', done: 8, pending: 3, overdue: 1, pct: 73 },
    { name: 'Design', done: 6, pending: 2, overdue: 0, pct: 75 },
    { name: 'Operations', done: 5, pending: 1, overdue: 1, pct: 83 },
  ]

  return (
    <div className="rounded-xl overflow-hidden border border-[#1F2937] bg-[#090d13] shadow-2xl">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#060a10] border-b border-[#1a1f2e]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <div className="flex-1 mx-3 text-center">
          <span className="text-[9px] text-gray-500 font-mono">Execution Dashboard · June 2026</span>
        </div>
      </div>

      <div className="p-4 bg-[#0b0f17]" style={{ minHeight: '360px' }}>
        {/* Metric cards */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {metrics.map((m) => (
            <div key={m.label} className="bg-[#111827] border border-[#1F2937] rounded-lg p-3">
              <div className="text-[8px] text-gray-600 uppercase tracking-wider mb-1.5">{m.label}</div>
              <div className="text-lg font-bold text-white tracking-tight">{m.value}</div>
              <div className={`text-[9px] font-medium mt-1 ${m.deltaUp ? 'text-green-400' : 'text-red-400'}`}>
                {m.delta} vs last week
              </div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-white font-semibold">Completion Trend</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-indigo-500" />
                <span className="text-[8px] text-gray-500">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-[#1F2937]" />
                <span className="text-[8px] text-gray-500">Pending</span>
              </div>
            </div>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-16">
            {[42, 58, 51, 67, 72, 65, 78].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                <div
                  className="w-full rounded-sm bg-indigo-500/70"
                  style={{ height: `${(val / 100) * 56}px` }}
                />
                <span className="text-[7px] text-gray-700">{['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team performance */}
        <div>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider font-medium mb-2">Team Performance</div>
          <div className="flex flex-col gap-1.5">
            {teamData.map((team) => (
              <div key={team.name} className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 w-20 flex-shrink-0">{team.name}</span>
                <div className="flex-1 h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${team.pct}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 w-8 text-right">{team.pct}%</span>
                {team.overdue > 0 && (
                  <span className="text-[8px] text-red-400">{team.overdue} late</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const tabContent: Record<Tab, { headline: string; description: string; component: React.ReactNode }> = {
  'Meeting Intelligence': {
    headline: 'Every word. Every decision. Captured.',
    description: 'AI analyzes your transcript in real-time, extracting action items and decisions with citations to the exact moment they were made.',
    component: <MeetingIntelligenceMock />,
  },
  'Task Management': {
    headline: 'Every commitment, tracked to completion.',
    description: 'A unified view of all action items across every meeting. Filter by owner, status, or meeting — no item ever falls through the cracks.',
    component: <TaskManagementMock />,
  },
  'Execution Dashboard': {
    headline: 'Real-time visibility for leadership.',
    description: 'Completion rates, team velocity, and overdue items in one view. Know the health of your team\'s execution at any moment.',
    component: <ExecutionDashboardMock />,
  },
}

export function ProductWalkthrough() {
  const [active, setActive] = useState<Tab>('Meeting Intelligence')

  return (
    <section className="py-24 bg-gray-50 dark:bg-[#0d1117] border-y border-gray-100 dark:border-[#1F2937]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#1F2937] bg-white dark:bg-[#111827] text-gray-600 dark:text-[#9CA3AF] text-xs font-medium mb-5">
            Product walkthrough
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-[#F9FAFB] tracking-tight">
            See it in action
          </h2>
          <p className="mt-3 text-base text-gray-500 dark:text-[#9CA3AF] max-w-lg mx-auto">
            Three views that together form a complete execution system.
          </p>
        </motion.div>

        {/* Tab selector */}
        <div className="flex items-center justify-center gap-1 mb-10 bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-xl p-1 max-w-xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active === tab
                  ? 'bg-white dark:bg-[#1F2937] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-[#374151]'
                  : 'text-gray-500 dark:text-[#6B7280] hover:text-gray-700 dark:hover:text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-center">
          {/* Description — left */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-snug">
                  {tabContent[active].headline}
                </h3>
                <p className="text-[15px] text-gray-500 dark:text-[#9CA3AF] leading-relaxed">
                  {tabContent[active].description}
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActive(tab)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                        active === tab
                          ? 'bg-indigo-50 dark:bg-indigo-500/8 border-indigo-200 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300'
                          : 'bg-white dark:bg-[#111827] border-gray-200 dark:border-[#1F2937] text-gray-600 dark:text-[#9CA3AF] hover:border-gray-300 dark:hover:border-[#374151]'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active === tab ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-[#374151]'}`} />
                      <span className="text-sm font-medium">{tab}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mockup — right */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.99 }}
                transition={{ duration: 0.35 }}
              >
                {tabContent[active].component}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
