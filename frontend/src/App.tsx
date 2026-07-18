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
import { Integrations as LandingIntegrations } from './components/Integrations';
import { Pricing } from './components/Pricing';
import { FAQ } from './components/FAQ';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';

// Auth pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AuthCallback } from './pages/AuthCallback';
import { Onboarding } from './pages/Onboarding';

// App shell
import { AppShell } from './shell/AppShell';

// App pages
import { Overview } from './pages/app/Overview';
import { Meetings } from './pages/app/Meetings';
import { Bots } from './pages/app/Bots';
import { Tasks } from './pages/app/Tasks';
import { Assistant } from './pages/app/Assistant';
import { Analytics } from './pages/app/Analytics';
import { Integrations } from './pages/app/Integrations';
import {
  Settings,
  SettingsProfile,
  SettingsWorkspace,
  SettingsNotifications,
  SettingsSecurity,
  SettingsBilling,
} from './pages/app/Settings';

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
        <LandingIntegrations />
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

            {/* Protected — pre-shell routes */}
            <Route
              path="/onboarding"
              element={<ProtectedRoute><Onboarding /></ProtectedRoute>}
            />

            {/* Protected — workspace-scoped SaaS shell */}
            <Route
              path="/:workspaceSlug"
              element={<ProtectedRoute><AppShell /></ProtectedRoute>}
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="bots" element={<Bots />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="settings" element={<Settings />}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<SettingsProfile />} />
                <Route path="workspace" element={<SettingsWorkspace />} />
                <Route path="notifications" element={<SettingsNotifications />} />
                <Route path="security" element={<SettingsSecurity />} />
                <Route path="billing" element={<SettingsBilling />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
