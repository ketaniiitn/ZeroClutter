import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Landing page sections
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SocialProof } from './components/SocialProof';
import { Problem } from './components/Problem';
import { Solution } from './components/Solution';
import { Features } from './components/Features';
import { ProductWalkthrough } from './components/ProductWalkthrough';
import { Integrations } from './components/Integrations';
import { Pricing } from './components/Pricing';
import { FAQ } from './components/FAQ';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';

// Auth & app pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AuthCallback } from './pages/AuthCallback';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';

function LandingPage() {
  return (
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
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected */}
            <Route
              path="/onboarding"
              element={<ProtectedRoute><Onboarding /></ProtectedRoute>}
            />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/:workspaceSlug/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
