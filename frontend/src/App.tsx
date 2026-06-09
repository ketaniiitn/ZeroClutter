import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6">
          <div className="relative">
            <img
              src={heroImg}
              alt="Hero"
              className="w-44 h-auto"
            />

            <img
              src={reactLogo}
              alt="React"
              className="absolute -left-8 top-6 w-16 animate-spin"
              style={{ animationDuration: '15s' }}
            />

            <img
              src={viteLogo}
              alt="Vite"
              className="absolute -right-8 top-6 w-16"
            />
          </div>

          <div>
            <h1 className="text-5xl font-bold text-slate-900">
              Get Started
            </h1>

            <p className="mt-4 text-slate-600">
              Edit <code className="bg-slate-200 px-2 py-1 rounded">src/App.tsx</code>{' '}
              and save to test HMR
            </p>
          </div>

          <button
            onClick={() => setCount((c) => c + 1)}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition"
          >
            Count is {count}
          </button>
        </section>

        {/* Divider */}
        <div className="my-12 border-t border-slate-200"></div>

        {/* Cards */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-2xl font-semibold mb-2">
              Documentation
            </h2>

            <p className="text-slate-600 mb-4">
              Your questions, answered
            </p>

            <div className="space-y-3">
              <a
                href="https://vite.dev/"
                target="_blank"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
              >
                <img src={viteLogo} alt="" className="w-6 h-6" />
                Explore Vite
              </a>

              <a
                href="https://react.dev/"
                target="_blank"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
              >
                <img src={reactLogo} alt="" className="w-6 h-6" />
                Learn React
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-2xl font-semibold mb-2">
              Connect with Us
            </h2>

            <p className="text-slate-600 mb-4">
              Join the Vite community
            </p>

            <div className="space-y-3">
              <a
                href="https://github.com/vitejs/vite"
                target="_blank"
                className="block rounded-lg border p-3 hover:bg-slate-50"
              >
                GitHub
              </a>

              <a
                href="https://chat.vite.dev/"
                target="_blank"
                className="block rounded-lg border p-3 hover:bg-slate-50"
              >
                Discord
              </a>

              <a
                href="https://x.com/vite_js"
                target="_blank"
                className="block rounded-lg border p-3 hover:bg-slate-50"
              >
                X
              </a>

              <a
                href="https://bsky.app/profile/vite.dev"
                target="_blank"
                className="block rounded-lg border p-3 hover:bg-slate-50"
              >
                Bluesky
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App