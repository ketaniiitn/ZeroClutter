import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { openBookDemo } from '../lib/bookDemo'

export function FinalCTA() {
  return (
    <section className="py-28 bg-gray-50 dark:bg-[#0d1117] border-t border-gray-100 dark:border-[#1F2937] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative max-w-3xl mx-auto text-center">
          {/* Background glow */}
          <div className="absolute inset-0 -m-16 bg-indigo-500/5 dark:bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="relative"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/25 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Start executing today
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-[#F9FAFB] tracking-tight leading-[1.1]">
              Ready to turn meetings
              <br className="hidden sm:block" />
              into completed work?
            </h2>

            <p className="mt-5 text-lg text-gray-500 dark:text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">
              Join 12,000+ teams that have eliminated the gap between what's decided in meetings and what actually gets done.
            </p>

            <div className="mt-9 flex items-center justify-center flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
              >
                Start Free Trial
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12,5 19,12 12,19" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={openBookDemo}
                className="inline-flex items-center gap-2 px-7 py-3.5 text-gray-700 dark:text-[#D1D5DB] text-sm font-semibold rounded-xl border border-gray-300 dark:border-[#1F2937] hover:bg-white dark:hover:bg-[#111827] transition-colors"
              >
                Book a Demo
              </button>
            </div>

            {/* Trust signals */}
            <div className="mt-9 flex items-center justify-center flex-wrap gap-6 text-xs text-gray-400 dark:text-[#4B5563]">
              {[
                'No credit card required',
                'Free 14-day trial',
                'Cancel any time',
              ].map((signal, i) => (
                <span key={signal} className="flex items-center gap-1.5">
                  {i > 0 && <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-300 dark:bg-[#374151] mr-2" />}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-green-500">
                    <polyline points="2,6 4.5,8.5 10,3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {signal}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
