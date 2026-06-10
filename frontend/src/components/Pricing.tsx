import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { openBookDemo } from '../lib/bookDemo'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
      <polyline points="2,7 5.5,10.5 12,3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const plans = [
  {
    name: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'For individuals and small teams trying ZeroClutter.',
    cta: 'Get started free',
    ctaVariant: 'outline' as const,
    ctaAction: 'signup' as const,
    highlighted: false,
    badge: null,
    features: [
      '5 meetings per month',
      'AI action item extraction',
      'Basic task tracking',
      'Slack notifications',
      '14-day history',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    monthlyPrice: 49,
    annualPrice: 39,
    description: 'For teams that are serious about execution.',
    cta: 'Start free trial',
    ctaVariant: 'primary' as const,
    ctaAction: 'signup' as const,
    highlighted: true,
    badge: 'Most popular',
    features: [
      'Unlimited meetings',
      'Full AI analysis suite',
      'Ownership assignment',
      'Automated reminders',
      'Execution dashboard',
      'Jira & Calendar sync',
      'Priority support',
      'Unlimited history',
    ],
  },
  {
    name: 'Business',
    monthlyPrice: 149,
    annualPrice: 119,
    description: 'For larger teams with advanced security and admin needs.',
    cta: 'Book a demo',
    ctaVariant: 'outline' as const,
    ctaAction: 'demo' as const,
    highlighted: false,
    badge: null,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Custom integrations',
      'Advanced analytics',
      'SAML SSO',
      'Audit logs',
      'Dedicated CSM',
      'SLA guarantees',
    ],
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="py-24 bg-gray-50 dark:bg-[#0d1117] border-y border-gray-100 dark:border-[#1F2937]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/25 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-5">
            Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-[#F9FAFB] tracking-tight">
            Simple, predictable pricing
          </h2>
          <p className="mt-3 text-base text-gray-500 dark:text-[#9CA3AF]">
            No hidden fees. Cancel any time.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-xl px-4 py-2.5">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm font-medium transition-colors ${!annual ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-[#4B5563]'}`}
            >
              Monthly
            </button>
            <button
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual(!annual)}
              className={`w-10 h-5 rounded-full transition-colors relative ${annual ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-[#1F2937]'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${annual ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-[#4B5563]'}`}
            >
              Annual
              <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        <motion.div
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                plan.highlighted
                  ? 'bg-indigo-500 border-indigo-500 shadow-xl shadow-indigo-500/25'
                  : 'bg-white dark:bg-[#111827] border-gray-200 dark:border-[#1F2937]'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-white text-indigo-600 text-[11px] font-bold shadow-md border border-indigo-100">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <h3 className={`font-bold text-lg ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-[#F9FAFB]'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mt-1.5 leading-snug ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500 dark:text-[#6B7280]'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="my-6">
                <div className="flex items-end gap-1.5">
                  <motion.span
                    key={`${plan.name}-${annual}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={`text-4xl font-extrabold tracking-tight ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                  >
                    {annual ? `$${plan.annualPrice}` : `$${plan.monthlyPrice}`}
                  </motion.span>
                  {plan.monthlyPrice > 0 && (
                    <span className={`text-sm pb-1.5 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-400 dark:text-[#4B5563]'}`}>
                      /mo
                    </span>
                  )}
                  {plan.monthlyPrice === 0 && (
                    <span className={`text-sm pb-1.5 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-400 dark:text-[#4B5563]'}`}>
                      forever
                    </span>
                  )}
                </div>
                {plan.monthlyPrice > 0 && annual && (
                  <p className={`text-xs mt-1 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-400 dark:text-[#4B5563]'}`}>
                    Billed annually · ${plan.annualPrice * 12}/yr
                  </p>
                )}
              </div>

              {plan.ctaAction === 'signup' ? (
                <Link
                  to="/signup"
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-colors mb-6 block ${
                    plan.highlighted
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openBookDemo}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-colors mb-6 ${
                    plan.highlighted
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              )}

              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <span className={plan.highlighted ? 'text-indigo-200' : 'text-indigo-500 dark:text-indigo-400'}>
                      <CheckIcon />
                    </span>
                    <span className={`text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-gray-600 dark:text-[#9CA3AF]'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Enterprise callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937]"
        >
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Need an enterprise plan?</p>
            <p className="text-sm text-gray-500 dark:text-[#6B7280] mt-0.5">Custom pricing, compliance features, and dedicated support for large organizations.</p>
          </div>
          <button
            type="button"
            onClick={openBookDemo}
            className="flex-shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/8 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 transition-colors"
          >
            Talk to sales →
          </button>
        </motion.div>
      </div>
    </section>
  )
}
