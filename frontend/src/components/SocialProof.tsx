import { motion } from 'framer-motion'

const companies = [
  { name: 'Meridian', suffix: '.io' },
  { name: 'Cascade', suffix: 'HQ' },
  { name: 'Northpoint', suffix: '' },
  { name: 'Helix', suffix: 'Labs' },
  { name: 'Prism', suffix: 'AI' },
  { name: 'Vertex', suffix: '' },
]

export function SocialProof() {
  return (
    <section id="social-proof" className="py-14 bg-gray-50 dark:bg-[#0d1117] border-y border-gray-100 dark:border-[#1F2937]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-[#4B5563] mb-8"
        >
          Trusted by modern teams
        </motion.p>

        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06 } },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5"
        >
          {companies.map((company) => (
            <motion.div
              key={company.name}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              className="flex items-center gap-1 select-none"
            >
              <span className="text-[15px] font-bold text-gray-400 dark:text-[#374151] tracking-tight">
                {company.name}
              </span>
              {company.suffix && (
                <span className="text-[15px] font-bold text-indigo-400 dark:text-indigo-500/60 tracking-tight">
                  {company.suffix}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
