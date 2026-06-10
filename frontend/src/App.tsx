import { ThemeProvider } from './contexts/ThemeContext'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { SocialProof } from './components/SocialProof'
import { Problem } from './components/Problem'
import { Solution } from './components/Solution'
import { Features } from './components/Features'
import { ProductWalkthrough } from './components/ProductWalkthrough'
import { Integrations } from './components/Integrations'
import { Pricing } from './components/Pricing'
import { FAQ } from './components/FAQ'
import { FinalCTA } from './components/FinalCTA'
import { Footer } from './components/Footer'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-[#0B0F17] text-gray-900 dark:text-[#F9FAFB] transition-colors duration-300">
        <Navbar />
        <main>
          <Hero />
          <SocialProof />
          <Problem />
          <Solution />
          <Features />
          <ProductWalkthrough />
          <Integrations />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}

export default App
