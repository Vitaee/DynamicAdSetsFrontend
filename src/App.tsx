import EmptyState from './components/EmptyState'
import AuthCard from './components/Auth/AuthCard'
import { useEffect } from 'react'
import { useAuth } from './stores/auth'
import { useNavigate } from 'react-router-dom'

function Hero()
{
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-sky-500 to-sky-700 text-white">
      <div className="absolute inset-0 opacity-30">
        {/* concentric circles */}
        <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="400" cy="400" r="160" fill="none" stroke="url(#g)" strokeWidth="2" />
          <circle cx="400" cy="400" r="260" fill="none" stroke="url(#g)" strokeWidth="2" />
          <circle cx="400" cy="400" r="360" fill="none" stroke="url(#g)" strokeWidth="2" />
        </svg>
      </div>
      <div className="relative flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
        <h1 className="max-w-md text-3xl font-semibold leading-tight sm:text-4xl">
          Smarter Ads with Weather-Based Triggers
        </h1>
        <p className="max-w-md text-white/90">
          Launch automated campaigns that respond to real-time weather conditions — maximise impact, minimise spend.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
            <span className="text-xl">⚡</span>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
            <span className="text-xl">🌧️</span>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
            <span className="text-xl">☀️</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const { session } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (session) navigate('/dashboard');
  }, [session]);
  return (
    <div className="min-h-screen bg-surface">
      <div className="container-narrow py-8 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left hero (or empty state on small screens if preferred) */}
          <div className="hidden min-h-[640px] lg:block">
            <Hero />
          </div>
          <div>
            <AuthCard />
            <div className="mt-6 lg:hidden">
              <EmptyState
                title="Discover weather-based triggers"
                description="Enable precise, automated ad delivery guided by live conditions."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
