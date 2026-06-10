import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    question: 'How does ZeroClutter integrate with my meeting platform?',
    answer: 'ZeroClutter connects directly to Google Meet, Zoom, and Microsoft Teams via their official APIs. Once connected, it automatically joins meetings on your calendar and begins transcription. No manual effort required after the initial 2-minute setup.',
  },
  {
    question: 'Is my meeting data secure and private?',
    answer: 'Yes. All transcripts and data are encrypted at rest (AES-256) and in transit (TLS 1.3). We are SOC 2 Type II compliant and GDPR-ready. Your data is never used to train AI models. Enterprise customers can bring their own encryption keys.',
  },
  {
    question: 'How accurate is the AI at extracting action items?',
    answer: 'In internal benchmarks, ZeroClutter achieves 94% recall on action items explicitly assigned in meetings. Every extracted item includes a citation to the exact transcript moment — so your team can verify any item in one click. You can always edit, add, or remove items.',
  },
  {
    question: 'Can I try ZeroClutter before committing to a paid plan?',
    answer: 'Yes. The Starter plan is free forever and includes 5 meetings per month. Pro and Business plans offer a 14-day free trial with no credit card required. You\'ll have access to every feature during the trial period.',
  },
  {
    question: 'What happens when action items aren\'t completed on time?',
    answer: 'ZeroClutter sends intelligent reminders via Slack or Telegram starting 48 hours before a deadline. If an item becomes overdue, it escalates — notifying the team lead and surfacing the item on the Execution Dashboard. You control the cadence and escalation rules.',
  },
  {
    question: 'Can ZeroClutter sync action items into Jira or other project management tools?',
    answer: 'Yes. The Pro and Business plans include Jira sync — action items extracted from meetings are automatically created as Jira issues with the right assignee and due date. Linear and Asana integrations are on the roadmap for Q3 2026.',
  },
  {
    question: 'Does ZeroClutter work with recorded meetings, not just live ones?',
    answer: 'Absolutely. You can upload audio or video recordings directly, or paste a transcript. ZeroClutter will run the same AI analysis pipeline and extract all action items and decisions. The source moment citation still works on uploaded transcripts.',
  },
  {
    question: 'How is ZeroClutter different from just taking meeting notes with Notion AI?',
    answer: 'Note-taking tools produce unstructured summaries that still require someone to manually extract tasks, assign owners, and chase follow-ups. ZeroClutter is an execution system — every item gets an owner, a due date, automated reminders, and a dashboard that tracks it to completion.',
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-gray-100 dark:border-[#1F2937] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className={`text-[15px] font-medium transition-colors ${open ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-[#D1D5DB] group-hover:text-gray-900 dark:group-hover:text-white'}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-400 dark:text-[#4B5563]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="7" y1="1" x2="7" y2="13" />
            <line x1="1" y1="7" x2="13" y2="7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-gray-500 dark:text-[#9CA3AF] leading-relaxed max-w-3xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-white dark:bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-14">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-28 h-fit"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#1F2937] bg-gray-50 dark:bg-[#111827] text-gray-600 dark:text-[#9CA3AF] text-xs font-medium mb-5">
              FAQ
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-[#F9FAFB] tracking-tight leading-tight">
              Common questions
            </h2>
            <p className="mt-4 text-base text-gray-500 dark:text-[#9CA3AF] leading-relaxed">
              Everything you need to know about ZeroClutter. Can't find an answer?
            </p>
            <a
              href="#"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              Talk to support
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 10 L10 2" />
                <path d="M4 2 L10 2 L10 8" />
              </svg>
            </a>
          </motion.div>

          {/* FAQ list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            {faqs.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
