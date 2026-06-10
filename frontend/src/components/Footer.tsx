import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Changelog', href: '#' },
    { label: 'Roadmap', href: '#' },
    { label: 'API Reference', href: '#' },
  ],
  Solutions: [
    { label: 'For Engineering Teams', href: '#' },
    { label: 'For Product Managers', href: '#' },
    { label: 'For Founders', href: '#' },
    { label: 'For Enterprise', href: '#' },
    { label: 'Case Studies', href: '#' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Help Center', href: '#' },
    { label: 'System Status', href: '#' },
    { label: 'Community', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Security', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
}

function ZeroClutterLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="#6366F1" />
      <path d="M8 19L14 9L20 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10.5" y1="15.5" x2="17.5" y2="15.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#060a10] border-t border-gray-100 dark:border-[#1F2937]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main footer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="py-14 grid md:grid-cols-6 gap-10"
        >
          {/* Brand column */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 text-gray-900 dark:text-white font-semibold text-[15px] mb-4">
              <ZeroClutterLogo />
              ZeroClutter
            </Link>
            <p className="text-sm text-gray-500 dark:text-[#6B7280] leading-relaxed max-w-[220px]">
              Meetings create decisions. ZeroClutter makes sure they happen.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {/* Social icons */}
              {[
                {
                  label: 'Twitter',
                  path: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z',
                },
                {
                  label: 'GitHub',
                  path: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
                },
                {
                  label: 'LinkedIn',
                  path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] flex items-center justify-center text-gray-400 dark:text-[#4B5563] hover:text-gray-600 dark:hover:text-[#9CA3AF] hover:border-gray-300 dark:hover:border-[#374151] transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-900 dark:text-[#F9FAFB] uppercase tracking-[0.08em] mb-4">
                {category}
              </h3>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-500 dark:text-[#6B7280] hover:text-gray-900 dark:hover:text-[#D1D5DB] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-gray-100 dark:border-[#1F2937] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-[#4B5563]">
            © {new Date().getFullYear()} ZeroClutter, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-xs text-gray-400 dark:text-[#4B5563]">All systems operational</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-gray-400 dark:text-[#4B5563] hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="text-xs text-gray-400 dark:text-[#4B5563] hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Terms</a>
            <a href="#" className="text-xs text-gray-400 dark:text-[#4B5563] hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
